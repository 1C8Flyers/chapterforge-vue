<template>
  <AdminLayout>
    <PageBreadcrumb pageTitle="Renewal Payments" />

    <!-- Manual Payment Entry Form -->
    <div class="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950">
      <h3 class="mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100">Record Manual Payment</h3>
      <div class="grid gap-3 sm:grid-cols-5">
        <div class="relative">
          <label class="block text-xs font-medium text-blue-800 dark:text-blue-200">Member</label>
          <input
            v-model="memberSearch"
            type="text"
            placeholder="Search member..."
            class="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-blue-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
          <div v-if="memberSearch && filteredMembersForSearch.length > 0" class="absolute top-full left-0 right-0 z-10 mt-1 max-h-40 overflow-y-auto rounded-lg border border-blue-300 bg-white shadow-lg dark:border-blue-700 dark:bg-gray-900">
            <div
              v-for="member in filteredMembersForSearch"
              :key="member.MemberID"
              @click="selectMember(member)"
              class="cursor-pointer border-b border-blue-200 px-3 py-2 text-sm text-gray-800 hover:bg-blue-100 dark:border-blue-800 dark:text-white/90 dark:hover:bg-blue-900"
            >
              {{ member.FirstName }} {{ member.LastName }} (#{{ member.MemberID }})
            </div>
          </div>
          <div v-if="manualPayment.memberId" class="mt-1 text-xs text-blue-700 dark:text-blue-300">
            Selected: {{ getMemberName(manualPayment.memberId) }}
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-blue-800 dark:text-blue-200">Year</label>
          <input
            v-model="manualPayment.year"
            type="number"
            placeholder="2026"
            class="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-blue-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-blue-800 dark:text-blue-200">Amount</label>
          <input
            v-model="manualPayment.amount"
            type="number"
            placeholder="$0.00"
            step="0.01"
            class="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-blue-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-blue-800 dark:text-blue-200">Method</label>
          <select
            v-model="manualPayment.method"
            class="mt-1 w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-blue-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="transfer">Transfer</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="flex items-end">
          <button
            @click="recordManualPayment"
            :disabled="recordingPayment || !manualPayment.memberId || !manualPayment.year || !manualPayment.amount"
            class="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {{ recordingPayment ? 'Recording...' : 'Record Payment' }}
          </button>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="border-b border-gray-200 p-6 dark:border-gray-800">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Payment History</h3>
          <button
            @click="refreshPayments"
            :disabled="loading"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
        
        <!-- Filter Options -->
        <div class="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Member ID</label>
            <input
              v-model="filters.memberId"
              type="number"
              placeholder="Filter by member..."
              class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Provider</label>
            <select
              v-model="filters.provider"
              class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              <option value="">All Providers</option>
              <option value="square">Square</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Year</label>
            <input
              v-model="filters.year"
              type="number"
              placeholder="Filter by year..."
              class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
            />
          </div>
        </div>
      </div>
      
      <!-- Payments Table -->
      <div class="overflow-x-auto p-6">
        <div v-if="loading" class="text-center text-gray-500 dark:text-gray-400">
          Loading payments...
        </div>
        <div v-else-if="filteredPayments.length === 0" class="text-center text-gray-500 dark:text-gray-400">
          No payments found
        </div>
        <table v-else class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Payment ID</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Member ID</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Year</th>
              <th class="px-4 py-3 text-right text-sm font-semibold text-gray-800 dark:text-white/90">Dues</th>
              <th class="px-4 py-3 text-right text-sm font-semibold text-gray-800 dark:text-white/90">Fee</th>
              <th class="px-4 py-3 text-right text-sm font-semibold text-gray-800 dark:text-white/90">Total</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Provider</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Status</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Date</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Provider Payment ID</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="payment in filteredPayments"
              :key="payment.PaymentID"
              class="border-b border-gray-200 dark:border-gray-800"
            >
              <td class="px-4 py-4 text-sm text-gray-800 dark:text-white/90">{{ payment.PaymentID }}</td>
              <td class="px-4 py-4 text-sm text-gray-800 dark:text-white/90">
                <div v-if="payment.MemberID > 0">{{ getMemberName(payment.MemberID) }}</div>
                <div v-else class="text-gray-400 italic">unmatched</div>
              </td>
              <td class="px-4 py-4 text-sm text-gray-800 dark:text-white/90">
                <span v-if="payment.Year > 0">{{ payment.Year }}</span>
                <span v-else class="text-gray-400 italic">-</span>
              </td>
              <td class="px-4 py-4 text-right text-sm font-medium text-gray-800 dark:text-white/90">
                ${{ (payment.DuesAmount || 0).toFixed(2) }}
              </td>
              <td class="px-4 py-4 text-right text-sm font-medium text-gray-800 dark:text-white/90">
                ${{ (payment.SquareFee || 0).toFixed(2) }}
              </td>
              <td class="px-4 py-4 text-right text-sm font-semibold text-gray-800 dark:text-white/90">
                ${{ payment.Amount.toFixed(2) }}
              </td>
              <td class="px-4 py-4">
                <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="payment.Provider === 'square' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  ">
                  {{ payment.Provider }}
                </span>
              </td>
              <td class="px-4 py-4">
                <span class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                  :class="payment.ProviderStatus === 'COMPLETED' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400'
                    : payment.ProviderStatus === 'APPROVED'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'
                  ">
                  {{ payment.ProviderStatus || 'Pending' }}
                </span>
              </td>
              <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                {{ formatDate(payment.CreatedAt) }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono text-xs">
                <span v-if="payment.ProviderPaymentId">{{ payment.ProviderPaymentId.substring(0, 12) }}...</span>
                <span v-else class="text-gray-400">-</span>
              </td>
                <td class="px-4 py-4 text-sm text-gray-800 dark:text-white/90">
                  <div class="flex flex-wrap gap-2">
                    <button
                      @click="openEdit(payment)"
                      class="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      @click="confirmDelete(payment)"
                      class="rounded-md bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Payment Modal -->
    <div
      v-if="editModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="editModalOpen = false"
    >
      <div class="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Edit Payment #{{ editForm.paymentId }}</h3>
          <button @click="editModalOpen = false" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Member ID</label>
            <input v-model="editForm.memberId" type="number" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90" />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Assign to a different member if needed.</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Year</label>
            <input v-model="editForm.year" type="number" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Dues Amount</label>
            <input v-model="editForm.duesAmount" type="number" step="0.01" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Square Fee</label>
            <input v-model="editForm.squareFee" type="number" step="0.01" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Total Amount</label>
            <input v-model="editForm.amount" type="number" step="0.01" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90" />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ formatTotalAmount() }}</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Method</label>
            <select v-model="editForm.method" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
              <option value="manual">manual</option>
              <option value="cash">cash</option>
              <option value="check">check</option>
              <option value="transfer">transfer</option>
              <option value="square">square</option>
              <option value="other">other</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Provider</label>
            <input v-model="editForm.provider" type="text" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Provider Status</label>
            <select v-model="editForm.providerStatus" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90">
              <option value="">(leave as-is)</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="PENDING">PENDING</option>
              <option value="CANCELED">CANCELED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Provider Payment ID</label>
            <input v-model="editForm.providerPaymentId" type="text" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Provider Order ID</label>
            <input v-model="editForm.providerOrderId" type="text" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Provider Invoice ID</label>
            <input v-model="editForm.providerInvoiceId" type="text" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 dark:text-gray-300">Provider Link ID</label>
            <input v-model="editForm.providerLinkId" type="text" class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90" />
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button @click="editModalOpen = false" class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-white/90 dark:hover:bg-gray-800">Cancel</button>
          <button @click="saveEdit" class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { useAuth } from '@/composables/useAuth'
import { getAuthHeaders, apiFetch, AuthError } from '@/utils/apiAuth'

const router = useRouter()

interface Payment {
  PaymentID: number
  MemberID: number
  Year: number
  Amount: number
  Provider: string
  Method: string
  ProviderStatus: string | null
  ProviderPaymentId: string | null
  ProviderOrderId: string | null
  ProviderInvoiceId: string | null
  ProviderLinkId: string | null
  DuesAmount: number
  SquareFee: number
  CreatedAt: string
}

interface Member {
  MemberID: number
  FirstName: string
  LastName: string
}

const { currentUser } = useAuth()

const payments = ref<Payment[]>([])
const members = ref<Map<number, string>>(new Map())
const allMembers = ref<Member[]>([])
const memberSearch = ref('')
const loading = ref(false)
const recordingPayment = ref(false)
const manualPayment = ref({
  memberId: '',
  year: new Date().getFullYear(),
  amount: '',
  duesAmount: '',
  squareFee: '',
  method: 'cash'
})
const filters = ref({
  memberId: '',
  provider: '',
  year: ''
})

const editModalOpen = ref(false)
const editForm = ref({
  paymentId: 0,
  memberId: '',
  year: new Date().getFullYear().toString(),
  amount: '',
  duesAmount: '',
  squareFee: '',
  method: 'manual',
  provider: '',
  providerStatus: '',
  providerPaymentId: '',
  providerOrderId: '',
  providerInvoiceId: '',
  providerLinkId: ''
})

const getAuthHeaders = async () => {
  const user = currentUser.value
  if (!user) {
    throw new Error('User not authenticated')
  }
  const token = await user.getIdToken()
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

const fetchMembers = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/members', { headers })
    
    if (!response.ok) throw new Error('Failed to fetch members')
    
    const data = await response.json() as Member[]
    allMembers.value = data
    const memberMap = new Map<number, string>()
    data.forEach(member => {
      const memberId = typeof member.MemberID === 'string' ? parseInt(member.MemberID, 10) : member.MemberID
      memberMap.set(memberId, `${member.FirstName} ${member.LastName}`)
    })
    members.value = memberMap
    console.log('Members loaded:', memberMap.size, 'members')
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching members:', error)
    }
  }
}

const fetchPayments = async () => {
  try {
    loading.value = true
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/payments', { headers })
    
    if (!response.ok) throw new Error('Failed to fetch payments')
    
    const data = await response.json()
    payments.value = data
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching payments:', error)
    }
  } finally {
    loading.value = false
  }
}

const filteredPayments = computed(() => {
  return payments.value.filter(payment => {
    if (filters.value.memberId && payment.MemberID !== Number(filters.value.memberId)) {
      return false
    }
    if (filters.value.provider && payment.Provider !== filters.value.provider) {
      return false
    }
    if (filters.value.year && payment.Year !== Number(filters.value.year)) {
      return false
    }
    return true
  }).sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime())
})

const refreshPayments = () => {
  fetchPayments()
}

const filteredMembersForSearch = computed(() => {
  if (!memberSearch.value) return []
  const search = memberSearch.value.toLowerCase()
  return allMembers.value.filter(member =>
    `${member.FirstName} ${member.LastName}`.toLowerCase().includes(search) ||
    member.MemberID.toString().includes(search)
  )
})

const selectMember = (member: Member) => {
  manualPayment.value.memberId = member.MemberID.toString()
  memberSearch.value = ''
}

const recordManualPayment = async () => {
  try {
    recordingPayment.value = true
    const memberId = Number(manualPayment.value.memberId)
    const year = Number(manualPayment.value.year)
    const amount = Number(manualPayment.value.amount)

    if (!memberId || !year || !amount) {
      alert('Please fill in all fields')
      return
    }

    const headers = await getAuthHeaders()
    const response = await apiFetch(`/api/members/${memberId}/payments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        Year: year,
        Amount: amount,
        DuesAmount: Number(manualPayment.value.duesAmount) || 0,
        SquareFee: Number(manualPayment.value.squareFee) || 0,
        Method: manualPayment.value.method
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to record payment')
    }

    alert('Payment recorded successfully!')
    manualPayment.value = {
      memberId: '',
      year: new Date().getFullYear(),
      amount: '',
      duesAmount: '',
      squareFee: '',
      method: 'cash'
    }
    await fetchPayments()
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Error recording payment:', error)
    }
  } finally {
    recordingPayment.value = false
  }
}

const openEdit = (payment: Payment) => {
  editForm.value = {
    paymentId: payment.PaymentID,
    memberId: payment.MemberID ? payment.MemberID.toString() : '',
    year: payment.Year ? payment.Year.toString() : '',
    amount: payment.Amount?.toString() || '',
    duesAmount: (payment.DuesAmount || 0).toString(),
    squareFee: (payment.SquareFee || 0).toString(),
    method: payment.Method || payment.Provider || 'manual',
    provider: payment.Provider || '',
    providerStatus: payment.ProviderStatus || '',
    providerPaymentId: payment.ProviderPaymentId || '',
    providerOrderId: payment.ProviderOrderId || '',
    providerInvoiceId: payment.ProviderInvoiceId || '',
    providerLinkId: payment.ProviderLinkId || ''
  }
  editModalOpen.value = true
}

const saveEdit = async () => {
  try {
    const headers = await getAuthHeaders()
    const body = {
      MemberID: editForm.value.memberId ? Number(editForm.value.memberId) : null,
      Year: Number(editForm.value.year),
      Amount: Number(editForm.value.amount),
      DuesAmount: Number(editForm.value.duesAmount) || 0,
      SquareFee: Number(editForm.value.squareFee) || 0,
      Method: editForm.value.method,
      Provider: editForm.value.provider || null,
      ProviderStatus: editForm.value.providerStatus || null,
      ProviderPaymentId: editForm.value.providerPaymentId || null,
      ProviderOrderId: editForm.value.providerOrderId || null,
      ProviderInvoiceId: editForm.value.providerInvoiceId || null,
      ProviderLinkId: editForm.value.providerLinkId || null
    }

    const response = await apiFetch(`/api/payments/${editForm.value.paymentId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to update payment')
    }

    editModalOpen.value = false
    await fetchPayments()
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      alert(`Error updating payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Error updating payment:', error)
    }
  }
}

const confirmDelete = async (payment: Payment) => {
  const ok = window.confirm(`Delete payment #${payment.PaymentID}? This cannot be undone.`)
  if (!ok) return
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch(`/api/payments/${payment.PaymentID}`, {
      method: 'DELETE',
      headers
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to delete payment')
    }
    await fetchPayments()
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      alert(`Error deleting payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
      console.error('Error deleting payment:', error)
    }
  }
}

const getMemberName = (memberId: number) => {
  if (!memberId || memberId <= 0) return 'Unknown'
  const name = members.value.get(memberId)
  if (name) return name
  console.warn('Member not found:', memberId, 'Available IDs:', Array.from(members.value.keys()))
  return `Member #${memberId}`
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatTotalAmount = () => {
  const dues = Number(editForm.value.duesAmount) || 0
  const fee = Number(editForm.value.squareFee) || 0
  const total = dues + fee
  if (total > 0) {
    return `(calculated: $${total.toFixed(2)})`
  }
  return ''
}

onMounted(async () => {
  await fetchMembers()
  await fetchPayments()
})
</script>
