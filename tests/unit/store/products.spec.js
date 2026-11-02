import { useProductStore } from '@/store/products';
import { productsService } from '@/services/products';
import { describeCrudStore } from './crudStoreCases';

jest.mock('@/services/products', () => ({
  productsService: {
    getProducts: jest.fn(),
    getProduct: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
  },
}));

jest.mock('@/services/api', () => ({
  onLoadingChange: jest.fn(),
}));

const product = (id, nome, quantidade, lojaId) => ({
  id,
  attributes: { nome, quantidade, loja: lojaId ? { data: { id: lojaId } } : undefined },
});

describe('store/products', () => {
  const { getStore } = describeCrudStore({
    useStore: useProductStore,
    service: productsService,
    keys: { list: 'products', cached: 'cachedProducts', current: 'currentProduct', storage: 'agromart_products' },
    actions: {
      fetchAll: 'fetchProducts',
      fetchOne: 'fetchProduct',
      create: 'createProduct',
      update: 'updateProduct',
      remove: 'deleteProduct',
    },
    serviceMethods: {
      fetchAll: 'getProducts',
      fetchOne: 'getProduct',
      create: 'createProduct',
      update: 'updateProduct',
      remove: 'deleteProduct',
    },
    messages: {
      loaded: 'Produtos carregados com sucesso',
      loadError: 'Erro ao carregar produtos',
      oneError: 'Erro ao carregar produto',
      created: 'Produto criado com sucesso',
      createError: 'Erro ao criar produto',
      updated: 'Produto atualizado com sucesso',
      updateError: 'Erro ao atualizar produto',
      removed: 'Produto removido com sucesso',
      removeError: 'Erro ao remover produto',
    },
  });

  describe('getters', () => {
    it('sortedProducts ordena por nome sem alterar a lista original', () => {
      const store = getStore();
      store.products = [product(1, 'Tomate'), product(2, 'Alface'), product(3, 'Cenoura')];

      expect(store.sortedProducts.map((p) => p.id)).toEqual([2, 3, 1]);
      expect(store.products.map((p) => p.id)).toEqual([1, 2, 3]);
    });

    it('availableProducts mantém apenas produtos com quantidade positiva', () => {
      const store = getStore();
      store.products = [product(1, 'A', 2), product(2, 'B', 0), product(3, 'C', -1)];

      expect(store.availableProducts.map((p) => p.id)).toEqual([1]);
    });

    it('productsByStore filtra pela loja e ignora produtos sem loja', () => {
      const store = getStore();
      store.products = [product(1, 'A', 1, 7), product(2, 'B', 1, 8), product(3, 'C', 1)];

      expect(store.productsByStore(7).map((p) => p.id)).toEqual([1]);
      expect(store.productsByStore(99)).toEqual([]);
    });
  });
});
