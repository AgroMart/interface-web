/* eslint-disable no-console */
import BasketForm from '@/components/BasketForm.vue';
import { apiService } from '@/services/api';
import { mountWithVuetify, flushPromises, mockFileReader } from '../helpers/mountWithVuetify';

jest.mock('@/services/api', () => ({
  apiService: { uploadFile: jest.fn() },
}));

const basket = {
  descricao: 'Cesta com 2kg de tomate e 1kg de alface',
  valor: 45.5,
  quantidade: 10,
  imagem: {
    data: [
      { attributes: { url: '/uploads/cesta.jpg' } },
      { attributes: { url: 'https://cdn.agromart.test/cesta2.jpg' } },
    ],
  },
};

const image = (name) => new File(['conteudo'], name, { type: 'image/jpeg' });

describe('BasketForm.vue', () => {
  let wrapper;

  const mountForm = (props = {}) => {
    wrapper = mountWithVuetify(BasketForm, { props });
    return wrapper;
  };

  const buttons = () => wrapper.findAll('.v-card-actions button');
  const submitButton = () => buttons()[1];

  const fillForm = async ({ descricao, valor, quantidade }) => {
    await wrapper.find('textarea').setValue(descricao);
    const [valorInput, quantidadeInput] = wrapper.findAll('input[type="number"]');
    await valorInput.setValue(valor);
    await quantidadeInput.setValue(quantidade);
    await flushPromises();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    wrapper.unmount();
    jest.restoreAllMocks();
  });

  describe('nova cesta', () => {
    it('exibe o formulário vazio no modo de criação', () => {
      mountForm();

      expect(wrapper.text()).toContain('Nova Cesta');
      expect(submitButton().text()).toBe('Criar');
      expect(wrapper.find('textarea').element.value).toBe('');
    });

    it('mantém o botão de criar desabilitado enquanto o formulário é inválido', async () => {
      mountForm();
      await fillForm({ descricao: 'curta', valor: '10', quantidade: '1' });

      expect(submitButton().attributes('disabled')).toBeDefined();
      expect(wrapper.text()).toContain('Descrição deve ter pelo menos 10 caracteres');
    });

    it('emite os dados preenchidos ao criar', async () => {
      mountForm();
      await fillForm({ descricao: 'Cesta de verduras da semana', valor: '30', quantidade: '5' });

      await submitButton().trigger('click');
      await flushPromises();

      expect(wrapper.emitted('save')[0][0]).toEqual({
        descricao: 'Cesta de verduras da semana',
        valor: '30',
        quantidade: '5',
      });
      expect(apiService.uploadFile).not.toHaveBeenCalled();
    });

    it('envia as imagens antes de emitir e inclui os ids enviados', async () => {
      apiService.uploadFile
        .mockResolvedValueOnce({ data: [{ id: 7 }] })
        .mockResolvedValueOnce({ data: [{ id: 8 }] });
      mountForm();
      await fillForm({ descricao: 'Cesta de verduras da semana', valor: '30', quantidade: '5' });
      const files = [image('a.jpg'), image('b.jpg')];
      wrapper.vm.imageFiles = files;

      await submitButton().trigger('click');
      await flushPromises();

      expect(apiService.uploadFile).toHaveBeenCalledWith(files[0]);
      expect(apiService.uploadFile).toHaveBeenCalledWith(files[1]);
      expect(wrapper.emitted('save')[0][0].imagem).toEqual([7, 8]);
    });

    it('não emite e registra o erro quando o envio de imagem falha', async () => {
      apiService.uploadFile.mockRejectedValue(new Error('upload falhou'));
      mountForm();
      await fillForm({ descricao: 'Cesta de verduras da semana', valor: '30', quantidade: '5' });
      wrapper.vm.imageFiles = [image('a.jpg')];

      await submitButton().trigger('click');
      await flushPromises();

      expect(wrapper.emitted('save')).toBeUndefined();
      expect(console.error).toHaveBeenCalledWith('Erro ao salvar cesta:', expect.any(Error));
      expect(wrapper.vm.loading).toBe(false);
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

  describe('edição de cesta', () => {
    it('preenche o formulário com os dados da cesta', () => {
      mountForm({ basket });

      expect(wrapper.text()).toContain('Editar Cesta');
      expect(submitButton().text()).toBe('Salvar');
      expect(wrapper.vm.formData).toEqual({
        descricao: basket.descricao,
        valor: 45.5,
        quantidade: 10,
      });
    });

    it('monta a URL das imagens existentes, mantendo URLs absolutas', () => {
      mountForm({ basket });

      expect(wrapper.vm.imagePreviews).toEqual([
        'http://localhost:1337/uploads/cesta.jpg',
        'https://cdn.agromart.test/cesta2.jpg',
      ]);
      expect(wrapper.findAll('.image-preview-container')).toHaveLength(2);
    });

    it('usa campos vazios quando a cesta não tem os dados', () => {
      mountForm({ basket: {} });

      expect(wrapper.vm.formData).toEqual({ descricao: '', valor: null, quantidade: null });
      expect(wrapper.vm.imagePreviews).toEqual([]);
    });

    // Teste de caracterização: registra o comportamento atual.
    // Por usar "|| null", uma cesta esgotada (quantidade 0) abre com o campo vazio,
    // e o formulário só volta a ser válido se o 0 for digitado novamente.
    it('abre cesta esgotada com a quantidade vazia', () => {
      mountForm({ basket: { ...basket, quantidade: 0 } });

      expect(wrapper.vm.formData.quantidade).toBeNull();
    });

    it('limpa o formulário quando a cesta deixa de ser editada', async () => {
      mountForm({ basket });

      await wrapper.setProps({ basket: null });

      expect(wrapper.text()).toContain('Nova Cesta');
      expect(wrapper.vm.formData).toEqual({ descricao: '', valor: null, quantidade: null });
      expect(wrapper.vm.imagePreviews).toEqual([]);
    });
  });

  describe('imagens', () => {
    const readFiles = async (files) => {
      wrapper.vm.handleImageChange({ target: { files } });
      await flushPromises();
    };

    beforeEach(mockFileReader);

    it('gera a pré-visualização das imagens escolhidas', async () => {
      mountForm();

      await readFiles([image('a.jpg'), image('b.jpg')]);

      expect(wrapper.vm.imagePreviews).toHaveLength(2);
      expect(wrapper.vm.imagePreviews).toEqual(['data:image/jpeg;base64,a.jpg', 'data:image/jpeg;base64,b.jpg']);
    });

    it('substitui as pré-visualizações ao escolher novas imagens em uma cesta nova', async () => {
      mountForm();
      await readFiles([image('a.jpg'), image('b.jpg')]);

      await readFiles([image('c.jpg')]);

      expect(wrapper.vm.imagePreviews).toHaveLength(1);
    });

    it('acrescenta às imagens existentes ao editar uma cesta', async () => {
      mountForm({ basket });

      await readFiles([image('c.jpg')]);

      expect(wrapper.vm.imagePreviews).toHaveLength(3);
    });

    it('ignora a seleção vazia', async () => {
      mountForm({ basket });

      await readFiles([]);

      expect(wrapper.vm.imagePreviews).toHaveLength(2);
    });

    it('remove a imagem e o arquivo correspondente', async () => {
      mountForm();
      const files = [image('a.jpg'), image('b.jpg')];
      wrapper.vm.imageFiles = files;
      wrapper.vm.imagePreviews = ['data:a', 'data:b'];
      await flushPromises();

      await wrapper.findAll('.remove-image-btn')[0].trigger('click');

      expect(wrapper.vm.imagePreviews).toEqual(['data:b']);
      expect(wrapper.vm.imageFiles).toEqual([files[1]]);
    });

    it('remove só a pré-visualização quando a imagem já estava salva', async () => {
      mountForm({ basket });

      wrapper.vm.removeImage(1);

      expect(wrapper.vm.imagePreviews).toEqual(['http://localhost:1337/uploads/cesta.jpg']);
      expect(wrapper.vm.imageFiles).toEqual([]);
    });
  });

  describe('regras de validação', () => {
    const firstError = (rules, value) => rules.map((rule) => rule(value)).find((r) => r !== true);

    it.each([
      ['vazia', '', 'Descrição é obrigatória'],
      ['curta', 'curta', 'Descrição deve ter pelo menos 10 caracteres'],
      ['longa', 'a'.repeat(501), 'Descrição deve ter no máximo 500 caracteres'],
      ['válida', 'Descrição válida', undefined],
    ])('descrição %s', (_, value, expected) => {
      mountForm();
      expect(firstError(wrapper.vm.descriptionRules, value)).toBe(expected);
    });

    it.each([
      ['', 'Preço é obrigatório'],
      ['-5', 'Preço deve ser maior que zero'],
      ['10.5', undefined],
    ])('preço "%s"', (value, expected) => {
      mountForm();
      expect(firstError(wrapper.vm.priceRules, value)).toBe(expected);
    });

    it.each([
      ['', 'Quantidade é obrigatória'],
      [null, 'Quantidade é obrigatória'],
      ['-1', 'Quantidade não pode ser negativa'],
      ['0', undefined],
      ['3', undefined],
    ])('quantidade "%s"', (value, expected) => {
      mountForm();
      expect(firstError(wrapper.vm.quantityRules, value)).toBe(expected);
    });
  });
});
