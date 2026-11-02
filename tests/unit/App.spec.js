import { createPinia, setActivePinia } from 'pinia';
import App from '@/App.vue';
import { useAppStore } from '@/store/app';
import { useAuthStore } from '@/store/auth';
import { onLoadingChange } from '@/services/api';
import { mountWithVuetify, flushPromises } from './helpers/mountWithVuetify';
import { createTestRouter } from './helpers/testRouter';

jest.mock('@/services/api', () => ({
  authService: {},
  onLoadingChange: jest.fn(),
}));

describe('App.vue', () => {
  let wrapper;
  let router;
  let appStore;
  let authStore;

  const mountApp = async (path = '/') => {
    router = createTestRouter();
    await router.push(path);
    const pinia = createPinia();
    setActivePinia(pinia);
    appStore = useAppStore();
    authStore = useAuthStore();
    wrapper = mountWithVuetify(App, { global: { plugins: [router, pinia] } });
    await flushPromises();
    return wrapper;
  };

  const navButtons = () => wrapper.findAll('.bottom-navigation button');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    wrapper.unmount();
    document.body.innerHTML = '';
  });

  it('inicializa o store da aplicação ao montar', async () => {
    await mountApp();

    expect(onLoadingChange).toHaveBeenCalledTimes(1);
  });

  it('renderiza a página da rota atual', async () => {
    await mountApp('/cestas');

    expect(wrapper.find('.v-main .test-page').text()).toBe('Cestas');
  });

  describe('indicadores', () => {
    it('mostra o aviso de conexão apenas quando está offline', async () => {
      await mountApp();
      expect(wrapper.find('.connection-indicator').exists()).toBe(false);

      appStore.isOnline = false;
      await flushPromises();

      expect(wrapper.find('.connection-indicator').text()).toContain('Sem conexão com a internet');
    });

    it('mostra o carregamento global enquanto há requisições', async () => {
      await mountApp();
      expect(wrapper.find('.loading-overlay').exists()).toBe(false);

      appStore.isLoading = true;
      await flushPromises();

      expect(wrapper.find('.loading-overlay').exists()).toBe(true);
    });
  });

  describe('navegação inferior', () => {
    it('não aparece para usuário não autenticado', async () => {
      await mountApp();

      expect(wrapper.find('.bottom-navigation').exists()).toBe(false);
    });

    it('não aparece na página de login, mesmo autenticado', async () => {
      await mountApp('/login');
      authStore.isAuthenticated = true;
      await flushPromises();

      expect(wrapper.find('.bottom-navigation').exists()).toBe(false);
    });

    it('mostra as cinco seções principais para usuário autenticado', async () => {
      await mountApp();
      authStore.isAuthenticated = true;
      await flushPromises();

      expect(navButtons().map((button) => button.text())).toEqual(
        ['Início', 'Produtos', 'Cestas', 'Pedidos', 'Perfil'],
      );
    });

    it('navega para a seção escolhida', async () => {
      await mountApp();
      authStore.isAuthenticated = true;
      await flushPromises();

      const navigated = new Promise((resolve) => router.afterEach(() => resolve()));
      await navButtons()[2].trigger('click');
      await navigated;
      await flushPromises();

      expect(router.currentRoute.value.name).toBe('Cestas');
      expect(wrapper.find('.v-main .test-page').text()).toBe('Cestas');
    });
  });

  describe('mensagens', () => {
    it('exibe a mensagem do store e permite fechá-la', async () => {
      await mountApp();

      appStore.showSnackbar('Cesta criada com sucesso', 'success');
      await flushPromises();
      expect(document.body.textContent).toContain('Cesta criada com sucesso');

      const closeButton = [...document.body.querySelectorAll('.v-snackbar button')]
        .find((button) => button.textContent.includes('Fechar'));
      closeButton.click();
      await flushPromises();

      expect(appStore.snackbar.show).toBe(false);
    });
  });
});
