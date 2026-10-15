import { useBasketStore } from '@/store/baskets';
import { apiService } from '@/services/api';
import { describeCrudStore } from './crudStoreCases';

jest.mock('@/services/api', () => ({
  apiService: {
    getBaskets: jest.fn(),
    getBasket: jest.fn(),
    createBasket: jest.fn(),
    updateBasket: jest.fn(),
    deleteBasket: jest.fn(),
  },
  onLoadingChange: jest.fn(),
}));

const basket = (id, valor, quantidade, lojaId) => ({
  id,
  attributes: { valor, quantidade, loja: lojaId ? { data: { id: lojaId } } : undefined },
});

describe('store/baskets', () => {
  const { getStore } = describeCrudStore({
    useStore: useBasketStore,
    service: apiService,
    keys: { list: 'baskets', cached: 'cachedBaskets', current: 'currentBasket', storage: 'agromart_baskets' },
    actions: {
      fetchAll: 'fetchBaskets',
      fetchOne: 'fetchBasket',
      create: 'createBasket',
      update: 'updateBasket',
      remove: 'deleteBasket',
    },
    serviceMethods: {
      fetchAll: 'getBaskets',
      fetchOne: 'getBasket',
      create: 'createBasket',
      update: 'updateBasket',
      remove: 'deleteBasket',
    },
    messages: {
      loaded: 'Cestas carregadas com sucesso',
      loadError: 'Erro ao carregar cestas',
      oneError: 'Erro ao carregar cesta',
      created: 'Cesta criada com sucesso',
      createError: 'Erro ao criar cesta',
      updated: 'Cesta atualizada com sucesso',
      updateError: 'Erro ao atualizar cesta',
      removed: 'Cesta removida com sucesso',
      removeError: 'Erro ao remover cesta',
    },
  });

  describe('getters', () => {
    it('sortedBaskets ordena por valor sem alterar a lista original', () => {
      const store = getStore();
      store.baskets = [basket(1, 50), basket(2, 10), basket(3, 30)];

      expect(store.sortedBaskets.map((b) => b.id)).toEqual([2, 3, 1]);
      expect(store.baskets.map((b) => b.id)).toEqual([1, 2, 3]);
    });

    it('availableBaskets mantém apenas cestas com quantidade positiva', () => {
      const store = getStore();
      store.baskets = [basket(1, 10, 2), basket(2, 10, 0), basket(3, 10, -1)];

      expect(store.availableBaskets.map((b) => b.id)).toEqual([1]);
    });

    it('basketsByStore filtra pela loja e ignora cestas sem loja', () => {
      const store = getStore();
      store.baskets = [basket(1, 10, 1, 7), basket(2, 10, 1, 8), basket(3, 10, 1)];

      expect(store.basketsByStore(7).map((b) => b.id)).toEqual([1]);
      expect(store.basketsByStore(99)).toEqual([]);
    });
  });
});
