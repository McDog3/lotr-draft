<template>
  <div class="lobby">
    <h1>Lobby</h1>

    <div v-if="!joined">
      <input v-model="lobbyIdInput" placeholder="Lobby Code" />
      <button @click="joinLobby">Join Lobby</button>
      <button @click="createLobby">Create New Lobby</button>
    </div>

    <div v-else>
      <h2>Lobby Code: {{ lobbyId }}</h2>
      <h3>Players:</h3>
      <ul>
        <li v-for="(player, index) in players" :key="index">{{ player.name }}</li>
      </ul>
      <button @click="startDraft" v-if="isHost">Start Draft</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { io } from 'socket.io-client'
import { useRouter } from 'vue-router'
const router = useRouter()

const socket = io('http://localhost:3000') // adjust if different

const lobbyIdInput = ref('')
const lobbyId = ref('')
const players = ref([])
const joined = ref(false)
const isHost = ref(false)

socket.on('draftStarted', (data) => {
  // Save initial grid to localStorage or use Pinia
  localStorage.setItem('draftGrid', JSON.stringify(data.grid))

  // Navigate to draft screen
  router.push('/draft')
})

function createLobby() {
  console.log('creating lobby')
  socket.emit('createLobby')
}

function joinLobby() {
  socket.emit('joinLobby', lobbyIdInput.value)
}

function startDraft() {
  socket.emit('startDraft', lobbyId.value)
}

socket.on('lobbyCreated', (id) => {
  lobbyId.value = id
  joined.value = true
  isHost.value = true
  socket.emit('joinLobby', { lobbyId: lobbyId.value })
})

socket.on('joinedLobby', (data) => {
  lobbyId.value = data.lobbyId
  players.value = data.players
  joined.value = true
})

socket.on('lobbyUpdated', (data) => {
  players.value = data.players
})
</script>
