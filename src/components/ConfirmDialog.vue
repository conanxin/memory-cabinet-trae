<template>
  <div class="dialog-overlay" @click.self="$emit('cancel')">
    <div class="dialog card" role="alertdialog" :aria-label="title">
      <h3 class="dialog__title">{{ title }}</h3>
      <p class="dialog__message">{{ message }}</p>
      <div class="dialog__actions">
        <button class="btn btn-danger" @click="$emit('confirm')">确认删除</button>
        <button class="btn btn-secondary" @click="$emit('cancel')">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  message: string
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.dialog {
  max-width: 400px;
  width: 100%;
  padding: 24px;
  text-align: center;
}

.dialog__title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
}

.dialog__message {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.dialog__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
