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

    const [items, total, summaryAggs] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        include: { supplier: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.inventoryItem.count({ where }),
      prisma.inventoryItem.findMany({
        where,
        select: {
          currentQuantity: true,
          sellingPrice: true,
          lowStockThreshold: true,
          expiryDate: true,
        }
      })
    ]);

    // Compute summary stats from ALL matching items
    let totalStockValue = 0n;
    let lowStockCount = 0;
    let expiringSoonCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDays = new Date(today);
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    for (const item of summaryAggs) {
      totalStockValue += BigInt(item.currentQuantity) * item.sellingPrice;
      if (item.currentQuantity <= item.lowStockThreshold && item.currentQuantity > 0) {
        lowStockCount++;
      }
      if (item.expiryDate) {
        const expDate = new Date(item.expiryDate);
        if (expDate >= today && expDate <= thirtyDays) {
          expiringSoonCount++;
        }
      }
    }

    return {
      data: items,
      summary: {
        totalItems: total,
        totalStockValue: Number(totalStockValue),
        lowStockCount,
        expiringSoonCount,
      },
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
    const createData = {
      name: data.name,
      sku: data.sku || null,
      category: data.category || null,
      location: data.location || null,
      unit: data.unit,
      purchasePrice: BigInt(Math.round(Number(data.purchasePrice) || 0)),
      sellingPrice: BigInt(Math.round(Number(data.sellingPrice) || 0)),
      currentQuantity: parseFloat(data.currentQuantity) || 0,
      totalQuantity: parseFloat(data.totalQuantity) || 0,
      lowStockThreshold: parseFloat(data.lowStockThreshold) || 0,
      taxRate: parseInt(data.taxRate) || 0,
      hsnCode: data.hsnCode || null,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
      unitValue: parseFloat(data.unitValue) || 1.0,
    };

    // Only link supplier if provided
    if (data.supplierId) {
      createData.supplierId = parseInt(data.supplierId);
    }

    const item = await prisma.inventoryItem.create({
      data: createData,
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
        sku: data.sku,
        category: data.category,
        location: data.location,
        unit: data.unit,
        purchasePrice: BigInt(Math.round(Number(data.purchasePrice) || 0)),
        sellingPrice: BigInt(Math.round(Number(data.sellingPrice) || 0)),
        currentQuantity: parseFloat(data.currentQuantity) || 0,
        totalQuantity: parseFloat(data.totalQuantity) || 0,
        lowStockThreshold: parseFloat(data.lowStockThreshold) || 0,
        taxRate: parseInt(data.taxRate) || 0,
        hsnCode: data.hsnCode || null,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        unitValue: parseFloat(data.unitValue) || 1.0,
        supplierId: data.supplierId ? parseInt(data.supplierId) : null,
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
