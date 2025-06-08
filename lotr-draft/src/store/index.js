import { createPinia ,defineStore } from 'pinia'
import { ref, computed } from 'vue'

const pinia = createPinia()
export default pinia

export const useDraftStore = defineStore('draft', () => {
    const originalPool = ref([]) // Original card data
    const pool = ref([])         // Flattened and shuffled
    const currentGrid = ref([])
    const selectedCards = ref([])

    const isDraftOver = computed(() => pool.value.length === 0 && currentGrid.value.length === 0)

    function startDraft(cardData) {
        originalPool.value = cardData
        pool.value = shuffle(cardData)
        selectedCards.value = []
        nextGrid()
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[array[i], array[j]] = [array[j], array[i]]
        }
        return array
    }

    function nextGrid() {
        currentGrid.value = pool.value.splice(0, 16)
    }

    function confirmSelection(selectedIndices) {
        selectedIndices.forEach(i => {
            const card = currentGrid.value[i]
            if (card) selectedCards.value.push(card)
        })
        currentGrid.value = []
        if (pool.value.length > 0) nextGrid()
    }

    return {
        originalPool,
        pool,
        currentGrid,
        selectedCards,
        isDraftOver,
        startDraft,
        nextGrid,
        confirmSelection
    }
})