// Router em memória com páginas vazias, para testar componentes que dependem
// da rota atual sem carregar as páginas reais da aplicação.
import { h } from 'vue';
import { createRouter, createMemoryHistory } from 'vue-router';

const page = (name) => ({ name, render: () => h('div', { class: 'test-page' }, name) });

export const createTestRouter = () => createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/login', name: 'Login', component: page('Login'), meta: { title: 'Login' } },
    { path: '/', name: 'Home', component: page('Home'), meta: { title: 'Início' } },
    { path: '/produtos', name: 'Produtos', component: page('Produtos'), meta: { title: 'Meus Produtos' } },
    { path: '/cestas', name: 'Cestas', component: page('Cestas'), meta: { title: 'Cestas' } },
    { path: '/pedidos', name: 'Pedidos', component: page('Pedidos'), meta: { title: 'Pedidos' } },
    { path: '/loja', name: 'Loja', component: page('Loja'), meta: { title: 'Minha Loja' } },
    { path: '/perfil', name: 'Perfil', component: page('Perfil'), meta: { title: 'Meu Perfil' } },
    { path: '/sem-titulo', name: 'SemTitulo', component: page('SemTitulo') },
  ],
});
