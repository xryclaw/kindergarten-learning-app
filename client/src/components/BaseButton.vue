<template>
  <button
    :class="[
      'btn',
      `btn--${type}`,
      `btn--${size}`,
      { 'btn--block': block }
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  block: Boolean,
  disabled: Boolean
})
defineEmits(['click'])
</script>

<style scoped>
.btn {
  border: none;
  border-radius: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:active:not(:disabled) {
  transform: scale(0.96);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--theme-primary);
  color: var(--text-white);
}

.btn--secondary {
  background: var(--theme-secondary);
  color: var(--text-primary);
}

.btn--game {
  background: var(--bg-secondary);
  border: 2px solid var(--border-light);
  color: var(--text-primary);
}

.btn--icon {
  background: var(--bg-secondary);
  border: 2px solid var(--border-light);
}

.btn--lg {
  min-height: var(--btn-height-lg);
  padding: 0 40px;
  font-size: var(--text-body);
}

.btn--md {
  min-height: var(--btn-height-md);
  padding: 0 32px;
  font-size: 1.1rem;
}

.btn--sm {
  min-height: var(--btn-height-sm);
  padding: 0 24px;
  font-size: var(--text-caption);
}

.btn--block {
  width: 100%;
}
</style>
