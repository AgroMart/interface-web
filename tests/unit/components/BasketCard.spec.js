import BasketCard from '@/components/BasketCard.vue';
import { mountWithVuetify } from '../helpers/mountWithVuetify';

const basket = (overrides = {}) => ({
  id: 1,
  descricao: 'Tomate, alface e cenoura',
  valor: 45.5,
  quantidade: 10,
  ...overrides,
});

describe('BasketCard.vue', () => {
  let wrapper;

  const mountCard = (overrides) => {
    wrapper = mountWithVuetify(BasketCard, { props: { basket: basket(overrides) } });
    return wrapper;
  };

  const actionButtons = () => wrapper.findAll('.v-card-actions button');
  const chips = () => wrapper.findAll('.v-chip').map((chip) => chip.text());

  afterEach(() => {
    wrapper.unmount();
  });

  describe('informações exibidas', () => {
    it('mostra descrição, preço formatado e disponibilidade', () => {
      mountCard();

      expect(wrapper.text()).toContain('Cesta Semanal');
      expect(wrapper.text()).toContain('Tomate, alface e cenoura');
      expect(wrapper.text()).toContain('R$ 45,50');
      expect(chips()).toEqual(['Disponível']);
    });

    it('usa uma descrição padrão quando a cesta não tem descrição', () => {
      mountCard({ descricao: '' });

      expect(wrapper.text()).toContain('Cesta com produtos frescos e selecionados');
    });

    it('resume descrições com mais de 120 caracteres', () => {
      mountCard({ descricao: 'a'.repeat(130) });

      expect(wrapper.vm.truncatedDescription).toBe(`${'a'.repeat(120)}...`);
    });

    it('mostra preço zerado quando a cesta não tem valor', () => {
      mountCard({ valor: null });

      expect(wrapper.text()).toContain('R$ 0,00');
    });

    it('mostra o nome da loja quando disponível', () => {
      mountCard({ loja: { data: { attributes: { nome: 'Sítio Verde' } } } });

      expect(wrapper.find('.store-info').text()).toContain('Sítio Verde');
    });

    it('não mostra a loja quando ela não foi carregada', () => {
      mountCard();

      expect(wrapper.find('.store-info').exists()).toBe(false);
    });
  });

  describe('estoque', () => {
    it('avisa quando restam poucas cestas', () => {
      mountCard({ quantidade: 3 });

      expect(chips()).toEqual(['3 disponíveis', 'Disponível']);
    });

    it('marca a cesta esgotada e bloqueia o pedido', () => {
      mountCard({ quantidade: 0 });

      expect(chips()).toEqual(['Esgotado', 'Indisponível']);
      expect(actionButtons()[0].attributes('disabled')).toBeDefined();
      expect(actionButtons()[1].attributes('disabled')).toBeUndefined();
    });
  });

  describe('imagem', () => {
    it('usa o placeholder quando a cesta não tem imagem', () => {
      mountCard();

      expect(wrapper.vm.basketImage).toBe('/placeholder-basket.jpg');
    });

    it('monta a URL da primeira imagem salva', () => {
      mountCard({
        imagem: { data: [{ attributes: { url: '/uploads/a.jpg' } }, { attributes: { url: '/uploads/b.jpg' } }] },
      });

      expect(wrapper.vm.basketImage).toBe('http://localhost:1337/uploads/a.jpg');
    });

    it('mantém URLs de imagem absolutas', () => {
      mountCard({ imagem: { data: [{ attributes: { url: 'https://cdn.agromart.test/a.jpg' } }] } });

      expect(wrapper.vm.basketImage).toBe('https://cdn.agromart.test/a.jpg');
    });

    it('usa o placeholder quando a lista de imagens está vazia', () => {
      mountCard({ imagem: { data: [] } });

      expect(wrapper.vm.basketImage).toBe('/placeholder-basket.jpg');
    });
  });

  describe('eventos', () => {
    it('emite click com a cesta ao clicar no card', async () => {
      mountCard();

      await wrapper.find('.basket-card').trigger('click');

      expect(wrapper.emitted('click')[0][0]).toEqual(basket());
    });

    it('emite checkout ao pedir, sem disparar o click do card', async () => {
      mountCard();

      await actionButtons()[0].trigger('click');

      expect(wrapper.emitted('checkout')[0][0]).toEqual(basket());
      expect(wrapper.emitted('click')).toBeUndefined();
    });

    it('emite edit ao editar, sem disparar o click do card', async () => {
      mountCard();

      await actionButtons()[1].trigger('click');

      expect(wrapper.emitted('edit')[0][0]).toEqual(basket());
      expect(wrapper.emitted('click')).toBeUndefined();
    });
  });
});
