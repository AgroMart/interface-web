<template>
  <v-card class="loading-card" elevation="2">
    <!-- Skeleton da imagem -->
    <v-skeleton-loader
      type="image"
      height="200"
    ></v-skeleton-loader>

    <!-- Skeleton do conteúdo -->
    <v-card-text class="pa-4">
      <v-skeleton-loader
        type="heading"
        class="mb-2"
      ></v-skeleton-loader>

      <v-skeleton-loader
        type="sentences"
        class="mb-3"
      ></v-skeleton-loader>

      <div class="d-flex align-center justify-space-between mb-3">
        <v-skeleton-loader
          type="text"
          width="80"
        ></v-skeleton-loader>

        <v-skeleton-loader
          type="chip"
          width="80"
        ></v-skeleton-loader>
      </div>

      <v-divider class="mb-2"></v-divider>
      
      <v-skeleton-loader
        type="text"
        width="120"
      ></v-skeleton-loader>
    </v-card-text>

    <!-- Skeleton das ações -->
    <v-card-actions class="pa-4 pt-0">
      <v-skeleton-loader
        type="button"
        width="100%"
      ></v-skeleton-loader>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'LoadingCard'
}
</script>

<style scoped>
.loading-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>

