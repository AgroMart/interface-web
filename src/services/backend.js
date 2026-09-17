export const backendMode = process.env.VUE_APP_BACKEND_MODE || 'strapi';
if (!['strapi', 'faas'].includes(backendMode)) {
  throw new Error('VUE_APP_BACKEND_MODE deve ser strapi ou faas.');
}
export const isFaas = backendMode === 'faas';
export const faasUrl = (process.env.VUE_APP_FAAS_API_URL || 'http://127.0.0.1:3001').replace(/\/+$/, '');
// FaaS tokens and caches must never reuse a Strapi session or another API's data.
const key = name => isFaas ? `faas:${faasUrl}:${name}` : name;
export const backendStorage = {
  keys: () => Object.keys(localStorage).filter(name => isFaas
    ? name.startsWith(`faas:${faasUrl}:agromart_`) : name.startsWith('agromart_'))
    .map(name => isFaas ? name.slice(`faas:${faasUrl}:`.length) : name),
  getItem: name => localStorage.getItem(key(name)),
  setItem: (name, value) => localStorage.setItem(key(name), value),
  removeItem: name => localStorage.removeItem(key(name)),
};
