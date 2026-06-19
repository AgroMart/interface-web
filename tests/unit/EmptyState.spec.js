import { mount } from '@vue/test-utils';
import EmptyState from '@/components/EmptyState.vue';

describe('EmptyState.vue', () => {
  it('renders properly', () => {
    const wrapper = mount(EmptyState);
    expect(wrapper.exists()).toBe(true);
  });
});

