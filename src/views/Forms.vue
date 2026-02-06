<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div class="mb-6 border-b border-gray-200 dark:border-gray-800">
      <div class="flex gap-4">
        <button
          @click="activeTab = 'responses'"
          :class="[
            'px-4 py-3 text-sm font-medium border-b-2 transition',
            activeTab === 'responses'
              ? 'border-brand-500 text-brand-500 dark:text-brand-400'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
        >
          Responses
        </button>
        <button
          @click="activeTab = 'settings'"
          :class="[
            'px-4 py-3 text-sm font-medium border-b-2 transition',
            activeTab === 'settings'
              ? 'border-brand-500 text-brand-500 dark:text-brand-400'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
        >
          Settings
        </button>
      </div>
    </div>

    <div v-if="activeTab === 'settings'" class="space-y-6">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Public Member Signup</h3>
          <button
            @click="savePublicSignupSettings"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            :disabled="savingPublicSignupSettings"
          >
            {{ savingPublicSignupSettings ? 'Saving...' : 'Save Settings' }}
          </button>
        </div>

        <div class="space-y-4 text-sm text-gray-700 dark:text-gray-200">
          <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              v-model="publicSignupSettings.enabled"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Enable public signup form
          </label>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Member Type</label>
              <select
                v-model="publicSignupSettings.defaultMemberType"
                class="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option v-for="type in memberTypes" :key="type.MemberTypeID" :value="type.Name">
                  {{ type.Name }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Notification Email</label>
              <input
                v-model="publicSignupSettings.notificationEmail"
                type="email"
                placeholder="notifications@example.com"
                class="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Optional. If set, a new signup notification will be emailed.</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Embed Snippet</label>
            <textarea
              readonly
              :value="publicSignupEmbedSnippet"
              class="mt-1 h-40 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-xs text-gray-800 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            ></textarea>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Copy and paste this HTML into your public website. Submissions will be sent to the configured endpoint.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'responses'" class="space-y-6">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Form Responses</h3>
          <button
            @click="fetchPublicSignups"
            class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200"
            :disabled="loadingPublicSignups"
          >
            {{ loadingPublicSignups ? 'Loading...' : 'Refresh' }}
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3">Received</th>
                <th class="px-4 py-3">Name</th>
                <th class="px-4 py-3">Email</th>
                <th class="px-4 py-3">Member Type</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loadingPublicSignups">
                <td colspan="6" class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Loading signups...</td>
              </tr>
              <tr v-else-if="publicSignups.length === 0">
                <td colspan="6" class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No signups yet.</td>
              </tr>
              <tr v-else v-for="signup in publicSignups" :key="signup.SignupID" class="border-b border-gray-100 dark:border-gray-800">
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ formatSignupDate(signup.CreatedAt) }}</td>
                <td class="px-4 py-3 text-sm text-gray-800 dark:text-white/90">{{ signup.FirstName }} {{ signup.LastName }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ signup.Email }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ signup.AssignedMemberType || '-' }}</td>
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ signup.Status || 'new' }}</td>
                <td class="px-4 py-3 text-right">
                  <button
                    class="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
                    @click="openSignupReply(signup)"
                  >
                    Reply
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div
      v-if="showSignupReplyModal && selectedSignup"
      class="fixed inset-0 z-99999 flex items-center justify-center bg-black/50"
      @click.self="closeSignupReply"
    >
      <div class="w-full max-w-lg rounded-xl bg-white p-6 dark:bg-gray-900">
        <h3 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Reply to Signup</h3>
        <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
          {{ selectedSignup.FirstName }} {{ selectedSignup.LastName }} · {{ selectedSignup.Email }}
        </p>

        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Subject</label>
            <input
              v-model="signupReplyForm.subject"
              type="text"
              class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Message</label>
            <textarea
              v-model="signupReplyForm.body"
              rows="6"
              class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            ></textarea>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            @click="closeSignupReply"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            :disabled="sendingSignupReply || !signupReplyForm.subject || !signupReplyForm.body"
            @click="sendSignupReply"
          >
            {{ sendingSignupReply ? 'Sending...' : 'Send Reply' }}
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { getAuthHeaders, apiFetch, AuthError } from '@/utils/apiAuth'

const router = useRouter()

const currentPageTitle = ref('Forms')
const activeTab = ref<'responses' | 'settings'>('responses')
const memberTypes = ref<any[]>([])

const publicSignupSettings = ref({
  enabled: false,
  defaultMemberType: 'Prospect',
  notificationEmail: ''
})
const savingPublicSignupSettings = ref(false)
const publicSignups = ref<any[]>([])
const loadingPublicSignups = ref(false)
const showSignupReplyModal = ref(false)
const selectedSignup = ref<any | null>(null)
const signupReplyForm = ref({ subject: '', body: '' })
const sendingSignupReply = ref(false)
const publicSignupBaseUrl = ref('')

const publicSignupFormAction = computed(() => {
  if (!publicSignupBaseUrl.value) return ''
  return `${publicSignupBaseUrl.value}/public/member-signup`
})

const publicSignupEmbedSnippet = computed(() => {
  const actionUrl = publicSignupFormAction.value || 'https://your-domain.example.com/public/member-signup'
  return `<style>
.cf-signup{font-family:Arial,sans-serif;max-width:680px;background:#fff;border-radius:14px;box-shadow:0 16px 30px rgba(15,23,42,.08);padding:22px}
.cf-grid{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}
.cf-field{display:flex;flex-direction:column;gap:6px}
.cf-field label{font-size:13px;color:#374151;font-weight:600}
.cf-field input,.cf-field select{padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px}
.cf-full{grid-column:span 2}
.cf-notice{margin-top:10px;padding:10px 12px;border-radius:10px;background:#eff6ff;color:#1e3a8a;font-size:12px}
.cf-actions{margin-top:14px;display:flex;justify-content:flex-end}
.cf-submit{background:#2563eb;color:#fff;border:0;border-radius:8px;padding:10px 18px;font-weight:600;cursor:pointer}
@media (max-width:640px){.cf-grid{grid-template-columns:1fr}.cf-full{grid-column:span 1}}
</style>
<form class="cf-signup" method="POST" action="${actionUrl}">
  <div class="cf-grid">
    <div class="cf-field"><label>First Name</label><input name="FirstName" required /></div>
    <div class="cf-field"><label>Last Name</label><input name="LastName" required /></div>
    <div class="cf-field"><label>Email</label><input name="Email" type="email" required /></div>
    <div class="cf-field"><label>EAA Number (optional)</label><input name="EAANumber" /></div>
    <div class="cf-field cf-full"><label>Street Address</label><input name="Street" required /></div>
    <div class="cf-field"><label>City</label><input name="City" required /></div>
    <div class="cf-field"><label>State</label><input name="State" required /></div>
    <div class="cf-field"><label>ZIP</label><input name="Zip" required /></div>
    <div class="cf-field cf-full">
      <label>How did you hear about us?</label>
      <select name="HearAbout">
        <option value="">Select...</option>
        <option>Friend or family</option>
        <option>Chapter event</option>
        <option>EAA website</option>
        <option>Social media</option>
        <option>Search engine</option>
        <option>Other</option>
      </select>
    </div>
  </div>
  <div class="cf-notice">By submitting this form, you agree to be added to our chapter events email list.</div>
  <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off" />
  <div class="cf-actions"><button class="cf-submit" type="submit">Submit</button></div>
</form>`
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

const fetchPublicSignupSettings = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/public-signup', { headers })
    if (response.ok) {
      const data = await response.json()
      publicSignupSettings.value = {
        enabled: Boolean(data.enabled),
        defaultMemberType: data.defaultMemberType || 'Prospect',
        notificationEmail: data.notificationEmail || ''
      }
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching public signup settings:', error)
    }
  }
}

const savePublicSignupSettings = async () => {
  try {
    savingPublicSignupSettings.value = true
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/public-signup', {
      method: 'POST',
      headers,
      body: JSON.stringify(publicSignupSettings.value)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save public signup settings')
    }
    alert('Public signup settings saved')
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error saving public signup settings:', error)
      alert(error instanceof Error ? error.message : 'Failed to save public signup settings')
    }
  } finally {
    savingPublicSignupSettings.value = false
  }
}

const fetchPublicSignups = async () => {
  try {
    loadingPublicSignups.value = true
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/public-signups?limit=200', { headers })
    if (!response.ok) {
      throw new Error('Failed to fetch public signups')
    }
    publicSignups.value = await response.json()
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching public signups:', error)
    }
  } finally {
    loadingPublicSignups.value = false
  }
}

const openSignupReply = (signup: any) => {
  selectedSignup.value = signup
  signupReplyForm.value = {
    subject: `Thanks for your interest in ${import.meta.env.VITE_CHAPTER_NAME || 'our chapter'}`,
    body: ''
  }
  showSignupReplyModal.value = true
}

const closeSignupReply = () => {
  showSignupReplyModal.value = false
  selectedSignup.value = null
  signupReplyForm.value = { subject: '', body: '' }
}

const sendSignupReply = async () => {
  if (!selectedSignup.value) return
  try {
    sendingSignupReply.value = true
    const headers = await getAuthHeaders()
    const response = await apiFetch(`/api/public-signups/${selectedSignup.value.SignupID}/reply`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        subject: signupReplyForm.value.subject,
        body: signupReplyForm.value.body
      })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send reply')
    }
    await fetchPublicSignups()
    closeSignupReply()
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error sending signup reply:', error)
      alert(error instanceof Error ? error.message : 'Failed to send reply')
    }
  } finally {
    sendingSignupReply.value = false
  }
}

const formatSignupDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    publicSignupBaseUrl.value = window.location.origin
  }
  fetchMemberTypes()
  fetchPublicSignupSettings()
  fetchPublicSignups()
})
</script>
