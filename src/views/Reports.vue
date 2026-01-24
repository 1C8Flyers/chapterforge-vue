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

      <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-dark">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-base font-semibold text-gray-800 dark:text-white">Dues collected by year</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Totals include manual and online payments for each dues year.
            </p>
          </div>
          <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">USD</span>
        </div>

        <div class="mt-4">
          <div v-if="loadingSummary" class="text-sm text-gray-500">Loading dues summary...</div>
          <div v-else-if="summaryError" class="text-sm text-red-600">{{ summaryError }}</div>
          <div v-else-if="!paymentsSummary.length" class="text-sm text-gray-500">No payments recorded yet.</div>
          <div v-else class="-ml-4 -mr-2">
            <VueApexCharts type="bar" height="340" :options="chartOptions" :series="chartSeries" />
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { useAuth } from '@/composables/useAuth'

type PaymentsSummaryRow = { Year: number; Total: number }

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
const paymentsSummary = ref<PaymentsSummaryRow[]>([])
const loadingSummary = ref(false)
const summaryError = ref('')

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

const formatCurrency = (value: number) => {
  const val = Number.isFinite(value) ? value : 0
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val)
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

const loadPaymentsSummary = async () => {
  if (!currentUser.value) return
  loadingSummary.value = true
  summaryError.value = ''
  try {
    const headers = await getAuthHeaders()
    const response = await fetch('/api/reports/payments/summary', { headers })
    if (!response.ok) {
      throw new Error('Failed to fetch payments summary')
    }
    const rows = await response.json()
    paymentsSummary.value = Array.isArray(rows)
      ? rows
        .map((row: any) => ({ Year: Number(row.Year), Total: Number(row.Total) || 0 }))
        .filter(row => Number.isFinite(row.Year))
        .sort((a, b) => a.Year - b.Year)
      : []
  } catch (error) {
    summaryError.value = 'Could not load payments summary.'
    console.error('Error loading payments summary:', error)
  } finally {
    loadingSummary.value = false
  }
}

const chartSeries = computed(() => [{
  name: 'Dues collected',
  data: paymentsSummary.value.map(row => row.Total)
}])

const chartOptions = computed(() => ({
  chart: {
    type: 'bar',
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif',
    toolbar: { show: false },
    animations: { easing: 'easeinout' }
  },
  colors: ['#0f766e'],
  plotOptions: {
    bar: {
      columnWidth: '55%',
      borderRadius: 8,
      borderRadiusApplication: 'end'
    }
  },
  dataLabels: { enabled: false },
  stroke: {
    show: true,
    width: 3,
    colors: ['transparent']
  },
  grid: {
    strokeDashArray: 4,
    borderColor: '#e5e7eb'
  },
  xaxis: {
    categories: paymentsSummary.value.map(row => String(row.Year)),
    axisBorder: { show: false },
    axisTicks: { show: false },
    labels: { style: { colors: '#6b7280' } }
  },
  yaxis: {
    labels: {
      formatter: (val: number) => formatCurrency(val),
      style: { colors: '#6b7280' }
    }
  },
  tooltip: {
    y: {
      formatter: (val: number) => formatCurrency(val)
    }
  },
  legend: {
    show: false
  },
  fill: {
    opacity: 0.9
  }
}))

onMounted(loadPaymentsSummary)

watch(currentUser, (user) => {
  if (!user) {
    errorMessage.value = ''
    summaryError.value = ''
    paymentsSummary.value = []
  } else {
    loadPaymentsSummary()
  }
})
</script>
