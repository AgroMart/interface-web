/* eslint-disable no-console */
import { createPinia, setActivePinia } from 'pinia';
import ProductsPage from '@/pages/ProductsPage.vue';
import ProductCard from '@/components/ProductCard.vue';
import ProductForm from '@/components/ProductForm.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useProductStore } from '@/store/products';
import { productsService } from '@/services/products';
import { flushPromises } from '../helpers/mountWithVuetify';
import { mountPage, findButton } from '../helpers/mountPage';

jest.mock('@/services/api', () => ({
  apiService: {},
  authService: {},
  onLoadingChange: jest.fn(),
}));

jest.mock('@/services/products', () => ({
  productsService: { getProducts: jest.fn(), createProduct: jest.fn(), updateProduct: jest.fn() },
}));

// Formato real da API (atributos achatados pelo middleware do Strapi),
// que esta página já usa.
const product = (id, nome, valor, quantidade, descricao = '') => ({ id, nome, valor, quantidade, descricao });

const products = [
  product(1, 'Tomate', 8, 10, 'Orgânico, colhido no dia'),
  product(2, 'Alface', 3, 2),
  product(3, 'Cenoura', 5, 0),
];

describe('ProductsPage.vue', () => {
  let wrapper;
  let page;
  let pinia;

  const mount = async (data = products) => {
    productsService.getProducts.mockResolvedValue({ data });
    ({ wrapper, page } = await mountPage(ProductsPage, { path: '/produtos', pinia }));
  };

  const cards = () => wrapper.findAllComponents(ProductCard).map((c) => c.props('product').id);
  const setFilter = async (key, value) => {
    page.vm[key] = value;
    await flushPromises();
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    pinia = createPinia();
    setActivePinia(pinia);
  });

  afterEach(() => {
    wrapper.unmount();
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('lista', () => {
    it('carrega os produtos e ordena por nome por padrão', async () => {
      await mount();

      expect(productsService.getProducts).toHaveBeenCalled();
      expect(cards()).toEqual([2, 3, 1]);
    });

    it.each([
      ['price_asc', [2, 3, 1]],
      ['price_desc', [1, 3, 2]],
      ['quantity', [1, 2, 3]],
      ['desconhecida', [1, 2, 3]],
    ])('ordena por "%s"', async (sort, expected) => {
      await mount();

      await setFilter('sortBy', sort);

      expect(cards()).toEqual(expected);
    });

    it('trata preço e quantidade ausentes como zero na ordenação', async () => {
      await mount([product(1, 'A'), product(2, 'B', 4, 1)]);

      await setFilter('sortBy', 'price_desc');
      expect(cards()).toEqual([2, 1]);
      await setFilter('sortBy', 'quantity');
      expect(cards()).toEqual([2, 1]);
    });

    it.each([
      ['pelo nome', 'TOMATE', [1]],
      ['pela descrição', 'orgânico', [1]],
    ])('busca %s, sem diferenciar maiúsculas', async (_, query, expected) => {
      await mount();

      await setFilter('searchQuery', query);

      expect(cards()).toEqual(expected);
    });

    it('ignora a descrição ausente na busca', async () => {
      await mount([{ id: 1, nome: 'Couve', valor: 2, quantidade: 1 }]);

      await setFilter('searchQuery', 'xyz');

      expect(cards()).toEqual([]);
    });

    it.each([
      ['available', [2, 1]],
      ['out_of_stock', [3]],
      ['low_stock', [2]],
      ['desconhecido', [2, 3, 1]],
    ])('filtra pelo status "%s"', async (status, expected) => {
      await mount();

      await setFilter('statusFilter', status);

      expect(cards()).toEqual(expected);
    });

    it('mostra o esqueleto de carregamento enquanto busca os primeiros produtos', async () => {
      await mount([]);

      useProductStore().loading = true;
      await flushPromises();

      expect(wrapper.findAll('.loading-card')).toHaveLength(6);
    });

    // Teste de caracterização: clicar no card apenas registra o produto no console.
    it('clicar no card só registra o produto no console', async () => {
      await mount();

      await wrapper.findComponent(ProductCard).trigger('click');

      expect(console.log).toHaveBeenCalledWith('Ver produto:', expect.objectContaining({ id: 2 }));
    });
  });

  describe('estado vazio', () => {
    it('convida a criar o primeiro produto e abre o formulário', async () => {
      await mount([]);
      const empty = wrapper.findComponent(EmptyState);

      expect(empty.props()).toMatchObject({
        title: 'Nenhum produto encontrado',
        description: 'Comece criando seu primeiro produto',
        actionText: 'Criar Produto',
      });

      empty.vm.$emit('action');
      await flushPromises();

      expect(wrapper.findComponent(ProductForm).exists()).toBe(true);
    });

    it('sugere outra busca, sem botão de criar, quando a busca não encontra nada', async () => {
      await mount();

      await setFilter('searchQuery', 'inexistente');

      expect(wrapper.findComponent(EmptyState).props()).toMatchObject({
        description: 'Tente buscar com outros termos',
        actionText: null,
      });
    });
  });

  describe('criar e editar', () => {
    const openForm = async () => {
      await findButton(wrapper, 'Novo Produto').trigger('click');
      await flushPromises();
      return wrapper.findComponent(ProductForm);
    };

    it('cria um produto novo pelo formulário e fecha o diálogo', async () => {
      productsService.createProduct.mockResolvedValue({ data: product(4, 'Abóbora', 6, 3) });
      await mount();
      const form = await openForm();
      expect(form.props('product')).toBeNull();

      form.vm.$emit('save', { nome: 'Abóbora' });
      await flushPromises();

      expect(productsService.createProduct).toHaveBeenCalledWith({ nome: 'Abóbora' });
      expect(page.vm.showCreateDialog).toBe(false);
      expect(cards()).toContain(4);
    });

    it('edita o produto escolhido no card', async () => {
      productsService.updateProduct.mockResolvedValue({ data: product(2, 'Alface crespa', 3, 2) });
      await mount();

      wrapper.findComponent(ProductCard).vm.$emit('edit', products[1]);
      await flushPromises();
      const form = wrapper.findComponent(ProductForm);
      expect(form.props('product')).toEqual(products[1]);

      form.vm.$emit('save', { nome: 'Alface crespa' });
      await flushPromises();

      expect(productsService.updateProduct).toHaveBeenCalledWith(2, { nome: 'Alface crespa' });
      expect(page.vm.showCreateDialog).toBe(false);
      expect(page.vm.selectedProduct).toBeNull();
    });

    it('mantém o diálogo aberto e registra o erro quando salvar falha', async () => {
      productsService.createProduct.mockRejectedValue(new Error('500'));
      await mount();
      const form = await openForm();

      form.vm.$emit('save', { nome: 'Abóbora' });
      await flushPromises();

      expect(console.error).toHaveBeenCalledWith('Erro ao salvar produto:', expect.any(Error));
      expect(page.vm.showCreateDialog).toBe(true);
    });

    it('fecha o formulário ao cancelar', async () => {
      await mount();
      const form = await openForm();

      form.vm.$emit('cancel');
      await flushPromises();

      expect(page.vm.showCreateDialog).toBe(false);
      expect(page.vm.selectedProduct).toBeNull();
    });
  });

  it('oferece as opções de status e ordenação', async () => {
    await mount([]);

    expect(page.vm.statusOptions.map((o) => o.value)).toEqual(['all', 'available', 'out_of_stock', 'low_stock']);
    expect(page.vm.sortOptions.map((o) => o.value)).toEqual(['name', 'price_asc', 'price_desc', 'quantity']);
  });
});
