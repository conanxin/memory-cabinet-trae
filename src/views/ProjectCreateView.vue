<template>
  <div class="page-container">
    <h1 class="page-title">新建项目</h1>

    <form @submit.prevent="handleSubmit" class="create-form">
      <!-- Project Info -->
      <section class="card form-section">
        <h2 class="section-title">项目信息</h2>
        <div class="form-group">
          <label class="form-label" for="project-title">项目名称 *</label>
          <input
            id="project-title"
            v-model="form.projectTitle"
            class="form-input"
            type="text"
            placeholder="例如：外婆的裁缝岁月"
            maxlength="50"
            required
          />
          <p v-if="titleError" class="form-error">{{ titleError }}</p>
        </div>
        <div class="form-group">
          <label class="form-label" for="project-desc">项目说明</label>
          <textarea
            id="project-desc"
            v-model="form.projectDescription"
            class="form-textarea"
            placeholder="简要描述这个口述史项目的背景和目标"
            maxlength="200"
          ></textarea>
        </div>
      </section>

      <!-- Narrator Info -->
      <section class="card form-section">
        <h2 class="section-title">主要讲述者</h2>
        <div class="form-group">
          <label class="form-label" for="narrator-name">姓名 *</label>
          <input
            id="narrator-name"
            v-model="form.narratorName"
            class="form-input"
            type="text"
            placeholder="讲述者的姓名"
            maxlength="20"
            required
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="narrator-rel">与采访者的关系</label>
          <input
            id="narrator-rel"
            v-model="form.narratorRelationship"
            class="form-input"
            type="text"
            placeholder="例如：外婆、父亲"
            maxlength="20"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="narrator-year">出生年份</label>
          <input
            id="narrator-year"
            v-model.number="birthYearInput"
            class="form-input"
            type="number"
            placeholder="例如：1928"
            min="1800"
            max="2020"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="narrator-notes">备注</label>
          <textarea
            id="narrator-notes"
            v-model="form.narratorNotes"
            class="form-textarea"
            placeholder="关于讲述者的其他信息"
            maxlength="200"
          ></textarea>
        </div>
      </section>

      <!-- Consent (inlined) -->
      <section class="card form-section">
        <h2 class="section-title">同意记录</h2>
        <div class="toggle-group">
          <input type="checkbox" id="consent-record" v-model="consentToRecord" />
          <label for="consent-record">同意被记录</label>
        </div>
        <div class="toggle-group">
          <input type="checkbox" id="consent-quotes" v-model="consentToStoreQuotes" />
          <label for="consent-quotes">同意保存原话</label>
        </div>
        <div class="toggle-group">
          <input type="checkbox" id="consent-photos" v-model="consentToStorePhotos" />
          <label for="consent-photos">同意保存照片</label>
        </div>
        <div class="toggle-group">
          <input type="checkbox" id="consent-family" v-model="consentToFamilyView" />
          <label for="consent-family">允许家庭查看</label>
        </div>
        <div class="toggle-group">
          <input type="checkbox" id="consent-public" v-model="consentToPublicDisplay" />
          <label for="consent-public">允许公开展示</label>
        </div>

        <div class="form-group" style="margin-top: 16px;">
          <label class="form-label" for="consent-method">确认方式</label>
          <input
            id="consent-method"
            v-model="confirmationMethod"
            class="form-input"
            type="text"
            placeholder="例如：当面口头同意"
            maxlength="50"
          />
        </div>
        <div class="form-group">
          <label class="form-label" for="consent-notes">备注</label>
          <textarea
            id="consent-notes"
            v-model="consentNotes"
            class="form-textarea"
            placeholder="同意相关的补充说明"
            maxlength="200"
          ></textarea>
        </div>
      </section>

      <!-- Submit -->
      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          {{ submitting ? '创建中...' : '创建项目' }}
        </button>
        <router-link to="/projects" class="btn btn-secondary">取消</router-link>
      </div>

      <p v-if="submitError" class="form-error" style="text-align:center;">{{ submitError }}</p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { projectService } from '@/services/project-service'

const router = useRouter()
const submitting = ref(false)
const titleError = ref('')
const submitError = ref('')

const birthYearInput = ref<number | string>('')

const form = ref({
  projectTitle: '',
  projectDescription: '',
  narratorName: '',
  narratorRelationship: '',
  narratorNotes: '',
})

// Consent as individual refs to avoid nested reactivity issues
const consentToRecord = ref(false)
const consentToStoreQuotes = ref(false)
const consentToStorePhotos = ref(false)
const consentToFamilyView = ref(false)
const consentToPublicDisplay = ref(false)
const confirmationMethod = ref('')
const consentNotes = ref('')

async function handleSubmit() {
  titleError.value = ''
  submitError.value = ''

  if (!form.value.projectTitle.trim()) {
    titleError.value = '请输入项目名称'
    return
  }

  if (!form.value.narratorName.trim()) {
    submitError.value = '请输入讲述者姓名'
    return
  }

  submitting.value = true
  try {
    const exists = await projectService.projectTitleExists(form.value.projectTitle.trim())
    if (exists) {
      titleError.value = '已存在同名项目'
      submitting.value = false
      return
    }

    const birthYear = typeof birthYearInput.value === 'number' ? birthYearInput.value : null

    const result = await projectService.createProject({
      projectTitle: form.value.projectTitle.trim(),
      projectDescription: form.value.projectDescription.trim(),
      narratorName: form.value.narratorName.trim(),
      narratorRelationship: form.value.narratorRelationship.trim(),
      narratorBirthYear: birthYear,
      narratorNotes: form.value.narratorNotes.trim(),
      consent: {
        consentToRecord: consentToRecord.value,
        consentToStoreQuotes: consentToStoreQuotes.value,
        consentToStorePhotos: consentToStorePhotos.value,
        consentToFamilyView: consentToFamilyView.value,
        consentToPublicDisplay: consentToPublicDisplay.value,
        confirmedAt: new Date().toISOString(),
        confirmationMethod: confirmationMethod.value,
        notes: consentNotes.value,
      },
    })

    router.push({ name: 'project-detail', params: { projectId: result.project.id } })
  } catch (_e) {
    submitError.value = '创建失败，请重试。'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.create-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  padding: 24px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 8px 0;
}
</style>
