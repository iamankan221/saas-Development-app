import prisma from "../config/database.js";
import crypto from "crypto";

// ============================================================================
// BILL SERVICE
// ============================================================================

/**
 * Generate a random unique 6-character uppercase hex bill code.
 * Retries if a collision is detected in the database.
 */
async function generateBillCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars
    const existing = await prisma.bill.findUnique({ where: { billCode: code } });
    if (!existing) return code;
  }
  // Fallback to longer code if too many collisions
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

export const billService = {
  // Get all bills with pagination
  async findAll(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.search) {
      where.OR = [
        { billNumber: { contains: filters.search, mode: "insensitive" } },
        { customerName: { contains: filters.search, mode: "insensitive" } },
        { billCode: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.customerId) {
      where.customerId = parseInt(filters.customerId);
    }

    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where,
        skip,
        take: limit,
        include: { items: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.bill.count({ where }),
    ]);

    return {
      data: bills,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  // Get single bill by ID
  async findById(id) {
    const bill = await prisma.bill.findUnique({
      where: { id: parseInt(id) },
      include: { items: true, customer: true },
    });

    if (!bill) throw new Error("Bill not found");
    return bill;
  },

  // Get single bill by billCode (for returns)
  async findByBillCode(billCode) {
    const bill = await prisma.bill.findUnique({
      where: { billCode: billCode.toUpperCase() },
      include: { items: true, customer: true },
    });

    if (!bill) throw new Error("No bill found with that code");
    return bill;
  },

  // Create bill (accepts billCode from frontend, computes totals)
  async create(data) {
    const billCode = data.billCode || await generateBillCode();
    const billNumber = data.billNumber || await billService.getNextBillNumber();

    // Look up customer name
    let customerName = data.customerName;
    if (!customerName && data.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: parseInt(data.customerId) },
        select: { name: true },
      });
      customerName = customer?.name || "Walk-in";
    }

    // Compute totals from items
    const itemsList = data.items || [];
    let subtotal = 0;
    let discountAmount = 0;
    let taxAmount = 0;

    for (const item of itemsList) {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const discPct = Number(item.discount) || 0;
      const taxPct = Number(item.taxRate) || 0;

      const lineBase = qty * price;
      const lineDisc = lineBase * (discPct / 100);
      const lineAfter = lineBase - lineDisc;
      const lineTax = lineAfter * (taxPct / 100);

      subtotal += lineBase;
      discountAmount += lineDisc;
      taxAmount += lineTax;
    }

    const finalTotalAmount = BigInt(Math.round(totalAmount));

    const bill = await prisma.$transaction(async (tx) => {
      const createdBill = await tx.bill.create({
        data: {
          billNumber,
          billCode,
          customerId: parseInt(data.customerId),
          customerName,
          subtotal: BigInt(Math.round(subtotal)),
          discountAmount: BigInt(Math.round(discountAmount)),
          taxAmount: BigInt(Math.round(taxAmount)),
          totalAmount: finalTotalAmount,
          status: data.status || "unpaid",
          notes: data.notes || null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          items: {
            create: itemsList.map(i => {
              const qty = parseInt(i.quantity) || 0;
              const price = Number(i.unitPrice) || 0;
              const itemSubtotal = BigInt(Math.round(qty * price));

              return {
                inventoryItemId: parseInt(i.inventoryItemId),
                itemName: i.itemName || "Unknown Item",
                quantity: qty,
                unitPrice: BigInt(Math.round(price)),
                discount: Number(i.discount) || 0,
                taxRate: Number(i.taxRate) || 0,
                subtotal: itemSubtotal,
              };
            }),
          },
        },
        include: { items: true },
      });

      // Update customer totals
      await tx.customer.update({
        where: { id: parseInt(data.customerId) },
        data: {
          totalBilled: { increment: finalTotalAmount },
          ...(createdBill.status === "paid" ? { totalPaid: { increment: finalTotalAmount } } : {}),
        }
      });

      return createdBill;
    });

    return bill;
  },

  // Update bill
  async update(id, data) {
    const existingBill = await prisma.bill.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingBill) throw new Error("Bill not found");

    const bill = await prisma.$transaction(async (tx) => {
      const updatedBill = await tx.bill.update({
        where: { id: parseInt(id) },
        data: {
          status: data.status,
          notes: data.notes,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          paidDate: data.paidDate ? new Date(data.paidDate) : null,
        },
        include: { items: true },
      });

      // Handle totalPaid changes
      if (data.status && existingBill.status !== data.status) {
        if (data.status === "paid") {
          await tx.customer.update({
            where: { id: existingBill.customerId },
            data: { totalPaid: { increment: existingBill.totalAmount } }
          });
        } else if (existingBill.status === "paid") {
          await tx.customer.update({
            where: { id: existingBill.customerId },
            data: { totalPaid: { decrement: existingBill.totalAmount } }
          });
        }
      }

      return updatedBill;
    });

    return bill;
  },

  // Delete bill
  async delete(id) {
    await prisma.bill.delete({
      where: { id: parseInt(id) },
    });
  },

  // Get next bill number
  async getNextBillNumber() {
    const lastBill = await prisma.bill.findFirst({
      orderBy: { id: "desc" },
      select: { billNumber: true },
    });

    if (!lastBill) return "INV-0001";

    const lastNumber = parseInt(lastBill.billNumber.split("-")[1]);
    return `INV-${String(lastNumber + 1).padStart(4, "0")}`;
  },
};
