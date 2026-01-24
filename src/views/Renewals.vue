<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    
    <div class="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Renewal Notices</h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage membership renewals for {{ selectedYear }}
          </p>
        </div>
        <div class="flex gap-2">
          <select
            v-model.number="selectedYear"
            @change="fetchRenewals"
            class="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option v-for="year in yearOptions" :key="year" :value="year">{{ year }}</option>
          </select>
          <button
            @click="sendBulkRenewals"
            :disabled="selectedMembers.length === 0"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send to Selected ({{ selectedMembers.length }})
          </button>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="overflow-x-auto p-6">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  @change="toggleSelectAll"
                  :checked="allSelected"
                  class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
              </th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Name</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Email</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Last Paid</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Amount Due</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Last Notice</th>
              <th class="px-4 py-3 text-right text-sm font-semibold text-gray-800 dark:text-white/90">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="member in renewals"
              :key="member.MemberID"
              class="border-b border-gray-200 dark:border-gray-800"
            >
              <td class="px-4 py-4">
                <input
                  type="checkbox"
                  v-model="selectedMembers"
                  :value="member.MemberID"
                  class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
              </td>
              <td class="px-4 py-4 text-sm text-gray-800 dark:text-white/90">
                {{ member.FirstName }} {{ member.LastName }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{{ member.Email }}</td>
              <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                {{ member.LastPaidYear || 'Never' }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                ${{ (member.AmountDue || member.DuesRate || 0).toFixed(2) }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                {{ formatDate(member.RenewalNoticeSentAt) }}
              </td>
              <td class="px-4 py-4 text-right text-sm">
                <button
                  @click="sendRenewalNotice(member.MemberID)"
                  class="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Send Notice
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div v-if="renewals.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400">
          No members need renewal notices for {{ selectedYear }}
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { auth } from '@/firebase'

const currentPageTitle = ref('Renewals')
const renewals = ref<any[]>([])
const selectedMembers = ref<number[]>([])
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)

const yearOptions = computed(() => {
  const years = []
  for (let i = currentYear - 2; i <= currentYear + 1; i++) {
    years.push(i)
  }
  return years
})

const allSelected = computed(() => {
  return renewals.value.length > 0 && selectedMembers.value.length === renewals.value.length
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

const fetchRenewals = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`/api/renewals?year=${selectedYear.value}`, { headers })
    if (response.ok) {
      const data = await response.json()
      renewals.value = data.members || []
    } else {
      console.error('Failed to fetch renewals:', response.statusText)
    }
  } catch (error) {
    console.error('Error fetching renewals:', error)
  }
}

const sendRenewalNotice = async (memberId: number) => {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`/api/renewals/send/${memberId}`, {
      method: 'POST',
      headers
    })
    
    if (response.ok) {
      alert('Renewal notice sent successfully')
      await fetchRenewals()
    } else {
      const error = await response.json()
      alert(error.error || 'Failed to send renewal notice')
    }
  } catch (error) {
    console.error('Error sending renewal notice:', error)
    alert('Failed to send renewal notice')
  }
}

const sendBulkRenewals = async () => {
  if (selectedMembers.value.length === 0) return
  
  if (!confirm(`Send renewal notices to ${selectedMembers.value.length} members?`)) return
  
  try {
    const headers = await getAuthHeaders()
    const response = await fetch('/api/renewals/send-bulk', {
      method: 'POST',
      headers,
      body: JSON.stringify({ memberIds: selectedMembers.value })
    })
    
    if (response.ok) {
      const result = await response.json()
      alert(`Sent ${result.sent} renewal notices successfully`)
      selectedMembers.value = []
      await fetchRenewals()
    } else {
      const error = await response.json()
      alert(error.error || 'Failed to send renewal notices')
    }
  } catch (error) {
    console.error('Error sending bulk renewals:', error)
    alert('Failed to send renewal notices')
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedMembers.value = []
  } else {
    selectedMembers.value = renewals.value.map(m => m.MemberID)
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

onMounted(() => {
  fetchRenewals()
})
</script>
