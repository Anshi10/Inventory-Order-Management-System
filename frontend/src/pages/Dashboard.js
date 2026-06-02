import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard…</div>;
  if (!stats) return <div className="loading">Failed to load stats.</div>;

  return (
    <div>
      <div className="page-header"><h2>Dashboard</h2></div>

      <div className="stat-grid">
        {[
          { icon: '🛍️', value: stats.total_products, label: 'Total Products' },
          { icon: '👥', value: stats.total_customers, label: 'Total Customers' },
          { icon: '📋', value: stats.total_orders, label: 'Total Orders' },
          { icon: '💰', value: `$${stats.total_revenue.toLocaleString()}`, label: 'Total Revenue' },
        ].map(({ icon, value, label }) => (
          <div key={label} className="stat-card">
            <span className="stat-icon">{icon}</span>
            <div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16, fontWeight: 700 }}>
          ⚠️ Low Stock Products
          <span className="badge badge-warning" style={{ marginLeft: 8 }}>
            ≤ 5 units
          </span>
        </h3>
        {stats.low_stock_products.length === 0 ? (
          <p style={{ color: 'var(--gray-500)' }}>All products have sufficient stock. ✅</p>
        ) : (
          <div className="low-stock-list">
            {stats.low_stock_products.map((p) => (
              <div key={p.id} className="low-stock-item">
                <div>
                  <strong>{p.name}</strong>
                  <span style={{ marginLeft: 8, color: 'var(--gray-500)', fontSize: 12 }}>{p.sku}</span>
                </div>
                <span className="badge badge-danger">{p.quantity} left</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
