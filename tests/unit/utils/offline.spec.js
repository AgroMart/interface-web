/* eslint-disable no-console */
import {
  registerServiceWorker,
  isOnline,
  setupConnectionListeners,
  cacheManager,
  syncManager,
  initOfflineFeatures,
} from '@/utils/offline';

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const seedCache = (key, item) => {
  localStorage.setItem(key, typeof item === 'string' ? item : JSON.stringify(item));
};

const getPending = () => JSON.parse(localStorage.getItem('agromart_pending_sync'));

describe('utils/offline', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isOnline', () => {
    it('retorna o estado de conexão do navegador', () => {
      const onLine = jest.spyOn(navigator, 'onLine', 'get');

      onLine.mockReturnValue(true);
      expect(isOnline()).toBe(true);

      onLine.mockReturnValue(false);
      expect(isOnline()).toBe(false);
    });
  });

  describe('setupConnectionListeners', () => {
    it('chama os callbacks nos eventos online e offline', () => {
      const onOnline = jest.fn();
      const onOffline = jest.fn();
      const cleanup = setupConnectionListeners(onOnline, onOffline);

      window.dispatchEvent(new Event('online'));
      window.dispatchEvent(new Event('offline'));

      expect(onOnline).toHaveBeenCalledTimes(1);
      expect(onOffline).toHaveBeenCalledTimes(1);
      cleanup();
    });

    it('remove os listeners ao chamar a função de limpeza', () => {
      const onOnline = jest.fn();
      const onOffline = jest.fn();
      const cleanup = setupConnectionListeners(onOnline, onOffline);

      cleanup();
      window.dispatchEvent(new Event('online'));
      window.dispatchEvent(new Event('offline'));

      expect(onOnline).not.toHaveBeenCalled();
      expect(onOffline).not.toHaveBeenCalled();
    });
  });

  describe('registerServiceWorker', () => {
    const originalLocation = window.location;
    let newWorker;
    let registration;

    const mockServiceWorker = ({ register, controller = {} }) => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { register, controller },
        configurable: true,
      });
    };

    beforeEach(() => {
      newWorker = new EventTarget();
      registration = new EventTarget();
      registration.installing = newWorker;
      delete window.location;
      window.location = { reload: jest.fn() };
    });

    afterEach(() => {
      delete navigator.serviceWorker;
      window.location = originalLocation;
    });

    const triggerUpdate = async (state) => {
      window.dispatchEvent(new Event('load'));
      await flushPromises();
      registration.dispatchEvent(new Event('updatefound'));
      newWorker.state = state;
      newWorker.dispatchEvent(new Event('statechange'));
    };

    it('não faz nada quando o navegador não suporta service worker', () => {
      const addListener = jest.spyOn(window, 'addEventListener');

      registerServiceWorker();

      expect(addListener).not.toHaveBeenCalledWith('load', expect.any(Function));
    });

    it('registra o /sw.js quando a página termina de carregar', async () => {
      const register = jest.fn().mockResolvedValue(registration);
      mockServiceWorker({ register });

      registerServiceWorker();
      expect(register).not.toHaveBeenCalled();

      window.dispatchEvent(new Event('load'));
      await flushPromises();

      expect(register).toHaveBeenCalledWith('/sw.js');
    });

    it('recarrega a página se o usuário aceitar a nova versão', async () => {
      mockServiceWorker({ register: jest.fn().mockResolvedValue(registration) });
      window.confirm = jest.fn().mockReturnValue(true);

      registerServiceWorker();
      await triggerUpdate('installed');

      expect(window.confirm).toHaveBeenCalled();
      expect(window.location.reload).toHaveBeenCalled();
    });

    it('não recarrega a página se o usuário recusar a nova versão', async () => {
      mockServiceWorker({ register: jest.fn().mockResolvedValue(registration) });
      window.confirm = jest.fn().mockReturnValue(false);

      registerServiceWorker();
      await triggerUpdate('installed');

      expect(window.confirm).toHaveBeenCalled();
      expect(window.location.reload).not.toHaveBeenCalled();
    });

    it('não avisa sobre atualização enquanto o novo worker não está instalado', async () => {
      mockServiceWorker({ register: jest.fn().mockResolvedValue(registration) });
      window.confirm = jest.fn();

      registerServiceWorker();
      await triggerUpdate('installing');

      expect(window.confirm).not.toHaveBeenCalled();
    });

    it('não avisa sobre atualização na primeira instalação (sem controller)', async () => {
      mockServiceWorker({
        register: jest.fn().mockResolvedValue(registration),
        controller: null,
      });
      window.confirm = jest.fn();

      registerServiceWorker();
      await triggerUpdate('installed');

      expect(window.confirm).not.toHaveBeenCalled();
    });

    it('registra o erro quando o registro do service worker falha', async () => {
      const error = new Error('falha');
      mockServiceWorker({ register: jest.fn().mockRejectedValue(error) });

      registerServiceWorker();
      window.dispatchEvent(new Event('load'));
      await flushPromises();

      expect(console.log).toHaveBeenCalledWith('Erro ao registrar Service Worker:', error);
    });
  });

  describe('cacheManager.cleanup', () => {
    const now = 1_000_000;

    beforeEach(() => {
      jest.spyOn(Date, 'now').mockReturnValue(now);
    });

    it('remove itens expirados e mantém os válidos', () => {
      seedCache('agromart_expirado', { data: 1, timestamp: now - 2000, expiration: 1000 });
      seedCache('agromart_valido', { data: 2, timestamp: now - 500, expiration: 1000 });

      cacheManager.cleanup();

      expect(localStorage.getItem('agromart_expirado')).toBeNull();
      expect(localStorage.getItem('agromart_valido')).not.toBeNull();
    });

    it('remove itens corrompidos', () => {
      seedCache('agromart_corrompido', '{json inválido');

      cacheManager.cleanup();

      expect(localStorage.getItem('agromart_corrompido')).toBeNull();
    });

    it('não mexe em chaves de outras aplicações', () => {
      seedCache('outra_chave', { data: 1, timestamp: 0, expiration: 1 });

      cacheManager.cleanup();

      expect(localStorage.getItem('outra_chave')).not.toBeNull();
    });

    it('mantém itens gravados pelo cacheManager.set dentro do prazo', () => {
      cacheManager.set('cestas', [{ id: 1 }]);

      cacheManager.cleanup();

      expect(JSON.parse(localStorage.getItem('agromart_cestas')).data).toEqual([{ id: 1 }]);
    });
  });

  describe('syncManager', () => {
    describe('getPendingSync', () => {
      it('retorna lista vazia quando não há pendências', () => {
        expect(syncManager.getPendingSync()).toEqual([]);
      });

      it('retorna lista vazia quando o conteúdo salvo está corrompido', () => {
        seedCache('agromart_pending_sync', '{json inválido');

        expect(syncManager.getPendingSync()).toEqual([]);
      });
    });

    describe('syncItem', () => {
      it.each(['product', 'basket', 'store'])('aceita o tipo %s', async (type) => {
        await expect(syncManager.syncItem({ type, data: {} })).resolves.toBeUndefined();
      });

      it('rejeita tipos não suportados', async () => {
        await expect(syncManager.syncItem({ type: 'pedido', data: {} }))
          .rejects.toThrow('Tipo de sincronização não suportado: pedido');
      });
    });

    describe('processPendingSync', () => {
      it('remove da fila os itens sincronizados com sucesso', async () => {
        seedCache('agromart_pending_sync', [
          { id: '1', type: 'product', data: {}, retries: 0 },
          { id: '2', type: 'basket', data: {}, retries: 0 },
          { id: '3', type: 'store', data: {}, retries: 0 },
        ]);

        await syncManager.processPendingSync();

        expect(getPending()).toEqual([]);
      });

      it('mantém na fila e incrementa as tentativas dos itens que falharam', async () => {
        seedCache('agromart_pending_sync', [
          { id: '1', type: 'product', data: {}, retries: 0 },
          { id: '2', type: 'desconhecido', data: {}, retries: 0 },
        ]);

        await syncManager.processPendingSync();

        expect(getPending()).toEqual([
          { id: '2', type: 'desconhecido', data: {}, retries: 1 },
        ]);
      });

      it('trata itens sem contador de tentativas como primeira tentativa', async () => {
        seedCache('agromart_pending_sync', [{ id: '1', type: 'desconhecido', data: {} }]);

        await syncManager.processPendingSync();

        expect(getPending()[0].retries).toBe(1);
      });

      it('descarta o item após a terceira falha', async () => {
        seedCache('agromart_pending_sync', [
          { id: '1', type: 'desconhecido', data: {}, retries: 2 },
        ]);

        await syncManager.processPendingSync();

        expect(getPending()).toEqual([]);
      });
    });
  });

  describe('initOfflineFeatures', () => {
    let onLine;
    let processPendingSync;
    let cleanup;

    beforeEach(() => {
      onLine = jest.spyOn(navigator, 'onLine', 'get');
      processPendingSync = jest.spyOn(syncManager, 'processPendingSync').mockResolvedValue();
      cleanup = jest.spyOn(cacheManager, 'cleanup');
    });

    it('limpa o cache e sincroniza as pendências quando está online', () => {
      onLine.mockReturnValue(true);

      initOfflineFeatures();

      expect(cleanup).toHaveBeenCalled();
      expect(processPendingSync).toHaveBeenCalledTimes(1);
    });

    it('não sincroniza ao iniciar quando está offline', () => {
      onLine.mockReturnValue(false);

      initOfflineFeatures();

      expect(cleanup).toHaveBeenCalled();
      expect(processPendingSync).not.toHaveBeenCalled();
    });

    it('sincroniza as pendências quando a conexão volta', () => {
      onLine.mockReturnValue(false);
      initOfflineFeatures();

      window.dispatchEvent(new Event('online'));

      expect(processPendingSync).toHaveBeenCalled();
    });

    it('apenas registra no log quando a conexão cai', () => {
      onLine.mockReturnValue(true);
      initOfflineFeatures();
      processPendingSync.mockClear();

      window.dispatchEvent(new Event('offline'));

      expect(console.log).toHaveBeenCalledWith('Conexão perdida - modo offline ativado');
      expect(processPendingSync).not.toHaveBeenCalled();
    });
  });
});
