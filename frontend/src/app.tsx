import { useState } from 'react';
import Checkout from './pages/Checkout.js';

export default function App() {
  const [orderId] = useState('demo-order-123');
  const [phone] = useState('+254700000000');

  return (
    <div className="app">
      <h1>WhatsShelf</h1>
      <Checkout orderId={orderId} buyerPhone={phone} />
    </div>
  );
}
