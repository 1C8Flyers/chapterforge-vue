<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4">
      <!-- Total Members Card -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-2xl font-bold text-gray-800 dark:text-white/90">{{ stats.totalMembers }}</h4>
            <span class="mt-1 block text-sm text-gray-500 dark:text-gray-400">Total Members</span>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10">
            <svg class="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Active Members Card -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-2xl font-bold text-gray-800 dark:text-white/90">{{ stats.activeMembers }}</h4>
            <span class="mt-1 block text-sm text-gray-500 dark:text-gray-400">Active Members</span>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-500/10">
            <svg class="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Renewals Due Card -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-2xl font-bold text-gray-800 dark:text-white/90">{{ stats.renewalsDue }}</h4>
            <span class="mt-1 block text-sm text-gray-500 dark:text-gray-400">Renewals Due</span>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-500/10">
            <svg class="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Youth Protection Card -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-2xl font-bold text-gray-800 dark:text-white/90">{{ stats.youthProtectionExpiring }}</h4>
            <span class="mt-1 block text-sm text-gray-500 dark:text-gray-400">YP Expiring Soon</span>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
            <svg class="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Chapter Information -->
    <div class="mt-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">{{ chapterName }}</h3>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <span class="text-sm text-gray-500 dark:text-gray-400">Chapter Email</span>
          <p class="mt-1 font-medium text-gray-800 dark:text-white/90">{{ chapterEmail }}</p>
        </div>
        <div>
          <span class="text-sm text-gray-500 dark:text-gray-400">System Status</span>
          <p class="mt-1 font-medium text-green-600 dark:text-green-400">Online</p>
        </div>
        <div>
          <span class="text-sm text-gray-500 dark:text-gray-400">Last Updated</span>
          <p class="mt-1 font-medium text-gray-800 dark:text-white/90">{{ lastUpdated }}</p>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { auth } from '@/firebase'

const currentPageTitle = ref('Dashboard')
const chapterName = ref(import.meta.env.VITE_CHAPTER_NAME || 'EAA Chapter')
const chapterEmail = ref('info@eaa22.org')
const lastUpdated = ref(new Date().toLocaleDateString())

const stats = ref({
  totalMembers: 0,
  activeMembers: 0,
  renewalsDue: 0,
  youthProtectionExpiring: 0
})

const getAuthHeaders = async () => {
  const user = auth.currentUser
  if (!user) {
    throw new Error('No authenticated user')
  }
  const token = await user.getIdToken()
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

const fetchStats = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch('/api/members/stats', { headers })
    if (response.ok) {
      stats.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

onMounted(() => {
  fetchStats()
})
</script>
