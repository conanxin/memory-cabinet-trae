<template>
  <div class="page-container">
    <div v-if="loading" class="empty-state">
      <p>加载中...</p>
    </div>

    <div v-else-if="!project || !interview" class="empty-state">
      <p>{{ !project ? '项目不存在' : '访谈不存在' }}</p>
      <router-link :to="'/projects'" class="btn btn-secondary">返回项目列表</router-link>
    </div>

    <template v-else>
      <nav class="breadcrumb">
        <router-link :to="'/projects'">项目列表</router-link>
        <span>/</span>
        <router-link :to="projectLink">{{ project.title }}</router-link>
        <span>/</span>
        <span>访谈详情</span>
      </nav>

      <div class="page-header">
        <h1 class="page-title">{{ interview.title }}</h1>
        <button class="btn btn-danger" @click="showDeleteConfirm = true">删除本次访谈</button>
      </div>

      <section class="card info-section">
        <h2 class="section-title">时间信息</h2>
        <div class="info-row">
          <span class="info-label">创建时间</span>
          <span class="info-value">{{ formatDate(interview.createdAt) }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">最近更新</span>
          <span class="info-value">{{ formatDate(interview.updatedAt) }}</span>
        </div>
      </section>

      <form class="card form-card" @submit.prevent="handleSave">
        <div class="form-group">
          <label class="form-label">访谈标题 <span class="form-required">*</span></label>
          <input id="interview-title" v-model="form.title" type="text" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label">访谈日期 <span class="form-required">*</span></label>
          <input v-model="form.interviewDate" type="datetime-local" class="form-input" required />
        </div>

        <div class="form-group">
          <label class="form-label">地点</label>
          <input id="interview-location" v-model="form.location" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label">采访者</label>
          <input id="interview-interviewer" v-model="form.interviewerName" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label">原始口述文字</label>
          <textarea id="interview-original-text" v-model="form.originalText" class="form-textarea" rows="10"></textarea>
        </div>

        <div class="form-group">
          <label class="form-label">备注</label>
          <textarea id="interview-notes" v-model="form.notes" class="form-textarea" rows="4"></textarea>
        </div>

        <div class="form-actions">
          <router-link :to="projectLink" class="btn btn-secondary">返回项目</router-link>
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? '保存中...' : '保存修改' }}
          </button>
        </div>
      </form>

      <ConfirmDialog
        v-if="showDeleteConfirm"
        title="删除本次访谈"
        message="确定要删除本次访谈吗？删除后无法恢复。"
        @confirm="handleDelete"
        @cancel="showDeleteConfirm = false"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { projectService } from '@/services/project-service'
import { interviewSessionService } from '@/services/interview-session-service'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import type { Project } from '@/models/project'
import type { InterviewSession } from '@/models/interview-session'

const props = defineProps<{ projectId: string; interviewId: string }>()
const router = useRouter()
const route = useRoute()

const loading = ref(true)
const saving = ref(false)
const showDeleteConfirm = ref(false)
const project = ref<Project | null>(null)
const interview = ref<InterviewSession | null>(null)

const projectLink = computed(() => ({ name: 'project-detail' as const, params: { projectId: props.projectId } }))

const form = ref({
  title: '',
  interviewDate: '',
  location: '',
  interviewerName: '',
  originalText: '',
  notes: '',
})

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 16)
}

onMounted(async () => {
  const pid = props.projectId || (route.params.projectId as string)
  const iid = props.interviewId || (route.params.interviewId as string)
  const detail = await projectService.getProjectDetail(pid)
  if (detail) project.value = detail.project
  interview.value = await interviewSessionService.getInterview(iid)
  if (interview.value) {
    form.value.title = interview.value.title
    form.value.interviewDate = toLocalInput(interview.value.interviewDate)
    form.value.location = interview.value.location
    form.value.interviewerName = interview.value.interviewerName
    form.value.originalText = interview.value.originalText
    form.value.notes = interview.value.notes
  }
  loading.value = false
})

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

async function handleSave() {
  if (!interview.value) return
  saving.value = true
  try {
    const interviewDate = new Date(form.value.interviewDate).toISOString()
    await interviewSessionService.updateInterview(interview.value.id, {
      title: form.value.title,
      interviewDate,
      location: form.value.location,
      interviewerName: form.value.interviewerName,
      originalText: form.value.originalText,
      notes: form.value.notes,
    })
    router.push({ name: 'project-detail', params: { projectId: props.projectId } })
  } catch {
    alert('保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!interview.value) return
  try {
    await interviewSessionService.deleteInterview(interview.value.id)
    router.push({ name: 'project-detail', params: { projectId: props.projectId } })
  } catch {
    alert('删除失败')
  }
}
</script>

<style scoped>
.breadcrumb {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 12px;
}
.breadcrumb a { color: var(--text-muted); }
.breadcrumb span { margin: 0 6px; }

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 12px;
}

.info-section { margin-bottom: 16px; }
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.info-row:last-child { border-bottom: none; }
.info-label {
  font-size: 14px;
  color: var(--text-muted);
  flex-shrink: 0;
  margin-right: 12px;
}
.info-value {
  font-size: 14px;
  color: var(--text-primary);
  text-align: right;
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
.form-required { color: #d32f2f; }
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