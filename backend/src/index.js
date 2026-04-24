import express from "express";
import cors from "cors";
import { db, formatCustomer } from "./data.js";

const app = express();
app.use(cors());
app.use(express.json());

// ─── HEALTH ──────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ─── DASHBOARD ───────────────────────────────────────────
app.get("/api/dashboard/summary", (_req, res) => {
  const totalCustomers = db.customers.length;
  const totalStockValue = db.inventory.reduce((acc, i) => acc + i.sellingPrice * i.currentQuantity, 0);
  const lowStockCount = db.inventory.filter(i => i.currentQuantity <= i.lowStockThreshold && i.currentQuantity > 0).length;

  const today = new Date().toISOString().split("T")[0];
  const thirtyDays = new Date();
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const expiryLimit = thirtyDays.toISOString().split("T")[0];
  const expiringItemsCount = db.inventory.filter(i => i.expiryDate && i.expiryDate >= today && i.expiryDate <= expiryLimit).length;

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayBills = db.bills.filter(b => new Date(b.createdAt) >= todayStart);
  const todaySales = todayBills.reduce((acc, b) => acc + b.totalAmount, 0);
  const todayProfit = todaySales * 0.22; // estimated margin for demo

  const unpaidAmount = db.bills
    .filter(b => b.status === "unpaid")
    .reduce((acc, b) => acc + b.totalAmount, 0);

  res.json({ totalStockValue, lowStockCount, todaySales, todayProfit, unpaidAmount, totalCustomers, expiringItemsCount });
});

app.get("/api/dashboard/recent-activity", (_req, res) => {
  const activity = db.bills.slice(-5).reverse().map(b => ({
    id: b.id,
    type: b.status === "paid" ? "payment_received" : "bill_created",
    title: b.status === "paid" ? `Payment from ${b.customerName}` : `Bill #${b.billNumber}`,
    description: `${b.customerName} — ₹${b.totalAmount.toFixed(2)}`,
    amount: b.totalAmount,
    createdAt: b.createdAt,
  }));

  const lowStock = db.inventory
    .filter(i => i.currentQuantity <= i.lowStockThreshold)
    .slice(0, 3)
    .map(i => ({
      id: i.id + 10000,
      type: "stock_low",
      title: `Low Stock: ${i.name}`,
      description: `Only ${i.currentQuantity} ${i.unit} remaining`,
      amount: null,
      createdAt: i.createdAt,
    }));

  const combined = [...activity, ...lowStock]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 8);

  res.json(combined);
});

// ─── CUSTOMERS ───────────────────────────────────────────
app.get("/api/customers", (req, res) => {
  let list = db.customers;
  if (req.query.search) {
    const s = req.query.search.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(s) || c.phone.includes(s));
  }
  res.json(list.map(formatCustomer));
});

app.get("/api/customers/:id", (req, res) => {
  const c = db.customers.find(c => c.id === +req.params.id);
  if (!c) return res.status(404).json({ error: "Customer not found" });
  res.json(formatCustomer(c));
});

app.post("/api/customers", (req, res) => {
  const { name, phone, email, address, gstNumber, panNumber, creditLimit } = req.body;
  if (!name || !phone) return res.status(400).json({ error: "name and phone are required" });
  const newCustomer = {
    id: Math.max(...db.customers.map(c => c.id)) + 1,
    name, phone,
    email: email || null,
    address: address || null,
    gstNumber: gstNumber || null,
    panNumber: panNumber || null,
    creditLimit: creditLimit ?? null,
    totalBilled: 0, totalPaid: 0,
    createdAt: new Date().toISOString(),
  };
  db.customers.push(newCustomer);
  res.status(201).json(formatCustomer(newCustomer));
});

app.patch("/api/customers/:id", (req, res) => {
  const idx = db.customers.findIndex(c => c.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Customer not found" });
  db.customers[idx] = { ...db.customers[idx], ...req.body };
  res.json(formatCustomer(db.customers[idx]));
});

app.delete("/api/customers/:id", (req, res) => {
  const idx = db.customers.findIndex(c => c.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Customer not found" });
  db.customers.splice(idx, 1);
  res.sendStatus(204);
});

app.get("/api/customers/:id/balance", (req, res) => {
  const c = db.customers.find(c => c.id === +req.params.id);
  if (!c) return res.status(404).json({ error: "Customer not found" });
  const billCount = db.bills.filter(b => b.customerId === c.id).length;
  res.json({
    customerId: c.id,
    totalBilled: c.totalBilled,
    totalPaid: c.totalPaid,
    outstandingBalance: c.totalBilled - c.totalPaid,
    billCount,
  });
});

// ─── INVENTORY ───────────────────────────────────────────
app.get("/api/inventory", (req, res) => {
  let list = db.inventory;
  if (req.query.search) {
    const s = req.query.search.toLowerCase();
    list = list.filter(i => i.name.toLowerCase().includes(s) || (i.sku || "").toLowerCase().includes(s));
  }
  if (req.query.lowStock === "true") {
    list = list.filter(i => i.currentQuantity <= i.lowStockThreshold);
  }
  if (req.query.expiringSoon === "true") {
    const today = new Date().toISOString().split("T")[0];
    const limit = new Date(); limit.setDate(limit.getDate() + 30);
    const expiryLimit = limit.toISOString().split("T")[0];
    list = list.filter(i => i.expiryDate && i.expiryDate >= today && i.expiryDate <= expiryLimit);
  }
  res.json(list);
});

app.get("/api/inventory/summary", (_req, res) => {
  const totalItems = db.inventory.length;
  const totalStockValue = db.inventory.reduce((acc, i) => acc + i.sellingPrice * i.currentQuantity, 0);
  const lowStockCount = db.inventory.filter(i => i.currentQuantity <= i.lowStockThreshold).length;
  const today = new Date().toISOString().split("T")[0];
  const limit = new Date(); limit.setDate(limit.getDate() + 30);
  const expiryLimit = limit.toISOString().split("T")[0];
  const expiringSoonCount = db.inventory.filter(i => i.expiryDate && i.expiryDate >= today && i.expiryDate <= expiryLimit).length;
  res.json({ totalItems, totalStockValue, lowStockCount, expiringSoonCount });
});

app.get("/api/inventory/:id", (req, res) => {
  const item = db.inventory.find(i => i.id === +req.params.id);
  if (!item) return res.status(404).json({ error: "Item not found" });
  res.json(item);
});

app.post("/api/inventory", (req, res) => {
  const newItem = {
    id: Math.max(...db.inventory.map(i => i.id)) + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  db.inventory.push(newItem);
  res.status(201).json(newItem);
});

app.patch("/api/inventory/:id", (req, res) => {
  const idx = db.inventory.findIndex(i => i.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Item not found" });
  db.inventory[idx] = { ...db.inventory[idx], ...req.body };
  res.json(db.inventory[idx]);
});

app.delete("/api/inventory/:id", (req, res) => {
  const idx = db.inventory.findIndex(i => i.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Item not found" });
  db.inventory.splice(idx, 1);
  res.sendStatus(204);
});

// ─── SUPPLIERS ───────────────────────────────────────────
app.get("/api/suppliers", (req, res) => {
  let list = db.suppliers;
  if (req.query.search) {
    const s = req.query.search.toLowerCase();
    list = list.filter(sup => sup.name.toLowerCase().includes(s) || (sup.contactPerson || "").toLowerCase().includes(s));
  }
  res.json(list);
});

app.get("/api/suppliers/:id", (req, res) => {
  const sup = db.suppliers.find(s => s.id === +req.params.id);
  if (!sup) return res.status(404).json({ error: "Supplier not found" });
  res.json(sup);
});

app.post("/api/suppliers", (req, res) => {
  const newSup = {
    id: Math.max(...db.suppliers.map(s => s.id)) + 1,
    ...req.body,
    createdAt: new Date().toISOString(),
  };
  db.suppliers.push(newSup);
  res.status(201).json(newSup);
});

app.patch("/api/suppliers/:id", (req, res) => {
  const idx = db.suppliers.findIndex(s => s.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Supplier not found" });
  db.suppliers[idx] = { ...db.suppliers[idx], ...req.body };
  res.json(db.suppliers[idx]);
});

app.delete("/api/suppliers/:id", (req, res) => {
  const idx = db.suppliers.findIndex(s => s.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Supplier not found" });
  db.suppliers.splice(idx, 1);
  res.sendStatus(204);
});

// ─── BILLS ───────────────────────────────────────────────
app.get("/api/bills", (req, res) => {
  let list = db.bills;
  if (req.query.customerId) list = list.filter(b => b.customerId === +req.query.customerId);
  if (req.query.status) list = list.filter(b => b.status === req.query.status);
  res.json([...list].reverse());
});

app.get("/api/bills/next-number", (_req, res) => {
  const prefix = db.settings.invoicePrefix;
  const max = db.bills.reduce((acc, b) => {
    const m = b.billNumber.match(/(\d+)$/);
    return m ? Math.max(acc, +m[1]) : acc;
  }, 0);
  res.json({ billNumber: `${prefix}-${String(max + 1).padStart(6, "0")}` });
});

app.get("/api/bills/:id", (req, res) => {
  const bill = db.bills.find(b => b.id === +req.params.id);
  if (!bill) return res.status(404).json({ error: "Bill not found" });
  res.json(bill);
});

app.post("/api/bills", (req, res) => {
  const { customerId, items, notes, dueDate, status } = req.body;
  if (!customerId || !items?.length) return res.status(400).json({ error: "customerId and items required" });

  const customer = db.customers.find(c => c.id === customerId);
  if (!customer) return res.status(404).json({ error: "Customer not found" });

  const prefix = db.settings.invoicePrefix;
  const max = db.bills.reduce((acc, b) => {
    const m = b.billNumber.match(/(\d+)$/);
    return m ? Math.max(acc, +m[1]) : acc;
  }, 0);
  const billNumber = `${prefix}-${String(max + 1).padStart(4, "0")}`;

  let subtotal = 0, discountAmount = 0, taxAmount = 0;
  const resolvedItems = [];

  for (const item of items) {
    const inv = db.inventory.find(i => i.id === item.inventoryItemId);
    if (!inv) return res.status(404).json({ error: `Inventory item ${item.inventoryItemId} not found` });
    const lineBase = item.quantity * item.unitPrice;
    const lineDiscount = lineBase * (item.discount / 100);
    const lineAfterDiscount = lineBase - lineDiscount;
    const lineTax = lineAfterDiscount * (item.taxRate / 100);
    subtotal += lineBase; discountAmount += lineDiscount; taxAmount += lineTax;
    resolvedItems.push({
      id: Date.now() + Math.random(),
      inventoryItemId: item.inventoryItemId,
      itemName: inv.name,
      quantity: item.quantity, unitPrice: item.unitPrice,
      discount: item.discount, taxRate: item.taxRate,
      subtotal: lineAfterDiscount + lineTax,
    });
    inv.currentQuantity = Math.max(0, inv.currentQuantity - item.quantity);
  }

  const totalAmount = subtotal - discountAmount + taxAmount;
  const newBill = {
    id: Math.max(...db.bills.map(b => b.id)) + 1,
    billNumber, customerId, customerName: customer.name,
    status: status || "unpaid",
    subtotal, discountAmount, taxAmount, totalAmount,
    notes: notes || null, dueDate: dueDate || null,
    createdAt: new Date().toISOString(),
    items: resolvedItems,
  };

  db.bills.push(newBill);
  customer.totalBilled += totalAmount;
  if (status === "paid") customer.totalPaid += totalAmount;

  res.status(201).json(newBill);
});

app.patch("/api/bills/:id", (req, res) => {
  const idx = db.bills.findIndex(b => b.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Bill not found" });
  const existingBill = db.bills[idx];
  if (req.body.status === "paid" && existingBill.status !== "paid") {
    const customer = db.customers.find(c => c.id === existingBill.customerId);
    if (customer) customer.totalPaid += existingBill.totalAmount;
  }
  db.bills[idx] = { ...existingBill, ...req.body };
  res.json(db.bills[idx]);
});

app.delete("/api/bills/:id", (req, res) => {
  const idx = db.bills.findIndex(b => b.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Bill not found" });
  db.bills.splice(idx, 1);
  res.sendStatus(204);
});

// ─── ANALYTICS ───────────────────────────────────────────
app.get("/api/analytics/sales", (_req, res) => {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const totalSales = db.bills
      .filter(b => b.createdAt.startsWith(dateStr) && b.status !== "cancelled")
      .reduce((acc, b) => acc + b.totalAmount, 0);
    days.push({ date: dateStr, totalSales: totalSales || Math.random() * 3000 + 500 });
  }
  res.json(days);
});

app.get("/api/analytics/profit-loss", (_req, res) => {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const month = d.toISOString().slice(0, 7);
    const monthBills = db.bills.filter(b => b.createdAt.startsWith(month) && b.status !== "cancelled");
    const revenue = monthBills.reduce((acc, b) => acc + b.totalAmount, 0) || (Math.random() * 50000 + 20000);
    const cost = revenue * (0.65 + Math.random() * 0.1);
    months.push({ month, revenue: Math.round(revenue), cost: Math.round(cost), profit: Math.round(revenue - cost) });
  }
  res.json(months);
});

app.get("/api/analytics/top-items", (_req, res) => {
  const itemSales = {};
  db.bills.forEach(bill => {
    bill.items.forEach(item => {
      if (!itemSales[item.itemName]) itemSales[item.itemName] = { name: item.itemName, totalQuantity: 0, totalRevenue: 0 };
      itemSales[item.itemName].totalQuantity += item.quantity;
      itemSales[item.itemName].totalRevenue += item.subtotal;
    });
  });
  const sorted = Object.values(itemSales).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
  res.json(sorted);
});

// ─── SETTINGS ────────────────────────────────────────────
app.get("/api/settings", (_req, res) => res.json(db.settings));
app.patch("/api/settings", (req, res) => {
  Object.assign(db.settings, req.body);
  res.json(db.settings);
});

// ─── START ────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`VyaparBook API running on http://localhost:${PORT}`));
