// Monta uma página completa: dentro de um v-app (exigido pelo layout padrão),
// com router em memória, Pinia e Vuetify reais.
import { h } from 'vue';
import { VApp } from 'vuetify/components';
import { mountWithVuetify, flushPromises } from './mountWithVuetify';
import { createTestRouter } from './testRouter';

// `config` repassa opções do app Vue, como um errorHandler para capturar
// erros de renderização em testes de caracterização.
export const mountPage = async (Page, { path = '/', pinia, props = {}, config } = {}) => {
  const router = createTestRouter();
  await router.push(path);
  const wrapper = mountWithVuetify(
    { render: () => h(VApp, () => h(Page, props)) },
    { global: { plugins: [router, pinia], ...(config && { config }) } },
  );
  await flushPromises();
  return { wrapper, router, page: wrapper.findComponent(Page) };
};

// Encontra um botão pelo texto visível
export const findButton = (wrapper, text) => wrapper.findAll('button').find((button) => button.text().includes(text));
