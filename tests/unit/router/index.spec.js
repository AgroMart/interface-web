jest.mock('@/services/api', () => ({
  authService: { getMe: jest.fn() },
}));

// As páginas são carregadas sob demanda pelo router; aqui são substituídas por
// componentes vazios para que o teste foque apenas na navegação.
jest.mock('@/pages/LoginPage.vue', () => ({ __esModule: true, default: { render: () => null } }));
jest.mock('@/pages/HomePage.vue', () => ({ __esModule: true, default: { render: () => null } }));
jest.mock('@/pages/ProductsPage.vue', () => ({ __esModule: true, default: { render: () => null } }));
jest.mock('@/pages/BasketsPage.vue', () => ({ __esModule: true, default: { render: () => null } }));
jest.mock('@/pages/OrdersPage.vue', () => ({ __esModule: true, default: { render: () => null } }));
jest.mock('@/pages/StorePage.vue', () => ({ __esModule: true, default: { render: () => null } }));
jest.mock('@/pages/ProfilePage.vue', () => ({ __esModule: true, default: { render: () => null } }));

const user = { id: 1, username: 'maria' };

describe('router', () => {
  let router;
  let authStore;
  let authService;

  // O router é um singleton; cada teste usa uma instância nova, junto com o Pinia,
  // o store de autenticação e o mock da API do mesmo registro de módulos.
  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const { createPinia, setActivePinia } = require('pinia');
    setActivePinia(createPinia());
    router = require('@/router').default;
    authStore = require('@/store/auth').useAuthStore();
    authService = require('@/services/api').authService;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const login = () => {
    authStore.isAuthenticated = true;
    authStore.user = user;
  };

  const saveSession = () => {
    localStorage.setItem('agromart_token', 'token-jwt');
    localStorage.setItem('agromart_user', JSON.stringify(user));
  };

  describe('usuário não autenticado', () => {
    it('é redirecionado ao login guardando a rota desejada', async () => {
      await router.push('/cestas');

      expect(router.currentRoute.value.name).toBe('Login');
      expect(router.currentRoute.value.query).toEqual({ redirect: '/cestas' });
      expect(document.title).toBe('Login - AgroMart');
    });

    it('pode acessar a página de login', async () => {
      await router.push('/login');

      expect(router.currentRoute.value.name).toBe('Login');
      expect(router.currentRoute.value.query).toEqual({});
    });

    // Teste de caracterização: não existe rota de "página não encontrada".
    // Uma rota inexistente não tem requiresAuth: false, então exige login.
    it('é redirecionado ao login ao acessar uma rota inexistente', async () => {
      await router.push('/inexistente');

      expect(router.currentRoute.value.name).toBe('Login');
      expect(router.currentRoute.value.query).toEqual({ redirect: '/inexistente' });
    });
  });

  describe('usuário autenticado', () => {
    beforeEach(login);

    it.each([
      ['/', 'Home', 'Início - AgroMart'],
      ['/produtos', 'Produtos', 'Meus Produtos - AgroMart'],
      ['/cestas', 'Cestas', 'Cestas - AgroMart'],
      ['/pedidos', 'Pedidos', 'Pedidos - AgroMart'],
      ['/loja', 'Loja', 'Minha Loja - AgroMart'],
      ['/perfil', 'Perfil', 'Meu Perfil - AgroMart'],
    ])('acessa %s e o título da aba é atualizado', async (path, name, title) => {
      await router.push(path);

      expect(router.currentRoute.value.name).toBe(name);
      expect(document.title).toBe(title);
    });

    it('é redirecionado à página inicial ao tentar abrir o login', async () => {
      await router.push('/login');

      expect(router.currentRoute.value.name).toBe('Home');
    });

    it('usa o título padrão em rotas sem título', async () => {
      await router.push('/inexistente');

      expect(router.currentRoute.value.matched).toEqual([]);
      expect(document.title).toBe('AgroMart');
    });

    it('não reinicializa a autenticação a cada navegação', async () => {
      saveSession();
      const initAuth = jest.spyOn(authStore, 'initAuth');

      await router.push('/cestas');

      expect(initAuth).not.toHaveBeenCalled();
    });
  });

  describe('sessão salva ao recarregar a página', () => {
    it('restaura a sessão e libera a rota protegida', async () => {
      saveSession();
      authService.getMe.mockResolvedValue({ data: user });

      await router.push('/cestas');

      expect(authService.getMe).toHaveBeenCalled();
      expect(authStore.isAuthenticated).toBe(true);
      expect(router.currentRoute.value.name).toBe('Cestas');
    });

    it('redireciona ao login quando só o token está salvo', async () => {
      localStorage.setItem('agromart_token', 'token-jwt');

      await router.push('/cestas');

      expect(router.currentRoute.value.name).toBe('Login');
    });
  });
});
