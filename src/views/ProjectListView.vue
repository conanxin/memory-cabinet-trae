<template>
  <div class="page-container">
    <header class="page-header">
      <h1 class="page-title">时光展柜</h1>
      <p class="page-subtitle">记录家庭口述记忆</p>
    </header>

    <div v-if="projects.length === 0" class="empty-state">
      <p>开始你的第一个家庭口述史项目</p>
      <router-link to="/projects/new" class="btn btn-primary">新建项目</router-link>
    </div>

    <div v-else>
      <div class="actions-bar">
        <router-link to="/projects/new" class="btn btn-primary">新建项目</router-link>
        <router-link to="/import" class="btn btn-secondary">导入项目</router-link>
      </div>

      <div class="project-list">
        <div
          v-for="project in projects"
          :key="project.id"
          class="card project-card"
          @click="goToProject(project.id)"
        >
          <h3 class="project-card__title">{{ project.title }}</h3>
          <p v-if="project.description" class="project-card__desc">{{ project.description }}</p>
          <time class="project-card__time">{{ formatDate(project.createdAt) }}</time>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { projectService } from '@/services/project-service'
import type { Project } from '@/models/project'

const router = useRouter()
const projects = ref<Project[]>([])

onMounted(async () => {
  projects.value = await projectService.listProjects()
})

function goToProject(id: string) {
  router.push({ name: 'project-detail', params: { projectId: id } })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}
</script>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.page-subtitle {
  color: var(--text-muted);
  font-size: 15px;
  margin-top: 4px;
}

.actions-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-card {
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.1s;
}

.project-card:hover {
  box-shadow: 0 4px 12px var(--shadow);
  transform: translateY(-1px);
}

.project-card__title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 4px;
}

.project-card__desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-card__time {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
