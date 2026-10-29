import { useStoreStore } from '@/store/stores';
import { useAppStore } from '@/store/app';
import { apiService } from '@/services/api';
import { describeCrudStore } from './crudStoreCases';

jest.mock('@/services/api', () => ({
  apiService: {
    getStores: jest.fn(),
    getStore: jest.fn(),
    updateStore: jest.fn(),
  },
  onLoadingChange: jest.fn(),
}));

const loja = (id, nome) => ({ id, attributes: { nome } });

describe('store/stores', () => {
  const { getStore } = describeCrudStore({
    useStore: useStoreStore,
    service: apiService,
    keys: { list: 'stores', cached: 'cachedStores', current: 'currentStore', storage: 'agromart_stores' },
    actions: {
      fetchAll: 'fetchStores',
      fetchOne: 'fetchStore',
      update: 'updateStore',
    },
    serviceMethods: {
      fetchAll: 'getStores',
      fetchOne: 'getStore',
      update: 'updateStore',
    },
    messages: {
      loaded: 'Lojas carregadas com sucesso',
      loadError: 'Erro ao carregar lojas',
      oneError: 'Erro ao carregar loja',
      updated: 'Loja atualizada com sucesso',
      updateError: 'Erro ao atualizar loja',
    },
  });

  describe('getters', () => {
    it('sortedStores ordena por nome sem alterar a lista original', () => {
      const store = getStore();
      store.stores = [loja(1, 'Sítio Verde'), loja(2, 'Horta da Ana'), loja(3, 'Quinta')];

      expect(store.sortedStores.map((s) => s.id)).toEqual([2, 3, 1]);
      expect(store.stores.map((s) => s.id)).toEqual([1, 2, 3]);
    });

    it('mainStore retorna a primeira loja da lista', () => {
      const store = getStore();
      store.stores = [loja(5, 'A'), loja(6, 'B')];

      expect(store.mainStore).toEqual(loja(5, 'A'));
    });

    it('mainStore retorna null quando não há lojas', () => {
      expect(getStore().mainStore).toBeNull();
    });
  });

  describe('updateStore e a loja aberta', () => {
    it('atualiza também a loja aberta quando ela é a editada', async () => {
      const store = getStore();
      const updated = loja(1, 'Novo nome');
      apiService.updateStore.mockResolvedValue({ data: updated });
      store.currentStore = loja(1, 'Antigo');

      await store.updateStore(1, { nome: 'Novo nome' });

      expect(store.currentStore).toEqual(updated);
    });

    it('não altera a loja aberta quando outra loja é editada', async () => {
      const store = getStore();
      apiService.updateStore.mockResolvedValue({ data: loja(2, 'Outra') });
      store.currentStore = loja(1, 'Aberta');

      await store.updateStore(2, {});

      expect(store.currentStore).toEqual(loja(1, 'Aberta'));
      expect(useAppStore().snackbar.message).toBe('Loja atualizada com sucesso');
    });
  });
});
