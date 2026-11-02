// Configuracao base para testes Vue 3
import { config } from '@vue/test-utils';

config.global.mocks = config.global.mocks || {};

// APIs de navegador usadas pelo Vuetify que o jsdom não implementa
global.ResizeObserver = global.ResizeObserver || class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.IntersectionObserver = global.IntersectionObserver || class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

global.CSS = global.CSS || { supports: () => false };

global.visualViewport = global.visualViewport || {
  width: 1024,
  height: 768,
  offsetLeft: 0,
  offsetTop: 0,
  scale: 1,
  addEventListener() {},
  removeEventListener() {},
};
