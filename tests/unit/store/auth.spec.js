import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/services/api';

jest.mock('@/services/api', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    getMe: jest.fn(),
    updateMe: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  },
}));

const user = { id: 1, username: 'maria', email: 'maria@agromart.test', role: { type: 'produtor' } };
const jwt = 'token-jwt';

const apiError = (message) => ({ response: { data: { error: { message } } } });

const savedUser = () => JSON.parse(localStorage.getItem('agromart_user'));

describe('store/auth', () => {
  let store;

  beforeEach(() => {
    setActivePinia(createPinia());
    store = useAuthStore();
    localStorage.clear();
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getters', () => {
    it('retornam valores padrão sem usuário logado', () => {
      expect(store.currentUser).toBeNull();
      expect(store.isLoggedIn).toBe(false);
      expect(store.userRole).toBeNull();
      expect(store.userName).toBe('');
      expect(store.userEmail).toBe('');
    });

    it('retornam os dados do usuário logado', () => {
      store.user = user;
      store.isAuthenticated = true;

      expect(store.currentUser).toEqual(user);
      expect(store.isLoggedIn).toBe(true);
      expect(store.userRole).toBe('produtor');
      expect(store.userName).toBe('maria');
      expect(store.userEmail).toBe('maria@agromart.test');
    });

    it('retornam papel nulo quando o usuário não tem papel definido', () => {
      store.user = { username: 'maria' };

      expect(store.userRole).toBeNull();
    });
  });

  // login, register e resetPassword compartilham o mesmo fluxo de autenticação
  describe.each([
    ['login', () => store.login({ identifier: 'maria', password: '123' }), 'login', 'Erro ao fazer login', { success: true, user }],
    ['register', () => store.register({ username: 'maria' }), 'register', 'Erro ao criar conta', { success: true, user }],
    ['resetPassword', () => store.resetPassword('codigo', 'nova', 'nova'), 'resetPassword', 'Erro ao resetar senha', { success: true }],
  ])('%s', (_, action, serviceMethod, defaultError, successResult) => {
    it('autentica o usuário e persiste a sessão em caso de sucesso', async () => {
      authService[serviceMethod].mockResolvedValue({ data: { jwt, user } });

      const result = await action();

      expect(result).toEqual(successResult);
      expect(store.token).toBe(jwt);
      expect(store.user).toEqual(user);
      expect(store.isAuthenticated).toBe(true);
      expect(store.loading).toBe(false);
      expect(localStorage.getItem('agromart_token')).toBe(jwt);
      expect(savedUser()).toEqual(user);
    });

    it('usa a mensagem de erro da API quando disponível', async () => {
      authService[serviceMethod].mockRejectedValue(apiError('Credenciais inválidas'));

      const result = await action();

      expect(result).toEqual({ success: false, error: 'Credenciais inválidas' });
      expect(store.error).toBe('Credenciais inválidas');
      expect(store.isAuthenticated).toBe(false);
      expect(store.loading).toBe(false);
      expect(localStorage.getItem('agromart_token')).toBeNull();
    });

    it('usa uma mensagem padrão quando a API não informa o erro', async () => {
      authService[serviceMethod].mockRejectedValue(new Error('Network Error'));

      const result = await action();

      expect(result).toEqual({ success: false, error: defaultError });
    });

    it('limpa o erro anterior e indica carregamento durante a requisição', async () => {
      store.error = 'erro anterior';
      let loadingDuringRequest;
      authService[serviceMethod].mockImplementation(() => {
        loadingDuringRequest = store.loading;
        return Promise.resolve({ data: { jwt, user } });
      });

      await action();

      expect(loadingDuringRequest).toBe(true);
      expect(store.error).toBeNull();
    });
  });

  it('resetPassword envia código e senhas no formato esperado pela API', async () => {
    authService.resetPassword.mockResolvedValue({ data: { jwt, user } });

    await store.resetPassword('codigo', 'nova', 'nova');

    expect(authService.resetPassword).toHaveBeenCalledWith({
      code: 'codigo',
      password: 'nova',
      passwordConfirmation: 'nova',
    });
  });

  describe('logout', () => {
    it('limpa o estado e a sessão salva', () => {
      store.user = user;
      store.token = jwt;
      store.isAuthenticated = true;
      store.error = 'erro';
      localStorage.setItem('agromart_token', jwt);
      localStorage.setItem('agromart_user', JSON.stringify(user));

      store.logout();

      expect(store.user).toBeNull();
      expect(store.token).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(store.error).toBeNull();
      expect(localStorage.getItem('agromart_token')).toBeNull();
      expect(localStorage.getItem('agromart_user')).toBeNull();
    });
  });

  describe('validateToken', () => {
    it('atualiza o usuário com os dados do servidor', async () => {
      const updated = { ...user, username: 'maria.silva' };
      authService.getMe.mockResolvedValue({ data: updated });

      await expect(store.validateToken()).resolves.toBe(true);
      expect(store.user).toEqual(updated);
    });

    it('retorna false quando o servidor rejeita o token', async () => {
      authService.getMe.mockRejectedValue(new Error('401'));

      await expect(store.validateToken()).resolves.toBe(false);
    });
  });

  describe('initAuth', () => {
    it('não faz nada quando não há sessão salva', async () => {
      await store.initAuth();

      expect(store.isAuthenticated).toBe(false);
      expect(authService.getMe).not.toHaveBeenCalled();
    });

    it('não restaura a sessão quando só o token está salvo', async () => {
      localStorage.setItem('agromart_token', jwt);

      await store.initAuth();

      expect(store.isAuthenticated).toBe(false);
    });

    it('restaura a sessão salva e valida o token no servidor', async () => {
      localStorage.setItem('agromart_token', jwt);
      localStorage.setItem('agromart_user', JSON.stringify(user));
      authService.getMe.mockResolvedValue({ data: user });

      await store.initAuth();

      expect(store.token).toBe(jwt);
      expect(store.user).toEqual(user);
      expect(store.isAuthenticated).toBe(true);
      expect(authService.getMe).toHaveBeenCalled();
    });

    // Teste de caracterização: registra o comportamento atual.
    // validateToken captura o erro e retorna false, então o catch de initAuth
    // nunca é alcançado e um token rejeitado pelo servidor não encerra a sessão.
    it('mantém a sessão mesmo quando o servidor rejeita o token', async () => {
      localStorage.setItem('agromart_token', jwt);
      localStorage.setItem('agromart_user', JSON.stringify(user));
      authService.getMe.mockRejectedValue(new Error('401'));

      await store.initAuth();

      expect(store.isAuthenticated).toBe(true);
      expect(localStorage.getItem('agromart_token')).toBe(jwt);
    });

    it('encerra a sessão se a validação do token lançar erro', async () => {
      localStorage.setItem('agromart_token', jwt);
      localStorage.setItem('agromart_user', JSON.stringify(user));
      jest.spyOn(store, 'validateToken').mockRejectedValue(new Error('falha'));

      await store.initAuth();

      expect(store.isAuthenticated).toBe(false);
      expect(localStorage.getItem('agromart_token')).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('atualiza o usuário no estado e na sessão salva', async () => {
      const updated = { ...user, username: 'maria.silva' };
      authService.updateMe.mockResolvedValue({ data: updated });

      const result = await store.updateProfile({ username: 'maria.silva' });

      expect(result).toEqual({ success: true, user: updated });
      expect(store.user).toEqual(updated);
      expect(savedUser()).toEqual(updated);
      expect(store.loading).toBe(false);
    });

    it.each([
      [apiError('Nome já em uso'), 'Nome já em uso'],
      [new Error('Network Error'), 'Erro ao atualizar perfil'],
    ])('retorna o erro em caso de falha', async (error, message) => {
      authService.updateMe.mockRejectedValue(error);

      const result = await store.updateProfile({});

      expect(result).toEqual({ success: false, error: message });
      expect(store.loading).toBe(false);
    });
  });

  describe('forgotPassword', () => {
    it('retorna sucesso quando o e-mail é enviado', async () => {
      authService.forgotPassword.mockResolvedValue({});

      const result = await store.forgotPassword('maria@agromart.test');

      expect(authService.forgotPassword).toHaveBeenCalledWith('maria@agromart.test');
      expect(result).toEqual({ success: true });
      expect(store.loading).toBe(false);
    });

    it.each([
      [apiError('E-mail não encontrado'), 'E-mail não encontrado'],
      [new Error('Network Error'), 'Erro ao enviar email'],
    ])('retorna o erro em caso de falha', async (error, message) => {
      authService.forgotPassword.mockRejectedValue(error);

      const result = await store.forgotPassword('x@y.z');

      expect(result).toEqual({ success: false, error: message });
      expect(store.error).toBe(message);
    });
  });

  it('clearError limpa a mensagem de erro', () => {
    store.error = 'erro';

    store.clearError();

    expect(store.error).toBeNull();
  });
});
