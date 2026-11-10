/* eslint-disable no-console */
import { createPinia, setActivePinia } from 'pinia';
import OrdersPage from '@/pages/OrdersPage.vue';
import { useAppStore } from '@/store/app';
import { flushPromises } from '../helpers/mountWithVuetify';
import { mountPage, findButton } from '../helpers/mountPage';

jest.mock('@/services/api', () => ({
  apiService: {},
  authService: {},
  onLoadingChange: jest.fn(),
}));

jest.mock('@/services/products', () => ({ productsService: {} }));

describe('OrdersPage.vue', () => {
  let wrapper;
  let page;

  const mount = async (now) => {
    if (now) {
      jest.useFakeTimers({ now, doNotFake: ['setTimeout', 'nextTick', 'setImmediate', 'queueMicrotask'] });
    }
    ({ wrapper, page } = await mountPage(OrdersPage, { path: '/pedidos', pinia: createPinia() }));
  };

  const orderIds = () => wrapper.findAll('.order-card h3').map((h) => h.text());
  const card = (id) => wrapper.findAll('.order-card').find((c) => c.find('h3').text() === `Pedido #${id}`);

  beforeEach(() => {
    setActivePinia(createPinia());
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    wrapper.unmount();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('lista de pedidos', () => {
    // Teste de caracterização: os pedidos são dados de exemplo fixos no código,
    // de janeiro de 2025; nada é carregado da API.
    it('mostra os três pedidos de exemplo, do mais recente para o mais antigo', async () => {
      await mount();

      expect(orderIds()).toEqual(['Pedido #001', 'Pedido #002', 'Pedido #003']);
    });

    it('mostra cliente, entrega, itens e total de cada pedido', async () => {
      await mount();
      const text = card('001').text();

      expect(text).toContain('Maria Silva');
      expect(text).toContain('(61) 99999-9999');
      expect(text).toContain('Entrega: Ponto de Coleta (CSA)');
      expect(text).toContain('Tomate Orgânico');
      expect(text).toContain('x2');
      expect(text).toContain('R$ 12,00');
      expect(text).toContain('Total: R$ 16,50');
      expect(text).toContain('Pendente');
      expect(card('002').text()).toContain('Entrega: Entrega em Residência');
    });
  });

  describe('filtros', () => {
    it('busca pelo número do pedido', async () => {
      await mount();

      page.vm.searchQuery = '002';
      await flushPromises();

      expect(orderIds()).toEqual(['Pedido #002']);
    });

    it('busca pelo nome do cliente, sem diferenciar maiúsculas', async () => {
      await mount();

      page.vm.searchQuery = 'ana COSTA';
      await flushPromises();

      expect(orderIds()).toEqual(['Pedido #003']);
    });

    it('mostra o estado vazio com dica de busca quando nada é encontrado', async () => {
      await mount();

      page.vm.searchQuery = 'inexistente';
      await flushPromises();

      expect(orderIds()).toEqual([]);
      expect(wrapper.text()).toContain('Nenhum pedido encontrado');
      expect(wrapper.text()).toContain('Tente buscar com outros termos');
    });

    it('filtra pelo status', async () => {
      await mount();

      page.vm.statusFilter = 'confirmed';
      await flushPromises();

      expect(orderIds()).toEqual(['Pedido #002']);
    });

    it('mostra a mensagem de nenhum pedido recebido quando o filtro não tem resultados', async () => {
      await mount();

      page.vm.statusFilter = 'cancelled';
      await flushPromises();

      expect(wrapper.text()).toContain('Você ainda não recebeu pedidos');
    });

    it.each([
      ['today', ['Pedido #001']],
      ['week', ['Pedido #001', 'Pedido #002', 'Pedido #003']],
      ['month', ['Pedido #001', 'Pedido #002', 'Pedido #003']],
    ])('filtra pelo período "%s"', async (period, expected) => {
      await mount(new Date('2025-01-15T15:00:00Z'));

      page.vm.periodFilter = period;
      await flushPromises();

      expect(orderIds()).toEqual(expected);
    });

    it('exclui da semana os pedidos com mais de sete dias', async () => {
      await mount(new Date('2025-01-21T15:00:00Z'));

      page.vm.periodFilter = 'week';
      await flushPromises();

      expect(orderIds()).toEqual(['Pedido #001', 'Pedido #002']);
    });

    // Teste de caracterização: como os pedidos de exemplo são de 2025,
    // qualquer filtro de período aplicado hoje esvazia a lista.
    it('esvazia a lista com filtro de período nas datas atuais', async () => {
      await mount(new Date('2026-11-02T15:00:00Z'));

      page.vm.periodFilter = 'month';
      await flushPromises();

      expect(orderIds()).toEqual([]);
    });

    it('trata um período desconhecido como todos', async () => {
      await mount();

      page.vm.periodFilter = 'ano';
      await flushPromises();

      expect(orderIds()).toHaveLength(3);
    });
  });

  describe('andamento do pedido', () => {
    const snackbar = () => [useAppStore().snackbar.message, useAppStore().snackbar.color];

    // Teste de caracterização: a mudança de status só existe na tela;
    // não é enviada à API e se perde ao recarregar a página.
    it('avança o pedido de pendente até pronto', async () => {
      await mount();

      await findButton(card('001'), 'Confirmar').trigger('click');
      expect(card('001').text()).toContain('Confirmado');
      expect(snackbar()).toEqual(['Pedido #001 atualizado para Confirmado', 'success']);

      await findButton(card('001'), 'Preparar').trigger('click');
      expect(card('001').text()).toContain('Preparando');

      await findButton(card('001'), 'Pronto').trigger('click');
      expect(card('001').text()).toContain('Pronto');
      expect(findButton(card('001'), 'Confirmar')).toBeUndefined();
      expect(findButton(card('001'), 'Preparar')).toBeUndefined();
    });

    it('não mostra ações de andamento para pedidos entregues', async () => {
      await mount();

      expect(card('003').text()).toContain('Entregue');
      expect(card('003').findAll('button').map((b) => b.text())).toEqual(['Detalhes']);
    });

    it('ignora a atualização de um pedido inexistente', async () => {
      await mount();

      page.vm.updateOrderStatus('999', 'confirmed');

      expect(useAppStore().snackbar.show).toBe(false);
    });

    // Teste de caracterização: o botão Detalhes apenas registra o pedido no console.
    it('o botão Detalhes só registra o pedido no console', async () => {
      await mount();

      await findButton(card('002'), 'Detalhes').trigger('click');

      expect(console.log).toHaveBeenCalledWith('Ver detalhes do pedido:', expect.objectContaining({ id: '002' }));
    });
  });

  describe('funções auxiliares', () => {
    it.each([
      ['pending', 'warning', 'Pendente'],
      ['confirmed', 'info', 'Confirmado'],
      ['preparing', 'primary', 'Preparando'],
      ['ready', 'success', 'Pronto'],
      ['completed', 'success', 'Entregue'],
      ['cancelled', 'error', 'Cancelado'],
      ['desconhecido', 'grey', 'desconhecido'],
    ])('status "%s" usa a cor %s e o texto %s', async (status, color, text) => {
      await mount();

      expect(page.vm.getStatusColor(status)).toBe(color);
      expect(page.vm.getStatusText(status)).toBe(text);
    });

    it('usa um texto padrão para tipo de entrega desconhecido', async () => {
      await mount();

      expect(page.vm.getDeliveryTypeText('drone')).toBe('Não Informado');
    });

    it('oferece os filtros de status e período', async () => {
      await mount();

      expect(page.vm.statusOptions.map((o) => o.value))
        .toEqual(['all', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']);
      expect(page.vm.periodOptions.map((o) => o.value)).toEqual(['all', 'today', 'week', 'month']);
    });

    it('mostra o esqueleto de carregamento enquanto carrega', async () => {
      await mount();

      page.vm.loading = true;
      await flushPromises();

      expect(wrapper.findAll('.v-skeleton-loader').length).toBeGreaterThan(0);
      expect(orderIds()).toEqual([]);
    });
  });
});
