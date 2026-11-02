import ProductForm from '@/components/ProductForm.vue';
import { mountWithVuetify, flushPromises, mockFileReader } from '../helpers/mountWithVuetify';

const product = {
  nome: 'Alface crespa',
  descricao: 'Colhida no dia',
  valor: 3.5,
  unidade_medida: 'maço',
  quantidade: 20,
  imagem: { data: { attributes: { url: '/uploads/alface.jpg' } } },
};

const emptyForm = { nome: '', descricao: '', valor: null, unidade_medida: '', quantidade: null };

const image = (name) => new File(['conteudo'], name, { type: 'image/jpeg' });

describe('ProductForm.vue', () => {
  let wrapper;

  const mountForm = (props = {}) => {
    wrapper = mountWithVuetify(ProductForm, { props });
    return wrapper;
  };

  const buttons = () => wrapper.findAll('.v-card-actions button');
  const submitButton = () => buttons()[1];

  const fillForm = async ({ nome, valor, quantidade }) => {
    await wrapper.find('input').setValue(nome);
    const [valorInput, quantidadeInput] = wrapper.findAll('input[type="number"]');
    await valorInput.setValue(valor);
    await quantidadeInput.setValue(quantidade);
    await flushPromises();
  };

  afterEach(() => {
    wrapper.unmount();
    jest.restoreAllMocks();
  });

  describe('novo produto', () => {
    it('exibe o formulário vazio no modo de criação', () => {
      mountForm();

      expect(wrapper.text()).toContain('Novo Produto');
      expect(submitButton().text()).toBe('Criar');
      expect(wrapper.vm.formData).toEqual(emptyForm);
    });

    it('oferece as unidades de medida usadas pelos produtores', () => {
      mountForm();

      expect(wrapper.vm.unidadeOptions).toEqual(
        ['kg', 'g', 'unidade', 'maço', 'dúzia', 'litro', 'ml', 'caixa', 'saco'],
      );
    });

    it('mantém o botão de criar desabilitado enquanto o formulário é inválido', async () => {
      mountForm();
      await fillForm({ nome: 'A', valor: '3', quantidade: '1' });

      expect(submitButton().attributes('disabled')).toBeDefined();
      expect(wrapper.text()).toContain('Nome deve ter pelo menos 2 caracteres');
    });

    it('emite os dados preenchidos ao criar', async () => {
      mountForm();
      await fillForm({ nome: 'Alface', valor: '3', quantidade: '10' });

      await submitButton().trigger('click');
      await flushPromises();

      expect(wrapper.emitted('save')[0][0]).toEqual({
        ...emptyForm,
        nome: 'Alface',
        valor: '3',
        quantidade: '10',
      });
      expect(wrapper.vm.loading).toBe(false);
    });

    // Teste de caracterização: o envio da imagem está comentado no componente,
    // então a foto escolhida aparece na pré-visualização mas não é salva.
    it('não inclui a imagem escolhida nos dados emitidos', async () => {
      mountForm();
      await fillForm({ nome: 'Alface', valor: '3', quantidade: '10' });
      wrapper.vm.imageFile = [image('alface.jpg')];

      await submitButton().trigger('click');
      await flushPromises();

      expect(wrapper.emitted('save')[0][0]).not.toHaveProperty('imagem');
    });

    it('não emite quando o formulário é inválido', async () => {
      mountForm();

      await wrapper.vm.handleSubmit();

      expect(wrapper.emitted('save')).toBeUndefined();
    });

    it('emite cancel ao clicar em cancelar', async () => {
      mountForm();

      await buttons()[0].trigger('click');

      expect(wrapper.emitted('cancel')).toHaveLength(1);
    });
  });

  describe('edição de produto', () => {
    it('preenche o formulário com os dados do produto', () => {
      mountForm({ product });

      expect(wrapper.text()).toContain('Editar Produto');
      expect(submitButton().text()).toBe('Salvar');
      expect(wrapper.vm.formData).toEqual({
        nome: 'Alface crespa',
        descricao: 'Colhida no dia',
        valor: 3.5,
        unidade_medida: 'maço',
        quantidade: 20,
      });
    });

    it('monta a URL da imagem salva', () => {
      mountForm({ product });

      expect(wrapper.vm.imagePreview).toBe('http://localhost:1337/uploads/alface.jpg');
    });

    it('mantém URLs de imagem absolutas', () => {
      mountForm({
        product: { ...product, imagem: { data: { attributes: { url: 'https://cdn.agromart.test/a.jpg' } } } },
      });

      expect(wrapper.vm.imagePreview).toBe('https://cdn.agromart.test/a.jpg');
    });

    it('usa campos vazios quando o produto não tem os dados', () => {
      mountForm({ product: {} });

      expect(wrapper.vm.formData).toEqual(emptyForm);
      expect(wrapper.vm.imagePreview).toBeNull();
    });

    // Teste de caracterização: assim como no formulário de cestas, um produto
    // esgotado (quantidade 0) abre com o campo de quantidade vazio.
    it('abre produto esgotado com a quantidade vazia', () => {
      mountForm({ product: { ...product, quantidade: 0 } });

      expect(wrapper.vm.formData.quantidade).toBeNull();
    });

    it('limpa o formulário quando o produto deixa de ser editado', async () => {
      mountForm({ product });

      await wrapper.setProps({ product: null });

      expect(wrapper.text()).toContain('Novo Produto');
      expect(wrapper.vm.formData).toEqual(emptyForm);
      expect(wrapper.vm.imagePreview).toBeNull();
    });
  });

  describe('imagem', () => {
    it('gera a pré-visualização da imagem escolhida', async () => {
      mockFileReader();
      mountForm();

      wrapper.vm.handleImageChange({ target: { files: [image('a.jpg')] } });

      expect(wrapper.vm.imagePreview).toBe('data:image/jpeg;base64,a.jpg');
    });

    it('remove a pré-visualização quando a seleção é limpa', () => {
      mountForm({ product });

      wrapper.vm.handleImageChange({ target: { files: [] } });

      expect(wrapper.vm.imagePreview).toBeNull();
    });
  });

  describe('regras de validação', () => {
    const firstError = (rules, value) => rules.map((rule) => rule(value)).find((r) => r !== true);

    it.each([
      ['vazio', '', 'Nome é obrigatório'],
      ['curto', 'A', 'Nome deve ter pelo menos 2 caracteres'],
      ['longo', 'a'.repeat(101), 'Nome deve ter no máximo 100 caracteres'],
      ['válido', 'Alface', undefined],
    ])('nome %s', (_, value, expected) => {
      mountForm();
      expect(firstError(wrapper.vm.nameRules, value)).toBe(expected);
    });

    it.each([
      ['vazia (opcional)', '', undefined],
      ['longa', 'a'.repeat(501), 'Descrição deve ter no máximo 500 caracteres'],
      ['válida', 'Colhida no dia', undefined],
    ])('descrição %s', (_, value, expected) => {
      mountForm();
      expect(firstError(wrapper.vm.descriptionRules, value)).toBe(expected);
    });

    it.each([
      ['', 'Preço é obrigatório'],
      ['-1', 'Preço deve ser maior que zero'],
      ['2.5', undefined],
    ])('preço "%s"', (value, expected) => {
      mountForm();
      expect(firstError(wrapper.vm.priceRules, value)).toBe(expected);
    });

    it.each([
      ['', 'Quantidade é obrigatória'],
      ['-1', 'Quantidade não pode ser negativa'],
      ['0', undefined],
    ])('quantidade "%s"', (value, expected) => {
      mountForm();
      expect(firstError(wrapper.vm.quantityRules, value)).toBe(expected);
    });
  });
});
