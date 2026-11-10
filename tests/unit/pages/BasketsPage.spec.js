/* eslint-disable no-console */
import { createPinia, setActivePinia } from 'pinia';
import BasketsPage from '@/pages/BasketsPage.vue';
import BasketCard from '@/components/BasketCard.vue';
import BasketForm from '@/components/BasketForm.vue';
import DeliverySelection from '@/components/DeliverySelection.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useAppStore } from '@/store/app';
import { useBasketStore } from '@/store/baskets';
import { apiService } from '@/services/api';
import { flushPromises } from '../helpers/mountWithVuetify';
import { mountPage, findButton } from '../helpers/mountPage';

jest.mock('@/services/api', () => ({
  apiService: {
    getBaskets: jest.fn(), createBasket: jest.fn(), updateBasket: jest.fn(), uploadFile: jest.fn(),
  },
  authService: {},
  onLoadingChange: jest.fn(),
}));

// Formato real da API: o middleware transformResponse do Strapi achata os
// atributos, então cada cesta chega com os campos direto no objeto.
const flatBasket = (id, descricao, valor, quantidade) => ({ id, descricao, valor, quantidade });

// A busca e o filtro da página leem o formato plano, mas a ordenação lê
// basket.attributes; para exercitar essa lógica, as cestas trazem os dois.
const basket = (id, descricao, valor, quantidade) => ({
  ...flatBasket(id, descricao, valor, quantidade),
  attributes: { valor, quantidade },
});

const baskets = [
  basket(1, 'Cesta de verduras', 30, 10),
  basket(2, 'Cesta de frutas', 50, 3),
  basket(3, 'Cesta de raízes', 20, 0),
];

describe('BasketsPage.vue', () => {
  let wrapper;
  let page;
  let pinia;

  const mount = async (data = baskets) => {
    apiService.getBaskets.mockResolvedValue({ data });
    ({ wrapper, page } = await mountPage(BasketsPage, { path: '/cestas', pinia }));
  };

  const cards = () => wrapper.findAllComponents(BasketCard).map((c) => c.props('basket').id);
  const setFilter = async (key, value) => {
    page.vm[key] = value;
    await flushPromises();
  };
  const snackbar = () => [useAppStore().snackbar.message, useAppStore().snackbar.color];

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

  // Teste de caracterização: com as cestas no formato que a API realmente
  // envia, a ordenação acessa basket.attributes.valor, que não existe, e a
  // lista não é exibida (nem as cestas, nem o aviso de lista vazia).
  it('não exibe nenhuma cesta quando os dados chegam no formato real da API', async () => {
    const errors = [];
    apiService.getBaskets.mockResolvedValue({ data: [flatBasket(1, 'Cesta A', 10, 3), flatBasket(2, 'Cesta B', 20, 1)] });
    ({ wrapper, page } = await mountPage(BasketsPage, {
      path: '/cestas',
      pinia,
      config: { errorHandler: (error) => errors.push(error) },
    }));

    expect(apiService.getBaskets).toHaveBeenCalled();
    expect(cards()).toEqual([]);
    expect(wrapper.findComponent(EmptyState).exists()).toBe(false);
    expect(errors[0]).toBeInstanceOf(TypeError);
    expect(errors[0].message).toContain('reading \'valor\'');
  });

  describe('lista', () => {
    it('carrega as cestas e ordena do maior para o menor preço por padrão', async () => {
      await mount();

      expect(cards()).toEqual([2, 1, 3]);
    });

    it.each([
      ['price_asc', [3, 1, 2]],
      ['price_desc', [2, 1, 3]],
      ['quantity', [1, 2, 3]],
      ['desconhecida', [1, 2, 3]],
    ])('ordena por "%s"', async (sort, expected) => {
      await mount();

      await setFilter('sortBy', sort);

      expect(cards()).toEqual(expected);
    });

    it('trata preço e quantidade ausentes como zero na ordenação', async () => {
      await mount([basket(1, 'A', undefined, undefined), basket(2, 'B', 5, 2)]);

      expect(cards()).toEqual([2, 1]);
      await setFilter('sortBy', 'quantity');
      expect(cards()).toEqual([2, 1]);
    });

    it('busca pela descrição, sem diferenciar maiúsculas', async () => {
      await mount();

      await setFilter('searchQuery', 'FRUTAS');

      expect(cards()).toEqual([2]);
    });

    it.each([
      ['available', [2, 1]],
      ['out_of_stock', [3]],
      ['low_stock', [2]],
      ['desconhecido', [2, 1, 3]],
    ])('filtra pelo status "%s"', async (status, expected) => {
      await mount();

      await setFilter('statusFilter', status);

      expect(cards()).toEqual(expected);
    });

    it('mostra o esqueleto de carregamento enquanto busca as primeiras cestas', async () => {
      await mount([]);

      useBasketStore().loading = true;
      await flushPromises();

      expect(wrapper.findAll('.loading-card')).toHaveLength(6);
    });

    // Teste de caracterização: clicar no card apenas registra a cesta no console.
    it('clicar no card só registra a cesta no console', async () => {
      await mount();

      await wrapper.findComponent(BasketCard).trigger('click');

      expect(console.log).toHaveBeenCalledWith('Ver cesta:', expect.objectContaining({ id: 2 }));
    });
  });

  describe('estado vazio', () => {
    it('convida a criar a primeira cesta e abre o formulário', async () => {
      await mount([]);
      const empty = wrapper.findComponent(EmptyState);

      expect(empty.props()).toMatchObject({
        title: 'Nenhuma cesta encontrada',
        description: 'Comece criando sua primeira cesta semanal',
        actionText: 'Criar Cesta',
      });

      empty.vm.$emit('action');
      await flushPromises();

      expect(page.vm.showCreateDialog).toBe(true);
      expect(wrapper.findComponent(BasketForm).exists()).toBe(true);
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
    const openForm = async (button = 'Nova Cesta') => {
      await findButton(wrapper, button).trigger('click');
      await flushPromises();
      return wrapper.findComponent(BasketForm);
    };

    it('cria uma cesta nova pelo formulário e fecha o diálogo', async () => {
      apiService.createBasket.mockResolvedValue({ data: basket(4, 'Nova', 40, 5) });
      await mount();
      const form = await openForm();
      expect(form.props('basket')).toBeNull();

      form.vm.$emit('save', { descricao: 'Nova' });
      await flushPromises();

      expect(apiService.createBasket).toHaveBeenCalledWith({ descricao: 'Nova' });
      expect(page.vm.showCreateDialog).toBe(false);
      expect(cards()).toContain(4);
    });

    it('edita a cesta escolhida no card', async () => {
      apiService.updateBasket.mockResolvedValue({ data: basket(1, 'Editada', 30, 10) });
      await mount();

      wrapper.findAllComponents(BasketCard)[1].vm.$emit('edit', baskets[0]);
      await flushPromises();
      const form = wrapper.findComponent(BasketForm);
      expect(form.props('basket')).toEqual(baskets[0]);

      form.vm.$emit('save', { descricao: 'Editada' });
      await flushPromises();

      expect(apiService.updateBasket).toHaveBeenCalledWith(1, { descricao: 'Editada' });
      expect(page.vm.showCreateDialog).toBe(false);
      expect(page.vm.selectedBasket).toBeNull();
    });

    it('mantém o diálogo aberto e registra o erro quando salvar falha', async () => {
      apiService.createBasket.mockRejectedValue(new Error('500'));
      await mount();
      const form = await openForm();

      form.vm.$emit('save', { descricao: 'Nova' });
      await flushPromises();

      expect(console.error).toHaveBeenCalledWith('Erro ao salvar cesta:', expect.any(Error));
      expect(page.vm.showCreateDialog).toBe(true);
    });

    it('fecha o formulário ao cancelar', async () => {
      await mount();
      const form = await openForm();

      form.vm.$emit('cancel');
      await flushPromises();

      expect(page.vm.showCreateDialog).toBe(false);
      expect(page.vm.selectedBasket).toBeNull();
    });
  });

  describe('pedido e entrega', () => {
    const checkout = async () => {
      wrapper.findComponent(BasketCard).vm.$emit('checkout', baskets[1]);
      await flushPromises();
      return wrapper.findComponent(DeliverySelection);
    };

    it('abre a escolha de entrega para a cesta pedida', async () => {
      await mount();

      const delivery = await checkout();

      expect(page.vm.showDeliveryDialog).toBe(true);
      expect(delivery.exists()).toBe(true);
      expect(page.vm.selectedBasket).toEqual(baskets[1]);
    });

    // Teste de caracterização: depois de escolher a entrega, o pedido não é
    // criado; a página só registra os dados no console e avisa a próxima etapa.
    it('conclui a escolha de entrega sem criar o pedido', async () => {
      await mount();
      const delivery = await checkout();
      const details = { deliveryType: 'csa', csa: 'csa_norte' };

      delivery.vm.$emit('proceed', details);
      await flushPromises();

      expect(console.log).toHaveBeenCalledWith('Detalhes da Entrega:', details);
      expect(console.log).toHaveBeenCalledWith('Cesta para Checkout:', baskets[1]);
      expect(snackbar()).toEqual(['Seleção de entrega concluída. Próxima etapa: Finalização do Pedido.', 'success']);
      expect(page.vm.showDeliveryDialog).toBe(false);
      expect(page.vm.selectedBasket).toBeNull();
    });

    it('cancela a escolha de entrega', async () => {
      await mount();
      const delivery = await checkout();

      delivery.vm.$emit('cancel');
      await flushPromises();

      expect(page.vm.showDeliveryDialog).toBe(false);
      expect(page.vm.selectedBasket).toBeNull();
      expect(page.vm.deliveryDetails).toBeNull();
    });
  });

  it('oferece as opções de status e ordenação', async () => {
    await mount([]);

    expect(page.vm.statusOptions.map((o) => o.value)).toEqual(['all', 'available', 'out_of_stock', 'low_stock']);
    expect(page.vm.sortOptions.map((o) => o.value)).toEqual(['price_asc', 'price_desc', 'quantity']);
  });
});
