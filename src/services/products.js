import api, { apiService } from './api';
import { isFaas } from './backend';


const endpoint = '/produtos-avulsos';

export const productsService = {

  getProducts: (params = {}) => {
    return api.get(endpoint, {
      params: {
        populate: ['imagem', 'loja'],
        ...params,
      },
    });
  },
  
  getProduct: (id) => {
    return api.get(`${endpoint}/${id}`, {
      params: {
        populate: ['imagem', 'loja'],
      },
    });
  },
  
  createProduct: (data) => {
    return api.post(endpoint, { data });
  },
  
  updateProduct: (id, data) => {
    return api.put(`${endpoint}/${id}`, { data });
  },
  
  deleteProduct: (id) => {
    return api.delete(`${endpoint}/${id}`);
  },

};

if (isFaas) Object.assign(productsService, {
  getProducts: apiService.getProducts, getProduct: apiService.getProduct,
  createProduct: apiService.createProduct, updateProduct: apiService.updateProduct,
  deleteProduct: apiService.deleteProduct,
});
