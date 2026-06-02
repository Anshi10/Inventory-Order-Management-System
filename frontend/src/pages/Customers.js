import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { getCustomers, createCustomer, deleteCustomer } from '../api';

const emptyForm = { name: '', email: '', phone: '' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    getCustomers().then(setCustomers).catch(() => toast.error('Failed to load customers')).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      await createCustomer(form);
      toast.success('Customer created');
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error creating customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer? Their orders will also be removed.')) return;
    try {
      await deleteCustomer(id);
      toast.success('Customer deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error deleting customer');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Customers</h2>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setErrors({}); setShowModal(true); }}>
          + Add Customer
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading…</div>
      ) : customers.length === 0 ? (
        <div className="empty-state"><div className="icon">👥</div><p>No customers yet.</p></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.email}</td>
                  <td>{c.phone || '—'}</td>
                  <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
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
            <h3>Add Customer</h3>
            <div className="form-group">
              <label>Full Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
              {errors.name && <div className="error-msg">{errors.name}</div>}
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
              {errors.email && <div className="error-msg">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Saving…' : 'Create Customer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
