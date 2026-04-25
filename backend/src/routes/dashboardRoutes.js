import express from "express";
import prisma from "../config/database.js";

const router = express.Router();

// Dashboard summary
router.get("/summary", async (req, res) => {
  try {
    const totalCustomers = await prisma.customer.count();

    const items = await prisma.inventoryItem.findMany({
        select: {
        currentQuantity: true,
        sellingPrice: true,
        lowStockThreshold: true,
        expiryDate: true,
        },
    });

    // FIX 1: Explicit BigInt conversion for stock value
    const totalStockValue = items.reduce(
        (acc, item) => acc + BigInt(item.currentQuantity) * item.sellingPrice,
        0n
    );

    const lowStockCount = items.filter(
        (item) => item.currentQuantity <= item.lowStockThreshold && item.currentQuantity > 0
    ).length;

    // FIX 2: Compare native Date objects, not strings
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const thirtyDays = new Date(todayDate);
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const expiringItemsCount = items.filter((item) => {
        if (!item.expiryDate) return false;
        const expDate = new Date(item.expiryDate); // Ensure it's a Date object
        return expDate >= todayDate && expDate <= thirtyDays;
    }).length;

    const todayBills = await prisma.bill.findMany({
        where: { createdAt: { gte: todayDate } },
        select: { totalAmount: true },
    });

    // FIX 3: Start accumulator with 0n
    const todaySales = todayBills.reduce((acc, b) => acc + b.totalAmount, 0n);

    // FIX 4: Secure BigInt percentage calculation (22%)
    // You cannot do `todaySales * 0.22` with BigInts.
    const todayProfit = (todaySales * 22n) / 100n;

    const unpaidAmountResult = await prisma.bill.aggregate({
        where: { status: "unpaid" },
        _sum: { totalAmount: true },
    });
    
    // Default to 0n if there are no unpaid bills
    const unpaidAmount = unpaidAmountResult._sum.totalAmount || 0n;

    // FIX 5: Convert all BigInts to standard Numbers before sending to res.json
    res.json({
        totalStockValue: Number(totalStockValue),
        lowStockCount,
        todaySales: Number(todaySales),
        todayProfit: Number(todayProfit),
        unpaidAmount: Number(unpaidAmount),
        totalCustomers,
        expiringItemsCount,
    });
    } catch (error) {
    res.status(400).json({ error: error.message });
    }
});

// Recent activity
router.get("/recent-activity", async (req, res) => {
  try {
    const bills = await prisma.bill.findMany({
      take: -5,
      orderBy: { createdAt: "desc" },
      select: { id: true, billNumber: true, status: true, customerName: true, totalAmount: true, createdAt: true },
    });

    const activity = bills.map((b) => ({
      id: b.id,
      type: b.status === "paid" ? "payment_received" : "bill_created",
      title: b.status === "paid" ? `Payment from ${b.customerName}` : `Bill #${b.billNumber}`,
      description: `${b.customerName} — ₹${(b.totalAmount / 100).toFixed(2)}`,
      amount: b.totalAmount,
      createdAt: b.createdAt,
    }));

    const lowStock = await prisma.inventoryItem.findMany({
      where: {
        currentQuantity: { lte: prisma.inventoryItem.fields.lowStockThreshold },
      },
      take: 3,
      orderBy: { currentQuantity: "asc" },
      select: { id: true, name: true, currentQuantity: true, lowStockThreshold: true },
    });

    const alerts = lowStock.map((item) => ({
      id: item.id + 10000,
      type: "low_stock",
      title: `Low stock: ${item.name}`,
      description: `Only ${item.currentQuantity} ${item.name} out of ${item.lowStockThreshold} units left`,
      urgency: "high",
      createdAt: new Date().toISOString(),
    }));

    console.log("📊 Dashboard summary and recent activity fetched", activity, alerts);
    res.json({ activity, alerts });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
