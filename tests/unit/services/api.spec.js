/* eslint-disable no-console */
// Os testes usam a instância real do axios e substituem apenas o adapter
// (a camada que faria a requisição HTTP), para que os interceptors sejam exercitados.

let api;
let apiService;
let authService;
let onLoadingChange;
let adapter;

const ok = (data = {}) => (config) => Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });

const loadModule = () => {
  jest.isolateModules(() => {
    ({ default: api, apiService, authService, onLoadingChange } = require('@/services/api'));
  });
  adapter = jest.fn(ok());
  api.defaults.adapter = adapter;
};

const lastRequest = () => adapter.mock.calls[adapter.mock.calls.length - 1][0];

describe('services/api', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    loadModule();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('interceptor de autenticação', () => {
    it('envia o token salvo no cabeçalho Authorization', async () => {
      localStorage.setItem('agromart_token', 'token-jwt');

      await api.get('/cestas');

      expect(lastRequest().headers.Authorization).toBe('Bearer token-jwt');
    });

    it('não envia Authorization quando não há token', async () => {
      await api.get('/cestas');

      expect(lastRequest().headers.Authorization).toBeUndefined();
    });
  });

  describe('controle de loading', () => {
    it('avisa o início e o fim de uma requisição', async () => {
      const callback = jest.fn();
      onLoadingChange(callback);

      await api.get('/cestas');

      expect(callback.mock.calls).toEqual([[true], [false]]);
    });

    it('avisa uma única vez para requisições simultâneas', async () => {
      const callback = jest.fn();
      onLoadingChange(callback);
      let release;
      adapter.mockImplementationOnce((config) => new Promise((resolve) => {
        release = () => resolve({ data: {}, status: 200, headers: {}, config });
      }));

      const first = api.get('/cestas');
      await api.get('/lojas');
      expect(callback.mock.calls).toEqual([[true]]);

      release();
      await first;
      expect(callback.mock.calls).toEqual([[true], [false]]);
    });

    it('encerra o loading quando a requisição falha', async () => {
      const callback = jest.fn();
      onLoadingChange(callback);
      adapter.mockRejectedValueOnce({ response: { status: 500, data: {} } });

      await expect(api.get('/cestas')).rejects.toBeDefined();

      expect(callback.mock.calls).toEqual([[true], [false]]);
    });

    it('notifica todos os callbacks registrados', async () => {
      const first = jest.fn();
      const second = jest.fn();
      onLoadingChange(first);
      onLoadingChange(second);

      await api.get('/cestas');

      expect(first).toHaveBeenCalledTimes(2);
      expect(second).toHaveBeenCalledTimes(2);
    });

    // Teste de caracterização: registra o comportamento atual.
    // Se um interceptor de requisição registrado depois falhar, o handler de erro
    // do loading decrementa o contador sem que ele tenha sido incrementado.
    it('decrementa o contador quando um interceptor posterior falha', async () => {
      const callback = jest.fn();
      onLoadingChange(callback);
      const id = api.interceptors.request.use(() => {
        throw new Error('falha no interceptor');
      });

      await expect(api.get('/cestas')).rejects.toThrow('falha no interceptor');
      api.interceptors.request.eject(id);

      // O contador ficou em -1: a próxima requisição volta a 0 e o loading não é avisado.
      callback.mockClear();
      await api.get('/cestas');
      expect(callback).not.toHaveBeenCalledWith(true);
    });

    // Teste de caracterização: com outra requisição em andamento, a mesma falha
    // zera o contador e encerra o loading antes de a primeira requisição terminar.
    it('encerra o loading antes da hora quando um interceptor posterior falha', async () => {
      const callback = jest.fn();
      onLoadingChange(callback);
      let release;
      adapter.mockImplementationOnce((config) => new Promise((resolve) => {
        release = () => resolve({ data: {}, status: 200, headers: {}, config });
      }));
      const pending = api.get('/cestas');
      await new Promise((resolve) => setTimeout(resolve, 0));

      const id = api.interceptors.request.use(() => {
        throw new Error('falha no interceptor');
      });
      await expect(api.get('/lojas')).rejects.toThrow('falha no interceptor');
      api.interceptors.request.eject(id);

      expect(callback.mock.calls).toEqual([[true], [false]]);
      release();
      await pending;
    });
  });

  describe('tratamento de erros', () => {
    it('registra timeout', async () => {
      adapter.mockRejectedValueOnce({ code: 'ECONNABORTED' });

      await expect(api.get('/cestas')).rejects.toEqual({ code: 'ECONNABORTED' });

      expect(console.error).toHaveBeenCalledWith('Timeout: A conexão demorou muito para responder');
    });

    it('registra erro de rede quando não há resposta', async () => {
      adapter.mockRejectedValueOnce({ message: 'Network Error' });

      await expect(api.get('/cestas')).rejects.toEqual({ message: 'Network Error' });

      expect(console.error).toHaveBeenCalledWith('Erro de rede: Verifique sua conexão com a internet');
    });

    it('registra status e corpo quando a API responde com erro', async () => {
      const error = { response: { status: 403, data: { error: 'Forbidden' } } };
      adapter.mockRejectedValueOnce(error);

      await expect(api.get('/cestas')).rejects.toBe(error);

      expect(console.error).toHaveBeenCalledWith('Erro na API:', 403, { error: 'Forbidden' });
    });
  });

  describe('apiService', () => {
    it.each([
      ['getStores', [], 'get', '/lojas', ['banner', 'endereco', 'cestas', 'produto_avulsos']],
      ['getStore', [4], 'get', '/lojas/4', ['banner', 'endereco', 'cestas', 'produto_avulsos', 'planos']],
      ['getBaskets', [], 'get', '/cestas', ['imagem', 'loja']],
      ['getBasket', [4], 'get', '/cestas/4', ['imagem', 'loja']],
    ])('%s faz GET em %s com os relacionamentos necessários', async (method, args, httpMethod, url, populate) => {
      await apiService[method](...args);

      const request = lastRequest();
      expect(request.method).toBe(httpMethod);
      expect(request.url).toBe(url);
      expect(request.params.populate).toEqual(populate);
    });

    it.each(['getStores', 'getBaskets'])('%s repassa parâmetros extras de consulta', async (method) => {
      await apiService[method]({ filters: { ativo: true } });

      expect(lastRequest().params.filters).toEqual({ ativo: true });
    });

    it.each([
      ['updateStore', [4, { nome: 'Loja' }], 'put', '/lojas/4'],
      ['createBasket', [{ nome: 'Cesta' }], 'post', '/cestas'],
      ['updateBasket', [4, { nome: 'Cesta' }], 'put', '/cestas/4'],
    ])('%s envia os dados no formato { data } do Strapi', async (method, args, httpMethod, url) => {
      await apiService[method](...args);

      const request = lastRequest();
      expect(request.method).toBe(httpMethod);
      expect(request.url).toBe(url);
      expect(JSON.parse(request.data)).toEqual({ data: args[args.length - 1] });
    });

    it('deleteBasket faz DELETE na cesta', async () => {
      await apiService.deleteBasket(4);

      expect(lastRequest().method).toBe('delete');
      expect(lastRequest().url).toBe('/cestas/4');
    });

    it('uploadFile envia o arquivo como multipart', async () => {
      const file = new File(['conteudo'], 'foto.jpg', { type: 'image/jpeg' });

      await apiService.uploadFile(file);

      const request = lastRequest();
      expect(request.url).toBe('/upload');
      expect(request.data).toBeInstanceOf(FormData);
      expect(request.data.get('files')).toBeInstanceOf(File);
      expect(request.data.get('files').name).toBe('foto.jpg');
    });
  });

  describe('authService', () => {
    const body = () => JSON.parse(lastRequest().data);

    it('login envia apenas identificador e senha', async () => {
      await authService.login({ identifier: 'maria', password: '123', extra: 'x' });

      expect(lastRequest().url).toBe('/auth/local');
      expect(body()).toEqual({ identifier: 'maria', password: '123' });
    });

    it('register envia apenas usuário, e-mail e senha', async () => {
      await authService.register({ username: 'maria', email: 'm@a.test', password: '123', role: 'admin' });

      expect(lastRequest().url).toBe('/auth/local/register');
      expect(body()).toEqual({ username: 'maria', email: 'm@a.test', password: '123' });
    });

    it('getMe busca o usuário atual com papel e loja', async () => {
      await authService.getMe();

      expect(lastRequest().url).toBe('/users/me');
      expect(lastRequest().params.populate).toEqual(['role', 'loja']);
    });

    it('updateMe atualiza o usuário salvo na sessão', async () => {
      localStorage.setItem('agromart_user', JSON.stringify({ id: 12 }));

      await authService.updateMe({ username: 'maria.silva' });

      expect(lastRequest().method).toBe('put');
      expect(lastRequest().url).toBe('/users/12');
      expect(body()).toEqual({ username: 'maria.silva' });
    });

    // Teste de caracterização: sem usuário salvo, a requisição vai para /users/undefined.
    it('updateMe usa /users/undefined quando não há usuário salvo', async () => {
      await authService.updateMe({});

      expect(lastRequest().url).toBe('/users/undefined');
    });

    it('forgotPassword envia o e-mail', async () => {
      await authService.forgotPassword('m@a.test');

      expect(lastRequest().url).toBe('/auth/forgot-password');
      expect(body()).toEqual({ email: 'm@a.test' });
    });

    it('resetPassword envia código e senhas', async () => {
      await authService.resetPassword({ code: 'c', password: 'p', passwordConfirmation: 'p', extra: 'x' });

      expect(lastRequest().url).toBe('/auth/reset-password');
      expect(body()).toEqual({ code: 'c', password: 'p', passwordConfirmation: 'p' });
    });
  });
});
