import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const runtimeConfig = window.__APP_CONFIG__ || {};
const API_BASE_URL = runtimeConfig.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const product = products.find((item) => item.id === Number(productId));
        return product ? { ...product, quantity } : null;
      })
      .filter(Boolean);
  }, [cart, products]);

  const cartTotal = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  async function loadData() {
    setError('');
    try {
      const [productsResponse, ordersResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/products`),
        fetch(`${API_BASE_URL}/orders`)
      ]);

      if (!productsResponse.ok || !ordersResponse.ok) {
        throw new Error('Unable to load purchasing data');
      }

      setProducts(await productsResponse.json());
      setOrders(await ordersResponse.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function addToCart(productId) {
    setCart((current) => ({
      ...current,
      [productId]: (current[productId] || 0) + 1
    }));
  }

  function updateQuantity(productId, quantity) {
    const nextQuantity = Number(quantity);
    setCart((current) => {
      const next = { ...current };
      if (nextQuantity <= 0) {
        delete next[productId];
      } else {
        next[productId] = nextQuantity;
      }
      return next;
    });
  }

  async function submitOrder(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!customerName.trim()) {
      setError('Enter a customer name before submitting the order.');
      return;
    }

    if (cartItems.length === 0) {
      setError('Add at least one product to the order.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity
          }))
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Order submission failed');
      }

      setMessage(`Order #${payload.id} submitted successfully.`);
      setCustomerName('');
      setCart({});
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <section className="toolbar">
        <div>
          <p className="eyebrow">Kubernetes learning app</p>
          <h1>Order Purchasing System</h1>
        </div>
        <button className="ghost-button" onClick={loadData} type="button">
          Refresh
        </button>
      </section>

      {(message || error) && (
        <section className={`notice ${error ? 'error' : 'success'}`}>
          {error || message}
        </section>
      )}

      <section className="layout">
        <div className="panel">
          <div className="panel-header">
            <h2>Products</h2>
            <span>{loading ? 'Loading' : `${products.length} available`}</span>
          </div>
          <div className="product-grid">
            {products.map((product) => (
              <article className="product-card" key={product.id}>
                <div>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                </div>
                <div className="product-actions">
                  <strong>${Number(product.price).toFixed(2)}</strong>
                  <button type="button" onClick={() => addToCart(product.id)}>
                    Add
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <form className="panel order-panel" onSubmit={submitOrder}>
          <div className="panel-header">
            <h2>Current Order</h2>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <label>
            Customer name
            <input
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Example: Haritha"
            />
          </label>
          <div className="cart-list">
            {cartItems.length === 0 && <p className="empty-state">No products added yet.</p>}
            {cartItems.map((item) => (
              <div className="cart-row" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>${Number(item.price).toFixed(2)} each</span>
                </div>
                <input
                  aria-label={`${item.name} quantity`}
                  min="0"
                  type="number"
                  value={item.quantity}
                  onChange={(event) => updateQuantity(item.id, event.target.value)}
                />
              </div>
            ))}
          </div>
          <button className="submit-button" disabled={submitting} type="submit">
            {submitting ? 'Submitting...' : 'Submit Order'}
          </button>
        </form>
      </section>

      <section className="panel orders-panel">
        <div className="panel-header">
          <h2>Submitted Orders</h2>
          <span>{orders.length} total</span>
        </div>
        <div className="orders-list">
          {orders.length === 0 && <p className="empty-state">Submitted orders will appear here.</p>}
          {orders.map((order) => (
            <article className="order-card" key={order.id}>
              <div>
                <h3>Order #{order.id}</h3>
                <p>{order.customer_name}</p>
              </div>
              <div className="order-meta">
                <strong>${Number(order.total).toFixed(2)}</strong>
                <span>{new Date(order.created_at).toLocaleString()}</span>
              </div>
              <ul>
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.product_id}`}>
                    {item.quantity} x {item.product_name}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
