import prisma from "../config/database.js";

// ============================================================================
// BILL SERVICE
// ============================================================================

export const billService = {
  // Get all bills with pagination
  async findAll(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.search) {
      where.OR = [
        { billNumber: { contains: filters.search, mode: "insensitive" } },
        { customerName: { contains: filters.search, mode: "insensitive" } },
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

  // Get single bill
  async findById(id) {
    const bill = await prisma.bill.findUnique({
      where: { id: parseInt(id) },
      include: { items: true, customer: true },
    });

    if (!bill) throw new Error("Bill not found");
    return bill;
  },

  // Create bill
  async create(data) {
    const bill = await prisma.bill.create({
      data: {
        billNumber: data.billNumber,
        customerId: data.customerId,
        customerName: data.customerName,
        subtotal: data.subtotal,
        discountAmount: data.discountAmount,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        notes: data.notes,
        dueDate: data.dueDate,
        items: {
          create: data.items,
        },
      },
      include: { items: true },
    });

    return bill;
  },

  // Update bill
  async update(id, data) {
    const bill = await prisma.bill.update({
      where: { id: parseInt(id) },
      data: {
        status: data.status,
        notes: data.notes,
        dueDate: data.dueDate,
        paidDate: data.paidDate,
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
