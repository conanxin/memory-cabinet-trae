<template>
  <div class="page-container">
    <h1 class="page-title">导入项目</h1>

    <div class="card import-area">
      <p class="import-desc">选择一个时光展柜导出的 JSON 文件，将作为新项目导入。不会覆盖已有项目。</p>

      <div class="file-input-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
        <p v-if="!selectedFile">点击选择文件或拖拽文件到此处</p>
        <p v-else>已选择：{{ selectedFile.name }}</p>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        accept=".json"
        style="display:none"
        @change="handleFileSelect"
      />

      <div v-if="importStatus === 'success'" class="import-success">
        <p>导入成功！</p>
        <router-link v-if="newProjectId" :to="{ name: 'project-detail', params: { projectId: newProjectId } }" class="btn btn-primary">
          查看项目
        </router-link>
      </div>

      <p v-if="importError" class="form-error" style="text-align:center;">{{ importError }}</p>

      <div v-if="importStatus !== 'success'" class="import-actions">
        <button
          class="btn btn-primary"
          :disabled="!selectedFile || importing"
          @click="handleImport"
        >
          {{ importing ? '导入中...' : '开始导入' }}
        </button>
        <router-link to="/projects" class="btn btn-secondary">返回</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { importExportService } from '@/services/import-export-service'

const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const importing = ref(false)
const importStatus = ref<'idle' | 'success'>('idle')
const importError = ref('')
const newProjectId = ref('')

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    selectedFile.value = input.files[0]
    importError.value = ''
  }
}

function handleDrop(event: DragEvent) {
  if (event.dataTransfer?.files?.[0]) {
    selectedFile.value = event.dataTransfer.files[0]
    importError.value = ''
  }
}

async function handleImport() {
  if (!selectedFile.value) return

  importing.value = true
  importError.value = ''
  importStatus.value = 'idle'

  const result = await importExportService.importProject(selectedFile.value)

  importing.value = false

  if (result.success && result.projectId) {
    importStatus.value = 'success'
    newProjectId.value = result.projectId
  } else {
    importError.value = result.error ?? '导入失败'
  }
}
</script>

<style scoped>
.import-area {
  text-align: center;
}

.import-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.file-input-area {
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  padding: 40px 20px;
  margin-bottom: 20px;
  cursor: pointer;
  transition: border-color 0.2s;
  color: var(--text-muted);
  font-size: 14px;
}

.file-input-area:hover {
  border-color: var(--accent);
}

.import-success {
  padding: 20px 0;
}

.import-success p {
  font-size: 16px;
  color: #2e7d32;
  margin-bottom: 12px;
}

.import-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
