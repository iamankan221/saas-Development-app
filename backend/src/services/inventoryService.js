import prisma from "../config/database.js";

// ============================================================================
// INVENTORY SERVICE
// ============================================================================

export const inventoryService = {
  // Get inventory with pagination
  async findAll(page = 1, limit = 10, filters = {}) {
    const skip = (page - 1) * limit;

    const where = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    if (filters.category) {
      where.category = filters.category;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        include: { supplier: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    return {
      data: items,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  },

  // Get single inventory item
  async findById(id) {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: parseInt(id) },
      include: { supplier: true, stockMovements: { take: 10, orderBy: { createdAt: "desc" } } },
    });

    if (!item) throw new Error("Inventory item not found");
    return item;
  },

  // Create inventory item
  async create(data) {
    const item = await prisma.inventoryItem.create({
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        location: data.location,
        unit: data.unit,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        currentQuantity: data.currentQuantity,
        totalQuantity: data.totalQuantity,
        lowStockThreshold: data.lowStockThreshold,
        taxRate: data.taxRate,
        hsnCode: data.hsnCode,
        expiryDate: data.expiryDate,
        supplierId: data.supplierId,
      },
      include: { supplier: true },
    });
    return item;
  },

  // Update inventory item
  async update(id, data) {
    const item = await prisma.inventoryItem.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        location: data.location,
        purchasePrice: data.purchasePrice,
        sellingPrice: data.sellingPrice,
        lowStockThreshold: data.lowStockThreshold,
        status: data.status,
      },
      include: { supplier: true },
    });
    return item;
  },

  // Delete inventory item
  async delete(id) {
    await prisma.inventoryItem.delete({
      where: { id: parseInt(id) },
    });
  },

  // Get inventory summary
  async getSummary() {
    const items = await prisma.inventoryItem.findMany({
      select: {
        id: true,
        currentQuantity: true,
        sellingPrice: true,
        lowStockThreshold: true,
        expiryDate: true,
      },
    });

    // FIX 1: Initialize accumulator with 0n (BigInt) and cast currentQuantity to BigInt
    const totalStockValue = items.reduce(
      (acc, item) => acc + BigInt(item.currentQuantity) * item.sellingPrice,
      0n 
    );

    const lowStockCount = items.filter(
      (item) => item.currentQuantity <= item.lowStockThreshold && item.currentQuantity > 0
    ).length;

    // FIX 2: Compare actual Date objects instead of ISO strings
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    const thirtyDays = new Date(today);
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const expiringItemsCount = items.filter((item) => {
      if (!item.expiryDate) return false;
      const expDate = new Date(item.expiryDate);
      return expDate >= today && expDate <= thirtyDays;
    }).length;

    return {
      totalStockValue: Number(totalStockValue), // Convert back to Number for JSON API
      lowStockCount,
      expiringItemsCount,
      totalItems: items.length,
    };
  },

  // Get low stock items
  async getLowStockItems() {
    const items = await prisma.inventoryItem.findMany({
      where: {
        currentQuantity: { lte: prisma.inventoryItem.fields.lowStockThreshold },
        status: "active",
      },
      include: { supplier: true },
      orderBy: { currentQuantity: "asc" },
    });

    return items;
  },
};
