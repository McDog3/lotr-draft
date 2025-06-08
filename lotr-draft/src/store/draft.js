// stores/draft.js
import { defineStore } from 'pinia'

export const useDraftStore = defineStore('draft', {
    state: () => ({
        grid: [],
        selectedCards: []
    })
})
