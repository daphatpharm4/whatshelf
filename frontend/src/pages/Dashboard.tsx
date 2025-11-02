import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { t } from '../lib/i18n.js';

export type DashboardResponse = {
  metrics: {
    revenue: { today: number; week: number; month: number; total: number };
    orders: { total: number; paid: number; pending: number; cancelled: number; refunded: number };
    repeatCustomerRate: number;
    averageOrderValue: number;
    topProducts: { productId: string; quantity: number; revenue: number }[];
  };
  asOf: string;
};

const DASHBOARD_ENDPOINT = '/v1/dashboard';

export default function Dashboard() {
  const [data, setData] = useState<DashboardResponse>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await api<DashboardResponse>(DASHBOARD_ENDPOINT, {
          headers: { 'x-merchant-id': 'm_001' },
        });
        if (!cancelled) {
          setData(response);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <section>
        <h2>{t('dashboardTitle')}</h2>
        <p>
          {t('errorPrefix')} {error}
        </p>
      </section>
    );
  }

  const metrics = data?.metrics;

  return (
    <section>
      <h2>{t('dashboardTitle')}</h2>
      {metrics ? (
        <div className="dashboard-grid">
          <dl>
            <dt>{t('revenueToday')}</dt>
            <dd>KES {metrics.revenue.today.toFixed(2)}</dd>
          </dl>
          <dl>
            <dt>{t('revenueWeek')}</dt>
            <dd>KES {metrics.revenue.week.toFixed(2)}</dd>
          </dl>
          <dl>
            <dt>{t('revenueMonth')}</dt>
            <dd>KES {metrics.revenue.month.toFixed(2)}</dd>
          </dl>
          <dl>
            <dt>{t('totalOrders')}</dt>
            <dd>{metrics.orders.total}</dd>
          </dl>
          <dl>
            <dt>{t('averageOrderValue')}</dt>
            <dd>KES {metrics.averageOrderValue.toFixed(2)}</dd>
          </dl>
          <dl>
            <dt>{t('repeatCustomers')}</dt>
            <dd>{(metrics.repeatCustomerRate * 100).toFixed(0)}%</dd>
          </dl>
          <div className="orders-card">
            <h3>{t('ordersBreakdown')}</h3>
            <ul>
              <li>
                {t('paid')}: {metrics.orders.paid}
              </li>
              <li>
                {t('pending')}: {metrics.orders.pending}
              </li>
              <li>
                {t('cancelled')}: {metrics.orders.cancelled}
              </li>
              <li>
                {t('refunded')}: {metrics.orders.refunded}
              </li>
            </ul>
          </div>
          <div>
            <h3>{t('topProducts')}</h3>
            {metrics.topProducts.length === 0 ? (
              <p>{t('noData')}</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>{t('qty')}</th>
                    <th>KES</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topProducts.map((item) => (
                    <tr key={item.productId}>
                      <td>{item.productId}</td>
                      <td>{item.quantity}</td>
                      <td>{item.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <p>{t('noData')}</p>
      )}
    </section>
  );
}
