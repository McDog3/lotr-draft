<template>
  <div
      class="card"
      @click="selectCard()"
      @mouseenter="onHover(card)"
      @mouseleave="onLeave"
  >
    <img :src="getCardImage(card)" :alt="card.sides.A.name" class="card-image" :class="{selected}" />
  </div>
</template>

<script setup>
defineProps({
  card: Object,
  selected: Boolean,
})

const emit = defineEmits(['select', 'hover', 'leave'])

function getCardImage(card) {
  return "https://dragncards-lotrlcg.s3.amazonaws.com/cards/English/" + card.cardid + ".jpg"
}

function selectCard() {
  emit('select')
}

function onHover(card) {
  emit('hover', getCardImage(card))
}

function onLeave() {
  emit('leave')
}
</script>

<style scoped>
.card {
  cursor: pointer;
  transition: transform 0.2s, outline 0.2s;
  border-radius: 4px;
  padding: 2px;
}

.card:hover {
  transform: scale(1.05);
}

.card-image {
  width: 150px;       /* or any fixed width */
  height: 190px;      /* set a fixed height to maintain consistent card shape */
  object-fit: contain;  /* or 'contain' if you prefer to show whole image */
  border-radius: 8px; /* optional: rounded corners for style */
  box-shadow: 0 2px 6px rgba(0,0,0,0.15); /* optional: subtle shadow */
}

.card.selected {
  border: 3px solid #009fc3;
  transform: scale(1.1);
}

.card-image.selected {
  border: 3px solid #009fc3;
  transform: scale(1.05);
}

</style>