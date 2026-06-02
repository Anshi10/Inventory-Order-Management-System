import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getOrders, createOrder, deleteOrder, getCustomers, getProducts } from '../api';
import axios from 'axios';
const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000' });

const emptyItem = { product_id: '', quantity: 1 };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getOrders(), getCustomers(), getProducts()])
      .then(([o, c, p]) => { setOrders(o); setCustomers(c); setProducts(p); })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const addItem = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => {
    const updated = [...items];
    updated[i] = { ...updated[i], [field]: val };
    setItems(updated);
  };

  const validate = () => {
    const e = {};
    if (!customerId) e.customer = 'Select a customer';
    if (items.some(it => !it.product_id)) e.items = 'Select a product for each row';
    if (items.some(it => Number(it.quantity) <= 0)) e.items = 'All quantities must be positive';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await createOrder({
        customer_id: Number(customerId),
        items: items.map(it => ({ product_id: Number(it.product_id), quantity: Number(it.quantity) })),
      });
      toast.success('Order created');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error creating order');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this order? Stock will be restored.')) return;
    try {
      await deleteOrder(id);
      toast.success('Order cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error cancelling order');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/orders/${id}`, { status: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      load();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const openCreate = () => {
    setCustomerId('');
    setItems([{ ...emptyItem }]);
    setErrors({});
    setShowModal(true);
  };

  // Preview total
  const previewTotal = items.reduce((acc, it) => {
    const prod = products.find(p => p.id === Number(it.product_id));
    return acc + (prod ? prod.price * Number(it.quantity || 0) : 0);
  }, 0);

  return (
    <div>
      <div className="page-header">
        <h2>Orders</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ New Order</button>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="empty-state"><div className="icon">📋</div><p>No orders yet.</p></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <React.Fragment key={o.id}>
                  <tr>
                    <td><strong>#{o.id}</strong></td>
                    <td>{o.customer?.name || `Customer #${o.customer_id}`}</td>
                    <td>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setExpandedOrder(expandedOrder === o.id ? null : o.id)}
                      >
                        {o.items?.length || 0} item(s) {expandedOrder === o.id ? '▲' : '▼'}
                      </button>
                    </td>
                    <td><strong>${Number(o.total_amount).toFixed(2)}</strong></td>
                    <td>
                      <select
                        value={o.status}
                        onChange={e => handleStatusChange(o.id, e.target.value)}
                        style={{
                          padding: '3px 8px', borderRadius: 6, border: '1.5px solid var(--gray-200)',
                          fontSize: 13, fontWeight: 600,
                          color: o.status === 'completed' ? '#065f46' : o.status === 'cancelled' ? '#991b1b' : '#1e40af',
                          background: o.status === 'completed' ? '#d1fae5' : o.status === 'cancelled' ? '#fee2e2' : '#e0e7ff',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="pending">pending</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(o.id)}>Cancel</button>
                    </td>
                  </tr>
                  {expandedOrder === o.id && o.items?.length > 0 && (
                    <tr>
                      <td colSpan={7} style={{ background: 'var(--gray-50)', padding: '8px 14px' }}>
                        <table style={{ width: '100%' }}>
                          <thead>
                            <tr>
                              <th style={{ background: 'none', color: 'var(--gray-500)' }}>Product</th>
                              <th style={{ background: 'none', color: 'var(--gray-500)' }}>Qty</th>
                              <th style={{ background: 'none', color: 'var(--gray-500)' }}>Unit Price</th>
                              <th style={{ background: 'none', color: 'var(--gray-500)' }}>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {o.items.map(it => (
                              <tr key={it.id}>
                                <td>{it.product?.name || `Product #${it.product_id}`}</td>
                                <td>{it.quantity}</td>
                                <td>${Number(it.unit_price).toFixed(2)}</td>
                                <td>${(it.quantity * it.unit_price).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <h3>Create Order</h3>

            <div className="form-group">
              <label>Customer *</label>
              <select value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">— Select customer —</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
              </select>
              {errors.customer && <div className="error-msg">{errors.customer}</div>}
            </div>

            <label style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-700)' }}>Order Items *</label>
            {errors.items && <div className="error-msg" style={{ marginTop: 4 }}>{errors.items}</div>}

            <div className="order-items" style={{ marginTop: 8 }}>
              {items.map((item, i) => (
                <div key={i} className="order-item-row">
                  <select value={item.product_id} onChange={e => updateItem(i, 'product_id', e.target.value)}>
                    <option value="">— Product —</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (${p.price} · {p.quantity} left)</option>
                    ))}
                  </select>
                  <input
                    type="number" min="1" value={item.quantity}
                    onChange={e => updateItem(i, 'quantity', e.target.value)}
                  />
                  {items.length > 1 && (
                    <button className="btn btn-danger btn-sm" onClick={() => removeItem(i)}>✕</button>
                  )}
                </div>
              ))}
              <button className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start' }} onClick={addItem}>
                + Add Item
              </button>
            </div>

            {previewTotal > 0 && (
              <div style={{ textAlign: 'right', marginTop: 8, fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>
                Estimated Total: ${previewTotal.toFixed(2)}
              </div>
            )}

            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Placing…' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
