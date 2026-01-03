// Автоматическое определение API endpoints в зависимости от окружения

const isProduction = window.location.hostname !== 'localhost' && 
                     window.location.hostname !== '127.0.0.1' &&
                     !window.location.hostname.includes('poehali.dev');

// Для VPS используем локальные эндпоинты
// Для poehali.dev используем облачные функции
export const API_ENDPOINTS = {
  auth: isProduction ? '/api/auth/login' : 'https://functions.poehali.dev/a6d698fe-c92a-4d08-b994-4fc13e0a8679',
  slots: isProduction ? '/api/slots' : 'https://functions.poehali.dev/9689b825-c9ac-49db-b85b-f1310460470d',
  bookings: isProduction ? '/api/bookings' : 'https://functions.poehali.dev/406a4a18-71da-46ec-a8a4-efc9c7c87810',
  cleanup: isProduction ? '/api/cleanup' : 'https://functions.poehali.dev/73351d50-e089-4cfe-a1ba-4653268b23d0',
  payment: isProduction ? '/api/payment' : 'https://functions.poehali.dev/payment',
  telegram: isProduction ? '/api/telegram' : 'https://functions.poehali.dev/07e0a713-f93f-4b65-b2a7-9c7d8d9afe18'
};

export const getApiUrl = (endpoint: keyof typeof API_ENDPOINTS): string => {
  return API_ENDPOINTS[endpoint];
};
