import LoadingCard from '@/components/LoadingCard.vue';
import { mountWithVuetify } from '../helpers/mountWithVuetify';

describe('LoadingCard.vue', () => {
  it('mostra o esqueleto de um card enquanto os dados carregam', () => {
    const wrapper = mountWithVuetify(LoadingCard);

    expect(wrapper.find('.loading-card').exists()).toBe(true);
    expect(wrapper.findAll('.v-skeleton-loader')).toHaveLength(7);
    expect(wrapper.find('.v-card-actions .v-skeleton-loader').exists()).toBe(true);

    wrapper.unmount();
  });
});
