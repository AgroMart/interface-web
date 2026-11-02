// Monta componentes com o Vuetify real, para que formulários, validações
// e eventos dos componentes da biblioteca funcionem como na aplicação.
import { mount } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

export const mountWithVuetify = (component, options = {}) => {
  const vuetify = createVuetify({ components, directives });
  const { global = {}, ...rest } = options;

  return mount(component, {
    attachTo: document.body,
    ...rest,
    global: {
      ...global,
      plugins: [vuetify, ...(global.plugins || [])],
    },
  });
};

export const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

// Substitui o FileReader por uma versão síncrona, para que a pré-visualização
// não dependa do tempo de leitura do arquivo.
export const mockFileReader = () => jest.spyOn(global, 'FileReader').mockImplementation(function FakeFileReader() {
  this.readAsDataURL = (file) => {
    this.onload({ target: { result: `data:${file.type};base64,${file.name}` } });
  };
});
