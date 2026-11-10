import { h } from 'vue';
import { VApp } from 'vuetify/components';
import { createPinia, setActivePinia } from 'pinia';
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { useAppStore } from '@/store/app';
import { useAuthStore } from '@/store/auth';
import { useProductStore } from '@/store/products';
import { useStoreStore } from '@/store/stores';
import { useBasketStore } from '@/store/baskets';
import { apiService } from '@/services/api';
import { productsService } from '@/services/products';
import { mountWithVuetify, flushPromises } from '../helpers/mountWithVuetify';
import { createTestRouter } from '../helpers/testRouter';

jest.mock('@/services/api', () => ({
  apiService: { getStores: jest.fn(), getBaskets: jest.fn() },
  authService: {},
  onLoadingChange: jest.fn(),
}));

jest.mock('@/services/products', () => ({
  productsService: { getProducts: jest.fn() },
}));

// O menu real só renderiza as opções depois da animação de abertura;
// aqui ele mostra o ativador e as opções diretamente.
const MenuStub = {
  setup(_, { slots }) {
    return () => h('div', { class: 'menu-stub' }, [slots.activator?.({ props: {} }), slots.default?.()]);
  },
};

describe('DefaultLayout.vue', () => {
  let wrapper;
  let router;
  let pinia;

  const mountLayout = async (path = '/') => {
    router = createTestRouter();
    await router.push(path);
    wrapper = mountWithVuetify(
      { render: () => h(VApp, () => h(DefaultLayout, null, () => h('p', { class: 'conteudo' }, 'Conteúdo da página'))) },
      { global: { plugins: [router, pinia], stubs: { VMenu: MenuStub } } },
    );
    await flushPromises();
    return wrapper;
  };

  const menuItem = (text) => wrapper.findAll('.v-list-item').find((item) => item.text().includes(text));
  const snackbar = () => [useAppStore().snackbar.message, useAppStore().snackbar.color];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    pinia = createPinia();
    setActivePinia(pinia);
  });

  afterEach(() => {
    wrapper.unmount();
    jest.restoreAllMocks();
  });

  describe('cabeçalho', () => {
    it('mostra o título da página atual', async () => {
      await mountLayout('/produtos');

      expect(wrapper.find('.v-app-bar-title').text()).toBe('Meus Produtos');
    });

    it('usa AgroMart como título quando a rota não tem título', async () => {
      await mountLayout('/sem-titulo');

      expect(wrapper.find('.v-app-bar-title').text()).toBe('AgroMart');
    });

    it('mostra o indicador de modo offline apenas sem conexão', async () => {
      await mountLayout();
      expect(wrapper.html()).not.toContain('mdi-cloud-off-outline');

      useAppStore().isOnline = false;
      await flushPromises();

      expect(wrapper.html()).toContain('mdi-cloud-off-outline');
    });

    it('renderiza o conteúdo da página', async () => {
      await mountLayout();

      expect(wrapper.find('.v-main .conteudo').text()).toBe('Conteúdo da página');
    });
  });

  describe('atualizar dados', () => {
    it('recarrega produtos, lojas e cestas e avisa o sucesso', async () => {
      productsService.getProducts.mockResolvedValue({ data: [] });
      apiService.getStores.mockResolvedValue({ data: [] });
      apiService.getBaskets.mockResolvedValue({ data: [] });
      await mountLayout();

      await menuItem('Atualizar dados').trigger('click');
      await flushPromises();

      expect(productsService.getProducts).toHaveBeenCalled();
      expect(apiService.getStores).toHaveBeenCalled();
      expect(apiService.getBaskets).toHaveBeenCalled();
      expect(snackbar()).toEqual(['Dados atualizados com sucesso', 'success']);
    });

    // Teste de caracterização: os stores tratam os próprios erros e não os
    // propagam, então o layout informa sucesso mesmo quando tudo falha.
    it('informa sucesso mesmo quando todas as requisições falham', async () => {
      productsService.getProducts.mockRejectedValue(new Error('Network Error'));
      apiService.getStores.mockRejectedValue(new Error('Network Error'));
      apiService.getBaskets.mockRejectedValue(new Error('Network Error'));
      await mountLayout();

      await menuItem('Atualizar dados').trigger('click');
      await flushPromises();

      expect(snackbar()).toEqual(['Dados atualizados com sucesso', 'success']);
    });

    it('avisa o erro quando algum store propaga a falha', async () => {
      await mountLayout();
      jest.spyOn(useProductStore(), 'fetchProducts').mockRejectedValue(new Error('falha'));
      jest.spyOn(useStoreStore(), 'fetchStores').mockResolvedValue();
      jest.spyOn(useBasketStore(), 'fetchBaskets').mockResolvedValue();

      await menuItem('Atualizar dados').trigger('click');
      await flushPromises();

      expect(snackbar()).toEqual(['Erro ao atualizar dados', 'error']);
    });
  });

  it('limpa o cache de produtos, lojas e cestas', async () => {
    localStorage.setItem('agromart_products', '[{"id":1}]');
    localStorage.setItem('agromart_stores', '[{"id":1}]');
    localStorage.setItem('agromart_baskets', '[{"id":1}]');
    await mountLayout();

    await menuItem('Limpar cache').trigger('click');

    expect(localStorage.getItem('agromart_products')).toBeNull();
    expect(localStorage.getItem('agromart_stores')).toBeNull();
    expect(localStorage.getItem('agromart_baskets')).toBeNull();
    expect(snackbar()).toEqual(['Cache limpo com sucesso', 'success']);
  });

  it('encerra a sessão e volta para o login ao sair', async () => {
    localStorage.setItem('agromart_token', 'token-jwt');
    await mountLayout();
    const authStore = useAuthStore();
    authStore.isAuthenticated = true;

    await menuItem('Sair').trigger('click');
    await flushPromises();

    expect(authStore.isAuthenticated).toBe(false);
    expect(localStorage.getItem('agromart_token')).toBeNull();
    expect(router.currentRoute.value.name).toBe('Login');
    expect(snackbar()).toEqual(['Logout realizado com sucesso', 'success']);
  });
});
