import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Pass the adapter to the constructor
const prisma = new PrismaClient({ adapter });

async function main() {
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
        creditLimit: 50000,
        totalBilled: 125000,
        totalPaid: 110000,
      },
      {
        name: "Priya Mehta",
        phone: "9845012345",
        email: "priya@mehta.in",
        address: "5, Koramangala, Bengaluru",
        panNumber: "BKNPM3392F",
        creditLimit: 30000,
        totalBilled: 87500,
        totalPaid: 87500,
      },
      {
        name: "Suresh Nair",
        phone: "9900112233",
        address: "7, Indiranagar, Bengaluru",
        gstNumber: "32ABCDE1234F1Z5",
        totalBilled: 54000,
        totalPaid: 30000,
      },
      {
        name: "Ananya Rao",
        phone: "9123456789",
        email: "ananya@rao.com",
        address: "3, Jayanagar, Bengaluru",
        panNumber: "CQQPR4567T",
        creditLimit: 20000,
        totalBilled: 32000,
        totalPaid: 32000,
      },
      {
        name: "Kiran Patel",
        phone: "9000099000",
        email: "kiran@patelsupply.com",
        address: "22, Whitefield, Bengaluru",
        gstNumber: "24AAACF2222B1Z5",
        panNumber: "AAACF2222B",
        creditLimit: 100000,
        totalBilled: 210000,
        totalPaid: 195000,
      },
    ],
  });

  console.log(`✅ Created ${customers.count} customers`);

  // Seed Inventory Items
  const supplierId = 1;
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
