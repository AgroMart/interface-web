import api from '@/services/api';
import { productsService } from '@/services/products';

jest.mock('@/services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('services/products', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getProducts busca os produtos avulsos com imagem e loja', () => {
    productsService.getProducts();

    expect(api.get).toHaveBeenCalledWith('/produtos-avulsos', {
      params: { populate: ['imagem', 'loja'] },
    });
  });

  it('getProducts repassa parâmetros extras de consulta', () => {
    productsService.getProducts({ filters: { ativo: true } });

    expect(api.get).toHaveBeenCalledWith('/produtos-avulsos', {
      params: { populate: ['imagem', 'loja'], filters: { ativo: true } },
    });
  });

  it('getProduct busca um produto pelo id', () => {
    productsService.getProduct(3);

    expect(api.get).toHaveBeenCalledWith('/produtos-avulsos/3', {
      params: { populate: ['imagem', 'loja'] },
    });
  });

  it('createProduct envia os dados no formato { data } do Strapi', () => {
    productsService.createProduct({ nome: 'Alface' });

    expect(api.post).toHaveBeenCalledWith('/produtos-avulsos', { data: { nome: 'Alface' } });
  });

  it('updateProduct envia os dados no formato { data } do Strapi', () => {
    productsService.updateProduct(3, { nome: 'Alface' });

    expect(api.put).toHaveBeenCalledWith('/produtos-avulsos/3', { data: { nome: 'Alface' } });
  });

  it('deleteProduct remove o produto pelo id', () => {
    productsService.deleteProduct(3);

    expect(api.delete).toHaveBeenCalledWith('/produtos-avulsos/3');
  });

  it('retorna a promessa da requisição', () => {
    const response = Promise.resolve({ data: [] });
    api.get.mockReturnValue(response);

    expect(productsService.getProducts()).toBe(response);
  });
});
