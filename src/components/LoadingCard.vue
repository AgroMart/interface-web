<template>
  <v-card
    class="loading-card"
    elevation="2"
  >
    <!-- Skeleton da imagem -->
    <v-skeleton-loader
      type="image"
      height="200"
    />

    <!-- Skeleton do conteúdo -->
    <v-card-text class="pa-4">
      <v-skeleton-loader
        type="heading"
        class="mb-2"
      />

      <v-skeleton-loader
        type="sentences"
        class="mb-3"
      />

      <div class="d-flex align-center justify-space-between mb-3">
        <v-skeleton-loader
          type="text"
          width="80"
        />

        <v-skeleton-loader
          type="chip"
          width="80"
        />
      </div>

      <v-divider class="mb-2" />
      
      <v-skeleton-loader
        type="text"
        width="120"
      />
    </v-card-text>

    <!-- Skeleton das ações -->
    <v-card-actions class="pa-4 pt-0">
      <v-skeleton-loader
        type="button"
        width="100%"
      />
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'LoadingCard',
};
</script>

<style scoped>
.loading-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>

