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

    return {
      data: customers,
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
    return customer;
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
        creditLimit: data.creditLimit,
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
        creditLimit: data.creditLimit,
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

  // Get customer balance
  async getBalance(id) {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(id) },
    });

    if (!customer) throw new Error("Customer not found");

    return {
      customerId: customer.id,
      totalBilled: customer.totalBilled,
      totalPaid: customer.totalPaid,
      balance: customer.totalBilled - customer.totalPaid,
    };
  },
};
