import EmptyState from '@/components/EmptyState.vue';
import { mountWithVuetify } from '../helpers/mountWithVuetify';

describe('EmptyState.vue', () => {
  let wrapper;

  const mountEmpty = (props = {}) => {
    wrapper = mountWithVuetify(EmptyState, {
      props: { title: 'Nenhuma cesta', description: 'Crie sua primeira cesta', ...props },
    });
    return wrapper;
  };

  afterEach(() => {
    wrapper.unmount();
  });

  it('mostra título, descrição e o ícone padrão', () => {
    mountEmpty();

    expect(wrapper.find('h3').text()).toBe('Nenhuma cesta');
    expect(wrapper.find('p').text()).toBe('Crie sua primeira cesta');
    expect(wrapper.find('.v-icon').classes()).toContain('mdi-inbox-outline');
  });

  it('aceita um ícone personalizado', () => {
    mountEmpty({ icon: 'mdi-basket' });

    expect(wrapper.find('.v-icon').classes()).toContain('mdi-basket');
  });

  it('não mostra botão de ação quando não há texto de ação', () => {
    mountEmpty();

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('mostra o botão de ação e emite action ao clicar', async () => {
    mountEmpty({ actionText: 'Nova cesta' });

    const button = wrapper.find('button');
    expect(button.text()).toContain('Nova cesta');
    expect(button.html()).toContain('mdi-plus');

    await button.trigger('click');

    expect(wrapper.emitted('action')).toHaveLength(1);
  });

  it('aceita um ícone de ação personalizado', () => {
    mountEmpty({ actionText: 'Atualizar', actionIcon: 'mdi-refresh' });

    expect(wrapper.find('button').html()).toContain('mdi-refresh');
  });
});
