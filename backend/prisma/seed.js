import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Pass the adapter to the constructor
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Clearing database before seeding...");
  await prisma.billItem.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();

  console.log("🌱 Seeding database with sample data...");

  // Seed Suppliers
  const suppliers = await prisma.supplier.createMany({
    data: [
      {
        name: "AgroBridge Wholesalers",
        contactPerson: "Mahesh Kumar",
        phone: "9811122334",
        email: "mahesh@agrobridge.com",
        address: "Industrial Area, Tumkur Rd, Bengaluru",
        gstNumber: "29AAABM4321H1Z4",
        paymentTerms: "Net 30",
      },
      {
        name: "Dairy Fresh Pvt Ltd",
        contactPerson: "Sunita Reddy",
        phone: "9922233445",
        email: "sunita@dairyfresh.in",
        address: "Yelahanka, Bengaluru",
        gstNumber: "29AABCD3456F1Z5",
        paymentTerms: "Net 15",
      },
      {
        name: "Metro Consumer Goods",
        contactPerson: "Rajiv Pillai",
        phone: "9933344556",
        email: "rajiv@metrocg.com",
        address: "Peenya, Bengaluru",
        gstNumber: "29AACDE5678G2Z6",
        paymentTerms: "Immediate",
      },
    ],
  });

  console.log(`✅ Created ${suppliers.count} suppliers`);

  // Seed Customers
  const customers = await prisma.customer.createMany({
    data: [
      {
        name: "Ravi Sharma",
        phone: "9876543210",
        email: "ravi@gmail.com",
        address: "12, MG Road, Bengaluru",
        gstNumber: "29AADCB2230M1ZP",
        panNumber: "AADCB2230M",
      },
      {
        name: "Priya Mehta",
        phone: "9845012345",
        email: "priya@mehta.in",
        address: "5, Koramangala, Bengaluru",
        panNumber: "BKNPM3392F",
      },
      {
        name: "Suresh Nair",
        phone: "9900112233",
        address: "7, Indiranagar, Bengaluru",
        gstNumber: "32ABCDE1234F1Z5",
      },
      {
        name: "Ananya Rao",
        phone: "9123456789",
        email: "ananya@rao.com",
        address: "3, Jayanagar, Bengaluru",
        panNumber: "CQQPR4567T",
      },
      {
        name: "Kiran Patel",
        phone: "9000099000",
        email: "kiran@patelsupply.com",
        address: "22, Whitefield, Bengaluru",
        gstNumber: "24AAACF2222B1Z5",
        panNumber: "AAACF2222B",
      },
    ],
  });

  console.log(`✅ Created ${customers.count} customers`);

  // Seed Inventory Items
  const dbSuppliers = await prisma.supplier.findMany({ take: 1, orderBy: { id: 'desc' } });
  const supplierId = dbSuppliers.length > 0 ? dbSuppliers[0].id : 1;

  const inventoryItems = await prisma.inventoryItem.createMany({
    data: [
      {
        name: "Basmati Rice 1kg",
        sku: "GRO-001",
        category: "Groceries",
        location: "Rack A-1",
        unit: "kg",
        purchasePrice: 8000,
        sellingPrice: 11000,
        currentQuantity: 250,
        totalQuantity: 500,
        lowStockThreshold: 50,
        taxRate: 5,
        hsnCode: "1006",
        expiryDate: new Date("2025-12-31"),
        supplierId,
      },
      {
        name: "Toor Dal 500g",
        sku: "GRO-002",
        category: "Groceries",
        location: "Rack A-2",
        unit: "kg",
        purchasePrice: 9000,
        sellingPrice: 12000,
        currentQuantity: 8,
        totalQuantity: 200,
        lowStockThreshold: 20,
        taxRate: 5,
        hsnCode: "0713",
        expiryDate: new Date("2025-10-15"),
        supplierId,
      },
      {
        name: "Sunflower Oil 1L",
        sku: "GRO-003",
        category: "Groceries",
        location: "Rack B-1",
        unit: "ltr",
        purchasePrice: 13000,
        sellingPrice: 16500,
        currentQuantity: 60,
        totalQuantity: 150,
        lowStockThreshold: 15,
        taxRate: 5,
        hsnCode: "1512",
        expiryDate: new Date("2025-08-20"),
        supplierId,
      },
    ],
  });

  console.log(`✅ Created ${inventoryItems.count} inventory items`);

  // Fetch created customers to use their IDs for bills
  const dbCustomers = await prisma.customer.findMany({
    take: 3,
    orderBy: { id: 'desc' }
  });

  if (dbCustomers.length >= 3) {
    // Seed Bills
    const bills = await prisma.bill.createMany({
      data: [
        {
          billNumber: "INV-0001",
          billCode: "A1B2C3",
          customerId: dbCustomers[0].id,
          customerName: dbCustomers[0].name,
          subtotal: 10000,
          discountAmount: 0,
          taxAmount: 500,
          totalAmount: 10500,
          paidAmount: 10500,
          status: "paid",
          createdAt: new Date("2024-04-20"),
        },
        {
          billNumber: "INV-0002",
          billCode: "D4E5F6",
          customerId: dbCustomers[0].id,
          customerName: dbCustomers[0].name,
          subtotal: 20000,
          discountAmount: 1000,
          taxAmount: 950,
          totalAmount: 19950,
          paidAmount: 5000,
          status: "partial",
          createdAt: new Date("2024-04-22"),
        },
        {
          billNumber: "INV-0003",
          billCode: "G7H8I9",
          customerId: dbCustomers[1].id,
          customerName: dbCustomers[1].name,
          subtotal: 50000,
          discountAmount: 2000,
          taxAmount: 2400,
          totalAmount: 50400,
          paidAmount: 50400,
          status: "paid",
          createdAt: new Date("2024-04-25"),
        },
        {
          billNumber: "INV-0004",
          billCode: "J0K1L2",
          customerId: dbCustomers[2].id,
          customerName: dbCustomers[2].name,
          subtotal: 15000,
          discountAmount: 0,
          taxAmount: 750,
          totalAmount: 15750,
          paidAmount: 0,
          status: "unpaid",
          createdAt: new Date(),
        }
      ],
    });

    console.log(`✅ Created ${bills.count} bills`);
  } else {
    console.log("⚠️ Not enough customers to create bills");
  }

  // Note: We are not seeding BillItems here to keep it brief, but the totals will reflect correctly on the frontend due to the Bill entries.

  console.log("✨ Database seeding completed!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
