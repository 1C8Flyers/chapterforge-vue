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
            <button
              @click="activeTab = 'balance'"
              :class="[
                'px-4 py-3 text-sm font-medium border-b-2 transition',
                activeTab === 'balance'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              ]"
            >
              Account Balance
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
            <button
              @click="loadTransactions"
              :disabled="loadingTransactions"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {{ loadingTransactions ? 'Loading...' : 'Refresh' }}
            </button>
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
                  <th class="px-4 py-3 text-left text-gray-700 font-semibold dark:text-gray-300">Date</th>
                  <th class="px-4 py-3 text-left text-gray-700 font-semibold dark:text-gray-300">Payment ID</th>
                  <th class="px-4 py-3 text-right text-gray-700 font-semibold dark:text-gray-300">Amount</th>
                  <th class="px-4 py-3 text-right text-gray-700 font-semibold dark:text-gray-300">Square Fee</th>
                  <th class="px-4 py-3 text-left text-gray-700 font-semibold dark:text-gray-300">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="txn in transactions" :key="txn.id" class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td class="px-4 py-3 text-gray-800 dark:text-gray-300">
                    {{ new Date(txn.created_at).toLocaleDateString() }} {{ new Date(txn.created_at).toLocaleTimeString() }}
                  </td>
                  <td class="px-4 py-3 text-gray-800 dark:text-gray-300 font-mono text-xs">{{ txn.id.substring(0, 12) }}...</td>
                  <td class="px-4 py-3 text-right text-gray-800 dark:text-gray-300">
                    <span v-if="txn.amount_money && txn.amount_money.amount">
                      ${{ (txn.amount_money.amount / 100).toFixed(2) }}
                    </span>
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
                      txn.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    ]">
                      {{ txn.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Balance Tab -->
        <div v-if="activeTab === 'balance'" class="p-6">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Account Balance</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Current Square account balance
              </p>
            </div>
            <button
              @click="loadBalance"
              :disabled="loadingBalance"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {{ loadingBalance ? 'Loading...' : 'Refresh' }}
            </button>
          </div>

          <div v-if="balanceError" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
            <p class="text-red-700 dark:text-red-300">{{ balanceError }}</p>
          </div>

          <div v-if="loadingBalance" class="text-center py-8">
            <p class="text-gray-500">Loading balance...</p>
          </div>

          <div v-else-if="balance" class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-green-100 p-6 dark:border-gray-700 dark:from-green-900/20 dark:to-green-900/10">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Available Balance</p>
              <p class="text-3xl font-bold text-green-700 dark:text-green-400 mt-2">
                ${{ formatBalance(balance.available_amount) }}
              </p>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 dark:border-gray-700 dark:from-blue-900/20 dark:to-blue-900/10">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Balance</p>
              <p class="text-3xl font-bold text-blue-700 dark:text-blue-400 mt-2">
                ${{ formatBalance(balance.pending_amount) }}
              </p>
            </div>

            <div class="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6 dark:border-gray-700 dark:from-purple-900/20 dark:to-purple-900/10">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Balance</p>
              <p class="text-3xl font-bold text-purple-700 dark:text-purple-400 mt-2">
                ${{ formatBalance(balance.available_amount + balance.pending_amount) }}
              </p>
            </div>
          </div>

          <div v-if="balance && balance.details" class="mt-6 rounded-lg border border-gray-200 p-6 dark:border-gray-700">
            <h4 class="text-sm font-semibold text-gray-800 dark:text-white mb-4">Balance Details</h4>
            <div class="space-y-3">
              <div v-for="detail in balance.details" :key="detail.currency" class="flex items-center justify-between">
                <span class="text-gray-600 dark:text-gray-400">{{ detail.currency }}</span>
                <div class="text-right">
                  <p class="font-semibold text-gray-800 dark:text-white">${{ formatBalance(detail.amount) }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'

interface Transaction {
  id: string
  created_at: string
  amount_money: { amount: number; currency: string }
  processing_fee?: { amount: number; currency: string }
  status: string
}

interface BalanceAmount {
  amount: number
  currency: string
}

interface BalanceDetail {
  amount: number
  currency: string
}

interface Balance {
  available_amount: number
  pending_amount: number
  details: BalanceDetail[]
}

const { currentUser, getAuthHeaders } = useAuth()

const activeTab = ref<'transactions' | 'balance'>('transactions')
const transactions = ref<Transaction[]>([])
const balance = ref<Balance | null>(null)
const loadingTransactions = ref(false)
const loadingBalance = ref(false)
const transactionsError = ref('')
const balanceError = ref('')

const loadTransactions = async () => {
  if (!currentUser.value) return
  
  loadingTransactions.value = true
  transactionsError.value = ''
  
  try {
    const headers = await getAuthHeaders()
    const response = await fetch('/api/square/payments', { headers })
    
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

const loadBalance = async () => {
  if (!currentUser.value) return
  
  loadingBalance.value = true
  balanceError.value = ''
  
  try {
    const headers = await getAuthHeaders()
    const response = await fetch('/api/square/balance', { headers })
    
    if (!response.ok) {
      throw new Error('Failed to fetch balance')
    }
    
    balance.value = await response.json()
  } catch (error) {
    balanceError.value = error instanceof Error ? error.message : 'Failed to load balance'
    console.error('Error loading balance:', error)
  } finally {
    loadingBalance.value = false
  }
}

const formatBalance = (amount: number): string => {
  return (amount / 100).toFixed(2)
}

onMounted(() => {
  loadTransactions()
  loadBalance()
})
</script>
