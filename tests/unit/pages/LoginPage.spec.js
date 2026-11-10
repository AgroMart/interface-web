import { createPinia, setActivePinia } from 'pinia';
import LoginPage from '@/pages/LoginPage.vue';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/services/api';
import { flushPromises } from '../helpers/mountWithVuetify';
import { mountPage, findButton } from '../helpers/mountPage';

jest.mock('@/services/api', () => ({
  apiService: {},
  authService: { login: jest.fn(), register: jest.fn(), forgotPassword: jest.fn() },
  onLoadingChange: jest.fn(),
}));

const user = { id: 1, username: 'maria', email: 'maria@agromart.test' };
const apiError = (message) => ({ response: { data: { error: { message } } } });

describe('LoginPage.vue', () => {
  let wrapper;
  let router;
  let pinia;

  const mount = async () => {
    ({ wrapper, router } = await mountPage(LoginPage, { path: '/login', pinia }));
  };

  const field = (label) => wrapper.findAll('.v-text-field')
    .find((f) => f.find('label').exists() && f.find('label').text() === label);
  const fill = async (values) => {
    for (const [label, value] of Object.entries(values)) {
      await field(label).find('input').setValue(value);
    }
  };
  const submit = async () => {
    await wrapper.find('form').trigger('submit');
    await flushPromises();
  };
  const link = (text) => wrapper.findAll('a').find((a) => a.text().includes(text));
  const navigation = () => new Promise((resolve) => router.afterEach(() => resolve()));

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    pinia = createPinia();
    setActivePinia(pinia);
  });

  afterEach(() => {
    wrapper.unmount();
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('mostra o formulário de login com e-mail ou usuário e senha', async () => {
      await mount();

      expect(wrapper.find('.form-title').text()).toBe('Entrar');
      expect(field('Email ou usuário').exists()).toBe(true);
      expect(field('Senha').exists()).toBe(true);
      expect(field('Nome de usuário')).toBeUndefined();
      expect(field('Confirmar senha')).toBeUndefined();
    });

    it('entra e vai para a página inicial com credenciais válidas', async () => {
      authService.login.mockResolvedValue({ data: { jwt: 'token-jwt', user } });
      await mount();
      await fill({ 'Email ou usuário': 'maria', Senha: 'segredo1' });

      const navigated = navigation();
      await submit();
      await navigated;

      expect(authService.login).toHaveBeenCalledWith({ identifier: 'maria', password: 'segredo1' });
      expect(useAuthStore().isAuthenticated).toBe(true);
      expect(router.currentRoute.value.name).toBe('Home');
    });

    it('mostra o erro da API e permanece no login', async () => {
      authService.login.mockRejectedValue(apiError('Credenciais inválidas'));
      await mount();
      await fill({ 'Email ou usuário': 'maria', Senha: 'errada1' });

      await submit();

      expect(wrapper.find('.v-alert').text()).toContain('Credenciais inválidas');
      expect(router.currentRoute.value.name).toBe('Login');
    });

    it('fecha o aviso de erro e limpa a mensagem do store', async () => {
      authService.login.mockRejectedValue(apiError('Credenciais inválidas'));
      await mount();
      await fill({ 'Email ou usuário': 'maria', Senha: 'errada1' });
      await submit();

      await wrapper.find('.v-alert button').trigger('click');
      await flushPromises();

      expect(useAuthStore().error).toBeNull();
      expect(wrapper.find('.v-alert').exists()).toBe(false);
    });

    it('não envia com campos vazios ou senha curta', async () => {
      await mount();
      await fill({ 'Email ou usuário': 'maria', Senha: '123' });

      await submit();

      expect(authService.login).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain('Mínimo de 6 caracteres');
    });

    it('alterna a visibilidade da senha', async () => {
      await mount();
      const input = () => field('Senha').find('input');
      expect(input().attributes('type')).toBe('password');

      await field('Senha').find('.v-field__append-inner .v-icon').trigger('click');

      expect(input().attributes('type')).toBe('text');
    });
  });

  describe('cadastro', () => {
    const openRegister = async () => {
      await link('Criar conta').trigger('click');
      await flushPromises();
    };

    it('troca para o formulário de cadastro com os campos extras', async () => {
      await mount();
      await fill({ 'Email ou usuário': 'maria' });

      await openRegister();

      expect(wrapper.find('.form-title').text()).toBe('Criar Conta');
      expect(field('Nome de usuário').exists()).toBe(true);
      expect(field('Confirmar senha').exists()).toBe(true);
      expect(field('Email').find('input').element.value).toBe('');
    });

    it('cria a conta e vai para a página inicial', async () => {
      authService.register.mockResolvedValue({ data: { jwt: 'token-jwt', user } });
      await mount();
      await openRegister();
      await fill({
        'Nome de usuário': 'maria', Email: 'maria@agromart.test', Senha: 'segredo1', 'Confirmar senha': 'segredo1',
      });

      const navigated = navigation();
      await submit();
      await navigated;

      expect(authService.register).toHaveBeenCalledWith({
        username: 'maria', email: 'maria@agromart.test', password: 'segredo1',
      });
      expect(router.currentRoute.value.name).toBe('Home');
    });

    it('permanece no cadastro quando a API recusa', async () => {
      authService.register.mockRejectedValue(apiError('Email já cadastrado'));
      await mount();
      await openRegister();
      await fill({
        'Nome de usuário': 'maria', Email: 'maria@agromart.test', Senha: 'segredo1', 'Confirmar senha': 'segredo1',
      });

      await submit();

      expect(wrapper.text()).toContain('Email já cadastrado');
      expect(router.currentRoute.value.name).toBe('Login');
    });

    it('exige e-mail válido e senhas iguais', async () => {
      await mount();
      await openRegister();
      await fill({
        'Nome de usuário': 'maria', Email: 'maria@', Senha: 'segredo1', 'Confirmar senha': 'outra123',
      });

      await submit();

      expect(authService.register).not.toHaveBeenCalled();
      expect(wrapper.text()).toContain('Email inválido');
      expect(wrapper.text()).toContain('As senhas não coincidem');
    });

    it('alterna a visibilidade da confirmação de senha', async () => {
      await mount();
      await openRegister();
      const input = () => field('Confirmar senha').find('input');

      await field('Confirmar senha').find('.v-field__append-inner .v-icon').trigger('click');

      expect(input().attributes('type')).toBe('text');
    });

    it('volta para o login e limpa o erro anterior', async () => {
      authService.register.mockRejectedValue(apiError('Email já cadastrado'));
      await mount();
      await openRegister();
      await fill({
        'Nome de usuário': 'maria', Email: 'maria@agromart.test', Senha: 'segredo1', 'Confirmar senha': 'segredo1',
      });
      await submit();

      await link('Fazer login').trigger('click');
      await flushPromises();

      expect(wrapper.find('.form-title').text()).toBe('Entrar');
      expect(useAuthStore().error).toBeNull();
    });
  });

  describe('esqueci minha senha', () => {
    const dialogButton = (text) => [...document.body.querySelectorAll('.v-dialog button')]
      .find((button) => button.textContent.includes(text));
    const dialogInput = () => document.body.querySelector('.v-dialog input');

    const openDialog = async () => {
      await link('Esqueci minha senha').trigger('click');
      await flushPromises();
    };

    const typeEmail = async (value) => {
      const input = dialogInput();
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await flushPromises();
    };

    it('envia o e-mail de recuperação e mostra a confirmação', async () => {
      authService.forgotPassword.mockResolvedValue({});
      await mount();
      await openDialog();
      await typeEmail('maria@agromart.test');

      dialogButton('Enviar').click();
      await flushPromises();

      expect(authService.forgotPassword).toHaveBeenCalledWith('maria@agromart.test');
      expect(wrapper.text()).toContain('Email enviado! Verifique sua caixa de entrada.');
    });

    it('não envia com o e-mail vazio', async () => {
      await mount();
      await openDialog();

      dialogButton('Enviar').click();
      await flushPromises();

      expect(authService.forgotPassword).not.toHaveBeenCalled();
    });

    // Teste de caracterização: a regra de e-mail do campo é apenas visual;
    // um endereço inválido é enviado à API mesmo assim.
    it('envia mesmo com um e-mail inválido', async () => {
      authService.forgotPassword.mockResolvedValue({});
      await mount();
      await openDialog();
      await typeEmail('invalido');

      dialogButton('Enviar').click();
      await flushPromises();

      expect(authService.forgotPassword).toHaveBeenCalledWith('invalido');
    });

    it('mantém o diálogo aberto quando o envio falha', async () => {
      authService.forgotPassword.mockRejectedValue(apiError('Email não encontrado'));
      await mount();
      await openDialog();
      await typeEmail('maria@agromart.test');

      dialogButton('Enviar').click();
      await flushPromises();

      expect(dialogInput()).not.toBeNull();
      expect(wrapper.text()).not.toContain('Email enviado!');
    });

    it('fecha o diálogo ao cancelar', async () => {
      await mount();
      await openDialog();

      dialogButton('Cancelar').click();
      await flushPromises();

      // O Vuetify esconde o conteúdo do diálogo fechado em vez de removê-lo
      const content = document.body.querySelector('.v-dialog .v-overlay__content');
      expect(content === null || content.style.display === 'none').toBe(true);
    });

    it('permite fechar a mensagem de confirmação', async () => {
      authService.forgotPassword.mockResolvedValue({});
      await mount();
      await openDialog();
      await typeEmail('maria@agromart.test');
      dialogButton('Enviar').click();
      await flushPromises();

      await wrapper.find('.v-alert button').trigger('click');
      await flushPromises();

      expect(wrapper.text()).not.toContain('Email enviado!');
    });
  });

  it('o botão de envio mostra o carregamento enquanto o store autentica', async () => {
    await mount();

    useAuthStore().loading = true;
    await flushPromises();

    expect(findButton(wrapper, 'Entrar').classes()).toContain('v-btn--loading');
  });
});
