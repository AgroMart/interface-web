const media = (value, multiple = false) => {
  const values = (Array.isArray(value) ? value : [value]).filter(Boolean);
  const entries = values.map(item => typeof item === 'string'
    ? { attributes: { url: item } } : item.attributes ? item : { attributes: item });
  return { data: multiple ? entries : entries[0] || null };
};
export const toEntity = item => {
  const { id, ...attributes } = item;
  if ('imagem' in attributes) attributes.imagem = media(attributes.imagem, Array.isArray(attributes.imagem));
  if ('banner' in attributes) attributes.banner = media(attributes.banner);
  if (attributes.loja_id) attributes.loja = { data: { id: attributes.loja_id, attributes: {} } };
  return { id, attributes };
};
export const normalizeUser = user => ({
  ...user, role: { type: user.role === 'admin' ? 'admin' : 'authenticated' },
});
export const unsupported = () => Promise.reject(new Error('Esta operação ainda não está disponível no modo FaaS.'));
export function createFaasServices(api) {
  const list = async path => {
    const response = await api.get(path);
    if (!Array.isArray(response.data)) throw new Error('Resposta de listagem FaaS inválida.');
    return { ...response, data: response.data.map(toEntity) };
  };
  const detail = async (path, id) => {
    const response = await list(path);
    const entity = response.data.find(item => String(item.id) === String(id));
    if (!entity) throw new Error('Registro não encontrado.');
    return { ...response, data: entity };
  };
  return {
    apiService: {
      getProducts: () => list('/produtos-avulsos'),
      getProduct: id => detail('/produtos-avulsos', id),
      getStores: () => list('/lojas'),
      getStore: id => detail('/lojas', id),
      getBaskets: () => list('/cestas'),
      getBasket: id => detail('/cestas', id),
      getPlans: () => list('/planos'),
      getPlan: id => detail('/planos', id),
      getSubscribers: () => list('/assinantes'),
      getSubscriber: id => detail('/assinantes', id),
      createProduct: unsupported, updateProduct: unsupported, deleteProduct: unsupported,
      createBasket: unsupported, updateBasket: unsupported, deleteBasket: unsupported,
      updateStore: unsupported, uploadFile: unsupported,
    },
    authService: {
      login: async credentials => {
        const response = await api.post('/auth', { email: credentials.identifier, senha: credentials.password });
        return { ...response, data: { ...response.data, user: normalizeUser(response.data.user) } };
      },
      getMe: async () => {
        const response = await api.get('/usuarios/me');
        return { ...response, data: normalizeUser(response.data) };
      },
      register: unsupported, updateMe: unsupported,
      forgotPassword: unsupported, resetPassword: unsupported, changePassword: unsupported,
    },
  };
}
