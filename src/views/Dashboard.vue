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
      <div
        role="button"
        tabindex="0"
        @click="showYPModal"
        @keydown.enter="showYPModal"
        @keydown.space.prevent="showYPModal"
        class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] cursor-pointer transition-all hover:shadow-lg hover:border-red-300 dark:hover:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-2xl font-bold text-gray-800 dark:text-white/90">{{ stats.youthProtectionExpiring }}</h4>
            <span class="mt-1 block text-sm text-gray-500 dark:text-gray-400">YP Expiring Soon</span>
            <span class="mt-2 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              View details
            </span>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
            <svg class="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- YP Expiring Soon Modal -->
    <div
      v-if="showYPDetailsModal"
      class="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      @click.self="showYPDetailsModal = false"
    >
      <div class="w-full max-w-2xl my-8 rounded-xl bg-white p-6 dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-800 dark:text-white/90">
            Youth Protection Expiring Soon (30 days)
          </h3>
          <button
            @click="showYPDetailsModal = false"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div v-if="loadingYPDetails" class="text-sm text-gray-500">Loading details...</div>
        <div v-else-if="ypDetailsError" class="text-sm text-red-600">{{ ypDetailsError }}</div>
        <div v-else-if="!ypExpiringMembers.length" class="text-sm text-gray-500">No members with expiring YP certifications.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Name</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Email</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Status</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">YP Expires</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in ypExpiringMembers" :key="member.MemberID" class="border-b border-gray-200 dark:border-gray-800">
                <td class="px-4 py-4 text-sm text-gray-800 dark:text-white/90">
                  {{ member.FirstName }} {{ member.LastName }}
                </td>
                <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {{ member.Email }}
                </td>
                <td class="px-4 py-4">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                      member.Status === 'Active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'
                    ]"
                  >
                    {{ member.Status }}
                  </span>
                </td>
                <td class="px-4 py-4 text-sm font-medium text-red-600 dark:text-red-400">
                  {{ formatDate(member.YouthProtectionExpiration) }}
                </td>
              </tr>
            </tbody>
          </table>
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
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { auth } from '@/firebase'
import { getAuthHeaders, apiFetch, AuthError } from '@/utils/apiAuth'

const router = useRouter()
const currentPageTitle = ref('Dashboard')
const chapterName = ref(import.meta.env.VITE_CHAPTER_NAME || 'EAA Chapter')
const chapterEmail = ref('info@eaa22.org')
const lastUpdated = ref(new Date().toLocaleDateString())
const showYPDetailsModal = ref(false)
const ypExpiringMembers = ref<any[]>([])
const loadingYPDetails = ref(false)
const ypDetailsError = ref('')

const stats = ref({
  totalMembers: 0,
  activeMembers: 0,
  renewalsDue: 0,
  youthProtectionExpiring: 0
})

const fetchStats = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/members/stats', { headers })
    if (response.ok) {
      stats.value = await response.json()
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching stats:', error)
    }
  }
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Not set'
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  } catch {
    return 'Invalid date'
  }
}

const loadYPExpiringMembers = async () => {
  loadingYPDetails.value = true
  ypDetailsError.value = ''
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/members/yp-expiring', { headers })
    if (response.ok) {
      ypExpiringMembers.value = await response.json()
    } else {
      ypDetailsError.value = 'Failed to load YP expiring members'
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      ypDetailsError.value = 'Error loading YP details'
      console.error('Error fetching YP expiring members:', error)
    }
  } finally {
    loadingYPDetails.value = false
  }
}

const showYPModal = async () => {
  showYPDetailsModal.value = true
  await loadYPExpiringMembers()
}

onMounted(() => {
  fetchStats()
})
</script>
