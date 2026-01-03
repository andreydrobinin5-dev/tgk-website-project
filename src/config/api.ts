// Всегда используем Cloud Functions для API
export const API_ENDPOINTS = {
  auth: 'https://functions.poehali.dev/a6d698fe-c92a-4d08-b994-4fc13e0a8679',
  slots: 'https://functions.poehali.dev/9689b825-c9ac-49db-b85b-f1310460470d',
  bookings: 'https://functions.poehali.dev/406a4a18-71da-46ec-a8a4-efc9c7c87810',
  cleanup: 'https://functions.poehali.dev/73351d50-e089-4cfe-a1ba-4653268b23d0',
  payment: 'https://functions.poehali.dev/payment',
  telegram: 'https://functions.poehali.dev/07e0a713-f93f-4b65-b2a7-9c7d8d9afe18'
};

export const getApiUrl = (endpoint: keyof typeof API_ENDPOINTS): string => {
  return API_ENDPOINTS[endpoint];
};