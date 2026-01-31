<template>
  <AdminLayout>
    <PageBreadcrumb pageTitle="Square Analytics" />

    <div class="w-full max-w-full space-y-4">
      <!-- Tabs -->
      <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
        <div class="border-b border-gray-200 dark:border-gray-800">
          <div class="flex gap-4 px-4">
            <button
              @click="activeTab = 'transactions'"
              :class="[
                'px-4 py-3 text-sm font-medium border-b-2 transition',
                activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              ]"
            >
              Transactions
            </button>
          </div>
        </div>

        <!-- Transactions Tab -->
        <div v-if="activeTab === 'transactions'" class="p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Square Transactions</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                View Square processing fees per transaction
              </p>
            </div>
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-2 mr-2">
                <select
                  v-model="datePreset"
                  @change="applyDatePreset"
                  class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
                >
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                  <option value="last_year">Last Year</option>
                  <option value="custom">Custom</option>
                </select>
                <input
                  v-if="datePreset === 'custom'"
                  v-model="customStart"
                  type="date"
                  class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
                />
                <input
                  v-if="datePreset === 'custom'"
                  v-model="customEnd"
                  type="date"
                  class="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
                />
                <button
                  v-if="datePreset === 'custom'"
                  @click="loadTransactions"
                  :disabled="loadingTransactions || !customStart || !customEnd"
                  class="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Apply
                </button>
              </div>
              <button
                @click="exportTransactions"
                :disabled="loadingTransactions || transactions.length === 0"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Export CSV
              </button>
              <button
                @click="loadTransactions"
                :disabled="loadingTransactions"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {{ loadingTransactions ? 'Loading...' : 'Refresh' }}
              </button>
            </div>
          </div>

          <div v-if="transactions.length > 0" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div class="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 dark:border-gray-700 dark:from-blue-900/20 dark:to-blue-900/10">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p class="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-2">
                ${{ formatCurrency(totalAmount) }}
              </p>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gradient-to-br from-orange-50 to-orange-100 p-6 dark:border-gray-700 dark:from-orange-900/20 dark:to-orange-900/10">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Fees</p>
              <p class="text-3xl font-bold text-orange-700 dark:text-orange-400 mt-2">
                ${{ formatCurrency(totalFees) }}
              </p>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-green-100 p-6 dark:border-gray-700 dark:from-green-900/20 dark:to-green-900/10">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Gross</p>
              <p class="text-3xl font-bold text-green-700 dark:text-green-400 mt-2">
                ${{ formatCurrency(totalGross) }}
              </p>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6 dark:border-gray-700 dark:from-purple-900/20 dark:to-purple-900/10">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Net</p>
              <p class="text-3xl font-bold text-purple-700 dark:text-purple-400 mt-2">
                ${{ formatCurrency(totalNet) }}
              </p>
            </div>
          </div>

          <div v-if="transactionsError" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p class="text-red-700 dark:text-red-300">{{ transactionsError }}</p>
          </div>

          <div v-if="loadingTransactions" class="text-center py-8">
            <p class="text-gray-500">Loading transactions...</p>
          </div>

          <div v-else-if="transactions.length === 0" class="text-center py-8">
            <p class="text-gray-500">No transactions found.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-4 py-3 text-left text-gray-700 font-semibold dark:text-gray-300">Type</th>
                  <th class="px-4 py-3 text-left text-gray-700 font-semibold dark:text-gray-300">Date</th>
                  <th class="px-4 py-3 text-left text-gray-700 font-semibold dark:text-gray-300">Customer</th>
                  <th class="px-4 py-3 text-left text-gray-700 font-semibold dark:text-gray-300">Items</th>
                  <th class="px-4 py-3 text-left text-gray-700 font-semibold dark:text-gray-300">Receipt</th>
                  <th class="px-4 py-3 text-right text-gray-700 font-semibold dark:text-gray-300">Amount</th>
                  <th class="px-4 py-3 text-right text-gray-700 font-semibold dark:text-gray-300">Square Fee</th>
                  <th class="px-4 py-3 text-left text-gray-700 font-semibold dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="txn in transactions" :key="txn.id" 
                    :class="[
                      'border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                      txn.transaction_type === 'refund' ? 'bg-red-50 dark:bg-red-900/10' : ''
                    ]">
                  <td class="px-4 py-3">
                    <span :class="[
                      'inline-block px-2 py-1 rounded text-xs font-medium',
                      txn.transaction_type === 'refund' 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    ]">
                      {{ txn.transaction_type === 'refund' ? 'REFUND' : 'PAYMENT' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-800 dark:text-gray-300">
                    {{ new Date(txn.created_at).toLocaleDateString() }} {{ new Date(txn.created_at).toLocaleTimeString() }}
                  </td>
                  <td class="px-4 py-3 text-gray-800 dark:text-gray-300">
                    <div v-if="txn.customer_name" class="font-medium text-sm">
                      {{ txn.customer_name }}
                    </div>
                    <div v-if="txn.buyer_email" class="text-xs text-gray-500 dark:text-gray-400">
                      {{ txn.buyer_email }}
                    </div>
                    <div v-if="!txn.customer_name && !txn.buyer_email" class="text-gray-500 text-sm">-</div>
                  </td>
                  <td class="px-4 py-3 text-gray-800 dark:text-gray-300">
                    <div v-if="txn.transaction_type === 'refund' && txn.refund_reason" class="text-sm text-red-600 dark:text-red-400">
                      {{ txn.refund_reason }}
                    </div>
                    <div v-else-if="txn.order_items && txn.order_items.length > 0" class="text-sm">
                      <div v-for="(item, idx) in txn.order_items" :key="idx" class="mb-1">
                        {{ item.quantity }}x {{ item.name }}
                      </div>
                    </div>
                    <div v-else class="text-gray-500 text-sm">-</div>
                  </td>
                  <td class="px-4 py-3 text-gray-800 dark:text-gray-300">
                    <a v-if="txn.receipt_url" :href="txn.receipt_url" target="_blank" class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                      #{{ txn.receipt_number || txn.id.substring(0, 8) }}
                    </a>
                    <span v-else class="text-gray-500 text-sm">-</span>
                  </td>
                  <td class="px-4 py-3 text-right text-gray-800 dark:text-gray-300">
                    <div v-if="txn.amount_money && txn.amount_money.amount">
                      <div :class="txn.transaction_type === 'refund' ? 'text-red-600 dark:text-red-400 font-semibold' : ''">
                        {{ txn.transaction_type === 'refund' ? '-' : '' }}${{ (txn.amount_money.amount / 100).toFixed(2) }}
                      </div>
                      <div v-if="txn.refunds && txn.refunds.length > 0 && txn.transaction_type !== 'refund'" class="text-xs text-red-600 dark:text-red-400 mt-1">
                        Refunded: -${{ (txn.total_refunded / 100).toFixed(2) }}
                      </div>
                    </div>
                    <span v-else class="text-gray-500">-</span>
                  </td>
                  <td class="px-4 py-3 text-right font-semibold text-gray-800 dark:text-gray-300">
                    <span v-if="txn.processing_fee && txn.processing_fee.amount" class="text-orange-600 dark:text-orange-400">
                      -${{ (txn.processing_fee.amount / 100).toFixed(2) }}
                    </span>
                    <span v-else class="text-gray-500">-</span>
                  </td>
                  <td class="px-4 py-3">
                    <span :class="[
                      'inline-block px-2 py-1 rounded text-xs font-medium',
                      txn.status === 'COMPLETED' || txn.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    ]">
                      {{ txn.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'

interface Transaction {
  id: string
  transaction_type?: string
  created_at: string
  amount_money?: { amount: number; currency: string }
  total_money?: { amount: number; currency: string }
  processing_fee?: { amount: number; currency: string }
  status: string
  customer_name?: string
  buyer_email?: string
  receipt_number?: string
  receipt_url?: string
  order_items?: Array<{ name?: string; quantity?: string; total?: number }>
  refund_reason?: string | null
  total_refunded?: number
  card_details?: {
    brand?: string
    last4?: string
    exp_month?: number
    exp_year?: number
    cardholder_name?: string
    entry_method?: string
    card_type?: string
  } | null
}

const { currentUser, getAuthHeaders } = useAuth()

const activeTab = ref<'transactions'>('transactions')
const transactions = ref<Transaction[]>([])
const loadingTransactions = ref(false)
const transactionsError = ref('')
const datePreset = ref<'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom'>('this_month')
const customStart = ref('')
const customEnd = ref('')

const getPresetRange = () => {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  switch (datePreset.value) {
    case 'this_month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'last_month':
      start.setMonth(start.getMonth() - 1, 1)
      start.setHours(0, 0, 0, 0)
      end.setDate(0)
      end.setHours(23, 59, 59, 999)
      break
    case 'this_year':
      start.setMonth(0, 1)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
      break
    case 'last_year':
      start.setFullYear(start.getFullYear() - 1, 0, 1)
      start.setHours(0, 0, 0, 0)
      end.setFullYear(end.getFullYear() - 1, 11, 31)
      end.setHours(23, 59, 59, 999)
      break
    case 'custom':
      return null
  }

  return { start, end }
}

const applyDatePreset = () => {
  if (datePreset.value !== 'custom') {
    const range = getPresetRange()
    if (range) {
      customStart.value = range.start.toISOString().slice(0, 10)
      customEnd.value = range.end.toISOString().slice(0, 10)
    }
    loadTransactions()
  }
}

const loadTransactions = async () => {
  if (!currentUser.value) return
  
  loadingTransactions.value = true
  transactionsError.value = ''
  
  try {
    const headers = await getAuthHeaders()
    const params = new URLSearchParams()
    const range = datePreset.value === 'custom'
      ? (customStart.value && customEnd.value ? {
          start: new Date(`${customStart.value}T00:00:00`).toISOString(),
          end: new Date(`${customEnd.value}T23:59:59`).toISOString()
        } : null)
      : getPresetRange()

    if (range) {
      params.set('begin_time', range.start.toISOString())
      params.set('end_time', range.end.toISOString())
    }

    const url = params.toString() ? `/api/square/payments?${params.toString()}` : '/api/square/payments'
    const response = await fetch(url, { headers })
    
    if (!response.ok) {
      throw new Error('Failed to fetch transactions')
    }
    
    transactions.value = await response.json()
  } catch (error) {
    transactionsError.value = error instanceof Error ? error.message : 'Failed to load transactions'
    console.error('Error loading transactions:', error)
  } finally {
    loadingTransactions.value = false
  }
}


const exportTransactions = () => {
  if (transactions.value.length === 0) return

  const headers = [
    'Type',
    'Date',
    'Status',
    'Amount',
    'Fee',
    'Refunded',
    'Customer Name',
    'Customer Email',
    'Items',
    'Refund Reason',
    'Receipt Number',
    'Receipt URL',
    'Card Brand',
    'Card Last4'
  ]

  const rows = transactions.value.map((txn) => {
    const createdAt = txn.created_at ? new Date(txn.created_at).toISOString() : ''
    const amount = txn.amount_money?.amount ? (txn.amount_money.amount / 100).toFixed(2) : ''
    const fee = txn.processing_fee?.amount ? (txn.processing_fee.amount / 100).toFixed(2) : ''
    const refunded = txn.total_refunded ? (txn.total_refunded / 100).toFixed(2) : ''
    const items = txn.order_items && txn.order_items.length > 0
      ? txn.order_items.map((item) => `${item.quantity || ''}x ${item.name || ''}`.trim()).join(' | ')
      : ''

    return [
      txn.transaction_type || 'payment',
      createdAt,
      txn.status || '',
      amount,
      fee,
      refunded,
      txn.customer_name || '',
      txn.buyer_email || '',
      items,
      txn.refund_reason || '',
      txn.receipt_number || '',
      txn.receipt_url || '',
      txn.card_details?.brand || '',
      txn.card_details?.last4 || ''
    ]
  })

  const escapeCell = (value: string) => {
    const safeValue = value ?? ''
    if (safeValue.includes('"') || safeValue.includes(',') || safeValue.includes('\n')) {
      return `"${safeValue.replace(/"/g, '""')}"`
    }
    return safeValue
  }

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => escapeCell(String(cell))).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `square-transactions-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const totalAmount = computed(() =>
  transactions.value
    .filter((txn) => txn.transaction_type !== 'refund' && txn.status === 'COMPLETED')
    .reduce((sum, txn) => {
      const gross = txn.total_money?.amount ?? txn.amount_money?.amount ?? 0
      return sum + gross
    }, 0)
)

const totalFees = computed(() =>
  transactions.value
    .filter((txn) => txn.transaction_type !== 'refund' && txn.status === 'COMPLETED')
    .reduce((sum, txn) => sum + (txn.processing_fee?.amount || 0), 0)
)

const totalGross = computed(() => totalAmount.value - totalFees.value)

const totalRefunds = computed(() =>
  transactions.value
    .filter((txn) => txn.transaction_type === 'refund' && txn.status === 'COMPLETED')
    .reduce((sum, txn) => sum + (txn.amount_money?.amount || 0), 0)
)

const totalNet = computed(() => totalGross.value - totalRefunds.value)

const formatCurrency = (amount: number): string => {
  return (amount / 100).toFixed(2)
}

onMounted(() => {
  applyDatePreset()
  loadTransactions()
})
</script>
