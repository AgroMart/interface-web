import api from './api';


const endpoint = '/produtos-avulsos';

export const productsService = {

  getProducts: (params = {}) => {
    return api.get(endpoint, {
      params: {
        populate: ['imagem', 'loja'],
        ...params
      }
    })
  },
  
  getProduct: (id) => {
    return api.get(`${endpoint}/${id}`, {
      params: {
        populate: ['imagem', 'loja']
      }
    })
  },
  
  createProduct: (data) => {
    return api.post(endpoint, { data })
  },
  
  updateProduct: (id, data) => {
    return api.put(`${endpoint}/${id}`, { data })
  },
  
  deleteProduct: (id) => {
    return api.delete(`${endpoint}/${id}`)
  },

}
