<template>
  <div
    :class="[
      'card',
      `card--${type}`,
      `card--padding-${padding}`,
      { 'card--clickable': clickable }
    ]"
    @click="clickable && $emit('click', $event)"
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'default' },
  padding: { type: String, default: 'md' },
  clickable: Boolean
})
defineEmits(['click'])
</script>

<style scoped>
.card {
  border-radius: 16px;
  transition: transform 0.15s ease;
}

.card--default {
  background: var(--bg-secondary);
  border: 2px solid var(--border-light);
}

.card--learning {
  background: #F0F9F5;
  border: 2px solid var(--theme-primary);
}

.card--game {
  background: #FFF8E7;
  border: 2px solid var(--theme-secondary);
}

.card--story {
  background: #FDF2ED;
  border: 2px solid var(--theme-accent);
}

.card--padding-lg {
  padding: 24px;
}

.card--padding-md {
  padding: 20px;
}

.card--padding-sm {
  padding: 16px;
}

.card--clickable {
  cursor: pointer;
}

.card--clickable:active {
  transform: scale(0.98);
}
</style>
