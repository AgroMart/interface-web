import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '@/store/auth';
import { authService } from '@/services/api';
import { backendStorage } from '@/services/backend';
jest.mock('@/services/api', () => ({ authService: { getMe: jest.fn() } }));
describe('Session restoration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    backendStorage.setItem('agromart_token', 'test-token');
    backendStorage.setItem('agromart_user', JSON.stringify({ id: 'a' }));
  });
  afterEach(() => jest.restoreAllMocks());
  it('clears a saved session rejected by the API', async () => {
    authService.getMe.mockRejectedValue(new Error('Invalid token'));
    const store = useAuthStore();
    await store.initAuth();
    expect(store.isAuthenticated).toBe(false);
    expect(backendStorage.getItem('agromart_token')).toBeNull();
  });
  it('restores and refreshes a session validated by the API', async () => {
    authService.getMe.mockResolvedValue({ data: { id: 'a', username: 'Atualizado' } });
    const store = useAuthStore();
    await store.initAuth();
    expect(store.isAuthenticated).toBe(true);
    expect(store.user.username).toBe('Atualizado');
    expect(JSON.parse(backendStorage.getItem('agromart_user')).username).toBe('Atualizado');
  });
  it('clears corrupted stored user JSON without crashing', async () => {
    backendStorage.setItem('agromart_user', '{');
    const store = useAuthStore();
    await store.initAuth();
    expect(store.isAuthenticated).toBe(false);
    expect(authService.getMe).not.toHaveBeenCalled();
  });
});
