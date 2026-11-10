/* eslint-disable no-console */
import { createPinia, setActivePinia } from 'pinia';
import StorePage from '@/pages/StorePage.vue';
import { useAppStore } from '@/store/app';
import { apiService } from '@/services/api';
import { productsService } from '@/services/products';
import { flushPromises, mockFileReader } from '../helpers/mountWithVuetify';
import { mountPage, findButton } from '../helpers/mountPage';

jest.mock('@/services/api', () => ({
  apiService: { getStores: jest.fn(), getBaskets: jest.fn(), updateStore: jest.fn() },
  authService: {},
  onLoadingChange: jest.fn(),
}));

jest.mock('@/services/products', () => ({
  productsService: { getProducts: jest.fn() },
}));

const loja = (attributes = {}) => ({
  id: 1,
  attributes: {
    nome: 'Sítio Verde',
    descricao: 'Orgânicos da região',
    contato: '(61) 99999-0000',
    cnpj: '12.345.678/0001-90',
    tipos_de_entrega: 'Entregar',
    endereco: {
      data: {
        attributes: {
          cep: '70000-000', rua: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'Brasília', estado: 'DF', complemento: 'Casa',
        },
      },
    },
    banner: { data: { attributes: { url: '/uploads/banner.jpg' } } },
    ...attributes,
  },
});

describe('StorePage.vue', () => {
  let wrapper;
  let page;
  let pinia;

  const mount = async (stores = [loja()]) => {
    apiService.getStores.mockResolvedValue({ data: stores });
    ({ wrapper, page } = await mountPage(StorePage, { path: '/loja', pinia }));
  };

  const snackbar = () => [useAppStore().snackbar.message, useAppStore().snackbar.color];
  const field = (label) => wrapper.findAll('.v-text-field').find((f) => f.text().includes(label));

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    productsService.getProducts.mockResolvedValue({ data: [{ id: 1 }, { id: 2 }] });
    apiService.getBaskets.mockResolvedValue({ data: [{ id: 1 }] });
    pinia = createPinia();
    setActivePinia(pinia);
  });

  afterEach(() => {
    wrapper.unmount();
    jest.restoreAllMocks();
    delete global.fetch;
  });

  describe('carregamento', () => {
    it('busca lojas, produtos e cestas ao abrir', async () => {
      await mount();

      expect(apiService.getStores).toHaveBeenCalled();
      expect(productsService.getProducts).toHaveBeenCalled();
      expect(apiService.getBaskets).toHaveBeenCalled();
    });

    it('preenche o formulário com os dados da loja principal', async () => {
      await mount();

      expect(page.vm.storeData).toEqual({
        nome: 'Sítio Verde',
        descricao: 'Orgânicos da região',
        contato: '(61) 99999-0000',
        cnpj: '12.345.678/0001-90',
        tipos_de_entrega: 'Entregar',
      });
      expect(page.vm.addressData).toMatchObject({ cep: '70000-000', cidade: 'Brasília', estado: 'DF' });
      expect(page.vm.bannerPreview).toBe('http://localhost:1337/uploads/banner.jpg');
    });

    it('mantém URLs absolutas do banner', async () => {
      await mount([loja({ banner: { data: { attributes: { url: 'https://cdn.agromart.test/b.jpg' } } } })]);

      expect(page.vm.bannerPreview).toBe('https://cdn.agromart.test/b.jpg');
    });

    it('usa campos vazios quando a loja não tem endereço, banner ou outros dados', async () => {
      await mount([{ id: 1, attributes: {} }]);

      expect(Object.values(page.vm.storeData).every((v) => v === '')).toBe(true);
      expect(Object.values(page.vm.addressData).every((v) => v === '')).toBe(true);
      expect(page.vm.bannerPreview).toBeNull();
    });

    it('deixa o formulário vazio quando o usuário não tem loja', async () => {
      await mount([]);

      expect(page.vm.storeData.nome).toBe('');
    });

    it('mostra a quantidade de produtos e de cestas carregados', async () => {
      await mount();

      const stats = wrapper.findAll('.text-h4').map((el) => el.text());
      expect(stats.slice(0, 2)).toEqual(['2', '1']);
    });
  });

  describe('busca de endereço pelo CEP', () => {
    const viaCep = (data) => {
      global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve(data) });
    };

    it('preenche rua, bairro, cidade e estado ao sair do campo de CEP', async () => {
      await mount([]);
      viaCep({ logradouro: 'SQN 210', bairro: 'Asa Norte', localidade: 'Brasília', uf: 'DF' });
      page.vm.addressData.cep = '70.862-000';
      page.vm.addressData.numero = '12';

      await field('CEP').find('input').trigger('blur');
      await flushPromises();

      expect(global.fetch).toHaveBeenCalledWith('https://viacep.com.br/ws/70862000/json/');
      expect(page.vm.addressData).toMatchObject({
        rua: 'SQN 210', bairro: 'Asa Norte', cidade: 'Brasília', estado: 'DF', numero: '12',
      });
    });

    it('usa campos vazios quando o ViaCEP não informa algum dado', async () => {
      await mount([]);
      viaCep({});
      page.vm.addressData.cep = '70862000';

      await page.vm.fetchAddressByCep();

      expect(page.vm.addressData).toMatchObject({ rua: '', bairro: '', cidade: '', estado: '' });
    });

    it('não altera o endereço quando o CEP não existe', async () => {
      await mount();
      viaCep({ erro: true });
      page.vm.addressData.cep = '00000000';

      await page.vm.fetchAddressByCep();

      expect(page.vm.addressData.rua).toBe('Rua A');
    });

    it('não consulta CEPs incompletos', async () => {
      await mount([]);
      global.fetch = jest.fn();
      page.vm.addressData.cep = '7086';

      await page.vm.fetchAddressByCep();

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('registra o erro quando a consulta falha', async () => {
      await mount([]);
      global.fetch = jest.fn().mockRejectedValue(new Error('offline'));
      page.vm.addressData.cep = '70862000';

      await page.vm.fetchAddressByCep();

      expect(console.error).toHaveBeenCalledWith('Erro ao buscar CEP:', expect.any(Error));
    });
  });

  describe('banner', () => {
    it('mostra a pré-visualização do banner escolhido', async () => {
      mockFileReader();
      await mount([]);

      page.vm.handleBannerChange({ target: { files: [new File(['x'], 'banner.png', { type: 'image/png' })] } });
      await flushPromises();

      expect(page.vm.bannerPreview).toBe('data:image/png;base64,banner.png');
      expect(wrapper.find('.v-img').exists()).toBe(true);
    });

    it('ignora a seleção vazia', async () => {
      await mount([]);

      page.vm.handleBannerChange({ target: { files: [] } });

      expect(page.vm.bannerPreview).toBeNull();
    });
  });

  describe('salvar', () => {
    // Teste de caracterização: salvar apenas registra no console; o
    // storeStore.updateStore existe, mas a página não envia os dados à API.
    it('informa sucesso sem enviar os dados à API', async () => {
      await mount();
      await page.vm.form.validate();
      await flushPromises();

      await findButton(wrapper, 'Salvar').trigger('click');
      await flushPromises();

      expect(apiService.updateStore).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Salvando loja:', expect.objectContaining({
        store: expect.objectContaining({ nome: 'Sítio Verde' }),
        address: expect.objectContaining({ cidade: 'Brasília' }),
      }));
      expect(snackbar()).toEqual(['Loja salva com sucesso!', 'success']);
      expect(page.vm.saving).toBe(false);
    });

    // Teste de caracterização: o botão Salvar fica habilitado com o formulário
    // inválido; o clique não salva e também não avisa o usuário.
    it('não salva nem avisa quando o formulário é inválido', async () => {
      await mount([]);
      await page.vm.form.validate();
      await flushPromises();

      const button = findButton(wrapper, 'Salvar');
      expect(button.attributes('disabled')).toBeUndefined();
      await button.trigger('click');
      await flushPromises();

      expect(console.log).not.toHaveBeenCalledWith('Salvando loja:', expect.anything());
      expect(useAppStore().snackbar.message).not.toBe('Loja salva com sucesso!');
    });

    // Teste de caracterização: o tipo de entrega é marcado como obrigatório,
    // mas não tem regra de validação.
    it('aceita salvar sem tipo de entrega', async () => {
      await mount([loja({ tipos_de_entrega: '' })]);
      await page.vm.form.validate();
      await flushPromises();

      await page.vm.saveStore();

      expect(snackbar()).toEqual(['Loja salva com sucesso!', 'success']);
    });
  });

  describe('regras de validação', () => {
    const firstError = (rules, value) => rules.map((rule) => rule(value)).find((r) => r !== true);

    it.each([
      ['nameRules', '', 'Nome da loja é obrigatório'],
      ['nameRules', 'A', 'Nome deve ter pelo menos 2 caracteres'],
      ['nameRules', 'Sítio', undefined],
      ['descriptionRules', '', undefined],
      ['descriptionRules', 'a'.repeat(501), 'Descrição deve ter no máximo 500 caracteres'],
      ['phoneRules', '', 'Telefone é obrigatório'],
      ['phoneRules', '9999-0000', 'Telefone deve ter pelo menos 10 dígitos'],
      ['phoneRules', '(61) 99999-0000', undefined],
    ])('%s com "%s"', async (rules, value, expected) => {
      await mount([]);
      expect(firstError(page.vm[rules], value)).toBe(expected);
    });

    it('oferece entrega no local e retirada pelo cliente', async () => {
      await mount([]);

      expect(page.vm.deliveryOptions.map((o) => o.value)).toEqual(['Entregar', 'Receber']);
    });
  });
});
