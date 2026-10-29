import { createPinia, setActivePinia } from 'pinia';
import { useAppStore } from '@/store/app';
import { onLoadingChange } from '@/services/api';

jest.mock('@/services/api', () => ({
  onLoadingChange: jest.fn(),
}));

describe('store/app', () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    setActivePinia(createPinia());
    store = useAppStore();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('estado inicial', () => {
    it('começa sem loading, sem mensagem e com o menu fechado', () => {
      expect(store.isLoading).toBe(false);
      expect(store.snackbar.show).toBe(false);
      expect(store.drawer).toBe(false);
    });

    it('reflete o estado de conexão do navegador', () => {
      jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
      setActivePinia(createPinia());

      expect(useAppStore().isOnline).toBe(false);
    });
  });

  describe('init', () => {
    it('acompanha o loading das requisições da API', () => {
      store.init();
      const callback = onLoadingChange.mock.calls[0][0];

      callback(true);
      expect(store.isLoading).toBe(true);

      callback(false);
      expect(store.isLoading).toBe(false);
    });

    it('avisa quando a conexão cai e quando volta', () => {
      store.init();

      window.dispatchEvent(new Event('offline'));
      expect(store.isOnline).toBe(false);
      expect(store.snackbar).toMatchObject({ show: true, message: 'Sem conexão com a internet', color: 'warning' });

      window.dispatchEvent(new Event('online'));
      expect(store.isOnline).toBe(true);
      expect(store.snackbar).toMatchObject({ show: true, message: 'Conexão restabelecida', color: 'success' });
    });
  });

  describe('snackbar', () => {
    it('usa cor e duração padrão quando não informadas', () => {
      store.showSnackbar('Olá');

      expect(store.snackbar).toEqual({ show: true, message: 'Olá', color: 'info', timeout: 4000 });
    });

    it('aceita cor e duração personalizadas', () => {
      store.showSnackbar('Erro', 'error', 8000);

      expect(store.snackbar).toEqual({ show: true, message: 'Erro', color: 'error', timeout: 8000 });
    });

    it('hideSnackbar fecha a mensagem mantendo o conteúdo', () => {
      store.showSnackbar('Olá');

      store.hideSnackbar();

      expect(store.snackbar.show).toBe(false);
      expect(store.snackbar.message).toBe('Olá');
    });
  });

  describe('drawer', () => {
    it('toggleDrawer alterna o menu lateral', () => {
      store.toggleDrawer();
      expect(store.drawer).toBe(true);

      store.toggleDrawer();
      expect(store.drawer).toBe(false);
    });

    it('closeDrawer fecha o menu lateral', () => {
      store.drawer = true;

      store.closeDrawer();

      expect(store.drawer).toBe(false);
    });
  });
});
