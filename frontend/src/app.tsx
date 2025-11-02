import { ChangeEvent, useState } from 'react';
import Checkout from './pages/Checkout.js';
import Dashboard from './pages/Dashboard.js';
import { getLocale, setLocale, type Locale, t } from './lib/i18n.js';
import { useOnlineStatus } from './lib/online.js';

export default function App() {
  const [orderId] = useState('demo-order-123');
  const [phone] = useState('+254700000000');
  const [locale, updateLocale] = useState<Locale>(getLocale());
  const online = useOnlineStatus();

  const changeLocale = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as Locale;
    updateLocale(value);
    setLocale(value);
  };

  return (
    <div className="app">
      <header>
        <h1>WhatsShelf</h1>
        <div className="controls">
          <label>
            {t('languageLabel')}
            <select value={locale} onChange={changeLocale}>
              <option value="en">English</option>
              <option value="sw">Kiswahili</option>
            </select>
          </label>
          <span className={`status ${online ? 'online' : 'offline'}`}>
            {online ? 'Online' : 'Offline'}
          </span>
        </div>
      </header>
      <main>
        <Dashboard />
        <Checkout orderId={orderId} buyerPhone={phone} />
      </main>
    </div>
  );
}
