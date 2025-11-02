import { useState } from 'react';
import { api } from '../lib/api.js';
import { t } from '../lib/i18n.js';

type Props = {
  orderId: string;
  buyerPhone: string;
};

export default function Checkout({ orderId, buyerPhone }: Props) {
  const [intent, setIntent] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const pay = async () => {
    try {
      setLoading(true);
      setError(undefined);
      const res = await api<{ paymentIntentId: string }>(`/v1/orders/${orderId}/pay`, {
        method: 'POST',
        body: JSON.stringify({ method: 'MPESA', phone: buyerPhone }),
        headers: { 'x-merchant-id': 'm_001' },
      });
      setIntent(res.paymentIntentId);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={pay} disabled={loading}>
        {loading ? 'Requesting…' : t('payButton')}
      </button>
      {intent && <p>{t('stkSent')}</p>}
      {error && (
        <p>
          {t('errorPrefix')} {error}
        </p>
      )}
    </div>
  );
}
