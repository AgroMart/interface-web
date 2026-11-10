/* eslint-disable no-console */
import { createPinia, setActivePinia } from 'pinia';
import HomePage from '@/pages/HomePage.vue';
import ProductCard from '@/components/ProductCard.vue';
import { apiService } from '@/services/api';
import { productsService } from '@/services/products';
import { mountPage, findButton } from '../helpers/mountPage';

jest.mock('@/services/api', () => ({
  apiService: { getStores: jest.fn(), getBaskets: jest.fn() },
  authService: {},
  onLoadingChange: jest.fn(),
}));

jest.mock('@/services/products', () => ({
  productsService: { getProducts: jest.fn() },
}));

const product = (id) => ({ id, nome: `Produto ${id}`, valor: 5, quantidade: 10 });

describe('HomePage.vue', () => {
  let wrapper;
  let page;
  let router;

  const mount = async ({ products = [product(1), product(2)], baskets = [{ id: 1 }], stores = [{ id: 1 }] } = {}) => {
    productsService.getProducts.mockResolvedValue({ data: products });
    apiService.getBaskets.mockResolvedValue({ data: baskets });
    apiService.getStores.mockResolvedValue({ data: stores });
    ({ wrapper, page, router } = await mountPage(HomePage, { path: '/', pinia: createPinia() }));
  };

  const summary = () => wrapper.findAll('.summary-card .text-h6').map((el) => el.text());

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    setActivePinia(createPinia());
  });

  afterEach(() => {
    wrapper.unmount();
    jest.restoreAllMocks();
  });

  describe('carregamento', () => {
    it('busca produtos, cestas e lojas da API quando não há cache', async () => {
      await mount();

      expect(productsService.getProducts).toHaveBeenCalled();
      expect(apiService.getBaskets).toHaveBeenCalled();
      expect(apiService.getStores).toHaveBeenCalled();
    });

    it('usa os dados em cache sem chamar a API', async () => {
      localStorage.setItem('agromart_products', JSON.stringify([product(9)]));
      localStorage.setItem('agromart_baskets', JSON.stringify([{ id: 1 }]));
      localStorage.setItem('agromart_stores', JSON.stringify([{ id: 1 }]));
      await mount();

      expect(productsService.getProducts).not.toHaveBeenCalled();
      expect(apiService.getBaskets).not.toHaveBeenCalled();
      expect(apiService.getStores).not.toHaveBeenCalled();
      expect(wrapper.findComponent(ProductCard).props('product')).toEqual(product(9));
    });
  });

  describe('resumo', () => {
    // Teste de caracterização: a quantidade de pedidos é fixa em 0.
    it('mostra as quantidades de produtos, cestas e lojas, com pedidos sempre zerados', async () => {
      await mount({ products: [product(1), product(2)], baskets: [{ id: 1 }, { id: 2 }, { id: 3 }], stores: [{ id: 1 }] });

      expect(summary()).toEqual(['2', '3', '0', '1']);
    });
  });

  describe('produtos recentes', () => {
    it('mostra no máximo os três primeiros produtos', async () => {
      await mount({ products: [product(1), product(2), product(3), product(4)] });

      expect(wrapper.findAllComponents(ProductCard).map((c) => c.props('product').id)).toEqual([1, 2, 3]);
    });

    it('esconde a seção quando não há produtos', async () => {
      await mount({ products: [] });

      expect(wrapper.findComponent(ProductCard).exists()).toBe(false);
      expect(page.vm.recentProducts).toEqual([]);
    });

    // Teste de caracterização: clicar ou editar um produto na página inicial
    // apenas registra o produto no console, sem navegar.
    it('clicar ou editar um produto só registra no console', async () => {
      await mount();
      const card = wrapper.findComponent(ProductCard);

      card.vm.$emit('click', product(1));
      card.vm.$emit('edit', product(1));

      expect(console.log).toHaveBeenCalledWith('Ver produto:', product(1));
      expect(console.log).toHaveBeenCalledWith('Editar produto:', product(1));
      expect(router.currentRoute.value.name).toBe('Home');
    });
  });

  describe('ações rápidas', () => {
    it.each([
      ['Novo Produto', 'Produtos'],
      ['Nova Cesta', 'Cestas'],
      ['Ver Pedidos', 'Pedidos'],
      ['Editar Loja', 'Loja'],
    ])('"%s" leva para a página %s', async (label, route) => {
      await mount();
      const navigated = new Promise((resolve) => router.afterEach(() => resolve()));

      await findButton(wrapper, label).trigger('click');
      await navigated;

      expect(router.currentRoute.value.name).toBe(route);
    });
  });

  it('mostra as quatro dicas para os produtores', async () => {
    await mount();

    expect(page.vm.tips.map((t) => t.title)).toEqual([
      'Tire fotos atrativas',
      'Descreva bem seus produtos',
      'Mantenha estoque atualizado',
      'Atenda bem seus clientes',
    ]);
    page.vm.tips.forEach((tip) => expect(wrapper.text()).toContain(tip.description));
  });
});
