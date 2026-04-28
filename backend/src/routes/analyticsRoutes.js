import express from "express";
import prisma from "../config/database.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

const getDatesInRange = (startDate, endDate) => {
  const dates = [];
  let curr = new Date(startDate);
  while (curr <= endDate) {
    dates.push(curr.toISOString().split("T")[0]);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

const getOrdinal = (d) => {
  if (d > 3 && d < 21) return 'th';
  switch (d % 10) {
    case 1:  return "st";
    case 2:  return "nd";
    case 3:  return "rd";
    default: return "th";
  }
};

router.get("/top-items", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const where = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const billItems = await prisma.billItem.findMany({
      where: {
        bill: where
      },
      include: {
        inventoryItem: {
          select: {
            name: true,
            purchasePrice: true,
          }
        }
      }
    });

    const itemStats = {};

    for (const item of billItems) {
      const id = item.inventoryItemId;
      if (!itemStats[id]) {
        itemStats[id] = {
          id,
          name: item.itemName || item.inventoryItem?.name || "Unknown",
          quantity: 0,
          value: 0n,
          profit: 0n,
        };
      }

      const qty = item.quantity;
      const subtotal = item.subtotal;
      const unitPrice = item.unitPrice;
      const purchasePrice = item.inventoryItem?.purchasePrice || 0n;

      itemStats[id].quantity += qty;
      itemStats[id].value += subtotal;
      itemStats[id].profit += (unitPrice - purchasePrice) * BigInt(qty);
    }

    const statsArray = Object.values(itemStats);

    const topByQuantity = [...statsArray]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(i => ({ ...i, value: Number(i.value), profit: Number(i.profit) }));

    const topByValue = [...statsArray]
      .sort((a, b) => {
        if (a.value > b.value) return -1;
        if (a.value < b.value) return 1;
        return 0;
      })
      .slice(0, 5)
      .map(i => ({ ...i, value: Number(i.value), profit: Number(i.profit) }));

    const topByProfit = [...statsArray]
      .sort((a, b) => {
        if (a.profit > b.profit) return -1;
        if (a.profit < b.profit) return 1;
        return 0;
      })
      .slice(0, 5)
      .map(i => ({ ...i, value: Number(i.value), profit: Number(i.profit) }));

    res.json({
      quantityWise: topByQuantity,
      valueWise: topByValue,
      profitWise: topByProfit
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/sales", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let start = startDate ? new Date(startDate) : new Date();
    if (!startDate) start.setDate(start.getDate() - 14);
    start.setHours(0, 0, 0, 0);

    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    const bills = await prisma.bill.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: "CANCELLED" }
      },
      select: { createdAt: true, totalAmount: true }
    });

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trend = {};

    if (diffDays <= 45) {
      const dates = getDatesInRange(start, end);
      dates.forEach(d => trend[d] = 0);
      bills.forEach(b => {
        const dateStr = b.createdAt.toISOString().split("T")[0];
        if (trend[dateStr] !== undefined) trend[dateStr] += Number(b.totalAmount);
      });
      const result = Object.entries(trend)
        .map(([date, totalSales]) => ({ date, totalSales }))
        .sort((a, b) => a.date.localeCompare(b.date));
      return res.json(result);
    } else {
      // 10-Day Grouping (1st, 10th, 20th, End)
      let curr = new Date(start);
      while (curr <= end) {
        const d = curr.getDate();
        const m = curr.getMonth();
        const y = curr.getFullYear();
        
        let labelDay = 1;
        if (d > 20) {
          // Get last day of month
          labelDay = new Date(y, m + 1, 0).getDate();
        } else if (d > 10) {
          labelDay = 20;
        } else if (d > 1) {
          labelDay = 10;
        } else {
          labelDay = 1;
        }

        const label = `${labelDay}${getOrdinal(labelDay)} ${monthNames[m]}`;
        const key = `${y}-${m+1}-${labelDay}`;
        
        if (!trend[key]) trend[key] = { date: label, totalSales: 0, sortKey: y * 10000 + (m+1) * 100 + labelDay };
        
        // Move to next milestone
        if (d < 10) curr.setDate(10);
        else if (d < 20) curr.setDate(20);
        else {
          curr.setMonth(m + 1);
          curr.setDate(1);
        }
      }

      bills.forEach(b => {
        const d = b.createdAt.getDate();
        const m = b.createdAt.getMonth();
        const y = b.createdAt.getFullYear();
        
        let targetDay = 1;
        if (d > 20) targetDay = new Date(y, m + 1, 0).getDate();
        else if (d > 10) targetDay = 20;
        else if (d > 1) targetDay = 10;
        else targetDay = 1;

        const key = `${y}-${m+1}-${targetDay}`;
        if (trend[key]) trend[key].totalSales += Number(b.totalAmount);
      });

      const result = Object.values(trend).sort((a, b) => a.sortKey - b.sortKey);
      return res.json(result);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/profit-loss", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let start = startDate ? new Date(startDate) : new Date();
    if (!startDate) start.setMonth(start.getMonth() - 5);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const bills = await prisma.bill.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        status: { not: "CANCELLED" }
      },
      include: {
        items: {
          include: {
            inventoryItem: { select: { purchasePrice: true } }
          }
        }
      }
    });

    const monthlyData = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    let curr = new Date(start);
    while (curr <= end) {
      const key = `${monthNames[curr.getMonth()]} ${curr.getFullYear()}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { month: key, revenue: 0, profit: 0, cost: 0, sortKey: curr.getFullYear() * 100 + curr.getMonth() };
      }
      curr.setMonth(curr.getMonth() + 1);
      curr.setDate(1);
    }

    bills.forEach(bill => {
      const d = new Date(bill.createdAt);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      
      if (monthlyData[key]) {
        let billCost = 0n;
        bill.items.forEach(item => {
          const purchasePrice = item.inventoryItem?.purchasePrice || 0n;
          billCost += purchasePrice * BigInt(item.quantity);
        });

        const revenue = Number(bill.totalAmount);
        const cost = Number(billCost);
        
        monthlyData[key].revenue += revenue;
        monthlyData[key].cost += cost;
        monthlyData[key].profit += (revenue - cost);
      }
    });

    const result = Object.values(monthlyData)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ sortKey, ...rest }) => rest);

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
