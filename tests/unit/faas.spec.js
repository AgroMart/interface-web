import { createFaasServices, toEntity } from '@/services/faas';
describe('FaaS adapter', () => {
  const user = { id: 'a', username: 'Admin', email: 'a@example.test', role: 'admin' };
  it('translates login and retrieves the current session from the API', async () => {
    const api = { post: jest.fn().mockResolvedValue({ data: { jwt: 'test-token', user } }),
      get: jest.fn().mockResolvedValue({ data: user }) };
    const { authService } = createFaasServices(api);
    const result = await authService.login({ identifier: user.email, password: 'test-password' });
    expect(api.post).toHaveBeenCalledWith('/auth', { email: user.email, senha: 'test-password' });
    expect(result.data.user.role.type).toBe('admin');
    expect((await authService.getMe()).data.id).toBe('a');
    expect(api.get).toHaveBeenCalledWith('/usuarios/me');
  });
  it('maps lists and details without requesting nonexistent detail endpoints', async () => {
    const api = { get: jest.fn().mockResolvedValue({ data: [{ id: 'p', nome: 'Produto', loja_id: 'l', imagem: 'https://example.test/a.png' }] }) };
    const { apiService } = createFaasServices(api);
    const result = await apiService.getProducts();
    expect(result.data[0].attributes.nome).toBe('Produto');
    expect(result.data[0].attributes.loja.data.id).toBe('l');
    expect((await apiService.getProduct('p')).data.id).toBe('p');
    await expect(apiService.getProduct('missing')).rejects.toThrow('Registro não encontrado');
    expect(api.get).toHaveBeenCalledWith('/produtos-avulsos');
  });
  it('accepts empty lists but rejects malformed lists and unsupported writes', async () => {
    const api = { get: jest.fn().mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: {} }), post: jest.fn() };
    const { apiService, authService } = createFaasServices(api);
    expect((await apiService.getBaskets()).data).toEqual([]);
    await expect(apiService.getStores()).rejects.toThrow('inválida');
    await expect(apiService.createProduct({})).rejects.toThrow('ainda não');
    await expect(authService.register({})).rejects.toThrow('ainda não');
    expect(api.post).not.toHaveBeenCalled();
    expect(toEntity({ id: 'b', imagem: [] }).attributes.imagem.data).toEqual([]);
  });
});
