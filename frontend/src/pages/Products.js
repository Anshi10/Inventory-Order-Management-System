import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api';

const emptyForm = { name: '', sku: '', price: '', quantity: '', description: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getProducts().then(setProducts).catch(() => toast.error('Failed to load products')).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => { setEditProduct(null); setForm(emptyForm); setErrors({}); setShowModal(true); };
  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name, sku: p.sku, price: p.price, quantity: p.quantity, description: p.description || '' });
    setErrors({});
    setShowModal(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.sku.trim()) e.sku = 'SKU is required';
    if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) < 0) e.price = 'Valid price required';
    if (form.quantity === '' || isNaN(Number(form.quantity)) || Number(form.quantity) < 0) e.quantity = 'Valid quantity required';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    const data = { ...form, price: Number(form.price), quantity: Number(form.quantity) };
    try {
      if (editProduct) {
        await updateProduct(editProduct.id, data);
        toast.success('Product updated');
      } else {
        await createProduct(data);
        toast.success('Product created');
      }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error deleting product');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Products</h2>
        <button className="btn btn-primary" onClick={openCreate}>+ Add Product</button>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : products.length === 0 ? (
        <div className="empty-state"><div className="icon">🛍️</div><p>No products yet. Add your first product!</p></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.name}</strong>{p.description && <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{p.description}</div>}</td>
                  <td><span className="badge badge-info">{p.sku}</span></td>
                  <td>${Number(p.price).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${p.quantity <= 5 ? 'badge-danger' : p.quantity <= 20 ? 'badge-warning' : 'badge-success'}`}>
                      {p.quantity}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h3>{editProduct ? 'Edit Product' : 'Add Product'}</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
                {errors.name && <div className="error-msg">{errors.name}</div>}
              </div>
              <div className="form-group">
                <label>SKU *</label>
                <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="Unique SKU" />
                {errors.sku && <div className="error-msg">{errors.sku}</div>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Price ($) *</label>
                <input type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                {errors.price && <div className="error-msg">{errors.price}</div>}
              </div>
              <div className="form-group">
                <label>Quantity *</label>
                <input type="number" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
                {errors.quantity && <div className="error-msg">{errors.quantity}</div>}
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional" />
            </div>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : editProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
