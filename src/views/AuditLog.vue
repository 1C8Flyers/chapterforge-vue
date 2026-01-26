<template>
  <AdminLayout>
    <PageBreadcrumb pageTitle="Audit Log" />

    <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="border-b border-gray-200 p-6 dark:border-gray-800">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">System Activity</h3>
          <button
            @click="fetchLogs"
            :disabled="loading"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
        
        <!-- Filter Options -->
        <div class="mt-4 grid gap-3 sm:grid-cols-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">User Email</label>
            <input
              v-model="filters.userEmail"
              type="text"
              placeholder="Filter by user..."
              @input="fetchLogs"
              class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Action</label>
            <select
              v-model="filters.action"
              @change="fetchLogs"
              class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Table</label>
            <select
              v-model="filters.tableName"
              @change="fetchLogs"
              class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="">All Tables</option>
              <option value="members">Members</option>
              <option value="payments">Payments</option>
              <option value="member_types">Member Types</option>
              <option value="app_settings">Settings</option>
              <option value="email_templates">Email Templates</option>
              <option value="user_allowlist">Users</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Limit</label>
            <select
              v-model="filters.limit"
              @change="fetchLogs"
              class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="100">100</option>
              <option value="500">500</option>
              <option value="1000">1000</option>
              <option value="5000">5000</option>
            </select>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
            <tr>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Timestamp</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">User</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Action</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Table</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Record ID</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Details</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">IP</th>
              <th class="px-4 py-3 text-center text-sm font-semibold text-gray-800 dark:text-white/90">Changes</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
            <tr v-if="loading">
              <td colspan="8" class="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading audit logs...
              </td>
            </tr>
            <tr v-else-if="logs.length === 0">
              <td colspan="8" class="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                No audit logs found
              </td>
            </tr>
            <tr v-else v-for="log in logs" :key="log.ID" class="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
              <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                {{ formatDate(log.CreatedAt) }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-800 dark:text-white/90">
                {{ log.UserEmail }}
              </td>
              <td class="px-4 py-4 text-sm">
                <span
                  class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="{
                    'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400': log.Action === 'LOGIN',
                    'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400': log.Action === 'CREATE',
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400': log.Action === 'UPDATE',
                    'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400': log.Action === 'DELETE'
                  }"
                >
                  {{ log.Action }}
                </span>
              </td>
              <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                {{ log.TableName || '-' }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                {{ log.RecordID || '-' }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                {{ log.Details || '-' }}
              </td>
              <td class="px-4 py-4 text-sm font-mono text-xs text-gray-600 dark:text-gray-400">
                {{ log.IPAddress || '-' }}
              </td>
              <td class="px-4 py-4 text-center">
                <button
                  v-if="log.OldValue || log.NewValue"
                  @click="showChanges(log)"
                  class="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  View
                </button>
                <span v-else class="text-sm text-gray-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Changes Modal -->
    <div
      v-if="selectedLog"
      @click="selectedLog = null"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        @click.stop
        class="w-full max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
      >
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Change Details</h3>
          <button
            @click="selectedLog = null"
            class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div>
            <h4 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Before</h4>
            <pre class="rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800"><code>{{ JSON.stringify(selectedLog.OldValue, null, 2) }}</code></pre>
          </div>
          <div>
            <h4 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">After</h4>
            <pre class="rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800"><code>{{ JSON.stringify(selectedLog.NewValue, null, 2) }}</code></pre>
          </div>
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
import { getAuthHeaders, apiFetch, AuthError } from '@/utils/apiAuth'

const router = useRouter()

interface AuditLog {
  ID: number
  UserEmail: string
  Action: string
  TableName: string | null
  RecordID: number | null
  OldValue: any
  NewValue: any
  IPAddress: string | null
  Details: string | null
  CreatedAt: string
}

const logs = ref<AuditLog[]>([])
const loading = ref(false)
const selectedLog = ref<AuditLog | null>(null)

const filters = ref({
  userEmail: '',
  action: '',
  tableName: '',
  limit: '1000'
})

const fetchLogs = async () => {
  try {
    loading.value = true
    const headers = await getAuthHeaders()
    const params = new URLSearchParams()
    if (filters.value.userEmail) params.append('userEmail', filters.value.userEmail)
    if (filters.value.action) params.append('action', filters.value.action)
    if (filters.value.tableName) params.append('tableName', filters.value.tableName)
    if (filters.value.limit) params.append('limit', filters.value.limit)

    const response = await apiFetch(`/api/audit-logs?${params.toString()}`, { headers })
    if (!response.ok) throw new Error('Failed to fetch audit logs')

    logs.value = await response.json()
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching audit logs:', error)
      alert('Failed to load audit logs')
    }
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const showChanges = (log: AuditLog) => {
  selectedLog.value = log
}

onMounted(() => {
  fetchLogs()
})
</script>
