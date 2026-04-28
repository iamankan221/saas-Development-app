import express from "express";
import prisma from "../config/database.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Dashboard summary with Multi-Timeframe Analytics
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalCustomers = await prisma.customer.count();
    const items = await prisma.inventoryItem.findMany({
      select: { currentQuantity: true, sellingPrice: true, lowStockThreshold: true, expiryDate: true },
    });

    const totalStockValue = items.reduce((acc, item) => acc + BigInt(item.currentQuantity) * item.sellingPrice, 0n);
    const lowStockCount = items.filter(i => i.currentQuantity <= i.lowStockThreshold && i.currentQuantity > 0).length;

    // Fetch Sales for all periods
    const getSalesInRange = async (start, end = null) => {
      const bills = await prisma.bill.findMany({
        where: { createdAt: end ? { gte: start, lt: end } : { gte: start } },
        select: { totalAmount: true },
      });
      return bills.reduce((acc, b) => acc + b.totalAmount, 0n);
    };

    const todaySales = await getSalesInRange(today);
    const yesterdaySales = await getSalesInRange(yesterday, today);
    const lastWeekSales = await getSalesInRange(sevenDaysAgo, today);
    const lastMonthSales = await getSalesInRange(thirtyDaysAgo, today);

    // Helper to calculate growth percentage safely with BigInts
    const calculateGrowth = (curr, prev) => {
      if (prev === 0n) return curr > 0n ? 100 : 0;
      try {
        return Number(((curr - prev) * 100n) / prev);
      } catch (e) {
        return 0;
      }
    };

    // 4. Fetch New Customers for all periods
    const getNewCustomersInRange = async (start, end = null) => {
      return await prisma.customer.count({
        where: { createdAt: end ? { gte: start, lt: end } : { gte: start } }
      });
    };

    const newCustYesterday = await getNewCustomersInRange(yesterday, today);
    const newCustWeekly = await getNewCustomersInRange(sevenDaysAgo, today);
    const newCustMonthly = await getNewCustomersInRange(thirtyDaysAgo, today);

    // 5. Fetch Historical Unpaid Amount (Point-in-time)
    const getUnpaidAtPoint = async (point) => {
      const unpaidBills = await prisma.bill.findMany({
        where: {
          createdAt: { lt: point },
          OR: [
            { status: "unpaid" },
            { paidDate: { gte: point } }
          ]
        },
        select: { totalAmount: true }
      });
      return unpaidBills.reduce((acc, b) => acc + b.totalAmount, 0n);
    };

    const currentUnpaid = (await prisma.bill.aggregate({ where: { status: "unpaid" }, _sum: { totalAmount: true } }))._sum.totalAmount || 0n;
    const unpaidYesterday = await getUnpaidAtPoint(today);
    const unpaidLastWeek = await getUnpaidAtPoint(sevenDaysAgo);
    const unpaidLastMonth = await getUnpaidAtPoint(thirtyDaysAgo);

    res.json({
      totalStockValue: Number(totalStockValue),
      lowStockCount,
      todaySales: Number(todaySales),
      todayProfit: Number((todaySales * 22n) / 100n),
      unpaidAmount: Number(currentUnpaid),
      totalCustomers,
      expiringItemsCount: items.filter(i => {
        if (!i.expiryDate) return false;
        const d = new Date(i.expiryDate);
        const thirty = new Date(today);
        thirty.setDate(thirty.getDate() + 30);
        return d >= today && d <= thirty;
      }).length,
      growth: {
        yesterday: {
          sales: calculateGrowth(todaySales, yesterdaySales),
          profit: calculateGrowth(todaySales, yesterdaySales),
          customers: newCustYesterday,
          unpaid: calculateGrowth(currentUnpaid, unpaidYesterday),
        },
        weekly: {
          sales: calculateGrowth(todaySales, lastWeekSales / 7n),
          profit: calculateGrowth(todaySales, lastWeekSales / 7n),
          customers: newCustWeekly,
          unpaid: calculateGrowth(currentUnpaid, unpaidLastWeek),
        },
        monthly: {
          sales: calculateGrowth(todaySales, lastMonthSales / 30n),
          profit: calculateGrowth(todaySales, lastMonthSales / 30n),
          customers: newCustMonthly,
          unpaid: calculateGrowth(currentUnpaid, unpaidLastMonth),
        }
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Recent activity (Combined Pulse Feed)
router.get("/recent-activity", authMiddleware, async (req, res) => {
  try {
    // 1. Fetch latest 8 bills
    const bills = await prisma.bill.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      select: { id: true, billNumber: true, status: true, customerName: true, totalAmount: true, createdAt: true },
    });

    const billActivity = bills.map((b) => ({
      id: `bill-${b.id}`,
      type: b.status === "paid" ? "payment_received" : "bill_created",
      title: b.status === "paid" ? `Payment: ${b.customerName}` : `New Bill: #${b.billNumber}`,
      description: b.status === "paid" ? `Invoice #${b.billNumber} settled by ${b.customerName}` : `Drafted for ${b.customerName}`,
      amount: Number(b.totalAmount),
      createdAt: b.createdAt,
    }));

    // 2. Fetch latest 3 new customers
    const newCustomers = await prisma.customer.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true },
    });

    const customerActivity = newCustomers.map(c => ({
      id: `cust-${c.id}`,
      type: "customer_joined",
      title: "New Customer",
      description: `${c.name} has been added to your database`,
      amount: null,
      createdAt: c.createdAt,
    }));

    // 3. Fetch low stock items (Top 5 most critical)
    const inventory = await prisma.inventoryItem.findMany({
      where: { status: "active" },
      select: { id: true, name: true, currentQuantity: true, lowStockThreshold: true, updatedAt: true }
    });

    const lowStockActivity = inventory
      .filter(i => i.currentQuantity <= i.lowStockThreshold)
      .map(i => ({
        id: `stock-${i.id}`,
        type: "stock_alert",
        title: "Low Stock Alert",
        description: `${i.name} is low on stock (${i.currentQuantity} left)`,
        amount: null,
        createdAt: i.updatedAt,
      }))
      .slice(0, 5);

    // 4. Combine and Sort
    const allActivity = [...billActivity, ...customerActivity, ...lowStockActivity]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);

    res.json(allActivity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
