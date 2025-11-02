const messages = {
  en: {
    payButton: 'Pay with M-Pesa',
    stkSent: 'STK sent. Approve on your phone.',
    errorPrefix: 'Error:',
  },
};

export type Locale = keyof typeof messages;

let currentLocale: Locale = 'en';

export function t(key: keyof (typeof messages)['en']) {
  return messages[currentLocale][key];
}

export function setLocale(locale: Locale) {
  currentLocale = locale;
}
