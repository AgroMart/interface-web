/* eslint-disable no-console */
import { createPinia, setActivePinia } from 'pinia';
import ProfilePage from '@/pages/ProfilePage.vue';
import { useAppStore } from '@/store/app';
import { useAuthStore } from '@/store/auth';
import { useProductStore } from '@/store/products';
import { useBasketStore } from '@/store/baskets';
import { useStoreStore } from '@/store/stores';
import { authService } from '@/services/api';
import { flushPromises, mockFileReader } from '../helpers/mountWithVuetify';
import { mountPage, findButton } from '../helpers/mountPage';

jest.mock('@/services/api', () => ({
  apiService: {},
  authService: { changePassword: jest.fn(), updateMe: jest.fn() },
  onLoadingChange: jest.fn(),
}));

jest.mock('@/services/products', () => ({ productsService: {} }));

describe('ProfilePage.vue', () => {
  let wrapper;
  let page;
  let router;
  let pinia;

  const mount = async () => {
    ({ wrapper, page, router } = await mountPage(ProfilePage, { path: '/perfil', pinia }));
  };

  const snackbar = () => [useAppStore().snackbar.message, useAppStore().snackbar.color];

  // Valida o formulário pela própria referência do v-form, como faria a interação do usuário
  const validate = async (formRef) => {
    await page.vm[formRef].validate();
    await flushPromises();
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    pinia = createPinia();
    setActivePinia(pinia);
  });

  afterEach(() => {
    wrapper.unmount();
    jest.restoreAllMocks();
  });

  describe('perfil', () => {
    // Teste de caracterização: os dados do perfil são fixos no código,
    // e não vêm do usuário autenticado.
    it('exibe dados de exemplo fixos, e não os do usuário logado', async () => {
      useAuthStore().user = { username: 'maria', email: 'maria@agromart.test' };
      await mount();

      expect(page.vm.userData).toMatchObject({ nome: 'João Silva', email: 'joao@exemplo.com' });
      expect(wrapper.text()).toContain('João Silva');
      expect(wrapper.text()).not.toContain('maria@agromart.test');
    });

    // Teste de caracterização: salvar o perfil apenas registra no console;
    // nenhuma chamada à API é feita.
    it('informa sucesso ao salvar sem enviar os dados à API', async () => {
      await mount();
      await validate('form');

      await findButton(wrapper, 'Salvar Perfil').trigger('click');
      await flushPromises();

      expect(authService.updateMe).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Salvando perfil:', page.vm.userData);
      expect(snackbar()).toEqual(['Perfil salvo com sucesso!', 'success']);
      expect(page.vm.saving).toBe(false);
    });

    it('não salva quando o formulário é inválido', async () => {
      await mount();
      page.vm.userData.email = 'invalido';
      await validate('form');

      expect(findButton(wrapper, 'Salvar Perfil').attributes('disabled')).toBeDefined();
      await page.vm.saveProfile();
      expect(console.log).not.toHaveBeenCalledWith('Salvando perfil:', expect.anything());
    });

    it('mostra o nome digitado no cartão da foto', async () => {
      await mount();

      page.vm.userData.nome = 'Ana Souza';
      await flushPromises();

      expect(wrapper.text()).toContain('Ana Souza');
    });

    it('usa um texto padrão quando o nome está vazio', async () => {
      await mount();

      page.vm.userData.nome = '';
      await flushPromises();

      expect(wrapper.text()).toContain('Seu Nome');
    });
  });

  describe('foto do perfil', () => {
    // Teste de caracterização: a foto escolhida só aparece na pré-visualização;
    // ela não é enviada nem salva.
    it('mostra a pré-visualização da foto escolhida', async () => {
      mockFileReader();
      await mount();

      page.vm.handleAvatarChange({ target: { files: [new File(['x'], 'foto.jpg', { type: 'image/jpeg' })] } });
      await flushPromises();

      expect(page.vm.avatarPreview).toBe('data:image/jpeg;base64,foto.jpg');
    });

    it('ignora a seleção vazia', async () => {
      await mount();

      page.vm.handleAvatarChange({ target: { files: [] } });

      expect(page.vm.avatarPreview).toBeNull();
    });
  });

  describe('configurações', () => {
    it('começa com as configurações padrão', async () => {
      await mount();

      expect(page.vm.settings).toEqual({ notifications: true, sms: false, darkMode: false, autoSave: true });
    });

    it('carrega as configurações salvas, mantendo o padrão das não salvas', async () => {
      localStorage.setItem('agromart_settings', JSON.stringify({ sms: true }));
      await mount();

      expect(page.vm.settings).toEqual({ notifications: true, sms: true, darkMode: false, autoSave: true });
    });

    it('salva as configurações no navegador', async () => {
      await mount();
      page.vm.settings.darkMode = true;

      await findButton(wrapper, 'Salvar Configurações').trigger('click');

      expect(JSON.parse(localStorage.getItem('agromart_settings')).darkMode).toBe(true);
      expect(snackbar()).toEqual(['Configurações salvas!', 'success']);
    });
  });

  describe('alteração de senha', () => {
    const fillPassword = async (current, next, confirm) => {
      page.vm.passwordData = { current, new: next, confirm };
      await flushPromises();
      await validate('passwordForm');
    };

    // Teste de caracterização: a senha não é alterada de fato; o
    // authService.changePassword existe, mas a página não o chama.
    it('limpa os campos e informa sucesso sem chamar a API', async () => {
      await mount();
      await fillPassword('antiga', 'nova123', 'nova123');

      await findButton(wrapper, 'Alterar Senha').trigger('click');
      await flushPromises();

      expect(authService.changePassword).not.toHaveBeenCalled();
      expect(page.vm.passwordData).toEqual({ current: '', new: '', confirm: '' });
      expect(snackbar()).toEqual(['Senha alterada com sucesso!', 'success']);
    });

    it('não altera quando a confirmação não coincide', async () => {
      await mount();
      await fillPassword('antiga', 'nova123', 'outra123');

      expect(findButton(wrapper, 'Alterar Senha').attributes('disabled')).toBeDefined();
      await page.vm.changePassword();
      expect(page.vm.passwordData.new).toBe('nova123');
    });
  });

  describe('estatísticas', () => {
    // Teste de caracterização: a quantidade de pedidos é fixa em 0.
    it('mostra as quantidades carregadas nos stores e pedidos sempre zerados', async () => {
      useProductStore().products = [{ id: 1 }, { id: 2 }];
      useBasketStore().baskets = [{ id: 1 }];
      useStoreStore().stores = [{ id: 1 }, { id: 2 }, { id: 3 }];
      await mount();

      const stats = wrapper.findAll('.text-h6.font-weight-bold').map((el) => el.text());
      expect(stats).toEqual(expect.arrayContaining(['2', '1', '0', '3']));
    });
  });

  describe('ações rápidas', () => {
    it('limpa o cache dos stores e as configurações salvas', async () => {
      localStorage.setItem('agromart_products', '[1]');
      localStorage.setItem('agromart_baskets', '[1]');
      localStorage.setItem('agromart_stores', '[1]');
      localStorage.setItem('agromart_settings', '{}');
      await mount();

      await findButton(wrapper, 'Limpar Cache').trigger('click');

      ['agromart_products', 'agromart_baskets', 'agromart_stores', 'agromart_settings']
        .forEach((key) => expect(localStorage.getItem(key)).toBeNull());
      expect(snackbar()).toEqual(['Cache limpo com sucesso!', 'success']);
    });

    it('exporta perfil, configurações e dados carregados em um arquivo JSON', async () => {
      URL.createObjectURL = jest.fn(() => 'blob:dados');
      URL.revokeObjectURL = jest.fn();
      const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
      useProductStore().products = [{ id: 1 }];
      await mount();

      await findButton(wrapper, 'Exportar Dados').trigger('click');

      const blob = URL.createObjectURL.mock.calls[0][0];
      const text = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsText(blob);
      });
      const data = JSON.parse(text);
      expect(data).toMatchObject({ profile: { nome: 'João Silva' }, products: [{ id: 1 }], stores: [], baskets: [] });
      expect(click).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:dados');
      expect(snackbar()).toEqual(['Dados exportados com sucesso!', 'success']);
    });

    it('encerra a sessão, limpa o cache e volta ao login', async () => {
      localStorage.setItem('agromart_token', 'token-jwt');
      localStorage.setItem('agromart_products', '[1]');
      await mount();
      useAuthStore().isAuthenticated = true;
      const navigated = new Promise((resolve) => router.afterEach(() => resolve()));

      await findButton(wrapper, 'Sair').trigger('click');
      await navigated;

      expect(useAuthStore().isAuthenticated).toBe(false);
      expect(localStorage.getItem('agromart_token')).toBeNull();
      expect(localStorage.getItem('agromart_products')).toBeNull();
      expect(router.currentRoute.value.name).toBe('Login');
      expect(snackbar()).toEqual(['Logout realizado com sucesso', 'success']);
    });
  });

  describe('regras de validação', () => {
    const firstError = (rules, value) => rules.map((rule) => rule(value)).find((r) => r !== true);

    it.each([
      ['nameRules', '', 'Nome é obrigatório'],
      ['nameRules', 'A', 'Nome deve ter pelo menos 2 caracteres'],
      ['emailRules', '', 'E-mail é obrigatório'],
      ['emailRules', 'joao@', 'E-mail deve ser válido'],
      ['phoneRules', '', 'Telefone é obrigatório'],
      ['phoneRules', '(61) 9999', 'Telefone deve ter pelo menos 10 dígitos'],
      ['bioRules', 'a'.repeat(301), 'Bio deve ter no máximo 300 caracteres'],
      ['currentPasswordRules', '', 'Senha atual é obrigatória'],
      ['newPasswordRules', '', 'Nova senha é obrigatória'],
      ['newPasswordRules', '123', 'Nova senha deve ter pelo menos 6 caracteres'],
      ['confirmPasswordRules', '', 'Confirmação de senha é obrigatória'],
    ])('%s rejeita "%s"', async (rules, value, expected) => {
      await mount();
      expect(firstError(page.vm[rules], value)).toBe(expected);
    });

    it.each([
      ['nameRules', 'Ana'],
      ['emailRules', 'ana@agromart.test'],
      ['phoneRules', '(61) 99999-9999'],
      ['bioRules', ''],
      ['newPasswordRules', '123456'],
    ])('%s aceita "%s"', async (rules, value) => {
      await mount();
      expect(firstError(page.vm[rules], value)).toBeUndefined();
    });

    it('confirmPasswordRules exige a mesma senha digitada', async () => {
      await mount();
      page.vm.passwordData.new = 'nova123';

      expect(firstError(page.vm.confirmPasswordRules, 'outra')).toBe('Senhas não coincidem');
      expect(firstError(page.vm.confirmPasswordRules, 'nova123')).toBeUndefined();
    });
  });
});
