# Database Setup Scripts

## Quick Setup

1. **Configure environment variables** in `.env.local`:
   ```bash
   # MySQL Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=fintech

   # MongoDB
   MONGODB_URI=mongodb://localhost:27017/fintech_nosql
   ```

2. **Test database connections**:
   ```bash
   npm run db:test
   ```

3. **Set up MongoDB collections** (run once):
   ```bash
   npm run setup-mongodb
   ```

## Scripts

- `db-test.js` - Tests MySQL and MongoDB connections
- `setup-mongodb.js` - Creates MongoDB collections and indexes

## MySQL Setup

Run this SQL script in your MySQL client to create the required tables:

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS fintech;
USE fintech;

-- Create all tables (organizations, users, portfolios, etc.)
-- [Your existing MySQL schema here]
```

That's it! Your databases are ready for development.
