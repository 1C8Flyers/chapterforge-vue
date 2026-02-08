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
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">New Member Registration</h3>
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
            Enable new member registration form
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


      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Custom Forms</h3>
          <div class="flex gap-2">
            <button
              @click="openCustomFormModal()"
              class="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
            >
              Add Form
            </button>
            <button
              @click="saveCustomForms"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              :disabled="savingCustomForms"
            >
              {{ savingCustomForms ? 'Saving...' : 'Save Forms' }}
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3">Name</th>
                <th class="px-4 py-3">Slug</th>
                <th class="px-4 py-3">Enabled</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="customForms.length === 0">
                <td colspan="4" class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No custom forms yet.</td>
              </tr>
              <tr v-else v-for="form in customForms" :key="form.slug" class="border-b border-gray-100 dark:border-gray-800">
                <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ form.name }}</td>
                <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{{ form.slug }}</td>
                <td class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  <span :class="form.enabled ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'">
                    {{ form.enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right">
                  <button
                    class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    @click="openCustomFormModal(form)"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Add or edit forms, then click Save Forms to publish changes.
        </p>
      </div>
    </div>

    <div v-if="activeTab === 'responses'" class="space-y-6">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">New Member Registration Responses</h3>
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
              <template v-else v-for="signup in publicSignups" :key="signup.SignupID">
                <tr
                  class="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03] cursor-pointer"
                  @click="toggleSignupRow(signup.SignupID)"
                >
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ formatSignupDate(signup.CreatedAt) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-800 dark:text-white/90">
                    {{ signup.FirstName }} {{ signup.LastName }}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ signup.Email }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ signup.AssignedMemberType || '-' }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ signup.Status || 'new' }}</td>
                  <td class="px-4 py-3 text-right">
                    <button
                      class="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
                      @click.stop="openSignupReply(signup)"
                    >
                      Reply
                    </button>
                  </td>
                </tr>
                <tr v-if="isSignupExpanded(signup.SignupID)" class="border-b border-gray-100 dark:border-gray-800">
                  <td colspan="6" class="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <div class="grid gap-3 md:grid-cols-2">
                      <div><span class="font-semibold text-gray-700 dark:text-gray-200">EAA Number:</span> {{ signup.EAANumber || '—' }}</div>
                      <div><span class="font-semibold text-gray-700 dark:text-gray-200">Heard about us:</span> {{ getHearAbout(signup) || '—' }}</div>
                      <div class="md:col-span-2"><span class="font-semibold text-gray-700 dark:text-gray-200">Address:</span> {{ formatAddress(signup) }}</div>
                      <div class="md:col-span-2"><span class="font-semibold text-gray-700 dark:text-gray-200">Notes:</span> {{ signup.Notes || '—' }}</div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>


      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Custom Form Responses</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">Select a form to view responses.</p>
          </div>
          <div class="flex gap-2">
            <select
              v-model="selectedCustomFormSlug"
              class="h-10 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              <option value="">Select form...</option>
              <option v-for="form in customForms" :key="form.slug" :value="form.slug">{{ form.name }}</option>
            </select>
            <button
              @click="fetchCustomFormSignups"
              class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200"
              :disabled="loadingCustomFormSignups || !selectedCustomFormSlug"
            >
              {{ loadingCustomFormSignups ? 'Loading...' : 'Refresh' }}
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm">
            <thead class="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3">Received</th>
                <th class="px-4 py-3">Name</th>
                <th class="px-4 py-3">Email</th>
                <th class="px-4 py-3">Session</th>
                <th class="px-4 py-3">Status</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loadingCustomFormSignups">
                <td colspan="6" class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">Loading signups...</td>
              </tr>
              <tr v-else-if="customFormSignups.length === 0">
                <td colspan="6" class="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No signups yet.</td>
              </tr>
              <template v-else v-for="signup in customFormSignups" :key="signup.SignupID">
                <tr
                  class="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03] cursor-pointer"
                  @click="toggleCustomFormRow(signup.SignupID)"
                >
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ formatSignupDate(signup.CreatedAt) }}</td>
                  <td class="px-4 py-3 text-sm text-gray-800 dark:text-white/90">
                    {{ signup.FirstName }} {{ signup.LastName }}
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ signup.Email }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ signup.SessionName || '—' }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{{ signup.Status || 'new' }}</td>
                  <td class="px-4 py-3 text-right">
                    <button
                      class="rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
                      @click.stop="openCustomFormReply(signup)"
                    >
                      Reply
                    </button>
                  </td>
                </tr>
                <tr v-if="isCustomFormExpanded(signup.SignupID)" class="border-b border-gray-100 dark:border-gray-800">
                  <td colspan="6" class="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                    <div class="grid gap-3 md:grid-cols-2">
                      <div><span class="font-semibold text-gray-700 dark:text-gray-200">EAA Number:</span> {{ signup.EAANumber || '—' }}</div>
                      <div><span class="font-semibold text-gray-700 dark:text-gray-200">Heard about us:</span> {{ getSignupHearAbout(signup) || '—' }}</div>
                      <div class="md:col-span-2"><span class="font-semibold text-gray-700 dark:text-gray-200">Address:</span> {{ formatAddress(signup) }}</div>
                      <div class="md:col-span-2"><span class="font-semibold text-gray-700 dark:text-gray-200">Assigned Roles:</span> {{ formatAssignedList(parseStoredList(signup.AssignedRoles), roleLabelMap) }}</div>
                      <div class="md:col-span-2"><span class="font-semibold text-gray-700 dark:text-gray-200">Assigned Activities:</span> {{ formatAssignedList(parseStoredList(signup.AssignedActivities), activityLabelMap) }}</div>
                      <div class="md:col-span-2"><span class="font-semibold text-gray-700 dark:text-gray-200">Notes:</span> {{ signup.Notes || '—' }}</div>
                    </div>
                  </td>
                </tr>
              </template>
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


    <div
      v-if="showCustomFormReplyModal && selectedCustomFormSignup"
      class="fixed inset-0 z-99999 flex items-center justify-center bg-black/50"
      @click.self="closeCustomFormReply"
    >
      <div class="w-full max-w-lg rounded-xl bg-white p-6 dark:bg-gray-900">
        <h3 class="mb-2 text-lg font-semibold text-gray-800 dark:text-white/90">Reply to Form Signup</h3>
        <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
          {{ selectedCustomFormSignup.FirstName }} {{ selectedCustomFormSignup.LastName }} · {{ selectedCustomFormSignup.Email }}
        </p>

        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Subject</label>
            <input
              v-model="customFormReplyForm.subject"
              type="text"
              class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Message</label>
            <textarea
              v-model="customFormReplyForm.body"
              rows="6"
              class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            ></textarea>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            @click="closeCustomFormReply"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
            :disabled="sendingCustomFormReply || !customFormReplyForm.subject || !customFormReplyForm.body"
            @click="sendCustomFormReply"
          >
            {{ sendingCustomFormReply ? 'Sending...' : 'Send Reply' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showCustomFormModal"
      class="fixed inset-0 z-99999 flex items-center justify-center bg-black/50"
      @click.self="closeCustomFormModal"
    >
      <div class="w-full max-w-2xl rounded-xl bg-white p-6 dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
        <h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          {{ editingCustomForm ? 'Edit Form' : 'Add Form' }}
        </h3>

        <div class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Form Name</label>
              <input
                v-model="customFormDraft.name"
                type="text"
                placeholder="Form - Spring"
                class="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
              <input
                v-model="customFormDraft.slug"
                type="text"
                placeholder="form-spring"
                class="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          </div>

          <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              v-model="customFormDraft.enabled"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Enable this form
          </label>

          <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              v-model="customFormDraft.addToParticipation"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Add signups to Participation
          </label>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Session Name</label>
              <input
                v-model="customFormDraft.sessionName"
                type="text"
                placeholder="Spring 2026"
                class="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Member Type</label>
              <select
                v-model="customFormDraft.defaultMemberType"
                class="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option v-for="type in memberTypes" :key="type.MemberTypeID" :value="type.Name">
                  {{ type.Name }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Notification Email</label>
            <input
              v-model="customFormDraft.notificationEmail"
              type="email"
              placeholder="notifications@example.com"
              class="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Assign Roles</p>
              <div class="mt-2 space-y-2">
                <label v-for="role in roleOptions" :key="role.value" class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    v-model="customFormDraft.assignedRoles"
                    type="checkbox"
                    :value="role.value"
                    class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  {{ role.label }}
                </label>
                <p v-if="roleOptions.length === 0" class="text-xs text-gray-500 dark:text-gray-400">No roles configured.</p>
              </div>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">Assign Activities</p>
              <div class="mt-2 space-y-2">
                <label v-for="activity in activityOptions" :key="activity.value" class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    v-model="customFormDraft.assignedActivities"
                    type="checkbox"
                    :value="activity.value"
                    class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  {{ activity.label }}
                </label>
                <p v-if="activityOptions.length === 0" class="text-xs text-gray-500 dark:text-gray-400">No activities configured.</p>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Embed Snippet</label>
            <textarea
              readonly
              :value="buildCustomFormEmbedSnippet(customFormDraft)"
              class="mt-1 h-32 w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-xs text-gray-800 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            ></textarea>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            @click="closeCustomFormModal"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            @click="saveCustomFormDraft"
          >
            Save Form
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { getAuthHeaders, apiFetch, AuthError } from '@/utils/apiAuth'

const router = useRouter()

const currentPageTitle = ref('Forms')
const activeTab = ref<'responses' | 'settings'>('responses')
const memberTypes = ref<any[]>([])
const roleOptions = ref<any[]>([])
const activityOptions = ref<any[]>([])

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
const expandedSignups = ref<Set<number>>(new Set())

const customForms = ref<any[]>([])
const savingCustomForms = ref(false)
const showCustomFormModal = ref(false)
const editingCustomForm = ref<any | null>(null)
const customFormDraft = ref({
  name: '',
  slug: '',
  enabled: false,
  addToParticipation: false,
  sessionName: '',
  defaultMemberType: 'Prospect',
  notificationEmail: '',
  assignedRoles: [] as string[],
  assignedActivities: [] as string[]
})
const customFormSignups = ref<any[]>([])
const loadingCustomFormSignups = ref(false)
const selectedCustomFormSlug = ref('')
const expandedCustomFormSignups = ref<Set<number>>(new Set())
const showCustomFormReplyModal = ref(false)
const selectedCustomFormSignup = ref<any | null>(null)
const customFormReplyForm = ref({ subject: '', body: '' })
const sendingCustomFormReply = ref(false)

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


const selectedCustomForm = computed(() =>
  customForms.value.find(form => form.slug === selectedCustomFormSlug.value)
)

const buildCustomFormEmbedSnippet = (form: any) => {
  const actionUrl = form?.slug
    ? `${publicSignupBaseUrl.value || 'https://your-domain.example.com'}/public/forms/${form.slug}`
    : 'https://your-domain.example.com/public/forms/your-form-slug';
  const sessionLine = form?.sessionName
    ? `<div class="cf-session">Session: ${form.sessionName}</div>`
    : ''
  return `<style>
.cf-signup{font-family:Arial,sans-serif;max-width:680px;background:#fff;border-radius:14px;box-shadow:0 16px 30px rgba(15,23,42,.08);padding:22px}
.cf-grid{display:grid;gap:12px;grid-template-columns:repeat(2,minmax(0,1fr))}
.cf-field{display:flex;flex-direction:column;gap:6px}
.cf-field label{font-size:13px;color:#374151;font-weight:600}
.cf-field input,.cf-field select{padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px}
.cf-full{grid-column:span 2}
.cf-notice{margin-top:10px;padding:10px 12px;border-radius:10px;background:#eff6ff;color:#1e3a8a;font-size:12px}
.cf-session{margin-top:8px;color:#1d4ed8;font-size:12px;font-weight:600}
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
  ${sessionLine}
  <div class="cf-notice">By submitting this form, you agree to be added to our chapter events email list.</div>
  <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off" />
  <div class="cf-actions"><button class="cf-submit" type="submit">Submit</button></div>
</form>`
}

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

const fetchMemberOptions = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/member-options', { headers })
    if (response.ok) {
      const data = await response.json()
      roleOptions.value = Array.isArray(data.roles) ? data.roles : []
      activityOptions.value = Array.isArray(data.activities) ? data.activities : []
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching member options:', error)
    }
  }
}

const fetchCustomForms = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/forms', { headers })
    if (response.ok) {
      const data = await response.json()
      customForms.value = Array.isArray(data.forms) ? data.forms : []
      if (!selectedCustomFormSlug.value && customForms.value.length > 0) {
        selectedCustomFormSlug.value = customForms.value[0].slug
      }
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching custom forms:', error)
    }
  }
}

const saveCustomForms = async () => {
  try {
    savingCustomForms.value = true
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/forms', {
      method: 'POST',
      headers,
      body: JSON.stringify({ forms: customForms.value })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save forms')
    }
    const data = await response.json()
    customForms.value = Array.isArray(data.forms) ? data.forms : []
    alert('Forms saved')
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error saving forms:', error)
      alert(error instanceof Error ? error.message : 'Failed to save forms')
    }
  } finally {
    savingCustomForms.value = false
  }
}

const openCustomFormModal = (form: any | null = null) => {
  editingCustomForm.value = form
  if (form) {
    customFormDraft.value = {
      name: form.name || '',
      slug: form.slug || '',
      enabled: Boolean(form.enabled),
      addToParticipation: Boolean(form.addToParticipation),
      sessionName: form.sessionName || '',
      defaultMemberType: form.defaultMemberType || 'Prospect',
      notificationEmail: form.notificationEmail || '',
      assignedRoles: Array.isArray(form.assignedRoles) ? [...form.assignedRoles] : [],
      assignedActivities: Array.isArray(form.assignedActivities) ? [...form.assignedActivities] : []
    }
  } else {
    customFormDraft.value = {
      name: '',
      slug: '',
      enabled: false,
      addToParticipation: false,
      sessionName: '',
      defaultMemberType: 'Prospect',
      notificationEmail: '',
      assignedRoles: [],
      assignedActivities: []
    }
  }
  showCustomFormModal.value = true
}

const closeCustomFormModal = () => {
  showCustomFormModal.value = false
  editingCustomForm.value = null
}

const saveCustomFormDraft = () => {
  const draft = { ...customFormDraft.value }
  if (!draft.name.trim()) {
    alert('Form name is required')
    return
  }
  const existingIndex = customForms.value.findIndex(form => form.slug === editingCustomForm.value?.slug)
  if (existingIndex >= 0) {
    customForms.value.splice(existingIndex, 1, draft)
  } else {
    customForms.value.push(draft)
  }
  closeCustomFormModal()
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
      console.error('Error fetching new member registration settings:', error)
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
      throw new Error(error.error || 'Failed to save new member registration settings')
    }
    alert('New member registration settings saved')
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error saving new member registration settings:', error)
      alert(error instanceof Error ? error.message : 'Failed to save new member registration settings')
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
      throw new Error('Failed to fetch new member registrations')
    }
    publicSignups.value = await response.json()
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching new member registrations:', error)
    }
  } finally {
    loadingPublicSignups.value = false
  }
}


const fetchCustomFormSignups = async () => {
  if (!selectedCustomFormSlug.value) return
  try {
    loadingCustomFormSignups.value = true
    const headers = await getAuthHeaders()
    const response = await apiFetch(`/api/forms/${selectedCustomFormSlug.value}/signups?limit=200`, { headers })
    if (!response.ok) {
      throw new Error('Failed to fetch form signups')
    }
    customFormSignups.value = await response.json()
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching form signups:', error)
    }
  } finally {
    loadingCustomFormSignups.value = false
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


const openCustomFormReply = (signup: any) => {
  selectedCustomFormSignup.value = signup
  const formName = selectedCustomForm.value?.name || 'Form'
  const sessionSuffix = signup?.SessionName ? ` (${signup.SessionName})` : ''
  customFormReplyForm.value = {
    subject: `${formName} Sign-Up${sessionSuffix}`,
    body: ''
  }
  showCustomFormReplyModal.value = true
}

const closeCustomFormReply = () => {
  showCustomFormReplyModal.value = false
  selectedCustomFormSignup.value = null
  customFormReplyForm.value = { subject: '', body: '' }
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


const sendCustomFormReply = async () => {
  if (!selectedCustomFormSignup.value || !selectedCustomFormSlug.value) return
  try {
    sendingCustomFormReply.value = true
    const headers = await getAuthHeaders()
    const response = await apiFetch(`/api/forms/${selectedCustomFormSlug.value}/signups/${selectedCustomFormSignup.value.SignupID}/reply`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        subject: customFormReplyForm.value.subject,
        body: customFormReplyForm.value.body
      })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send reply')
    }
    await fetchCustomFormSignups()
    closeCustomFormReply()
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error sending form reply:', error)
      alert(error instanceof Error ? error.message : 'Failed to send reply')
    }
  } finally {
    sendingCustomFormReply.value = false
  }
}

const formatSignupDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const toggleSignupRow = (id: number) => {
  if (expandedSignups.value.has(id)) {
    expandedSignups.value.delete(id)
  } else {
    expandedSignups.value.add(id)
  }
  expandedSignups.value = new Set(expandedSignups.value)
}

const isSignupExpanded = (id: number) => expandedSignups.value.has(id)


const toggleCustomFormRow = (id: number) => {
  if (expandedCustomFormSignups.value.has(id)) {
    expandedCustomFormSignups.value.delete(id)
  } else {
    expandedCustomFormSignups.value.add(id)
  }
  expandedCustomFormSignups.value = new Set(expandedCustomFormSignups.value)
}

const isCustomFormExpanded = (id: number) => expandedCustomFormSignups.value.has(id)

const parseSignupPayload = (signup: any) => {
  try {
    return signup?.RawPayload ? JSON.parse(signup.RawPayload) : {}
  } catch (error) {
    return {}
  }
}

const parseStoredList = (value: any) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      return trimmed.split(',').map(item => item.trim()).filter(Boolean)
    }
  }
  return []
}

const roleLabelMap = computed(() => {
  const entries = roleOptions.value.map(option => [option.value, option.label])
  return Object.fromEntries(entries)
})

const activityLabelMap = computed(() => {
  const entries = activityOptions.value.map(option => [option.value, option.label])
  return Object.fromEntries(entries)
})

const formatAssignedList = (values: string[], labelMap: Record<string, string>) => {
  if (!values || values.length === 0) return '—'
  return values.map(value => labelMap[value] || value).join(', ')
}

const getHearAbout = (signup: any) => {
  const payload = parseSignupPayload(signup)
  return payload?.HearAbout || ''
}

const getSignupHearAbout = (signup: any) => {
  const payload = parseSignupPayload(signup)
  return payload?.HearAbout || ''
}

const formatAddress = (signup: any) => {
  const parts = [signup?.Street, signup?.City, signup?.State, signup?.Zip]
    .map((value: string) => String(value || '').trim())
    .filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    publicSignupBaseUrl.value = window.location.origin
  }
  fetchMemberTypes()
  fetchMemberOptions()
  fetchPublicSignupSettings()
  fetchPublicSignups()
  fetchCustomForms()
})

watch(selectedCustomFormSlug, () => {
  fetchCustomFormSignups()
})
</script>
