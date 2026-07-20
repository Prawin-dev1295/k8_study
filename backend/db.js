import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'orderdb',
  user: process.env.DB_USER || 'orderuser',
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000
});

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      customer_name TEXT NOT NULL,
      total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)
    );
  `);

  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM products');
  if (rows[0].count === 0) {
    await pool.query(
      `
        INSERT INTO products (name, description, price)
        VALUES
          ('Laptop Stand', 'Adjustable aluminum stand for desks and study tables.', 39.99),
          ('Wireless Mouse', 'Ergonomic mouse with silent clicks and long battery life.', 24.50),
          ('Mechanical Keyboard', 'Compact keyboard with tactile switches.', 79.00),
          ('USB-C Hub', 'Seven-port hub for monitors, storage, and charging.', 45.75),
          ('Notebook Pack', 'Set of three ruled notebooks for planning and classes.', 12.25)
      `
    );
  }
}

export async function closeDb() {
  await pool.end();
}
