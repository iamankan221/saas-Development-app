# Prisma & PostgreSQL Setup - Complete Guide

## What is Prisma?

Prisma is a modern ORM (Object-Relational Mapping) that provides:
- ✅ Type-safe database access
- ✅ Auto-generated database client
- ✅ Built-in migration system
- ✅ Intuitive data modeling
- ✅ Query optimization

## What is PostgreSQL?

PostgreSQL is a powerful, open-source relational database with:
- ✅ ACID compliance
- ✅ JSON support
- ✅ Advanced indexing
- ✅ Scaling capabilities
- ✅ Free and open-source

## Installation & Setup

### Step 1: Install PostgreSQL

#### macOS (with Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

#### Windows
1. Download from https://www.postgresql.org/download/windows/
2. Run installer, remember your master password
3. PostgreSQL starts automatically

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Step 2: Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE vyaparbook;

# Exit psql
\q
```

Or via command line:
```bash
createdb -U postgres vyaparbook
```

### Step 3: Get Connection String
```bash
# Connection string format:
postgresql://username:password@localhost:5432/database

# For default setup:
postgresql://postgres:yourpassword@localhost:5432/vyaparbook
```

### Step 4: Configure .env
```bash
# Copy template
cp .env.example .env

# Edit .env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/vyaparbook"
NODE_ENV=development
PORT=3000
```

## Running Migrations

### First Time Setup
```bash
# Install dependencies
npm install

# Apply migrations to database
npm run prisma:migrate:deploy

# (Optional) Seed sample data
npm run seed
```

### Creating New Migration
After modifying `prisma/schema.prisma`:
```bash
npm run prisma:migrate
```

Follow the prompt to name your migration (e.g., "add_user_roles")

Prisma generates SQL in: `prisma/migrations/[timestamp]_[name]/migration.sql`

### Viewing Database (Prisma Studio)
```bash
npm run prisma:studio
```

Opens browser UI at `http://localhost:5555`

### Production Migration
```bash
# Deploy pending migrations (no prompts)
npm run prisma:migrate:deploy
```

## Database Schema Overview

The schema defines 9 models representing your business entities:

### Customers
- Stores customer information
- Tracks credit limits and payment status
- Indexes on status and creation date

### Suppliers
- Supplier contact and payment terms
- Linked to inventory items
- Support for GST tracking

### Inventory Items
- Product catalog with SKU
- Pricing (purchase & selling)
- Stock management with low stock alerts
- Expiry date tracking
- Tax and HSN codes

### Bills (Sales)
- Customer invoices
- Bill items with line-level tax
- Payment tracking
- Status: unpaid, partial, paid, cancelled

### Purchase Orders
- Orders to suppliers
- Received quantity tracking
- Expected vs. actual delivery dates

### Transactions
- Payment records (customer & supplier)
- Supports multiple payment methods
- Links to bills and purchase orders

### Stock Movements
- Audit trail for all inventory changes
- Reasons for stock adjustments
- Historical tracking

## Prisma Key Concepts

### Migrations
Migrations track database schema changes:

```bash
# View all migrations
ls prisma/migrations/

# Each migration has timestamp_name/migration.sql
# Example: 20240425120530_init/migration.sql
```

### Indexes
Database indexes optimize queries:
```prisma
model Customer {
  id    Int     @id @default(autoincrement())
  name  String
  status String

  @@index([status])
  @@index([createdAt])
}
```

### Relations
Define relationships between models:
```prisma
model Bill {
  id        Int @id @default(autoincrement())
  customerId Int
  customer  Customer @relation(fields: [customerId], references: [id])
}
```

### Constraints
Enforce data integrity:
```prisma
model Customer {
  email String? @unique  // Unique email
  phone String  @unique  // Unique phone
}
```

## Common Prisma Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create migration interactively
npm run prisma:migrate

# Push schema directly (dev only)
npm run prisma:push

# Deploy migrations (production)
npm run prisma:migrate:deploy

# Open Studio (browser UI)
npm run prisma:studio

# Seed database with sample data
npm run seed

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

## Using Prisma in Code

### Query Examples

```javascript
// Create
const customer = await prisma.customer.create({
  data: {
    name: "John Doe",
    phone: "9876543210",
    email: "john@example.com"
  }
});

// Read
const customers = await prisma.customer.findMany({
  where: { status: "active" },
  orderBy: { createdAt: "desc" }
});

// Update
await prisma.customer.update({
  where: { id: 1 },
  data: { status: "inactive" }
});

// Delete
await prisma.customer.delete({
  where: { id: 1 }
});
```

### Relations & Includes

```javascript
// Get customer with their bills
const customer = await prisma.customer.findUnique({
  where: { id: 1 },
  include: { bills: true }
});

// Get bill with items and customer
const bill = await prisma.bill.findUnique({
  where: { id: 1 },
  include: {
    items: true,
    customer: true
  }
});
```

### Filtering & Pagination

```javascript
// Search
const items = await prisma.inventoryItem.findMany({
  where: {
    name: { contains: "rice", mode: "insensitive" }
  }
});

// Pagination
const page = 1;
const pageSize = 20;
const items = await prisma.inventoryItem.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize
});

// Aggregation
const count = await prisma.customer.count();
const total = await prisma.bill.aggregate({
  _sum: { totalAmount: true }
});
```

## Migration Files Explained

Each migration file contains SQL that:
1. Creates new tables
2. Adds/removes columns
3. Creates/drops indexes
4. Modifies constraints

Example migration structure:
```sql
-- CreateTable Customers
CREATE TABLE "customers" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "name" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(20) NOT NULL UNIQUE,
  ...
);

-- CreateIndex
CREATE INDEX "customers_status_idx" ON "customers"("status");
```

## Database Performance Tuning

### Indexes
Indexes speed up queries on frequently searched fields:

```prisma
@@index([status])
@@index([createdAt])
@@index([customerId])
```

### Optimal Queries

✅ Good - only needed fields:
```javascript
const customers = await prisma.customer.findMany({
  select: { id: true, name: true, email: true }
});
```

❌ Bad - loads unnecessary data:
```javascript
const customers = await prisma.customer.findMany();
// Loads all fields including bio, notes, etc.
```

## Troubleshooting

### Migration Success Check
```bash
# List applied migrations
ls prisma/migrations/

# Check if migration_lock.toml exists
cat prisma/migration_lock.toml
```

### Connection Issues
```bash
# Test PostgreSQL connection
psql -U postgres -d vyaparbook -c "SELECT 1;"

# Verify DATABASE_URL
echo $DATABASE_URL

# Check if PostgreSQL is running
psql -U postgres -l  # Lists all databases
```

### Reset Everything (⚠️ Deletes Data)
```bash
# This resets the entire database
npx prisma migrate reset

# Creates fresh database + runs seed
npm run seed
```

## Data Types Reference

| Prisma Type | PostgreSQL Type | Usage |
|---|---|---|
| `Int` | INTEGER | Whole numbers |
| `BigInt` | BIGINT | Large numbers (prices in paise) |
| `String` | VARCHAR | Text |
| `Boolean` | BOOLEAN | True/False |
| `DateTime` | TIMESTAMP | Date and time |
| `Decimal` | DECIMAL | Precise decimals |
| `Bytes` | BYTEA | Binary data |
| `Json` | JSONB | JSON objects |

## Next Steps

1. **Review Schema** - Open `prisma/schema.prisma`
2. **Check Migrations** - View `prisma/migrations/`
3. **Test Connection** - Run `npm run prisma:studio`
4. **Run Seeds** - Load sample data with `npm run seed`
5. **Start Coding** - Use Prisma Client in services

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Community](https://www.postgresql.org/)
- [Prisma CLI Reference](https://www.prisma.io/docs/reference/api-reference/command-reference)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/)

---

**Status**: ✅ PostgreSQL + Prisma Ready
**Database**: VyaparBook
**ORM**: Prisma v5.8+
**Setup Date**: 2026-04-25
