import * as storeModule from '@/store';
import { useAuthStore } from '@/store/auth';
import { useAppStore } from '@/store/app';
import { useBasketStore } from '@/store/baskets';
import { useProductStore } from '@/store/products';
import { useStoreStore } from '@/store/stores';

describe('store/index', () => {
  it('cria a instância do Pinia usada pela aplicação', () => {
    expect(typeof storeModule.pinia.install).toBe('function');
  });

  it('reexporta todos os stores da aplicação', () => {
    expect(storeModule).toMatchObject({
      useAuthStore,
      useAppStore,
      useBasketStore,
      useProductStore,
      useStoreStore,
    });
  });
});
