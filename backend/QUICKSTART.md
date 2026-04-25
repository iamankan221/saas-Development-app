# 🚀 Quick Start - VyaparBook Backend

## Prerequisites
- Node.js v18+
- PostgreSQL 13+
- npm or yarn

## 5-Minute Setup

### Step 1: Install & Configure (2 min)
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your PostgreSQL connection
# Example:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/vyaparbook"
```

### Step 2: Setup Database (2 min)
```bash
# Create PostgreSQL database
createdb vyaparbook

# Apply migrations
npm run prisma:migrate:deploy

# Load sample data
npm run seed
```

### Step 3: Start Server (1 min)
```bash
npm run dev
```

Server running on: `http://localhost:3000`

## API Quick Test

### Test Health
```bash
curl http://localhost:3000/api/health
```

### Get Customers
```bash
curl http://localhost:3000/api/customers
```

### Create Customer
```bash
curl -X POST http://localhost:3000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "phone": "1234567890",
    "email": "test@example.com"
  }'
```

## Project Structure at a Glance

```
backend/
├── prisma/schema.prisma        ← Database models
├── prisma/migrations/          ← Auto-generated SQL migrations
├── src/
│   ├── config/                 ← Environment & database config
│   ├── services/               ← Business logic
│   ├── controllers/            ← HTTP handlers
│   ├── routes/                 ← API routes
│   ├── middlewares/             ← Error handling
│   └── index.js                ← Main app
├── .env                        ← Your configuration
└── package.json                ← Dependencies & scripts
```

## Common Commands

```bash
# Development
npm run dev                  # Hot reload server

# Database
npm run prisma:studio      # Open Prisma Studio
npm run prisma:migrate     # Create new migration
npm run seed               # Load sample data
npm run prisma:push        # Push schema to DB

# Production
npm start                  # Run server
npm run prisma:migrate:deploy  # Deploy migrations
```

## Key Features

✅ **Microservices Architecture** - Organized by features  
✅ **Prisma ORM** - Type-safe database access  
✅ **PostgreSQL** - Production-ready database  
✅ **Error Handling** - Global error middleware  
✅ **Request Logging** - Built-in request tracking  
✅ **Pagination** - Efficient data loading  
✅ **Search & Filtering** - Advanced query support  

## Database Models

1. **Customers** - Customer management
2. **Suppliers** - Supplier information  
3. **InventoryItems** - Product catalog
4. **Bills** - Sales invoices
5. **PurchaseOrders** - Supplier purchases
6. **Transactions** - Payment tracking
7. **StockMovements** - Inventory audit
8. **BillItems** - Line items
9. **PurchaseOrderItems** - Line items

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/:id` | Get customer |
| PATCH | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |
| GET | `/api/bills` | List bills |
| POST | `/api/bills` | Create bill |
| GET | `/api/inventory` | List inventory |
| GET | `/api/suppliers` | List suppliers |
| GET | `/api/dashboard/summary` | Dashboard metrics |

## Troubleshooting

### "Port 3000 already in use"
```bash
PORT=3001 npm run dev
```

### "Database connection refused"
1. Check PostgreSQL is running: `psql -U postgres`
2. Verify DATABASE_URL in .env
3. Ensure database exists: `createdb vyaparbook`

### "Prisma Client not found"
```bash
npm run prisma:generate
```

### Reset Everything
```bash
# ⚠️ DELETES ALL DATA
npx prisma migrate reset
```

## Next Steps

1. Read [README.md](./README.md) for detailed documentation
2. Review [PRISMA_SETUP.md](./PRISMA_SETUP.md) for database details
3. Explore `prisma/schema.prisma` to understand the data model
4. Check `src/services/` to see business logic
5. Start building your API!

## Support

For issues:
1. Check server logs for errors
2. Verify database connection: `psql -U postgres -d vyaparbook`
3. Open Prisma Studio: `npm run prisma:studio`
4. Review migration status: `npx prisma migrate status`

---

**Setup Time**: 5 minutes  
**Status**: ✅ Ready for Development  
**Framework**: Express.js + Prisma + PostgreSQL
