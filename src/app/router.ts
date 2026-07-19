import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/projects',
    },
    {
      path: '/projects',
      name: 'project-list',
      component: () => import('@/views/ProjectListView.vue'),
    },
    {
      path: '/projects/new',
      name: 'project-create',
      component: () => import('@/views/ProjectCreateView.vue'),
    },
    {
      path: '/projects/:projectId',
      name: 'project-detail',
      component: () => import('@/views/ProjectDetailView.vue'),
      props: true,
    },
    {
      path: '/projects/:projectId/memories',
      name: 'memory-list',
      component: () => import('@/views/MemoryItemListView.vue'),
      props: true,
    },
    {
      path: '/projects/:projectId/memories/new',
      name: 'memory-create',
      component: () => import('@/views/MemoryItemCreateView.vue'),
      props: true,
    },
    {
      path: '/projects/:projectId/memories/:memoryItemId',
      name: 'memory-detail',
      component: () => import('@/views/MemoryItemDetailView.vue'),
      props: true,
    },
    {
      path: '/projects/:projectId/interviews/new',
      name: 'interview-create',
      component: () => import('@/views/InterviewCreateView.vue'),
      props: true,
    },
    {
      path: '/projects/:projectId/interviews/:interviewId',
      name: 'interview-detail',
      component: () => import('@/views/InterviewDetailView.vue'),
      props: true,
    },
    {
      path: '/import',
      name: 'import',
      component: () => import('@/views/ImportView.vue'),
    },
  ],
})

export default router