# Backend Setup Guide - Production Grade Microservices Architecture

## Overview
The backend has been restructured with production-grade scalability using:
- **Express.js** - Lightweight API framework
- **Prisma ORM** - Type-safe database access
- **PostgreSQL** - Relational database
- **Microservices Pattern** - Organized by features/domains

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma              # Prisma schema (database models)
│   ├── migrations/                # Database migrations
│   │   └── 1_init/
│   │       └── migration.sql      # Initial schema migration
│   ├── migration_lock.toml        # Migration lock file
│   └── seed.js                    # Database seeding script
├── src/
│   ├── config/
│   │   ├── env.js                # Environment variables
│   │   └── database.js           # Prisma client setup
│   ├── services/
│   │   ├── customerService.js    # Customer business logic
│   │   ├── billService.js        # Bill business logic
│   │   ├── inventoryService.js   # Inventory business logic
│   │   └── supplierService.js    # Supplier business logic
│   ├── controllers/
│   │   ├── customerController.js # Customer HTTP handlers
│   │   ├── billController.js     # Bill HTTP handlers
│   │   ├── inventoryController.js# Inventory HTTP handlers
│   │   └── supplierController.js # Supplier HTTP handlers
│   ├── routes/
│   │   ├── customerRoutes.js     # Customer API routes
│   │   ├── billRoutes.js         # Bill API routes
│   │   ├── inventoryRoutes.js    # Inventory API routes
│   │   ├── supplierRoutes.js     # Supplier API routes
│   │   └── dashboardRoutes.js    # Dashboard routes
│   ├── middlewares/
│   │   └── errorHandler.js       # Error handling & logging
│   ├── utils/
│   │   └── index.js              # Utilities & helpers
│   ├── types/                     # TypeScript types (ready)
│   └── index.js                  # Main Express app
├── .env.example                  # Environment template
├── package.json                  # Dependencies & scripts
└── README.md                     # This file
```

## Setup Instructions

### 1. Prerequisites
- Node.js v18+ 
- PostgreSQL v13+
- npm or yarn

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your PostgreSQL config
DATABASE_URL="postgresql://user:password@localhost:5432/vyaparbook?schema=public"
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup

#### Option A: Create Database Manually
```bash
# Create PostgreSQL database
createdb vyaparbook

# Run migrations
npm run prisma:migrate:deploy

# (Optional) Seed sample data
npm run seed
```

#### Option B: Using Prisma DB Push
```bash
# Push schema to database (creates tables)
npm run prisma:push

# (Optional) Seed sample data  
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```

Server runs on `http://localhost:3000`

## Database Schema

The Prisma schema includes 8 interconnected models:

### Core Models
1. **Customer** - Customer information & credit tracking
2. **Supplier** - Supplier details & payment terms
3. **InventoryItem** - Product catalog with pricing & stock
4. **Bill** - Sales invoices to customers
5. **BillItem** - Line items within bills
6. **PurchaseOrder** - Purchase orders to suppliers
7. **PurchaseOrderItem** - Line items within purchase orders
8. **Transaction** - Payment & financial tracking
9. **StockMovement** - Inventory audit trail

### Relationships
- Bills are linked to Customers
- Inventory Items are linked to Suppliers
- Transactions track both customer and supplier payments
- Stock Movements track all inventory changes

## Available Scripts

```bash
# Development
npm run dev                      # Start with hot reload
npm start                        # Production start

# Database
npm run prisma:generate         # Generate Prisma Client
npm run prisma:migrate          # Create new migration
npm run prisma:migrate:deploy   # Deploy migrations to prod
npm run prisma:push             # Push schema without migration
npm run prisma:studio           # Open Prisma Studio UI
npm run seed                     # Seed sample data
```

## API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Customers
- `GET /customers` - List customers (paginated, searchable)
- `GET /customers/:id` - Get customer details
- `POST /customers` - Create customer
- `PATCH /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer
- `GET /customers/:id/balance` - Get customer balance

### Bills
- `GET /bills` - List bills
- `GET /bills/:id` - Get bill details
- `GET /bills/next-number` - Get next bill number
- `POST /bills` - Create bill
- `PATCH /bills/:id` - Update bill
- `DELETE /bills/:id` - Delete bill

### Inventory
- `GET /inventory` - List items (paginated, filterable)
- `GET /inventory/:id` - Get item details
- `GET /inventory/summary` - Get inventory summary
- `GET /inventory/low-stock` - Get low stock items
- `POST /inventory` - Create item
- `PATCH /inventory/:id` - Update item
- `DELETE /inventory/:id` - Delete item

### Suppliers
- `GET /suppliers` - List suppliers
- `GET /suppliers/:id` - Get supplier details
- `POST /suppliers` - Create supplier
- `PATCH /suppliers/:id` - Update supplier
- `DELETE /suppliers/:id` - Delete supplier

### Dashboard
- `GET /dashboard/summary` - Dashboard summary metrics
- `GET /dashboard/recent-activity` - Recent activity feed

## Architecture Patterns

### Service Layer Pattern
Business logic is separated into service modules:

```javascript
// services/customerService.js
export const customerService = {
  async findAll(page, limit, filters) { /* ... */ },
  async findById(id) { /* ... */ },
  async create(data) { /* ... */ },
  async update(id, data) { /* ... */ },
  async delete(id) { /* ... */ },
};
```

### Controller Pattern
HTTP handlers delegate to services:

```javascript
// controllers/customerController.js
export const customerController = {
  async getAll(req, res) {
    const result = await customerService.findAll(...);
    res.json(result);
  },
};
```

### Router Pattern
Routes map to controllers:

```javascript
// routes/customerRoutes.js
router.get("/", customerController.getAll);
router.post("/", customerController.create);
```

## Database Migrations

### Creating Migrations

When you modify `schema.prisma`:

```bash
# Create a migration
npm run prisma:migrate

# Enter a name for the migration (e.g., "add_product_rating")
```

Prisma generates SQL in `prisma/migrations/[timestamp]_[name]/migration.sql`

### Viewing Migrations

```bash
# Open Prisma Studio
npm run prisma:studio

# Or view migration files in prisma/migrations/
```

### Deploying Migrations (Production)

```bash
# This safely applies all pending migrations
npm run prisma:migrate:deploy
```

## Error Handling

Global error handler catches all errors:

```javascript
// Automatically handles:
// - Prisma unique constraint violations (409)
// - Prisma record not found (404)
// - Validation errors
// - Server errors (500)
```

## Logging

Request logging middleware logs all HTTP requests:

```
[GET] /api/customers - 200 - 45ms
[POST] /api/bills - 201 - 120ms
[PATCH] /api/inventory/1 - 200 - 65ms
```

## Pagination

List endpoints support pagination:

```javascript
GET /api/customers?page=2&limit=20
```

Response:
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Search & Filtering

Search endpoints support filtering:

```javascript
// Search customers
GET /api/customers?search=ravi

// Filter inventory by category
GET /api/inventory?category=Groceries

// Filter bills by status
GET /api/bills?status=unpaid
```

## Performance Optimization

1. **Indexing** - Database indexes on frequently queried fields
2. **Pagination** - Prevents loading large datasets
3. **Selective Loading** - Only requested fields returned
4. **Connection Pooling** - Prisma handles connection management

## Extending the System

### Adding a New Feature

1. **Create Service**
   ```javascript
   // src/services/newFeatureService.js
   export const newFeatureService = {
     async findAll() { /* ... */ },
   };
   ```

2. **Create Controller**
   ```javascript
   // src/controllers/newFeatureController.js
   import { newFeatureService } from "../services/newFeatureService.js";
   export const newFeatureController = { /* ... */ };
   ```

3. **Create Routes**
   ```javascript
   // src/routes/newFeatureRoutes.js
   router.get("/", newFeatureController.getAll);
   ```

4. **Register in Main App**
   ```javascript
   // src/index.js
   import newFeatureRoutes from "./routes/newFeatureRoutes.js";
   app.use("/api/newfeature", newFeatureRoutes);
   ```

## Best Practices

✅ **Do:**
- Use services for all business logic
- Validate input in controllers
- Use Prisma for all database access
- Handle errors gracefully
- Log important operations
- Use pagination for lists
- Index frequently queried fields

❌ **Don't:**
- Access database directly from routes
- Mix business logic in controllers
- Ignore error cases
- Return stacktraces to clients
- N+1 queries (use `include` in Prisma)

## Troubleshooting

### Database Connection Issue
```bash
# Check DATABASE_URL in .env
echo $DATABASE_URL

# Verify PostgreSQL is running
psql -U user -d vyaparbook -c "SELECT 1;"
```

### Migration Issues
```bash
# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

### Port Already in Use
```bash
# Change PORT in .env or:
PORT=3001 npm run dev
```

## Next Steps

1. **Add Authentication** - JWT middleware
2. **Add Validation** - Request body validation with Joi
3. **Add Caching** - Redis for frequently accessed data
4. **Add Analytics** - Database event tracking
5. **Add File Uploads** - Document/image storage
6. **Monitor Performance** - APM tools integration
7. **API Documentation** - Swagger/OpenAPI spec

## Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [REST API Best Practices](https://restfulapi.net/)

## Support

For issues or questions:
1. Check error messages in terminal
2. Review logs in `[timestamp].log`
3. Check database state with Prisma Studio
4. Verify migrations are applied

---

**Backend Setup**: Production-Grade Microservices
**ORM**: Prisma with PostgreSQL
**Setup Date**: 2026-04-25  
**Status**: ✅ Ready for Development
