describe('Backend configuration and storage', () => {
  const originalMode = process.env.VUE_APP_BACKEND_MODE;
  const originalUrl = process.env.VUE_APP_FAAS_API_URL;
  beforeEach(() => { jest.resetModules(); localStorage.clear(); });
  afterEach(() => {
    if (originalMode === undefined) delete process.env.VUE_APP_BACKEND_MODE;
    else process.env.VUE_APP_BACKEND_MODE = originalMode;
    if (originalUrl === undefined) delete process.env.VUE_APP_FAAS_API_URL;
    else process.env.VUE_APP_FAAS_API_URL = originalUrl;
  });
  it('defaults to Strapi and preserves its storage keys', () => {
    delete process.env.VUE_APP_BACKEND_MODE;
    const { backendStorage, isFaas } = require('@/services/backend');
    expect(isFaas).toBe(false);
    backendStorage.setItem('agromart_token', 'strapi-test');
    expect(localStorage.getItem('agromart_token')).toBe('strapi-test');
    expect(backendStorage.keys()).toEqual(['agromart_token']);
  });
  it('isolates FaaS session and cache by API URL', () => {
    process.env.VUE_APP_BACKEND_MODE = 'faas';
    process.env.VUE_APP_FAAS_API_URL = 'http://127.0.0.1:3001/';
    localStorage.setItem('agromart_token', 'strapi-test');
    const first = require('@/services/backend').backendStorage;
    expect(first.getItem('agromart_token')).toBeNull();
    first.setItem('agromart_token', 'faas-test');
    first.setItem('agromart_products', '[]');
    expect(first.keys().sort()).toEqual(['agromart_products', 'agromart_token']);
    jest.resetModules();
    process.env.VUE_APP_FAAS_API_URL = 'http://127.0.0.1:3002';
    const second = require('@/services/backend').backendStorage;
    expect(second.getItem('agromart_token')).toBeNull();
    expect(second.keys()).toEqual([]);
    first.removeItem('agromart_token');
    expect(localStorage.getItem('agromart_token')).toBe('strapi-test');
  });
});
