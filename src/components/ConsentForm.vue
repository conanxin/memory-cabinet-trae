<template>
  <section class="card form-section">
    <h2 class="section-title">同意记录</h2>
    <div class="toggle-group">
      <input type="checkbox" id="consent-record" :checked="consent.consentToRecord" @change="update('consentToRecord', ($event.target as HTMLInputElement).checked)" />
      <label for="consent-record">同意被记录</label>
    </div>
    <div class="toggle-group">
      <input type="checkbox" id="consent-quotes" :checked="consent.consentToStoreQuotes" @change="update('consentToStoreQuotes', ($event.target as HTMLInputElement).checked)" />
      <label for="consent-quotes">同意保存原话</label>
    </div>
    <div class="toggle-group">
      <input type="checkbox" id="consent-photos" :checked="consent.consentToStorePhotos" @change="update('consentToStorePhotos', ($event.target as HTMLInputElement).checked)" />
      <label for="consent-photos">同意保存照片</label>
    </div>
    <div class="toggle-group">
      <input type="checkbox" id="consent-family" :checked="consent.consentToFamilyView" @change="update('consentToFamilyView', ($event.target as HTMLInputElement).checked)" />
      <label for="consent-family">允许家庭查看</label>
    </div>
    <div class="toggle-group">
      <input type="checkbox" id="consent-public" :checked="consent.consentToPublicDisplay" @change="update('consentToPublicDisplay', ($event.target as HTMLInputElement).checked)" />
      <label for="consent-public">允许公开展示</label>
    </div>

    <div class="form-group" style="margin-top: 16px;">
      <label class="form-label" for="consent-date">确认时间</label>
      <input
        id="consent-date"
        type="datetime-local"
        class="form-input"
        :value="datetimeLocalValue"
        @input="update('confirmedAt', new Date(($event.target as HTMLInputElement).value).toISOString())"
      />
    </div>

    <div class="form-group">
      <label class="form-label" for="consent-method">确认方式</label>
      <input
        id="consent-method"
        :value="consent.confirmationMethod"
        @input="update('confirmationMethod', ($event.target as HTMLInputElement).value)"
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
        :value="consent.notes"
        @input="update('notes', ($event.target as HTMLTextAreaElement).value)"
        class="form-textarea"
        placeholder="同意相关的补充说明"
        maxlength="200"
      ></textarea>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Consent } from '@/models/consent'

type ConsentInput = Omit<Consent, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>

const props = defineProps<{ consent: ConsentInput }>()
const emit = defineEmits<{
  'update:consent': [value: ConsentInput]
}>()

function update<K extends keyof ConsentInput>(key: K, value: ConsentInput[K]) {
  emit('update:consent', { ...props.consent, [key]: value })
}

const datetimeLocalValue = computed(() => {
  const d = new Date(props.consent.confirmedAt)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
})
</script>

<style scoped>
.form-section {
  padding: 24px;
}
</style>
