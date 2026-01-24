<template>
  <AdminLayout>
    <PageBreadcrumb pageTitle="Reports" />

    <div class="w-full max-w-full overflow-hidden space-y-4">
      <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-dark">
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">Export Reports</h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Download CSV exports of raw database tables.
        </p>

        <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="table in tables"
            :key="table.id"
            @click="exportReport(table)"
            class="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <span>{{ table.name }}</span>
            <span class="text-xs text-gray-500 dark:text-gray-400">Export CSV</span>
          </button>
        </div>

        <div v-if="exporting" class="mt-4 text-sm text-gray-500">Preparing export...</div>
        <div v-if="errorMessage" class="mt-2 text-sm text-red-600">{{ errorMessage }}</div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { useAuth } from '@/composables/useAuth'

const { currentUser } = useAuth()

const getAuthHeaders = async () => {
  const user = currentUser.value
  if (!user) {
    throw new Error('User not authenticated');
  }
  const token = await user.getIdToken()
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

const tables = [
  { id: 'members', name: 'Members' },
  { id: 'member_types', name: 'Member Types' },
  { id: 'user_allowlist', name: 'Users' },
  { id: 'email_templates', name: 'Email Templates' },
]

const schemaColumnOrder = {
  'members': ['MemberID', 'HouseholdID', 'FirstName', 'LastName', 'EAANumber', 'Phone', 'Email', 'MemberType', 'Status', 'DuesRate', 'LastPaidYear', 'AmountDue', 'YouthProtectionExpiration', 'BackgroundCheckExpiration', 'YoungEaglePilot', 'YoungEagleVolunteer', 'EaglePilot', 'EagleFlightVolunteer', 'BoardMember', 'Officer', 'RenewalNoticeSentAt', 'RenewalNoticeSentYear', 'Notes', 'CreatedAt', 'UpdatedAt'],
  'member_types': ['MemberTypeID', 'Name', 'DuesRate', 'SortOrder'],
  'user_allowlist': ['Email', 'Role', 'MemberID'],
  'email_templates': ['TemplateKey', 'Subject', 'HtmlBody', 'UpdatedAt']
}

const exporting = ref(false)
const errorMessage = ref('')

const getColumnsForTable = (tableId: string, rows: any[]) => {
  if (rows.length === 0) return []
  const allColumns = Object.keys(rows[0])
  const schemaOrder = schemaColumnOrder[tableId] || []
  return [
    ...schemaOrder.filter(col => allColumns.includes(col)),
    ...allColumns.filter(col => !schemaOrder.includes(col))
  ]
}

const formatCellValue = (value: any) => {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const exportReport = async (table: { id: string; name: string }) => {
  if (!currentUser.value) {
    errorMessage.value = 'Please sign in to export reports.'
    return
  }

  exporting.value = true
  errorMessage.value = ''

  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`/api/reports/${table.id}`, { headers })
    if (!response.ok) {
      throw new Error('Failed to fetch report data')
    }

    const rows = await response.json()
    if (!rows || rows.length === 0) {
      errorMessage.value = 'No data available for export.'
      return
    }

    const headersOrder = getColumnsForTable(table.id, rows)
    const csvContent = [
      headersOrder.map(h => `"${h}"`).join(','),
      ...rows.map((row: any) =>
        headersOrder.map(col => {
          const value = row[col]
          const stringValue = formatCellValue(value)
          return `"${stringValue.replace(/"/g, '""')}"`
        }).join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${table.id}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Error exporting report:', error)
    errorMessage.value = 'Failed to export report.'
  } finally {
    exporting.value = false
  }
}

watch(currentUser, (user) => {
  if (!user) {
    errorMessage.value = ''
  }
})
</script>
