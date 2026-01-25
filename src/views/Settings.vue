<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    
    <!-- Settings Tabs -->
    <div class="mb-6 border-b border-gray-200 dark:border-gray-800">
      <div class="flex gap-4">
        <button
          @click="activeTab = 'member-types'"
          :class="[
            'px-4 py-3 text-sm font-medium border-b-2 transition',
            activeTab === 'member-types'
              ? 'border-brand-500 text-brand-500 dark:text-brand-400'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
        >
          Member Types
        </button>
        <button
          @click="activeTab = 'email-template'"
          :class="[
            'px-4 py-3 text-sm font-medium border-b-2 transition',
            activeTab === 'email-template'
              ? 'border-brand-500 text-brand-500 dark:text-brand-400'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
        >
          Email Template
        </button>
        <button
          @click="activeTab = 'users'"
          :class="[
            'px-4 py-3 text-sm font-medium border-b-2 transition',
            activeTab === 'users'
              ? 'border-brand-500 text-brand-500 dark:text-brand-400'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
        >
          User Management
        </button>
        <button
          @click="activeTab = 'payments'"
          :class="[
            'px-4 py-3 text-sm font-medium border-b-2 transition',
            activeTab === 'payments'
              ? 'border-brand-500 text-brand-500 dark:text-brand-400'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
        >
          Payment Settings
        </button>
        <button
          @click="activeTab = 'timezone'"
          :class="[
            'px-4 py-3 text-sm font-medium border-b-2 transition',
            activeTab === 'timezone'
              ? 'border-brand-500 text-brand-500 dark:text-brand-400'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
        >
          Timezone
        </button>
      </div>
    </div>

    <!-- Timezone Tab -->
    <div v-if="activeTab === 'timezone'" class="space-y-6">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Timezone Settings</h3>
          <button
            @click="saveTimezoneSettings"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            :disabled="savingTimezoneSettings"
          >
            {{ savingTimezoneSettings ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>

        <div class="space-y-3 text-sm text-gray-700 dark:text-gray-200">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Application Timezone</label>
          <select
            v-model="timezoneSettings.timezone"
            class="h-11 w-full max-w-md rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Phoenix">Arizona (MT - No DST)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="America/Anchorage">Alaska Time (AKT)</option>
            <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
            <option value="UTC">UTC</option>
          </select>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            This timezone will be used for displaying dates and times throughout the application.
          </p>
        </div>
      </div>
    </div>

    <!-- Payments Tab -->
    <div v-if="activeTab === 'payments'" class="space-y-6">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Square Payment Settings</h3>
          <button
            @click="savePaymentSettings"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            :disabled="savingPaymentSettings"
          >
            {{ savingPaymentSettings ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>

        <div class="space-y-3 text-sm text-gray-700 dark:text-gray-200">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Processing Fee Amount (USD)</label>
          <input
            v-model.number="paymentSettings.squareFeeAmount"
            type="number"
            min="0"
            step="0.01"
            class="h-11 w-full max-w-xs rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
          <p class="text-xs text-gray-500 dark:text-gray-400">
            This fee is added to Square payment links sent in renewal emails and manual link generation.
          </p>
        </div>
      </div>
    </div>

    <!-- Member Types Tab -->
    <div v-if="activeTab === 'member-types'" class="space-y-6">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-6 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Member Types</h3>
          <button
            @click="openMemberTypeModal"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Add Member Type
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Name</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Dues Rate</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Sort Order</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-gray-800 dark:text-white/90">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="type in memberTypes"
                :key="type.MemberTypeID"
                class="border-b border-gray-200 dark:border-gray-800"
              >
                <td class="px-4 py-4 text-sm text-gray-800 dark:text-white/90">{{ type.Name }}</td>
                <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">${{ type.DuesRate.toFixed(2) }}</td>
                <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{{ type.SortOrder }}</td>
                <td class="px-4 py-4 text-right text-sm">
                  <button
                    @click="editMemberType(type)"
                    class="mr-3 text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteMemberType(type.MemberTypeID)"
                    class="text-red-500 hover:text-red-600 dark:text-red-400"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Email Template Tab -->
    <div v-if="activeTab === 'email-template'" class="space-y-6">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Renewal Notice Email Template</h3>
        
        <div class="mb-4 space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Subject
            </label>
            <input
              v-model="emailTemplate.Subject"
              type="text"
              class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Email Body
            </label>
            <QuillEditor
              v-model:content="emailTemplate.HtmlBody"
              contentType="html"
              theme="snow"
              class="rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden"
            />
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Available placeholders: &#123;&#123;FirstName&#125;&#125;, &#123;&#123;LastName&#125;&#125;, &#123;&#123;EAANumber&#125;&#125;, &#123;&#123;MemberType&#125;&#125;, &#123;&#123;DuesRate&#125;&#125;, &#123;&#123;Year&#125;&#125;, &#123;&#123;ChapterName&#125;&#125;, &#123;&#123;ChapterEmail&#125;&#125;, &#123;&#123;AdditionalFamilyMembers&#125;&#125;
            </p>
          </div>

          <div class="flex gap-2">
            <button
              @click="previewEmailTemplate"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Preview
            </button>
            <button
              @click="saveEmailTemplate"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Save Template
            </button>
          </div>
        </div>
      </div>

      <!-- Email Preview Modal -->
      <div
        v-if="showPreview"
        class="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
        @click.self="showPreview = false"
      >
        <div class="w-full max-w-2xl my-8 rounded-xl bg-white p-6 dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
          <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">Email Preview</h3>
          
          <div class="mb-4 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
            <p class="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Subject:</p>
            <p class="text-gray-800 dark:text-white">{{ previewData.Subject }}</p>
          </div>

          <div class="rounded-lg border border-gray-300 p-4 dark:border-gray-700">
            <div v-html="previewData.HtmlBody" class="prose prose-sm dark:prose-invert max-w-none"></div>
          </div>

          <div class="mt-6 flex justify-end">
            <button
              @click="showPreview = false"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- User Management Tab -->
    <div v-if="activeTab === 'users'" class="space-y-6">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-6 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">User Access</h3>
          <button
            @click="openAddUserModal"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Add User
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Email</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Role</th>
                <th class="px-4 py-3 text-right text-sm font-semibold text-gray-800 dark:text-white/90">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in users"
                :key="user.Email"
                class="border-b border-gray-200 dark:border-gray-800"
              >
                <td class="px-4 py-4 text-sm text-gray-800 dark:text-white/90">{{ user.Email }}</td>
                <td class="px-4 py-4 text-sm">
                  <span v-if="user.Role === 'admin'" class="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">Admin</span>
                  <span v-else class="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">User</span>
                </td>
                <td class="px-4 py-4 text-right text-sm">
                  <button
                    @click="editUser(user)"
                    class="mr-3 text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteUser(user.Email)"
                    class="text-red-500 hover:text-red-600 dark:text-red-400"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="users.length === 0" class="py-8 text-center text-gray-500">
            No users configured yet
          </div>
        </div>
      </div>
    </div>

    <!-- Member Type Modal -->
    <div
      v-if="showMemberTypeModal"
      class="fixed inset-0 z-99999 flex items-center justify-center bg-black/50"
      @click.self="closeMemberTypeModal"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 dark:bg-gray-900">
        <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {{ editingMemberTypeId ? 'Edit' : 'Add' }} Member Type
        </h3>

        <form @submit.prevent="saveMemberType">
          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Name<span class="text-red-500">*</span>
              </label>
              <input
                v-model="memberTypeForm.Name"
                type="text"
                required
                class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Dues Rate<span class="text-red-500">*</span>
              </label>
              <input
                v-model.number="memberTypeForm.DuesRate"
                type="number"
                step="0.01"
                required
                class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Sort Order
              </label>
              <input
                v-model.number="memberTypeForm.SortOrder"
                type="number"
                class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              @click="closeMemberTypeModal"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              {{ editingMemberTypeId ? 'Update' : 'Add' }} Member Type
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- User Modal -->
    <div
      v-if="showUserModal"
      class="fixed inset-0 z-99999 flex items-center justify-center bg-black/50"
      @click.self="closeUserModal"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 dark:bg-gray-900">
        <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {{ editingUserEmail ? 'Edit' : 'Add' }} User
        </h3>

        <form @submit.prevent="saveUser">
          <div class="space-y-4">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Email<span class="text-red-500">*</span>
              </label>
              <input
                v-model="userForm.email"
                type="email"
                required
                :disabled="!!editingUserEmail"
                class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Link Member
              </label>
              <select
                v-model.number="userForm.memberId"
                class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option :value="null">-- No Member Link --</option>
                <option v-for="member in members" :key="member.MemberID" :value="member.MemberID">
                  {{ member.FirstName }} {{ member.LastName }} ({{ member.Email }})
                </option>
              </select>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Role<span class="text-red-500">*</span>
              </label>
              <select
                v-model="userForm.role"
                required
                class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              @click="closeUserModal"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              {{ editingUserEmail ? 'Update' : 'Add' }} User
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { getAuthHeaders, apiFetch, AuthError } from '@/utils/apiAuth'

const router = useRouter()

const currentPageTitle = ref('Settings')
const activeTab = ref('member-types')
const memberTypes = ref<any[]>([])
const members = ref<any[]>([])
const showMemberTypeModal = ref(false)
const editingMemberTypeId = ref<number | null>(null)
const showPreview = ref(false)
const users = ref<any[]>([])
const showUserModal = ref(false)
const editingUserEmail = ref<string | null>(null)
const paymentSettings = ref({ squareFeeAmount: 1 })
const savingPaymentSettings = ref(false)
const timezoneSettings = ref({ timezone: 'America/Chicago' })
const savingTimezoneSettings = ref(false)

const memberTypeForm = ref({
  Name: '',
  DuesRate: 0,
  SortOrder: 0
})

const userForm = ref({
  email: '',
  role: 'user',
  memberId: null as number | null
})
const emailTemplate = ref({
  Subject: '',
  HtmlBody: ''
})

const previewData = ref({
  Subject: '',
  HtmlBody: ''
})

const fetchMemberTypes = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/member-types', { headers })
    if (response.ok) {
      memberTypes.value = await response.json()
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching member types:', error)
    }
  }
}

const fetchMembers = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/members', { headers })
    if (response.ok) {
      members.value = await response.json()
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching members:', error)
    }
  }
}

const fetchTimezoneSettings = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/timezone', { headers })
    if (response.ok) {
      const data = await response.json()
      timezoneSettings.value.timezone = data.timezone || 'America/Chicago'
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching timezone settings:', error)
    }
  }
}

const saveTimezoneSettings = async () => {
  try {
    savingTimezoneSettings.value = true
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/timezone', {
      method: 'POST',
      headers,
      body: JSON.stringify({ timezone: timezoneSettings.value.timezone })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save timezone settings')
    }
    alert('Timezone settings saved')
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error saving timezone settings:', error)
      alert(error instanceof Error ? error.message : 'Failed to save timezone settings')
    }
  } finally {
    savingTimezoneSettings.value = false
  }
}

const fetchPaymentSettings = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/payments', { headers })
    if (response.ok) {
      const data = await response.json()
      paymentSettings.value.squareFeeAmount = Number(data.squareFeeAmount ?? 1)
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching payment settings:', error)
    }
  }
}

const fetchEmailTemplate = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/email-template', { headers })
    if (response.ok) {
      const data = await response.json()
      // Backend returns lowercase keys: subject, body
      emailTemplate.value = {
        Subject: data.subject || '',
        HtmlBody: data.body || ''
      }
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching email template:', error)
    }
  }
}

const openMemberTypeModal = () => {
  editingMemberTypeId.value = null
  memberTypeForm.value = { Name: '', DuesRate: 0, SortOrder: 0 }
  showMemberTypeModal.value = true
}

const editMemberType = (type: any) => {
  editingMemberTypeId.value = type.MemberTypeID
  memberTypeForm.value = {
    Name: type.Name,
    DuesRate: type.DuesRate,
    SortOrder: type.SortOrder
  }
  showMemberTypeModal.value = true
}

const closeMemberTypeModal = () => {
  showMemberTypeModal.value = false
  memberTypeForm.value = { Name: '', DuesRate: 0, SortOrder: 0 }
}

const saveMemberType = async () => {
  try {
    const headers = await getAuthHeaders()
    const url = editingMemberTypeId.value
      ? `/api/settings/member-types/${editingMemberTypeId.value}`
      : '/api/settings/member-types'
    const method = editingMemberTypeId.value ? 'PUT' : 'POST'

    const response = await apiFetch(url, {
      method,
      headers,
      body: JSON.stringify(memberTypeForm.value)
    })

    if (response.ok) {
      await fetchMemberTypes()
      closeMemberTypeModal()
    } else {
      const error = await response.json()
      alert(error.error || 'Failed to save member type')
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error saving member type:', error)
      alert('Failed to save member type')
    }
  }
}

const deleteMemberType = async (id: number) => {
  if (!confirm('Are you sure you want to delete this member type?')) return

  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch(`/api/settings/member-types/${id}`, {
      method: 'DELETE',
      headers
    })

    if (response.ok) {
      await fetchMemberTypes()
    } else {
      const error = await response.json()
      alert(error.error || 'Failed to delete member type')
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error deleting member type:', error)
      alert('Failed to delete member type')
    }
  }
}

const saveEmailTemplate = async () => {
  try {
    const headers = await getAuthHeaders()
    // Strip formatting before saving - remove extra whitespace
    const minifiedHtml = emailTemplate.value.HtmlBody
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('')
    
    const response = await apiFetch('/api/settings/email-template', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        subject: emailTemplate.value.Subject,
        body: minifiedHtml
      })
    })

    if (response.ok) {
      alert('Email template saved successfully')
    } else {
      const error = await response.json()
      alert(error.error || 'Failed to save email template')
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error saving email template:', error)
      alert('Failed to save email template')
    }
  }
}

const savePaymentSettings = async () => {
  try {
    savingPaymentSettings.value = true
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/payments', {
      method: 'POST',
      headers,
      body: JSON.stringify({ squareFeeAmount: paymentSettings.value.squareFeeAmount })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save payment settings')
    }
    alert('Payment settings saved')
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error saving payment settings:', error)
      alert(error instanceof Error ? error.message : 'Failed to save payment settings')
    }
  } finally {
    savingPaymentSettings.value = false
  }
}

const previewEmailTemplate = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/email-template/preview', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        Subject: emailTemplate.value.Subject,
        HtmlBody: emailTemplate.value.HtmlBody
      })
    })

    if (response.ok) {
      const data = await response.json()
      previewData.value = {
        Subject: data.subject || emailTemplate.value.Subject,
        HtmlBody: data.html || data.body || emailTemplate.value.HtmlBody
      }
      showPreview.value = true
    } else {
      const error = await response.json()
      alert(error.error || 'Failed to preview email template')
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error previewing email template:', error)
      alert('Failed to preview email template')
    }
  }
}

const fetchUsers = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/users', { headers })
    if (response.ok) {
      users.value = await response.json()
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching users:', error)
    }
  }
}

const openAddUserModal = () => {
  editingUserEmail.value = null
  userForm.value = { email: '', role: 'user', memberId: null }
  showUserModal.value = true
}

const editUser = (user: any) => {
  editingUserEmail.value = user.Email
  userForm.value = {
    email: user.Email,
    role: user.Role,
    memberId: user.MemberID || null
  }
  showUserModal.value = true
}

const closeUserModal = () => {
  showUserModal.value = false
  userForm.value = { email: '', role: 'user', memberId: null }
}

const saveUser = async () => {
  try {
    const headers = await getAuthHeaders()
    const url = editingUserEmail.value
      ? `/api/users/${encodeURIComponent(editingUserEmail.value)}`
      : '/api/users'
    const method = editingUserEmail.value ? 'PUT' : 'POST'

    const response = await apiFetch(url, {
      method,
      headers,
      body: JSON.stringify({
        email: userForm.value.email,
        role: userForm.value.role,
        memberId: userForm.value.memberId
      })
    })

    if (response.ok) {
      await fetchUsers()
      closeUserModal()
    } else {
      const error = await response.json()
      alert(error.error || 'Failed to save user')
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error saving user:', error)
      alert('Failed to save user')
    }
  }
}

const deleteUser = async (email: string) => {
  if (!confirm('Are you sure you want to remove this user?')) return

  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch(`/api/users/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers
    })

    if (response.ok) {
      await fetchUsers()
    } else {
      const error = await response.json()
      alert(error.error || 'Failed to remove user')
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error removing user:', error)
      alert('Failed to remove user')
    }
  }
}

onMounted(() => {
  fetchMemberTypes()
  fetchEmailTemplate()
  fetchMembers()
  fetchUsers()
  fetchPaymentSettings()
  fetchTimezoneSettings()
})
</script>
