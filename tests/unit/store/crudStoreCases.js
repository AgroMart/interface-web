// Casos compartilhados pelos stores de cestas, produtos e lojas.
// Os stores têm a mesma estrutura, mudando apenas nomes, serviço e mensagens,
// então o mesmo conjunto de testes é aplicado a todos. O store de lojas não
// cria nem remove itens, então esses casos são opcionais.
import { createPinia, setActivePinia } from 'pinia';
import { useAppStore } from '@/store/app';

const describeIf = (condition) => (condition ? describe : () => {});

export const describeCrudStore = ({
  useStore,
  service,
  keys: { list, cached, current, storage },
  actions: { fetchAll, fetchOne, create, update, remove },
  serviceMethods,
  messages,
}) => {
  const lastFetchKey = `${storage}_last_fetch`;
  const item = (id, attributes = {}) => ({ id, attributes });

  let store;
  let appStore;

  const createStore = () => {
    setActivePinia(createPinia());
    store = useStore();
    appStore = useAppStore();
  };

  const snackbar = () => [appStore.snackbar.message, appStore.snackbar.color];
  const saved = () => JSON.parse(localStorage.getItem(storage));

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    createStore();
  });

  describe('estado inicial', () => {
    it('começa com o cache vazio quando não há nada salvo', () => {
      expect(store[cached]).toEqual([]);
      expect(store.lastFetch).toBeNull();
    });

    it('carrega o cache salvo no localStorage', () => {
      localStorage.setItem(storage, JSON.stringify([item(1)]));
      localStorage.setItem(lastFetchKey, '2026-10-15T00:00:00.000Z');

      createStore();

      expect(store[cached]).toEqual([item(1)]);
      expect(store.lastFetch).toBe('2026-10-15T00:00:00.000Z');
    });
  });

  describe(fetchAll, () => {
    const withCache = () => {
      localStorage.setItem(storage, JSON.stringify([item(9)]));
      createStore();
    };

    it('busca na API, salva no cache e avisa o sucesso', async () => {
      service[serviceMethods.fetchAll].mockResolvedValue({ data: [item(1)] });

      await store[fetchAll]();

      expect(store[list]).toEqual([item(1)]);
      expect(saved()).toEqual([item(1)]);
      expect(localStorage.getItem(lastFetchKey)).not.toBeNull();
      expect(store.loading).toBe(false);
      expect(snackbar()).toEqual([messages.loaded, 'success']);
    });

    it('usa o cache sem chamar a API quando está offline', async () => {
      withCache();
      appStore.isOnline = false;

      await store[fetchAll]();

      expect(store[list]).toEqual([item(9)]);
      expect(service[serviceMethods.fetchAll]).not.toHaveBeenCalled();
    });

    it('usa o cache sem chamar a API quando o cache é solicitado', async () => {
      withCache();

      await store[fetchAll](true);

      expect(store[list]).toEqual([item(9)]);
      expect(service[serviceMethods.fetchAll]).not.toHaveBeenCalled();
    });

    it('tenta a API mesmo offline quando o cache está vazio', async () => {
      appStore.isOnline = false;
      service[serviceMethods.fetchAll].mockResolvedValue({ data: [item(1)] });

      await store[fetchAll]();

      expect(service[serviceMethods.fetchAll]).toHaveBeenCalled();
      expect(store[list]).toEqual([item(1)]);
    });

    it('recorre ao cache quando a API falha', async () => {
      withCache();
      service[serviceMethods.fetchAll].mockRejectedValue(new Error('Network Error'));

      await store[fetchAll]();

      expect(store[list]).toEqual([item(9)]);
      expect(store.error).toBe('Network Error');
      expect(store.loading).toBe(false);
      expect(snackbar()).toEqual(['Usando dados salvos (sem internet)', 'warning']);
    });

    it('avisa o erro quando a API falha e não há cache', async () => {
      service[serviceMethods.fetchAll].mockRejectedValue(new Error('Network Error'));

      await store[fetchAll]();

      expect(store[list]).toEqual([]);
      expect(store.error).toBe('Network Error');
      expect(snackbar()).toEqual([messages.loadError, 'error']);
    });
  });

  describe(fetchOne, () => {
    it('carrega o item solicitado', async () => {
      service[serviceMethods.fetchOne].mockResolvedValue({ data: item(3) });

      await store[fetchOne](3);

      expect(service[serviceMethods.fetchOne]).toHaveBeenCalledWith(3);
      expect(store[current]).toEqual(item(3));
      expect(store.loading).toBe(false);
    });

    it('registra e avisa o erro quando a API falha', async () => {
      service[serviceMethods.fetchOne].mockRejectedValue(new Error('404'));

      await store[fetchOne](3);

      expect(store[current]).toBeNull();
      expect(store.error).toBe('404');
      expect(store.loading).toBe(false);
      expect(snackbar()).toEqual([messages.oneError, 'error']);
    });
  });

  describeIf(create)(create, () => {
    it('adiciona o novo item à lista e ao cache', async () => {
      service[serviceMethods.create].mockResolvedValue({ data: item(2) });
      store[list] = [item(1)];

      const result = await store[create]({ nome: 'novo' });

      expect(service[serviceMethods.create]).toHaveBeenCalledWith({ nome: 'novo' });
      expect(result).toEqual(item(2));
      expect(store[list]).toEqual([item(1), item(2)]);
      expect(saved()).toEqual([item(1), item(2)]);
      expect(snackbar()).toEqual([messages.created, 'success']);
    });

    it('propaga o erro e mantém a lista inalterada', async () => {
      const error = new Error('400');
      service[serviceMethods.create].mockRejectedValue(error);
      store[list] = [item(1)];

      await expect(store[create]({})).rejects.toBe(error);

      expect(store[list]).toEqual([item(1)]);
      expect(store.error).toBe('400');
      expect(store.loading).toBe(false);
      expect(snackbar()).toEqual([messages.createError, 'error']);
    });
  });

  describe(update, () => {
    it('substitui o item atualizado na lista e no cache', async () => {
      const updated = item(1, { nome: 'atualizado' });
      service[serviceMethods.update].mockResolvedValue({ data: updated });
      store[list] = [item(1), item(2)];

      const result = await store[update](1, { nome: 'atualizado' });

      expect(service[serviceMethods.update]).toHaveBeenCalledWith(1, { nome: 'atualizado' });
      expect(result).toEqual(updated);
      expect(store[list]).toEqual([updated, item(2)]);
      expect(saved()).toEqual([updated, item(2)]);
      expect(snackbar()).toEqual([messages.updated, 'success']);
    });

    it('não altera a lista quando o item não está carregado', async () => {
      service[serviceMethods.update].mockResolvedValue({ data: item(5) });
      store[list] = [item(1)];

      await store[update](5, {});

      expect(store[list]).toEqual([item(1)]);
    });

    it('propaga o erro e avisa a falha', async () => {
      const error = new Error('500');
      service[serviceMethods.update].mockRejectedValue(error);

      await expect(store[update](1, {})).rejects.toBe(error);

      expect(store.error).toBe('500');
      expect(store.loading).toBe(false);
      expect(snackbar()).toEqual([messages.updateError, 'error']);
    });
  });

  describeIf(remove)(remove, () => {
    it('remove o item da lista e do cache', async () => {
      service[serviceMethods.remove].mockResolvedValue({});
      store[list] = [item(1), item(2)];

      await store[remove](1);

      expect(service[serviceMethods.remove]).toHaveBeenCalledWith(1);
      expect(store[list]).toEqual([item(2)]);
      expect(saved()).toEqual([item(2)]);
      expect(snackbar()).toEqual([messages.removed, 'success']);
    });

    it('propaga o erro e mantém o item na lista', async () => {
      const error = new Error('403');
      service[serviceMethods.remove].mockRejectedValue(error);
      store[list] = [item(1)];

      await expect(store[remove](1)).rejects.toBe(error);

      expect(store[list]).toEqual([item(1)]);
      expect(store.error).toBe('403');
      expect(store.loading).toBe(false);
      expect(snackbar()).toEqual([messages.removeError, 'error']);
    });
  });

  describe('clearCache', () => {
    it('apaga o cache do estado e do localStorage', () => {
      store[list] = [item(1)];
      store.saveToCache();

      store.clearCache();

      expect(store[cached]).toEqual([]);
      expect(store.lastFetch).toBeNull();
      expect(localStorage.getItem(storage)).toBeNull();
      expect(localStorage.getItem(lastFetchKey)).toBeNull();
    });
  });

  return { getStore: () => store };
};
