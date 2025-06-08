<!--<template>-->
<!--  <div class="p-4">-->
<!--    <button @click="start" class="mb-4 bg-blue-500 text-white px-4 py-2 rounded">Start Draft</button>-->

<!--    <CardGrid-->
<!--        v-if="!isDraftOver"-->
<!--        :cards="currentGrid"-->
<!--        @confirmSelection="confirmSelection"-->
<!--    />-->

<!--    <div v-if="isDraftOver" class="mt-4">-->
<!--      <h2 class="text-xl font-bold mb-2">Your Drafted Cards:</h2>-->
<!--      <ul>-->
<!--        <li v-for="(card, index) in selectedCards" :key="index">{{card.sides.A.name}}</li>-->
<!--      </ul>-->
<!--    </div>-->
<!--  </div>-->
<!--</template>-->

<!--<script setup>-->
<!--import { useDraftStore } from '../store/index.js'-->
<!--import { storeToRefs } from 'pinia'-->
<!--import CardGrid from '../components/CardGrid.vue'-->

<!--const store = useDraftStore()-->
<!--const { currentGrid, selectedCards, isDraftOver } = storeToRefs(store)-->

<!--async function start() {-->
<!--  const rawCardDb = await fetch('https://raw.githubusercontent.com/seastan/dragncards/development-v1/frontend/src/features/plugins/lotrlcg/definitions/cardDb.json').then(res => res.json())-->
<!--  const heroCards = Object.values(rawCardDb).filter(card =>-->
<!--      card.sides?.A?.type === 'Hero'-->
<!--  )-->
<!--  let pool = heroCards.slice(0, 32)-->
<!--  console.log(pool)-->
<!--  store.startDraft(pool)-->
<!--}-->

<!--function confirmSelection(indices) {-->
<!--  store.confirmSelection(indices)-->
<!--}-->
<!--</script>-->

<!--<style scoped>-->

<!--</style>-->

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import CardGrid from '../components/CardGrid.vue'
import socket from '../socket'
import { useDraftStore } from '../store/index.js'

const lobbyId = ref('') // Could also generate or pass via route
const currentGrid = ref([])
const selectedIndices = ref([])
const draftComplete = ref(false)
const finalDrafts = ref({})

const store = useDraftStore()

onMounted(() => {

  socket.on('draftStarted', (data) => {
    console.log('draftStarted')
    console.log(data)
    lobbyId.value = data.lobbyId
    store.startDraft(data.pool)
    selectedIndices.value = []
  })

  socket.on('newGrid', (data) => {
    currentGrid.value = data.grid
    selectedIndices.value = []
  })

  socket.on('selectionConflict', (data) => {
    alert(data.message)
    selectedIndices.value = []
  })

  socket.on('initGrid', (grid) => {
    currentGrid.value = grid
  })

  socket.on('nextGrid', (grid) => {
    currentGrid.value = grid
    selectedIndices.value = []
  })

  socket.on('draftComplete', (drafts) => {
    draftComplete.value = true
    finalDrafts.value = drafts
  })
})

onUnmounted(() => {
  socket.off('initGrid')
  socket.off('nextGrid')
  socket.off('draftComplete')
})

function handleSelectionUpdate(indices) {
  selectedIndices.value = indices
}

function confirmSelection() {
  if (selectedIndices.value.length === 3) {
    socket.emit('confirmSelection', {
      lobbyId: localStorage.getItem('lobbyId'),
      selectedIndices: selectedIndices.value
    })
    store.confirmSelection(selectedIndices.value)
    selectedIndices.value = [] // Reset after confirmation
  }
}
</script>

<template>
  <div>
    <h2>Card Draft</h2>

    <CardGrid
        v-if="!draftComplete"
        :cards="currentGrid"
        :selectedIndices="selectedIndices"
        @updateSelection="handleSelectionUpdate"
        @confirmSelection="confirmSelection"
    />
<!--:disabled="selectedIndices.length !== 3"-->
<!--    <button @click="confirmSelection">-->
<!--      Confirm Selection-->
<!--    </button>-->

    <div v-if="draftComplete">
      <h3>Draft Complete</h3>
      <div v-for="(cards, playerId) in finalDrafts" :key="playerId">
        <h4>Player {{ playerId }}</h4>
        <ul>
          <li v-for="(card, index) in cards" :key="index">{{ card.sides?.A?.name }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>
