const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

const rooms = {}

const lobbies = {} // Structure: { [lobbyId]: { players, draftPool, currentGrid, selections } }

const CARD_DATA_URL = 'https://raw.githubusercontent.com/seastan/dragncards/development-v1/frontend/src/features/plugins/lotrlcg/definitions/cardDb.json'

// Utility to shuffle an array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
}

async function loadCardPool() {
    const res = await fetch(CARD_DATA_URL)
    const data = await res.json()
    const cards = Object.values(data)
        .filter(card => card.sides?.A?.type === 'Hero') // Filter as needed
        .flatMap(card => {
            const quantity = parseInt(card.cardquantity || 1)
            return Array.from({ length: quantity }, () => card)
        })

    return shuffle(cards).slice(0, 16)
}

io.on('connection', (socket) => {
    console.log('✅ User connected:', socket.id)

    socket.on('joinRoom', async (roomId) => {
        socket.join(roomId)

        // Initialize room if it doesn't exist
        if (!rooms[roomId]) {
            const pool = await loadCardPool()

            rooms[roomId] = {
                players: [],
                cardPool: pool,
                currentGrid: pool.splice(0, 16),
                selections: {},
                drafted: {} // { socketId: [cards] }
            }
        }

        const room = rooms[roomId]
        room.players.push(socket.id)
        room.drafted[socket.id] = []

        // Send current grid to new player
        socket.emit('initGrid', room.currentGrid)
        io.to(roomId).emit('playerJoined', room.players)
    })

    socket.on('submitSelection', ({ roomId, selectedIndices }) => {
        const room = rooms[roomId]
        if (!room) return

        const selectedCards = selectedIndices.map(i => room.currentGrid[i])
        room.drafted[socket.id].push(...selectedCards)

        // Mark this player as done
        room.selections[socket.id] = true

        // When all players are done, proceed to next grid
        const allDone = room.players.every(pid => room.selections[pid])
        if (allDone) {
            room.currentGrid = room.cardPool.splice(0, 16)
            room.selections = {}
            io.to(roomId).emit('nextGrid', room.currentGrid)

            // If no more cards, end draft
            if (room.currentGrid.length === 0) {
                io.to(roomId).emit('draftComplete', room.drafted)
            }
        }
    })

    // socket.on('disconnect', () => {
    //     console.log('🚫 User disconnected:', socket.id)
    //     for (const [roomId, room] of Object.entries(rooms)) {
    //         room.players = room.players.filter(id => id !== socket.id)
    //         delete room.drafted[socket.id]
    //         delete room.selections[socket.id]
    //         io.to(roomId).emit('playerLeft', socket.id)
    //
    //         // Optionally delete room if empty
    //         if (room.players.length === 0) {
    //             delete rooms[roomId]
    //         }
    //     }
    // })

    socket.on('createLobby', () => {
        const lobbyId = Math.random().toString(36).substring(2, 7).toUpperCase()
        lobbies[lobbyId] = {
            host: socket.id,
            players: [{ id: socket.id, name: `Player-${lobbyId}` }]
        }
        socket.join(lobbyId)
        socket.emit('lobbyCreated', lobbyId)
        io.to(lobbyId).emit('lobbyUpdated', { players: lobbies[lobbyId].players })
    })

    socket.on('joinLobby', (lobbyId) => {
        const lobby = lobbies[lobbyId]
        if (lobby) {
            const player = { id: socket.id, name: `Player-${socket.id.slice(0, 5)}` }
            lobby.players.push(player)
            socket.join(lobbyId)
            socket.emit('joinedLobby', { lobbyId, players: lobby.players })
            io.to(lobbyId).emit('lobbyUpdated', { players: lobby.players })
        } else {
            socket.emit('error', 'Lobby not found')
        }
    })

    socket.on('startDraft', (lobbyId) => {
        loadCardPool().then(pool => {
            let currentGrid = pool.slice(0, 16)

            lobbies[lobbyId].draftPool = pool
            lobbies[lobbyId].currentGrid = currentGrid
            lobbies[lobbyId].selections = {}

            io.to(lobbyId).emit('draftStarted', {pool: pool, lobbyId: lobbyId})
        })
    })

    socket.on('confirmSelection', ({ lobbyId, selectedCardIds }) => {
        console.log('confirming selection server side:' + selectedCardIds)
        const lobby = lobbies[lobbyId]
        if (!lobby) return

        // Save player selection
        lobby.selections[socket.id] = selectedCardIds

        // Wait until all players have submitted
        const allSubmitted = lobby.players.every(p => lobby.selections[p.id])

        if (allSubmitted) {
            // Flatten all selected cards and check for overlap
            const allSelections = Object.values(lobby.selections).flat()
            const uniqueSet = new Set(allSelections)

            if (uniqueSet.size !== allSelections.length) {
                // Conflict detected
                lobby.selections = {}
                io.to(lobbyId).emit('selectionConflict', { message: 'Selection conflict. Please try again.' })
            } else {
                // Valid selection → save picks
                for (const [playerId, picks] of Object.entries(lobby.selections)) {
                    const player = lobby.players.find(p => p.id === playerId)
                    if (!player.selections) player.selections = []
                    player.selections.push(...lobby.currentGrid.filter(c => picks.includes(c.id)))
                }

                // Remove picked cards from pool
                lobby.draftPool = lobby.draftPool.filter(c => !uniqueSet.has(c.id))

                // Generate next grid
                if (lobby.draftPool.length === 0) {
                    lobby.players.forEach(p => {
                        io.to(p.id).emit('draftComplete', { selected: p.selections })
                    })
                } else {
                    const newGrid = lobby.draftPool.splice(0, 16)
                    lobby.currentGrid = newGrid
                    lobby.selections = {}
                    io.to(lobbyId).emit('newGrid', { grid: newGrid })
                }
            }
        }
    })

    socket.on('disconnect', () => {
        for (const [lobbyId, lobby] of Object.entries(lobbies)) {
            const index = lobby.players.findIndex(p => p.id === socket.id)
            if (index !== -1) {
                lobby.players.splice(index, 1)
                io.to(lobbyId).emit('lobbyUpdated', { players: lobby.players })
            }
        }
    })
})

server.listen(3000, () => {
    console.log('🚀 Socket.IO server running at http://localhost:3000')
})
