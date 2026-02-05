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
          @click="activeTab = 'scheduled-reports'"
          :class="[
            'px-4 py-3 text-sm font-medium border-b-2 transition',
            activeTab === 'scheduled-reports'
              ? 'border-brand-500 text-brand-500 dark:text-brand-400'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
        >
          Scheduled Reports
        </button>
        <button
          @click="activeTab = 'google-sheets'"
          :class="[
            'px-4 py-3 text-sm font-medium border-b-2 transition',
            activeTab === 'google-sheets'
              ? 'border-brand-500 text-brand-500 dark:text-brand-400'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
        >
          Google Sheets
        </button>
        <button
          @click="activeTab = 'google-groups'"
          :class="[
            'px-4 py-3 text-sm font-medium border-b-2 transition',
            activeTab === 'google-groups'
              ? 'border-brand-500 text-brand-500 dark:text-brand-400'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
        >
          Google Groups
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
        <button
          @click="activeTab = 'audit-log'; fetchAuditLogs()"
          :class="[
            'px-4 py-3 text-sm font-medium border-b-2 transition',
            activeTab === 'audit-log'
              ? 'border-brand-500 text-brand-500 dark:text-brand-400'
              : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
          ]"
        >
          Audit Log
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

    <!-- Google Sheets Tab -->
    <div v-if="activeTab === 'google-sheets'" class="space-y-6">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Google Sheets Sync</h3>
          <div class="flex items-center gap-2">
            <button
              @click="syncGoogleSheetsNow"
              class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200"
              :disabled="syncingGoogleSheets || !googleSheetsSettings.enabled || !googleSheetsSettings.spreadsheetId"
            >
              {{ syncingGoogleSheets ? 'Syncing...' : 'Sync Now' }}
            </button>
            <button
              @click="saveGoogleSheetsSettings"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              :disabled="savingGoogleSheetsSettings"
            >
              {{ savingGoogleSheetsSettings ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>
        </div>

        <div class="space-y-4 text-sm text-gray-700 dark:text-gray-200">
          <div class="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
            <p class="font-semibold">Setup steps</p>
            <ol class="mt-2 list-decimal space-y-1 pl-5">
              <li>Create a Google Cloud project and enable the Google Sheets API.</li>
              <li>Create a service account and download the JSON key.</li>
              <li>Share your Google Sheet with the service account email (Editor access).</li>
              <li>Set the service account JSON on the server as GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON or GOOGLE_SHEETS_SERVICE_ACCOUNT_PATH.</li>
              <li>Paste the spreadsheet ID below and click Save Settings, then Sync Now.</li>
            </ol>
          </div>
          <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              v-model="googleSheetsSettings.enabled"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Enable sync on changes
          </label>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Spreadsheet ID</label>
            <input
              v-model="googleSheetsSettings.spreadsheetId"
              type="text"
              placeholder="1AbC..."
              class="mt-1 h-11 w-full max-w-2xl rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Use the spreadsheet ID from the URL. Share the sheet with the Google service account email.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Sheet name prefix (optional)</label>
            <input
              v-model="googleSheetsSettings.sheetPrefix"
              type="text"
              placeholder="ChapterForge-"
              class="mt-1 h-11 w-full max-w-md rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Each table is written to its own tab using this prefix.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Google Groups Tab -->
    <div v-if="activeTab === 'google-groups'" class="space-y-6">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Google Groups Sync</h3>
          <div class="flex items-center gap-2">
            <button
              @click="syncGoogleGroupsNow"
              class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60 dark:bg-gray-800 dark:text-gray-200"
              :disabled="syncingGoogleGroups || !googleGroupsSettings.enabled || !googleGroupsSettings.adminEmail"
            >
              {{ syncingGoogleGroups ? 'Syncing...' : 'Sync Now' }}
            </button>
            <button
              @click="saveGoogleGroupsSettings"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              :disabled="savingGoogleGroupsSettings"
            >
              {{ savingGoogleGroupsSettings ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>
        </div>

        <div class="space-y-4 text-sm text-gray-700 dark:text-gray-200">
          <div class="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
            <p class="font-semibold">Setup steps</p>
            <ol class="mt-2 list-decimal space-y-1 pl-5">
              <li>Enable Domain-wide Delegation on the service account.</li>
              <li>In Google Admin Console, grant the Admin SDK scopes for groups and members.</li>
              <li>Ensure the service account key is configured on the server.</li>
              <li>Enter an admin email to impersonate and map member types to group emails.</li>
            </ol>
          </div>

          <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              v-model="googleGroupsSettings.enabled"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Enable sync on member changes
          </label>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Admin email to impersonate</label>
            <input
              v-model="googleGroupsSettings.adminEmail"
              type="email"
              placeholder="admin@yourdomain.org"
              class="mt-1 h-11 w-full max-w-2xl rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This user must be a Workspace admin with permissions to manage groups.
            </p>
          </div>

          <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              v-model="googleGroupsSettings.removeUnmatched"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Remove members that no longer match the mapped type
          </label>

          <RuleBuilderList
            :mappings="googleGroupsSettings.mappings"
            :memberTypes="memberTypes"
            :roleOptions="googleGroupRoleOptions"
            :activityOptions="googleGroupActivityOptions"
            :availableGroups="availableGoogleGroups"
            @update:mappings="googleGroupsSettings.mappings = $event"
          />

          <p class="text-xs text-gray-500 dark:text-gray-400">
            Only active members with an email address are synced to groups.
          </p>
        </div>
      </div>
    </div>

    <!-- Audit Log Tab -->
    <div v-if="activeTab === 'audit-log'">
      <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="border-b border-gray-200 p-6 dark:border-gray-800">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">System Activity</h3>
            <button
              @click="fetchAuditLogs"
              :disabled="loadingAuditLogs"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
            >
              {{ loadingAuditLogs ? 'Loading...' : 'Refresh' }}
            </button>
          </div>
          
          <!-- Filter Options -->
          <div class="mt-4 grid gap-3 sm:grid-cols-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">User Email</label>
              <input
                v-model="auditFilters.userEmail"
                type="text"
                placeholder="Filter by user..."
                @input="fetchAuditLogs"
                class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Action</label>
              <select
                v-model="auditFilters.action"
                @change="fetchAuditLogs"
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
                v-model="auditFilters.tableName"
                @change="fetchAuditLogs"
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
                v-model="auditFilters.limit"
                @change="fetchAuditLogs"
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
              <tr v-if="loadingAuditLogs">
                <td colspan="8" class="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading audit logs...
                </td>
              </tr>
              <tr v-else-if="auditLogs.length === 0">
                <td colspan="8" class="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  No audit logs found
                </td>
              </tr>
              <tr v-else v-for="log in auditLogs" :key="log.ID" class="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {{ formatAuditDate(log.CreatedAt) }}
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
                    @click="showAuditChanges(log)"
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
        v-if="selectedAuditLog"
        @click="selectedAuditLog = null"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <div
          @click.stop
          class="w-full max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900"
        >
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Change Details</h3>
            <button
              @click="selectedAuditLog = null"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ✕
            </button>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <h4 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Before</h4>
              <pre class="rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800"><code>{{ JSON.stringify(selectedAuditLog.OldValue, null, 2) }}</code></pre>
            </div>
            <div>
              <h4 class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">After</h4>
              <pre class="rounded-lg bg-gray-100 p-4 text-xs dark:bg-gray-800"><code>{{ JSON.stringify(selectedAuditLog.NewValue, null, 2) }}</code></pre>
            </div>
          </div>
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

    <!-- Scheduled Reports Tab -->
    <div v-if="activeTab === 'scheduled-reports'" class="space-y-6">
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="mb-4 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Scheduled Report Emails</h3>
          <div class="flex flex-wrap gap-2">
            <button
              @click="sendReportNow"
              class="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-100 disabled:opacity-60 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
              :disabled="sendingReportNow"
            >
              {{ sendingReportNow ? 'Sending...' : 'Send Report Now' }}
            </button>
            <button
              @click="saveReportScheduleSettings"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
              :disabled="savingReportScheduleSettings"
            >
              {{ savingReportScheduleSettings ? 'Saving...' : 'Save Settings' }}
            </button>
          </div>
        </div>

        <div class="space-y-6 text-sm text-gray-700 dark:text-gray-200">
          <label class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <input
              v-model="reportSchedule.enabled"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Enable scheduled report emails
          </label>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Recipients</label>
            <input
              v-model="reportSchedule.recipients"
              type="text"
              placeholder="email1@example.com, email2@example.com"
              class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Reports</label>
            <div class="grid gap-2 sm:grid-cols-2">
              <label
                v-for="report in reportScheduleReports"
                :key="report.id"
                class="flex items-start gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
              >
                <input
                  v-model="reportSchedule.reports"
                  type="checkbox"
                  :value="report.id"
                  class="mt-1 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                <span>
                  <span class="font-medium">{{ report.name }}</span>
                  <span v-if="report.description" class="block text-xs text-gray-500 dark:text-gray-400">{{ report.description }}</span>
                </span>
              </label>
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
              <select
                v-model="reportSchedule.datePreset"
                class="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_year">This Year</option>
                <option value="last_year">Last Year</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Status Filter</label>
              <select
                v-model="reportSchedule.status"
                class="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="ALL">All</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
              <input
                v-model="reportSchedule.time"
                type="time"
                class="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Frequency</label>
              <select
                v-model="reportSchedule.frequency"
                class="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div v-if="reportSchedule.frequency === 'weekly'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Day of Week</label>
              <select
                v-model.number="reportSchedule.dayOfWeek"
                class="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option :value="0">Sunday</option>
                <option :value="1">Monday</option>
                <option :value="2">Tuesday</option>
                <option :value="3">Wednesday</option>
                <option :value="4">Thursday</option>
                <option :value="5">Friday</option>
                <option :value="6">Saturday</option>
              </select>
            </div>
            <div v-if="reportSchedule.frequency === 'monthly'">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Day of Month</label>
              <input
                v-model.number="reportSchedule.dayOfMonth"
                type="number"
                min="1"
                max="31"
                class="mt-1 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
            </div>
          </div>

          <p class="text-xs text-gray-500 dark:text-gray-400">
            Cron preview: {{ reportScheduleCron }}
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { QuillEditor } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import RuleBuilderList from '@/components/google-groups/RuleBuilderList.vue'
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
const reportSchedule = ref({
  enabled: false,
  recipients: '',
  reports: [] as string[],
  datePreset: 'last_month',
  status: 'COMPLETED',
  frequency: 'monthly',
  time: '08:00',
  dayOfWeek: 1,
  dayOfMonth: 1
})
const reportScheduleReports = ref<Array<{ id: string; name: string; description?: string }>>([])
const savingReportScheduleSettings = ref(false)
const sendingReportNow = ref(false)

const googleSheetsSettings = ref({
  enabled: false,
  spreadsheetId: '',
  sheetPrefix: ''
})
const savingGoogleSheetsSettings = ref(false)
const syncingGoogleSheets = ref(false)

const googleGroupsSettings = ref({
  enabled: false,
  adminEmail: '',
  removeUnmatched: false,
  mappings: [] as Array<{
    memberTypes: string[]
    roles: string[]
    activities: string[]
    groups: string[]
    groupSearch: string
  }>
})
const savingGoogleGroupsSettings = ref(false)
const syncingGoogleGroups = ref(false)
const loadingGoogleGroups = ref(false)
const availableGoogleGroups = ref<Array<{ email: string; name: string }>>([])
const lastLoadedGroupsEmail = ref('')

const googleGroupRoleOptions = [
  { value: 'BoardMember', label: 'Board Member' },
  { value: 'Officer', label: 'Officer' }
]

const googleGroupActivityOptions = [
  { value: 'YoungEaglePilot', label: 'Young Eagle Pilot' },
  { value: 'YoungEagleVolunteer', label: 'Young Eagle Volunteer' },
  { value: 'EaglePilot', label: 'Eagle Pilot' },
  { value: 'EagleFlightVolunteer', label: 'Eagle Flight Volunteer' }
]

// Audit Log state
const auditLogs = ref<AuditLog[]>([])
const loadingAuditLogs = ref(false)
const selectedAuditLog = ref<AuditLog | null>(null)
const auditFilters = ref({
  userEmail: '',
  action: '',
  tableName: '',
  limit: '1000'
})

const reportScheduleCron = computed(() => {
  const [hour, minute] = reportSchedule.value.time.split(':').map(Number)
  const safeMinute = Number.isFinite(minute) ? minute : 0
  const safeHour = Number.isFinite(hour) ? hour : 8

  if (reportSchedule.value.frequency === 'weekly') {
    return `${safeMinute} ${safeHour} * * ${reportSchedule.value.dayOfWeek}`
  }
  if (reportSchedule.value.frequency === 'monthly') {
    return `${safeMinute} ${safeHour} ${reportSchedule.value.dayOfMonth} * *`
  }
  return `${safeMinute} ${safeHour} * * *`
})

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

const fetchReportScheduleSettings = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/report-schedule', { headers })
    if (response.ok) {
      const data = await response.json()
      const config = data.config || {}
      reportSchedule.value = {
        enabled: Boolean(config.enabled),
        recipients: Array.isArray(config.recipients) ? config.recipients.join(', ') : (config.recipients || ''),
        reports: Array.isArray(config.reports) ? config.reports : [],
        datePreset: config.datePreset || 'last_month',
        status: config.status || 'COMPLETED',
        frequency: config.frequency || 'monthly',
        time: config.time || '08:00',
        dayOfWeek: Number.isFinite(config.dayOfWeek) ? config.dayOfWeek : 1,
        dayOfMonth: Number.isFinite(config.dayOfMonth) ? config.dayOfMonth : 1
      }
      reportScheduleReports.value = Array.isArray(data.availableReports) ? data.availableReports : []
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching report schedule settings:', error)
    }
  }
}

const fetchGoogleSheetsSettings = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/google-sheets', { headers })
    if (response.ok) {
      const data = await response.json()
      googleSheetsSettings.value = {
        enabled: Boolean(data.enabled),
        spreadsheetId: data.spreadsheetId || '',
        sheetPrefix: data.sheetPrefix || ''
      }
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching Google Sheets settings:', error)
    }
  }
}

const fetchGoogleGroupsSettings = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/google-groups', { headers })
    if (response.ok) {
      const data = await response.json()
      const mappings = Array.isArray(data.mappings) ? data.mappings : []
      googleGroupsSettings.value = {
        enabled: Boolean(data.enabled),
        adminEmail: data.adminEmail || '',
        removeUnmatched: Boolean(data.removeUnmatched),
        mappings: mappings.map((mapping: any) => ({
          memberTypes: Array.isArray(mapping.memberTypes)
            ? mapping.memberTypes
            : (mapping.memberType ? [mapping.memberType] : []),
          roles: Array.isArray(mapping.roles) ? mapping.roles : [],
          activities: Array.isArray(mapping.activities) ? mapping.activities : [],
          groups: Array.isArray(mapping.groups)
            ? mapping.groups
            : String(mapping.groups || '').split(',').map((group: string) => group.trim()).filter(Boolean),
          groupSearch: ''
        }))
      }
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching Google Groups settings:', error)
    }
  }
}

const fetchGoogleGroupsList = async () => {
  if (!googleGroupsSettings.value.adminEmail) return
  try {
    loadingGoogleGroups.value = true
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/google-groups/groups', { headers })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to load Google Groups')
    }
    const data = await response.json()
    availableGoogleGroups.value = Array.isArray(data.groups) ? data.groups : []
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error loading Google Groups:', error)
      alert(error instanceof Error ? error.message : 'Failed to load Google Groups')
    }
  } finally {
    loadingGoogleGroups.value = false
  }
}

const maybeAutoLoadGroups = async () => {
  if (activeTab.value !== 'google-groups') return
  const email = String(googleGroupsSettings.value.adminEmail || '').trim().toLowerCase()
  if (!email) return
  if (loadingGoogleGroups.value) return
  if (email === lastLoadedGroupsEmail.value && availableGoogleGroups.value.length > 0) return
  await fetchGoogleGroupsList()
  lastLoadedGroupsEmail.value = email
}

const saveReportScheduleSettings = async () => {
  try {
    savingReportScheduleSettings.value = true
    const headers = await getAuthHeaders()
    const payload = {
      enabled: reportSchedule.value.enabled,
      recipients: reportSchedule.value.recipients,
      reports: reportSchedule.value.reports,
      datePreset: reportSchedule.value.datePreset,
      status: reportSchedule.value.status,
      frequency: reportSchedule.value.frequency,
      time: reportSchedule.value.time,
      dayOfWeek: reportSchedule.value.dayOfWeek,
      dayOfMonth: reportSchedule.value.dayOfMonth
    }
    const response = await apiFetch('/api/settings/report-schedule', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save report schedule settings')
    }
    alert('Scheduled report settings saved')
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error saving report schedule settings:', error)
      alert(error instanceof Error ? error.message : 'Failed to save report schedule settings')
    }
  } finally {
    savingReportScheduleSettings.value = false
  }
}

const saveGoogleSheetsSettings = async () => {
  try {
    savingGoogleSheetsSettings.value = true
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/google-sheets', {
      method: 'POST',
      headers,
      body: JSON.stringify(googleSheetsSettings.value)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save Google Sheets settings')
    }
    alert('Google Sheets settings saved')
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error saving Google Sheets settings:', error)
      alert(error instanceof Error ? error.message : 'Failed to save Google Sheets settings')
    }
  } finally {
    savingGoogleSheetsSettings.value = false
  }
}

const saveGoogleGroupsSettings = async () => {
  try {
    savingGoogleGroupsSettings.value = true
    const headers = await getAuthHeaders()
    const payload = {
      enabled: googleGroupsSettings.value.enabled,
      adminEmail: googleGroupsSettings.value.adminEmail,
      removeUnmatched: googleGroupsSettings.value.removeUnmatched,
      mappings: googleGroupsSettings.value.mappings.map(mapping => ({
        memberTypes: mapping.memberTypes,
        roles: mapping.roles,
        activities: mapping.activities,
        groups: mapping.groups
      }))
    }
    const response = await apiFetch('/api/settings/google-groups', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to save Google Groups settings')
    }
    alert('Google Groups settings saved')
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error saving Google Groups settings:', error)
      alert(error instanceof Error ? error.message : 'Failed to save Google Groups settings')
    }
  } finally {
    savingGoogleGroupsSettings.value = false
  }
}

const syncGoogleSheetsNow = async () => {
  try {
    syncingGoogleSheets.value = true
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/google-sheets/sync', {
      method: 'POST',
      headers
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to sync Google Sheets')
    }
    alert('Google Sheets sync started')
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error syncing Google Sheets:', error)
      alert(error instanceof Error ? error.message : 'Failed to sync Google Sheets')
    }
  } finally {
    syncingGoogleSheets.value = false
  }
}

const syncGoogleGroupsNow = async () => {
  try {
    syncingGoogleGroups.value = true
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/settings/google-groups/sync', {
      method: 'POST',
      headers
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to sync Google Groups')
    }
    alert('Google Groups sync started')
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error syncing Google Groups:', error)
      alert(error instanceof Error ? error.message : 'Failed to sync Google Groups')
    }
  } finally {
    syncingGoogleGroups.value = false
  }
}


const sendReportNow = async () => {
  try {
    sendingReportNow.value = true
    const headers = await getAuthHeaders()
    const payload = {
      recipients: reportSchedule.value.recipients,
      reports: reportSchedule.value.reports,
      datePreset: reportSchedule.value.datePreset,
      status: reportSchedule.value.status
    }
    const response = await apiFetch('/api/settings/report-schedule/send-now', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send report')
    }
    const result = await response.json()
    alert(result.message || 'Report sent successfully')
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error sending report now:', error)
      alert(error instanceof Error ? error.message : 'Failed to send report')
    }
  } finally {
    sendingReportNow.value = false
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

const fetchAuditLogs = async () => {
  try {
    loadingAuditLogs.value = true
    const headers = await getAuthHeaders()
    const params = new URLSearchParams()
    if (auditFilters.value.userEmail) params.append('userEmail', auditFilters.value.userEmail)
    if (auditFilters.value.action) params.append('action', auditFilters.value.action)
    if (auditFilters.value.tableName) params.append('tableName', auditFilters.value.tableName)
    if (auditFilters.value.limit) params.append('limit', auditFilters.value.limit)

    const response = await apiFetch(`/api/audit-logs?${params.toString()}`, { headers })
    if (!response.ok) throw new Error('Failed to fetch audit logs')

    auditLogs.value = await response.json()
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching audit logs:', error)
      alert('Failed to load audit logs')
    }
  } finally {
    loadingAuditLogs.value = false
  }
}

const formatAuditDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const showAuditChanges = (log: AuditLog) => {
  selectedAuditLog.value = log
}

onMounted(() => {
  fetchMemberTypes()
  fetchEmailTemplate()
  fetchMembers()
  fetchUsers()
  fetchPaymentSettings()
  fetchTimezoneSettings()
  fetchReportScheduleSettings()
  fetchGoogleSheetsSettings()
  fetchGoogleGroupsSettings()
})

watch(
  [activeTab, () => googleGroupsSettings.value.adminEmail],
  () => {
    if (activeTab.value !== 'google-groups') return
    availableGoogleGroups.value = []
    lastLoadedGroupsEmail.value = ''
    maybeAutoLoadGroups()
  }
)
</script>
