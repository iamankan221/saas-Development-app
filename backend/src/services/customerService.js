import prisma from "../config/database.js";

// ============================================================================
// CUSTOMER SERVICE
// ============================================================================

export const customerService = {
  // Get all customers with pagination
  async findAll(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search } },
      ];
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.customer.count({ where }),
    ]);

    // Compute totalBilled and totalPaid from bills for each customer
    const customerIds = customers.map(c => c.id);

    const billAggregates = await prisma.bill.groupBy({
      by: ["customerId"],
      where: { customerId: { in: customerIds } },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    const aggregateMap = {};
    for (const agg of billAggregates) {
      aggregateMap[agg.customerId] = {
        totalBilled: Number(agg._sum.totalAmount || 0n),
        totalPaid: Number(agg._sum.paidAmount || 0n),
      };
    }

    const enrichedCustomers = customers.map(c => {
      const agg = aggregateMap[c.id] || { totalBilled: 0, totalPaid: 0 };
      return {
        ...c,
        totalBilled: agg.totalBilled,
        totalPaid: agg.totalPaid,
        outstandingBalance: agg.totalBilled - agg.totalPaid,
      };
    });

    return {
      data: enrichedCustomers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  // Get single customer
  async findById(id) {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
      include: { bills: { take: 5, orderBy: { createdAt: "desc" } } },
    });

    if (!customer) throw new Error("Customer not found");

    // Compute totals from bills
    const billTotals = await prisma.bill.aggregate({
      where: { customerId: parseInt(id) },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    return {
      ...customer,
      totalBilled: Number(billTotals._sum.totalAmount || 0n),
      totalPaid: Number(billTotals._sum.paidAmount || 0n),
      outstandingBalance: Number(billTotals._sum.totalAmount || 0n) - Number(billTotals._sum.paidAmount || 0n),
    };
  },

  // Create customer
  async create(data) {
    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        gstNumber: data.gstNumber,
        panNumber: data.panNumber,
      },
    });
    return customer;
  },

  // Update customer
  async update(id, data) {
    const customer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        email: data.email,
        address: data.address,
        gstNumber: data.gstNumber,
        panNumber: data.panNumber,
        status: data.status,
      },
    });
    return customer;
  },

  // Delete customer
  async delete(id) {
    await prisma.customer.delete({
      where: { id: parseInt(id) },
    });
  },

  // Get customer balance (computed from bills)
  async getBalance(id) {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
    });

    if (!customer) throw new Error("Customer not found");

    const billTotals = await prisma.bill.aggregate({
      where: { customerId: parseInt(id) },
      _sum: {
        totalAmount: true,
        paidAmount: true,
      },
    });

    const totalBilled = Number(billTotals._sum.totalAmount || 0n);
    const totalPaid = Number(billTotals._sum.paidAmount || 0n);

    return {
      customerId: customer.id,
      totalBilled,
      totalPaid,
      balance: totalBilled - totalPaid,
    };
  },

  // Search customers by phone (for autocomplete)
  async searchByPhone(phone) {
    if (!phone || phone.length < 3) return [];

    const customers = await prisma.customer.findMany({
      where: {
        phone: { contains: phone },
        status: "active",
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        gstNumber: true,
      },
    });

    return customers;
  },
};
