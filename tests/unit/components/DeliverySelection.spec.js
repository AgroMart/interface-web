import DeliverySelection from '@/components/DeliverySelection.vue';
import { mountWithVuetify, flushPromises } from '../helpers/mountWithVuetify';

// Datas de referência (outubro de 2026): 14 = quarta, 15 = quinta, 16 = sexta.
const WEDNESDAY = new Date(2026, 9, 14, 12, 0);
const THURSDAY = new Date(2026, 9, 15, 12, 0);
const FRIDAY = new Date(2026, 9, 16, 12, 0);

const dayOf = (iso) => new Date(iso).getDate();

describe('DeliverySelection.vue', () => {
  let wrapper;

  const mountAt = (now, props = {}) => {
    jest.useFakeTimers({ now, doNotFake: ['setTimeout', 'nextTick', 'setImmediate', 'queueMicrotask'] });
    wrapper = mountWithVuetify(DeliverySelection, { props });
    return wrapper;
  };

  const continueButton = () => wrapper.findAll('.v-card-actions button')[1];

  const chooseHomeDelivery = async () => {
    await wrapper.findAll('input[type="radio"]')[1].setValue(true);
    await flushPromises();
  };

  const proceed = async () => {
    await continueButton().trigger('click');
    return wrapper.emitted('proceed')?.[0][0];
  };

  afterEach(() => {
    wrapper.unmount();
    jest.useRealTimers();
  });

  describe('ponto de coleta (CSA)', () => {
    it('vem selecionado por padrão com o primeiro CSA da lista', () => {
      mountAt(THURSDAY);

      expect(wrapper.vm.deliveryType).toBe('csa');
      expect(wrapper.vm.selectedCsa).toBe('csa_norte');
      expect(wrapper.text()).toContain('Retire seu pedido no ponto de coleta');
      expect(continueButton().attributes('disabled')).toBeUndefined();
    });

    it('prevê a entrega para a próxima sexta-feira', async () => {
      mountAt(THURSDAY);

      const result = await proceed();

      expect(result).toMatchObject({ deliveryType: 'csa', csa: 'csa_norte', address: null });
      expect(dayOf(result.deliveryPrediction)).toBe(16);
      expect(wrapper.text()).toContain('sexta-feira');
    });

    // Teste de caracterização: pedidos feitos na própria sexta têm previsão
    // para o mesmo dia, e não para a semana seguinte.
    it('prevê a entrega para o mesmo dia quando o pedido é feito na sexta', async () => {
      mountAt(FRIDAY);

      const result = await proceed();

      expect(dayOf(result.deliveryPrediction)).toBe(16);
    });

    it('envia o CSA escolhido', async () => {
      mountAt(THURSDAY);
      wrapper.vm.selectedCsa = 'csa_sul';
      await flushPromises();

      const result = await proceed();

      expect(result.csa).toBe('csa_sul');
    });

    it('não permite continuar sem CSA selecionado', async () => {
      mountAt(THURSDAY);
      wrapper.vm.selectedCsa = null;
      await flushPromises();

      expect(continueButton().attributes('disabled')).toBeDefined();
      wrapper.vm.handleProceed();
      expect(wrapper.emitted('proceed')).toBeUndefined();
    });
  });

  describe('entrega em residência', () => {
    it('mostra o endereço cadastrado e prevê a entrega para a próxima quarta-feira', async () => {
      mountAt(THURSDAY);
      await chooseHomeDelivery();

      expect(wrapper.text()).toContain('Seu pedido será entregue no endereço cadastrado');
      const result = await proceed();

      expect(result).toMatchObject({
        deliveryType: 'home',
        csa: null,
        address: 'Rua das Flores, 123 - Brasília/DF',
      });
      expect(dayOf(result.deliveryPrediction)).toBe(21);
      expect(wrapper.text()).toContain('quarta-feira');
    });

    // Teste de caracterização: pedidos feitos na própria quarta têm previsão
    // para o mesmo dia.
    it('prevê a entrega para o mesmo dia quando o pedido é feito na quarta', async () => {
      mountAt(WEDNESDAY);
      await chooseHomeDelivery();

      const result = await proceed();

      expect(dayOf(result.deliveryPrediction)).toBe(14);
    });

    it('usa o endereço informado pela página', async () => {
      mountAt(THURSDAY, { userAddress: 'SQN 210, Bloco A - Brasília/DF' });
      await chooseHomeDelivery();

      const result = await proceed();

      expect(result.address).toBe('SQN 210, Bloco A - Brasília/DF');
    });

    it('não permite continuar sem endereço cadastrado', async () => {
      mountAt(THURSDAY, { userAddress: '' });
      await chooseHomeDelivery();

      expect(continueButton().attributes('disabled')).toBeDefined();
    });
  });

  it('não permite continuar nem prevê entrega para um tipo desconhecido', async () => {
    mountAt(THURSDAY);
    wrapper.vm.deliveryType = 'drone';
    await flushPromises();

    expect(wrapper.vm.canProceed).toBe(false);
    expect(wrapper.vm.deliveryPredictionText).toBe('Não disponível');
  });

  it('emite cancel ao clicar em cancelar', async () => {
    mountAt(THURSDAY);

    await wrapper.findAll('.v-card-actions button')[0].trigger('click');

    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });
});
