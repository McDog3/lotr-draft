<template>
  <div v-if="previewImage" class="preview-box">
    <img :src="previewImage" alt="Preview" />
  </div>
  <div class="card-grid">
    <Card
        v-for="(card, index) in cards"
        :key="index"
        :card="card"
        :index="index"
        :selected="selectedIndices.includes(index)"
        @select="toggleSelection(index)"
        @hover="setPreview"
        @leave="clearPreview"

    />
  </div>
  <button :hidden="selectedIndices.length < 3" @click="confirmSelection" class="mb-4 bg-blue-500 text-white px-4 py-2 rounded">Confirm</button>
</template>

<script setup>
import Card from './Card.vue'
import { ref, watch } from 'vue'

const props = defineProps({
  cards: Array,   // Array of 16 cards for grid
  selectedIndices: Array,
})

const emit = defineEmits(['updateSelection', 'confirmSelection'])

const selectedIndices = ref([])

function isOrthogonallyAdjacent(index) {
  return selectedIndices.value.some(selIndex => {
    // Calculate row/col of current and selected card
    const row1 = Math.floor(index / 4)
    const col1 = index % 4
    const row2 = Math.floor(selIndex / 4)
    const col2 = selIndex % 4

    // Orthogonal adjacency means difference of 1 in row or col but not both
    return (
        (row1 === row2 && Math.abs(col1 - col2) === 1) ||
        (col1 === col2 && Math.abs(row1 - row2) === 1)
    )
  })
}

// Validate the selection
function isSameRowOrCol(index) {
  let selOne = selectedIndices.value[0]
  let selTwo = selectedIndices.value[1]

  // Calculate row/col of all selected cards
  const row1 = Math.floor(index / 4)
  const col1 = index % 4
  const row2 = Math.floor(selOne / 4)
  const col2 = selOne % 4
  const row3 = Math.floor(selTwo / 4)
  const col3 = selTwo % 4

  let allSameRow = (row1 === row2 && row1 === row3)
  let allSameCol = (col1 === col2 && col1 === col3)

  return allSameRow || allSameCol
}

function toggleSelection(index) {
  if (selectedIndices.value.includes(index)) {
    // Deselect
    selectedIndices.value = selectedIndices.value.filter(card => card !== index)
  } else {
    if (selectedIndices.value.length === 0) {
      selectedIndices.value.push(index)
    } else if (selectedIndices.value.length === 1 && isOrthogonallyAdjacent(index)) {
      selectedIndices.value.push(index)
    } else if (selectedIndices.value.length === 2 && isSameRowOrCol(index)) {
      selectedIndices.value.push(index)
    } else {
      // Not adjacent or max picks reached
      return
    }
  }
  emit('updateSelection', selectedIndices.value)
}

function confirmSelection() {
  if (selectedIndices.value.length === 3) {
    emit('confirmSelection', selectedIndices.value)
    selectedIndices.value = [] // Reset after confirmation
  } else {
    console.warn("You must select exactly 3 cards that are orthogonally adjacent.")
  }
}

const previewImage = ref(null)

function setPreview(imageUrl) {
  previewImage.value = imageUrl
}

function clearPreview() {
  previewImage.value = null
}

</script>

<style scoped>
.card-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.preview-box {
  position: fixed;
  top: 1rem;
  right: 1rem;
  width: 350px; /* Increase size here */
  height: auto;
  z-index: 1000;
  border: 3px solid #333;
  background: white;
  padding: 0.75rem;
  box-shadow: 0 0 15px rgba(0,0,0,0.4);
  border-radius: 8px;
}

.preview-box img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 4px;
}

</style>