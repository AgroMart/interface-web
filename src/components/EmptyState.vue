<template>
  <div class="empty-state text-center pa-8">
    <v-icon
      :icon="icon"
      size="80"
      color="grey-lighten-1"
      class="mb-4"
    ></v-icon>
    
    <h3 class="text-h6 font-weight-bold mb-2 text-grey-darken-1">
      {{ title }}
    </h3>
    
    <p class="text-body-1 text-grey-darken-1 mb-4">
      {{ description }}
    </p>
    
    <v-btn
      v-if="actionText"
      color="primary"
      size="large"
      @click="$emit('action')"
    >
      <v-icon class="mr-2">{{ actionIcon }}</v-icon>
      {{ actionText }}
    </v-btn>
  </div>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    icon: {
      type: String,
      default: 'mdi-inbox-outline'
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    actionText: {
      type: String,
      default: null
    },
    actionIcon: {
      type: String,
      default: 'mdi-plus'
    }
  },
  emits: ['action']
}
</script>

<style scoped>
.empty-state {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>

