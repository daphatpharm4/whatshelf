import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { t } from '../lib/i18n.js';
import { offlineQueue } from '../lib/offlineQueue.js';
import { useOnlineStatus } from '../lib/online.js';

type Props = {
  orderId: string;
  buyerPhone: string;
};

export default function Checkout({ orderId, buyerPhone }: Props) {
  const [intent, setIntent] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [queued, setQueued] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const online = useOnlineStatus();

  const requestPayment = useCallback(
    async (targetOrderId: string, phone: string) => {
      const res = await api<{ paymentIntentId: string }>(`/v1/orders/${targetOrderId}/pay`, {
        method: 'POST',
        body: JSON.stringify({ method: 'MPESA', phone }),
        headers: { 'x-merchant-id': 'm_001' },
      });
      setIntent(res.paymentIntentId);
    },
    [],
  );

  useEffect(() => {
    if (!online) {
      return;
    }

    const flush = async () => {
      const snapshot = offlineQueue.snapshot();
      if (snapshot.length === 0) {
        return;
      }
      setSyncing(true);
      try {
        await offlineQueue.flush(async ({ orderId: offlineOrderId, phone }) => {
          await requestPayment(offlineOrderId, phone);
        });
      } finally {
        setSyncing(false);
      }
    };

    void flush();
  }, [online, requestPayment]);

  const pay = async () => {
    try {
      if (!online) {
        offlineQueue.enqueue({ orderId, phone: buyerPhone });
        setQueued(true);
        return;
      }
      setLoading(true);
      setError(undefined);
      await requestPayment(orderId, buyerPhone);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!online && <p>{t('offlineNotice')}</p>}
      <button onClick={pay} disabled={loading}>
        {loading ? 'Requesting…' : t('payButton')}
      </button>
      {intent && <p>{t('stkSent')}</p>}
      {queued && <p>{t('offlineQueued')}</p>}
      {syncing && <p>{t('syncingQueue')}</p>}
      {error && (
        <p>
          {t('errorPrefix')} {error}
        </p>
      )}
    </div>
  );
}
