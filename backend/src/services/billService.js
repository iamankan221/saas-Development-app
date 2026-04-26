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

/**
 * Derive bill status from paidAmount vs totalAmount.
 */
function deriveStatus(paidAmount, totalAmount) {
  if (paidAmount <= 0n) return "unpaid";
  if (paidAmount >= totalAmount) return "paid";
  return "partial";
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

  // Create bill (accepts newCustomer or customerId, computes totals)
  async create(data) {
    const billCode = data.billCode || await generateBillCode();
    const billNumber = data.billNumber || await billService.getNextBillNumber();

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

    const totalAmount = subtotal - discountAmount + taxAmount;
    const finalTotalAmount = BigInt(Math.round(totalAmount));

    // Determine paidAmount
    let paidAmount = 0n;
    if (data.status === "paid") {
      paidAmount = finalTotalAmount;
    } else if (data.paidAmount != null && Number(data.paidAmount) > 0) {
      paidAmount = BigInt(Math.round(Number(data.paidAmount)));
    }

    // Derive status from paidAmount
    const status = deriveStatus(paidAmount, finalTotalAmount);

    const bill = await prisma.$transaction(async (tx) => {
      // If newCustomer is provided, create the customer first
      let customerId = data.customerId ? parseInt(data.customerId) : null;
      let customerName = data.customerName;

      if (data.newCustomer && !customerId) {
        const newCust = await tx.customer.create({
          data: {
            name: data.newCustomer.name || "Walk-in",
            phone: data.newCustomer.phone || null,
            email: data.newCustomer.email || null,
            gstNumber: data.newCustomer.gstNumber || null,
          },
        });
        customerId = newCust.id;
        customerName = newCust.name;
      }

      // Look up customer name if not provided
      if (!customerName && customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: customerId },
          select: { name: true },
        });
        customerName = customer?.name || "Walk-in";
      }

      if (!customerId) {
        throw new Error("A customer or new customer details are required");
      }

      const createdBill = await tx.bill.create({
        data: {
          billNumber,
          billCode,
          customerId,
          customerName,
          subtotal: BigInt(Math.round(subtotal)),
          discountAmount: BigInt(Math.round(discountAmount)),
          taxAmount: BigInt(Math.round(taxAmount)),
          totalAmount: finalTotalAmount,
          paidAmount,
          status,
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

    // Determine new paidAmount and status
    let paidAmount = existingBill.paidAmount;
    if (data.paidAmount != null) {
      paidAmount = BigInt(Math.round(Number(data.paidAmount)));
    }
    // If explicitly marking as paid, set paidAmount to totalAmount
    if (data.status === "paid") {
      paidAmount = existingBill.totalAmount;
    }

    const status = data.status === "draft" ? "draft" : deriveStatus(paidAmount, existingBill.totalAmount);

    const bill = await prisma.bill.update({
      where: { id: parseInt(id) },
      data: {
        status,
        paidAmount,
        notes: data.notes !== undefined ? data.notes : undefined,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
        paidDate: status === "paid" ? new Date() : (data.paidDate ? new Date(data.paidDate) : null),
      },
      include: { items: true },
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
