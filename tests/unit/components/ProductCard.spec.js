import ProductCard from '@/components/ProductCard.vue';
import logo from '@/assets/logo.png';
import { mountWithVuetify } from '../helpers/mountWithVuetify';

const product = (overrides = {}) => ({
  id: 1,
  nome: 'Alface crespa',
  descricao: 'Colhida no dia',
  valor: 3.5,
  unidade_medida: 'maço',
  quantidade: 20,
  ...overrides,
});

describe('ProductCard.vue', () => {
  let wrapper;

  const mountCard = (props) => {
    wrapper = mountWithVuetify(ProductCard, { props: { product: props } });
    return wrapper;
  };

  const editButton = () => wrapper.find('.v-card-actions button');
  const chips = () => wrapper.findAll('.v-chip').map((chip) => chip.text());

  afterEach(() => {
    wrapper.unmount();
  });

  describe('informações exibidas', () => {
    it('mostra nome, descrição, preço por unidade e disponibilidade', () => {
      mountCard(product());

      expect(wrapper.text()).toContain('Alface crespa');
      expect(wrapper.text()).toContain('Colhida no dia');
      expect(wrapper.text()).toContain('R$ 3,50');
      expect(wrapper.text()).toContain('/ maço');
      expect(chips()).toEqual(['Disponível']);
    });

    it('omite descrição e unidade quando não informadas', () => {
      mountCard(product({ descricao: '', unidade_medida: '' }));

      expect(wrapper.vm.truncatedDescription).toBe('');
      expect(wrapper.text()).not.toContain('/ ');
    });

    it('resume descrições com mais de 100 caracteres', () => {
      mountCard(product({ descricao: 'a'.repeat(110) }));

      expect(wrapper.vm.truncatedDescription).toBe(`${'a'.repeat(100)}...`);
    });

    it('mostra preço zerado quando o produto não tem valor', () => {
      mountCard(product({ valor: null }));

      expect(wrapper.text()).toContain('R$ 0,00');
    });

    it('mostra o nome da loja quando disponível', () => {
      mountCard(product({ loja: { data: { attributes: { nome: 'Sítio Verde' } } } }));

      expect(wrapper.find('.store-info').text()).toContain('Sítio Verde');
    });
  });

  describe('estoque', () => {
    it('avisa quando restam poucas unidades', () => {
      mountCard(product({ quantidade: 2 }));

      expect(chips()).toEqual(['2 restantes', 'Disponível']);
    });

    // Teste de caracterização: o botão de editar fica bloqueado em produtos
    // esgotados, então o estoque não pode ser reposto a partir do card.
    it('marca o produto esgotado e bloqueia a edição', () => {
      mountCard(product({ quantidade: 0 }));

      expect(chips()).toEqual(['Esgotado', 'Indisponível']);
      expect(editButton().attributes('disabled')).toBeDefined();
    });
  });

  describe('imagem', () => {
    it('usa o logo como placeholder quando não há imagem', () => {
      mountCard(product());

      expect(wrapper.vm.productImage).toBe(logo);
    });

    // Teste de caracterização: a imagem é lida de product.attributes.imagem,
    // enquanto os demais campos são lidos direto do produto. No formato usado
    // pelo restante do card, a foto salva nunca é exibida.
    it('ignora a imagem salva quando o produto vem no formato plano', () => {
      mountCard(product({ imagem: { data: { attributes: { url: '/uploads/alface.jpg' } } } }));

      expect(wrapper.vm.productImage).toBe(logo);
    });

    it('monta a URL da imagem quando ela está em attributes', () => {
      mountCard(product({ attributes: { imagem: { data: { attributes: { url: '/uploads/alface.jpg' } } } } }));

      expect(wrapper.vm.productImage).toBe('http://localhost:1337/uploads/alface.jpg');
    });

    it('mantém URLs de imagem absolutas', () => {
      mountCard(product({ attributes: { imagem: { data: { attributes: { url: 'https://cdn.agromart.test/a.jpg' } } } } }));

      expect(wrapper.vm.productImage).toBe('https://cdn.agromart.test/a.jpg');
    });
  });

  describe('eventos', () => {
    it('emite click com o produto ao clicar no card', async () => {
      mountCard(product());

      await wrapper.find('.product-card').trigger('click');

      expect(wrapper.emitted('click')[0][0]).toEqual(product());
    });

    it('emite edit ao editar, sem disparar o click do card', async () => {
      mountCard(product());

      await editButton().trigger('click');

      expect(wrapper.emitted('edit')[0][0]).toEqual(product());
      expect(wrapper.emitted('click')).toBeUndefined();
    });
  });
});
