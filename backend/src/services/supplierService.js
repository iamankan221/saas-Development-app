import prisma from "../config/database.js";

// ============================================================================
// SUPPLIER SERVICE
// ============================================================================

export const supplierService = {
  // Get all suppliers with pagination
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

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        include: { inventoryItems: { select: { id: true, name: true, sku: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      data: suppliers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  // Get single supplier
  async findById(id) {
    const supplier = await prisma.supplier.findUnique({
      where: { id: parseInt(id) },
      include: { inventoryItems: true, purchaseOrders: { take: 5 } },
    });

    if (!supplier) throw new Error("Supplier not found");
    return supplier;
  },

  // Create supplier
  async create(data) {
    const supplier = await prisma.supplier.create({
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        address: data.address,
        gstNumber: data.gstNumber,
        panNumber: data.panNumber,
        paymentTerms: data.paymentTerms,
      },
    });
    return supplier;
  },

  // Update supplier
  async update(id, data) {
    const supplier = await prisma.supplier.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        email: data.email,
        address: data.address,
        gstNumber: data.gstNumber,
        panNumber: data.panNumber,
        paymentTerms: data.paymentTerms,
        status: data.status,
      },
    });
    return supplier;
  },

  // Delete supplier
  async delete(id) {
    await prisma.supplier.delete({
      where: { id: parseInt(id) },
    });
  },
};
