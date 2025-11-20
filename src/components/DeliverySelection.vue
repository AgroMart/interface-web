<template>
  <v-card class="delivery-selection">
    <v-card-title class="text-h6 font-weight-bold">
      Opções de Entrega
    </v-card-title>

    <v-card-text class="pa-6">
      <v-radio-group v-model="deliveryType" label="Selecione o tipo de entrega" mandatory>
        <v-radio
          label="Ponto de Coleta (CSA)"
          value="csa"
          color="primary"
        ></v-radio>
        <v-radio
          label="Entrega em Residência"
          value="home"
          color="primary"
        ></v-radio>
      </v-radio-group>

      <v-divider class="my-4"></v-divider>

      <div v-if="deliveryType === 'csa'">
        <h3 class="text-subtitle-1 font-weight-bold mb-2">
          Ponto de Coleta (CSA)
        </h3>
        <p class="text-body-2 text-grey-darken-1 mb-3">
          Retire seu pedido no ponto de coleta previamente indicado.
        </p>
        <v-select
          v-model="selectedCsa"
          :items="csaOptions"
          label="Selecione o CSA"
          variant="outlined"
          density="comfortable"
          hide-details
          required
        ></v-select>
      </div>

      <div v-else-if="deliveryType === 'home'">
        <h3 class="text-subtitle-1 font-weight-bold mb-2">
          Entrega em Residência
        </h3>
        <p class="text-body-2 text-grey-darken-1 mb-3">
          Seu pedido será entregue no endereço cadastrado.
        </p>
        <v-text-field
          v-model="deliveryAddress"
          label="Endereço de Entrega"
          variant="outlined"
          density="comfortable"
          hide-details
          required
          disabled
        ></v-text-field>
      </div>

      <v-divider class="my-4"></v-divider>

      <h3 class="text-subtitle-1 font-weight-bold mb-2">
        Previsão de Entrega
      </h3>
      <v-alert
        type="info"
        variant="tonal"
        class="mb-0"
      >
        <v-icon class="mr-2">mdi-calendar-clock</v-icon>
        <strong>Previsão:</strong> {{ deliveryPredictionText }}
      </v-alert>
    </v-card-text>

    <v-card-actions class="pa-6 pt-0">
      <v-spacer></v-spacer>
      
      <v-btn
        variant="outlined"
        size="large"
        @click="$emit('cancel')"
      >
        Cancelar
      </v-btn>
      
      <v-btn
        color="primary"
        size="large"
        :disabled="!canProceed"
        @click="handleProceed"
      >
        Continuar
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
/* eslint-disable no-unused-vars */

import { ref, computed, watch } from 'vue'

export default {
  name: 'DeliverySelection',
  props: {
    // Endereço do usuário, mockado para demonstração
    userAddress: {
      type: String,
      default: 'Rua das Flores, 123 - Brasília/DF'
    }
  },
  emits: ['proceed', 'cancel'],
  setup(props, { emit }) {
    const deliveryType = ref('csa') // Padrão para CSA
    const selectedCsa = ref(null)
    const deliveryAddress = ref(props.userAddress)

    // Mock de opções de CSA
    const csaOptions = [
      { title: 'CSA Asa Norte - 905 Norte', value: 'csa_norte' },
      { title: 'CSA Asa Sul - 308 Sul', value: 'csa_sul' },
      { title: 'CSA Lago Sul - QI 15', value: 'csa_lago_sul' }
    ]

    // Definir o primeiro CSA como padrão
    if (csaOptions.length > 0) {
      selectedCsa.value = csaOptions[0].value
    }

    // Lógica de previsão de entrega (mockada)
    const getPredictionDate = (type) => {
      const today = new Date()
      const deliveryDate = new Date(today)
      
      if (type === 'csa') {
        // Entrega CSA: Próxima sexta-feira
        const dayOfWeek = today.getDay() // 0 = Domingo, 5 = Sexta
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7
        deliveryDate.setDate(today.getDate() + daysUntilFriday)
        return deliveryDate.toISOString()
      } else if (type === 'home') {
        // Entrega em Residência: Próxima quarta-feira
        const dayOfWeek = today.getDay() // 0 = Domingo, 3 = Quarta
        const daysUntilWednesday = (3 - dayOfWeek + 7) % 7
        deliveryDate.setDate(today.getDate() + daysUntilWednesday)
        return deliveryDate.toISOString()
      }
      return null
    }

    const deliveryPrediction = computed(() => getPredictionDate(deliveryType.value))

    const deliveryPredictionText = computed(() => {
      if (!deliveryPrediction.value) return 'Não disponível'
      
      const date = new Date(deliveryPrediction.value)
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      })
    })

    const canProceed = computed(() => {
      if (deliveryType.value === 'csa') {
        return !!selectedCsa.value
      } else if (deliveryType.value === 'home') {
        return !!deliveryAddress.value // Endereço já está preenchido pelo prop
      }
      return false
    })

    const handleProceed = () => {
      if (canProceed.value) {
        const result = {
          deliveryType: deliveryType.value,
          deliveryPrediction: deliveryPrediction.value,
          csa: deliveryType.value === 'csa' ? selectedCsa.value : null,
          address: deliveryType.value === 'home' ? deliveryAddress.value : null
        }
        emit('proceed', result)
      }
    }

    // Watcher para atualizar a previsão quando o tipo de entrega muda
    watch(deliveryType, (newType) => {
      // A previsão é recomputada automaticamente
    })

    return {
      deliveryType,
      selectedCsa,
      deliveryAddress,
      csaOptions,
      deliveryPredictionText,
      canProceed,
      handleProceed
    }
  }
}
</script>

<style scoped>
.delivery-selection {
  max-width: 100%;
}
</style>
