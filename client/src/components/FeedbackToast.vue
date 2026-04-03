<template>
  <Transition name="feedback">
    <div v-if="show" :class="['feedback', `feedback--${type}`]">
      <span class="feedback-icon">{{ icon }}</span>
      <span class="feedback-text">{{ message }}</span>
      <button v-if="showNextButton" class="feedback-next" @click="$emit('next')">
        {{ nextText }}
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: Boolean,
  type: { type: String, default: 'success' },
  message: String,
  showNextButton: Boolean,
  nextText: { type: String, default: '下一步' }
})

const icon = computed(() => {
  if (props.type === 'success') return '🎉'
  if (props.type === 'error') return '💪'
  return '💡'
})

defineEmits(['next'])
</script>

<style scoped>
.feedback {
  padding: 16px 32px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-size: var(--text-h3);
  font-weight: 600;
  text-align: center;
  animation: feedbackPop 0.4s ease;
}

.feedback--success {
  background: var(--state-success);
  color: var(--text-white);
}

.feedback--error {
  background: var(--state-warning);
  color: var(--text-primary);
}

.feedback--info {
  background: var(--theme-primary);
  color: var(--text-white);
}

.feedback-icon {
  font-size: 2rem;
}

.feedback-next {
  margin-top: 8px;
  padding: 10px 28px;
  border: none;
  border-radius: 12px;
  background: rgba(255,255,255,0.9);
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}

.feedback-next:active {
  transform: scale(0.96);
}

@keyframes feedbackPop {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}

.feedback-enter-active,
.feedback-leave-active {
  transition: all 0.3s ease;
}

.feedback-enter-from,
.feedback-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
