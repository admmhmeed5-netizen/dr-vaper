const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Make sure the data folder + file exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, '[]', 'utf8');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ---------------------------------------------------------- */
/* Simple JSON-file "database" for orders                     */
/* ---------------------------------------------------------- */
function readOrders() {
  try {
    const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
}

/* ---------------------------------------------------------- */
/* Very simple admin session tokens (kept in memory)           */
/* ---------------------------------------------------------- */
const sessions = new Set();

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (token && sessions.has(token)) {
    return next();
  }
  return res.status(401).json({ error: 'unauthorized' });
}

/* ---------------------------------------------------------- */
/* Admin auth routes                                           */
/* ---------------------------------------------------------- */
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password && password === ADMIN_PASSWORD) {
    const token = crypto.randomBytes(24).toString('hex');
    sessions.add(token);
    return res.json({ token });
  }
  return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
});

app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.slice(7);
  sessions.delete(token);
  res.json({ ok: true });
});

/* ---------------------------------------------------------- */
/* Orders API                                                   */
/* ---------------------------------------------------------- */

// Create a new order (called from the storefront's checkout page)
app.post('/api/orders', (req, res) => {
  const body = req.body || {};
  const required = ['name', 'phone', 'email', 'region', 'city', 'address'];
  for (const field of required) {
    if (!body[field]) {
      return res.status(400).json({ error: `الحقل "${field}" مطلوب` });
    }
  }

  const order = {
    id: crypto.randomUUID(),
    name: String(body.name).slice(0, 200),
    phone: String(body.phone).slice(0, 30),
    email: String(body.email).slice(0, 200),
    region: String(body.region).slice(0, 100),
    city: String(body.city).slice(0, 100),
    district: String(body.district || '').slice(0, 100),
    address: String(body.address).slice(0, 1000),
    items: Array.isArray(body.items)
      ? body.items.slice(0, 100).map((it) => ({
          name: String(it.name || '').slice(0, 200),
          price: Number(it.price) || 0,
          qty: Number(it.qty) || 1,
        }))
      : [],
    itemCount: Number(body.itemCount) || 0,
    total: Number(body.total) || 0,
    status: 'جديد',
    createdAt: new Date().toISOString(),
  };

  const orders = readOrders();
  orders.unshift(order); // newest first
  writeOrders(orders);

  res.json({ ok: true, order });
});

// List all orders (admin only), newest first
app.get('/api/orders', requireAdmin, (req, res) => {
  const orders = readOrders();
  res.json({ orders });
});

// Update an order's status (admin only)
app.patch('/api/orders/:id', requireAdmin, (req, res) => {
  const { status } = req.body || {};
  const orders = readOrders();
  const idx = orders.findIndex((o) => o.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'الطلب غير موجود' });
  }
  if (status) orders[idx].status = status;
  writeOrders(orders);
  res.json({ ok: true, order: orders[idx] });
});

// Delete an order (admin only)
app.delete('/api/orders/:id', requireAdmin, (req, res) => {
  const orders = readOrders();
  const next = orders.filter((o) => o.id !== req.params.id);
  writeOrders(next);
  res.json({ ok: true });
});

/* ---------------------------------------------------------- */
/* Health check (useful for Railway)                            */
/* ---------------------------------------------------------- */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

/* ---------------------------------------------------------- */
/* Explicit /admin route (in case static serving is disabled)   */
/* ---------------------------------------------------------- */
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`✅ dr.vaper server running on port ${PORT}`);
  console.log(`   Store:  http://localhost:${PORT}/`);
  console.log(`   Admin:  http://localhost:${PORT}/admin`);
});
