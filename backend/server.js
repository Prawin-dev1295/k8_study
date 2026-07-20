import cors from 'cors';
import express from 'express';
import { initDb, pool, closeDb } from './db.js';

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.get('/api/products', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, name, description, price FROM products ORDER BY id');
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.post('/api/orders', async (req, res, next) => {
  const { customerName, items } = req.body;

  if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
    return res.status(400).json({ error: 'customerName is required' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items must contain at least one product' });
  }

  const normalizedItems = items.map((item) => ({
    productId: Number(item.productId),
    quantity: Number(item.quantity)
  }));

  if (normalizedItems.some((item) => !Number.isInteger(item.productId) || !Number.isInteger(item.quantity) || item.quantity <= 0)) {
    return res.status(400).json({ error: 'each item needs a valid productId and positive quantity' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const productIds = normalizedItems.map((item) => item.productId);
    const { rows: products } = await client.query(
      'SELECT id, name, price FROM products WHERE id = ANY($1::int[])',
      [productIds]
    );

    if (products.length !== new Set(productIds).size) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'one or more products do not exist' });
    }

    const productById = new Map(products.map((product) => [product.id, product]));
    const total = normalizedItems.reduce((sum, item) => {
      const product = productById.get(item.productId);
      return sum + Number(product.price) * item.quantity;
    }, 0);

    const { rows: orderRows } = await client.query(
      'INSERT INTO orders (customer_name, total) VALUES ($1, $2) RETURNING id, customer_name, total, created_at',
      [customerName.trim(), total]
    );

    for (const item of normalizedItems) {
      const product = productById.get(item.productId);
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
        [orderRows[0].id, item.productId, item.quantity, product.price]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(orderRows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

app.get('/api/orders', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        o.id,
        o.customer_name,
        o.total,
        o.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'product_id', p.id,
              'product_name', p.name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price
            )
            ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) AS items
      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'internal server error' });
});

const server = app.listen(port, async () => {
  try {
    await initDb();
    console.log(`Order backend listening on port ${port}`);
  } catch (error) {
    console.error('Database initialization failed', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  server.close(async () => {
    await closeDb();
    process.exit(0);
  });
});
