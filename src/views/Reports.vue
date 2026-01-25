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

          <button
            :key="duesByMemberReport.id"
            @click="exportDuesByMemberYear()"
            class="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-100 dark:hover:bg-emerald-900/50"
          >
            <span>{{ duesByMemberReport.name }}</span>
            <span class="text-xs text-emerald-700 dark:text-emerald-200">Export CSV</span>
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
              Click a bar to see payment details for that year.
            </p>
          </div>
          <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">USD</span>
        </div>

        <div class="mt-4">
          <div v-if="loadingSummary" class="text-sm text-gray-500">Loading dues summary...</div>
          <div v-else-if="summaryError" class="text-sm text-red-600">{{ summaryError }}</div>
          <div v-else-if="!paymentsSummary.length" class="text-sm text-gray-500">No payments recorded yet.</div>
          <div v-else class="-ml-4 -mr-2">
            <VueApexCharts type="bar" height="340" :options="chartOptions" :series="chartSeries" @click="onChartClick" />
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Details Modal -->
    <div
      v-if="showDetailsModal"
      class="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      @click.self="showDetailsModal = false"
    >
      <div class="w-full max-w-2xl my-8 rounded-xl bg-white p-6 dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-800 dark:text-white/90">
            Payments for {{ selectedYear }}
          </h3>
          <button
            @click="showDetailsModal = false"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div v-if="loadingDetails" class="text-sm text-gray-500">Loading details...</div>
        <div v-else-if="detailsError" class="text-sm text-red-600">{{ detailsError }}</div>
        <div v-else-if="!paymentDetails.length" class="text-sm text-gray-500">No payments found for this year.</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Member</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Type</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Method</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-gray-800 dark:text-white/90">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payment in paymentDetails" :key="payment.PaymentID" class="border-b border-gray-200 dark:border-gray-800">
                <td class="px-4 py-4 text-sm text-gray-800 dark:text-white/90">
                  {{ payment.FirstName }} {{ payment.LastName }}
                </td>
                <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {{ payment.MemberType }}
                </td>
                <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {{ payment.Provider || payment.Method }}
                </td>
                <td class="px-4 py-4 text-right text-sm font-medium text-gray-800 dark:text-white/90">
                  {{ formatCurrency(payment.Amount) }}
                </td>
              </tr>
              <tr class="border-t-2 border-gray-300 dark:border-gray-700 font-semibold">
                <td colspan="3" class="px-4 py-4 text-sm text-gray-800 dark:text-white/90">
                  Total for {{ selectedYear }}
                </td>
                <td class="px-4 py-4 text-right text-sm text-gray-800 dark:text-white/90">
                  {{ formatCurrency(paymentDetails.reduce((sum, p) => sum + (p.Amount || 0), 0)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import VueApexCharts from 'vue3-apexcharts'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { useAuth } from '@/composables/useAuth'
import { getAuthHeaders, apiFetch, AuthError } from '@/utils/apiAuth'

type PaymentsSummaryRow = { Year: number; Category: string; Total: number }

const router = useRouter()
const { currentUser } = useAuth()

const tables = [
  { id: 'members', name: 'Members' },
  { id: 'member_types', name: 'Member Types' },
  { id: 'user_allowlist', name: 'Users' },
  { id: 'email_templates', name: 'Email Templates' },
]

const duesByMemberReport = {
  id: 'dues_by_member_year',
  name: 'Dues by Year by Member'
}

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
const showDetailsModal = ref(false)
const selectedYear = ref<number | null>(null)
const paymentDetails = ref<any[]>([])
const loadingDetails = ref(false)
const detailsError = ref('')

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
    const response = await apiFetch(`/api/reports/${table.id}`, { headers })
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
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error exporting report:', error)
      errorMessage.value = 'Failed to export report.'
    }
  } finally {
    exporting.value = false
  }
}

const exportDuesByMemberYear = async () => {
  if (!currentUser.value) {
    errorMessage.value = 'Please sign in to export reports.'
    return
  }

  exporting.value = true
  errorMessage.value = ''

  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/reports/payments/by-member-year', { headers })
    if (!response.ok) {
      throw new Error('Failed to fetch dues by member report')
    }

    const rows = await response.json()
    if (!rows || rows.length === 0) {
      errorMessage.value = 'No data available for export.'
      return
    }

    const headersOrder = ['MemberID', 'FirstName', 'LastName', 'MemberType', 'Year', 'TotalPaid']
    const csvContent = [
      headersOrder.join(','),
      ...rows.map((row: any) =>
        headersOrder.map(col => {
          const val = row[col] ?? ''
          const str = typeof val === 'string' ? val.replace(/"/g, '""') : String(val)
          return `"${str}"`
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `dues_by_member_year_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error exporting dues by member/year report:', error)
      errorMessage.value = 'Failed to export report.'
    }
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
    const response = await apiFetch('/api/reports/payments/summary', { headers })
    if (!response.ok) {
      throw new Error('Failed to fetch payments summary')
    }
    const rows = await response.json()
    paymentsSummary.value = Array.isArray(rows)
      ? rows
        .map((row: any) => ({
          Year: Number(row.Year),
          Category: String(row.Category || 'Unknown'),
          Total: Number(row.Total) || 0
        }))
        .filter(row => Number.isFinite(row.Year))
      : []
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      summaryError.value = 'Could not load payments summary.'
      console.error('Error loading payments summary:', error)
    }
  } finally {
    loadingSummary.value = false
  }
}

const categoryOrder = ['Family', 'Individual', 'Unknown']

const categories = computed(() => {
  const found = Array.from(new Set(paymentsSummary.value.map(row => row.Category)))
  return [
    ...categoryOrder.filter(cat => found.includes(cat)),
    ...found.filter(cat => !categoryOrder.includes(cat))
  ]
})

const years = computed(() => Array.from(new Set(paymentsSummary.value.map(row => row.Year))).sort((a, b) => a - b))

const categoryColorMap: Record<string, string> = {
  Family: '#0ea5e9',
  Individual: '#0f766e',
  Unknown: '#94a3b8'
}

const chartSeries = computed(() => categories.value.map(category => ({
  name: `${category} dues`,
  data: years.value.map(year => {
    const match = paymentsSummary.value.find(row => row.Year === year && row.Category === category)
    return match ? match.Total : 0
  })
})))

const chartOptions = computed(() => ({
  chart: {
    type: 'bar',
    fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif',
    toolbar: { show: false },
    animations: { easing: 'easeinout' },
    stacked: true
  },
  colors: categories.value.map(cat => categoryColorMap[cat] || '#0ea5e9'),
  plotOptions: {
    bar: {
      columnWidth: '55%',
      borderRadius: 8,
      borderRadiusApplication: 'end',
      dataLabels: {
        total: {
          enabled: true,
          formatter: (val: number) => formatCurrency(val),
          style: {
            fontSize: '12px',
            fontWeight: 600,
            colors: ['#374151']
          },
          offsetY: -5
        }
      }
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
    categories: years.value.map(year => String(year)),
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
    show: true
  },
  fill: {
    opacity: 0.9
  }
}))

const onChartClick = async (event: any, chartContext: any, config: any) => {
  const dataPointIndex = config.dataPointIndex
  if (dataPointIndex >= 0 && dataPointIndex < years.value.length) {
    const year = years.value[dataPointIndex]
    selectedYear.value = year
    await loadPaymentDetails(year)
    showDetailsModal.value = true
  }
}

const loadPaymentDetails = async (year: number) => {
  loadingDetails.value = true
  detailsError.value = ''
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch(`/api/reports/payments/year/${year}`, { headers })
    if (!response.ok) {
      throw new Error('Failed to fetch payment details')
    }
    paymentDetails.value = await response.json()
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      detailsError.value = 'Could not load payment details.'
      console.error('Error loading payment details:', error)
    }
  } finally {
    loadingDetails.value = false
  }
}

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
