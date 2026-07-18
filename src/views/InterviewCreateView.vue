<template>
  <div class="page-container">
    <div v-if="loading" class="empty-state">
      <p>加载中...</p>
    </div>

    <div v-else-if="!project" class="empty-state">
      <p>项目不存在</p>
      <router-link :to="'/projects'" class="btn btn-secondary">返回项目列表</router-link>
    </div>

    <template v-else>
      <nav class="breadcrumb">
        <router-link :to="'/projects'">项目列表</router-link>
        <span>/</span>
        <router-link :to="projectLink">{{ project.title }}</router-link>
        <span>/</span>
        <span>新增访谈</span>
      </nav>

      <h1 class="page-title">新增访谈</h1>

      <div class="storage-warning card">
        <p>本次访谈内容只保存在此浏览器的本地存储中。清理浏览器数据可能导致内容丢失，请定期导出备份。</p>
      </div>

      <section class="card info-section">
        <h2 class="section-title">所属项目</h2>
        <p class="info-value">{{ project.title }}</p>
      </section>

      <form class="card form-card" @submit.prevent="handleSave">
        <div class="form-group">
          <label class="form-label">访谈标题 <span class="form-required">*</span></label>
          <input
            v-model="form.title"
            type="text"
            class="form-input"
            placeholder="例如：第一次访谈"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">访谈日期 <span class="form-required">*</span></label>
          <input
            v-model="form.interviewDate"
            type="datetime-local"
            class="form-input"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label">地点</label>
          <input
            v-model="form.location"
            type="text"
            class="form-input"
            placeholder="例如：家中"
          />
        </div>

        <div class="form-group">
          <label class="form-label">采访者</label>
          <input
            v-model="form.interviewerName"
            type="text"
            class="form-input"
            placeholder="例如：访谈者姓名"
          />
        </div>

        <div class="form-group">
          <label class="form-label">原始口述文字</label>
          <textarea
            v-model="form.originalText"
            class="form-textarea"
            rows="8"
            placeholder="输入本次访谈的原始口述内容..."
          ></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">备注</label>
          <textarea
            v-model="form.notes"
            class="form-textarea"
            rows="4"
            placeholder="采访者备注或其他说明..."
          ></textarea>
        </div>

        <div class="form-actions">
          <router-link :to="projectLink" class="btn btn-secondary">返回项目</router-link>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存访谈' }}
          </button>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { projectService } from '@/services/project-service'
import { interviewSessionService } from '@/services/interview-session-service'
import type { Project } from '@/models/project'

const props = defineProps<{ projectId: string }>()
const router = useRouter()
const route = useRoute()

const loading = ref(true)
const saving = ref(false)
const project = ref<Project | null>(null)

const projectLink = computed(() => ({ name: 'project-detail' as const, params: { projectId: props.projectId } }))

const form = ref({
  title: '',
  interviewDate: '',
  location: '',
  interviewerName: '',
  originalText: '',
  notes: '',
})

onMounted(async () => {
  const pid = props.projectId || (route.params.projectId as string)
  const detail = await projectService.getProjectDetail(pid)
  if (detail) {
    project.value = detail.project
    // Set default title: 第N次访谈
    const count = await interviewSessionService.countInterviews(pid)
    form.value.title = `第${count + 1}次访谈`
    // Set default date to now
    const now = new Date()
    const tzOffset = now.getTimezoneOffset() * 60000
    form.value.interviewDate = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16)
  }
  loading.value = false
})

async function handleSave() {
  if (!project.value) return
  saving.value = true
  try {
    const pid = project.value.id
    const interviewDate = new Date(form.value.interviewDate).toISOString()
    const session = await interviewSessionService.createInterview({
      projectId: pid,
      title: form.value.title,
      interviewDate,
      location: form.value.location,
      interviewerName: form.value.interviewerName,
      originalText: form.value.originalText,
      notes: form.value.notes,
    })
    router.push({ name: 'project-detail', params: { projectId: pid } })
  } catch {
    alert('保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.breadcrumb {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.breadcrumb a {
  color: var(--text-muted);
}

.breadcrumb span {
  margin: 0 6px;
}

.storage-warning {
  background-color: #fff8e1;
  border-color: #ffecb3;
  margin-bottom: 16px;
}

.storage-warning p {
  font-size: 13px;
  color: #f57f17;
  line-height: 1.5;
}

.info-section {
  margin-bottom: 16px;
}

.info-value {
  font-size: 14px;
  color: var(--text-primary);
}

.form-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}

.form-required {
  color: #d32f2f;
}

.form-input,
.form-textarea {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-primary);
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--accent, #1976d2);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
}
</style>