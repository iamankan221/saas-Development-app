import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testUpdate() {
  try {
    const id = 5; // Dairy Fresh Pvt Ltd
    console.log("Testing update for Supplier ID:", id);
    
    const result = await prisma.supplier.update({
      where: { id },
      data: {
        upiId: "dairy@okicici",
        accountNumber: "1234567890",
        ifscCode: "BARB0ABCD",
        bankName: "Bank of Baroda"
      }
    });
    console.log("Update successful:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("DATABASE ERROR DETECTED:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdate();
