<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    
    <div class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="border-b border-gray-200 p-6 dark:border-gray-800">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 class="text-lg font-semibold text-gray-800 dark:text-white/90">Members List</h3>
          <div class="flex gap-2">
            <input
              type="file"
              ref="fileInput"
              @change="handleFileUpload"
              accept=".csv"
              class="hidden"
            />
            <button
              @click="$refs.fileInput.click()"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Import CSV
            </button>
            <button
              @click="downloadSampleCsv"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Download Sample CSV
            </button>
            <button
              @click="showImportHelp = true"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Import Instructions
            </button>
            <button
              @click="openAddModal"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Add Member
            </button>
          </div>
        </div>
        
        <!-- Search Bar -->
        <div class="mt-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search members by name or email..."
            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30"
          />
        </div>
      </div>
      
      <div class="overflow-x-auto p-6">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-800">
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Name</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Email</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Status</th>
              <th class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90">Last Paid</th>
              <th class="px-4 py-3 text-right text-sm font-semibold text-gray-800 dark:text-white/90">Actions</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="item in groupedMembers" :key="item.type === 'individual' ? item.member.MemberID : `household-${item.householdId}`">
              <!-- Individual Member or Primary Household Member -->
              <tr class="border-b border-gray-200 dark:border-gray-800">
                <td class="px-4 py-4 text-sm text-gray-800 dark:text-white/90">
                  <div class="flex items-center gap-2">
                    <button
                      v-if="item.type === 'household' && item.family.length > 0"
                      @click="toggleHousehold(item.householdId)"
                      class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <svg
                        class="h-4 w-4 transition-transform"
                        :class="{ 'rotate-90': item.expanded }"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <span v-else-if="item.type === 'household'" class="w-4"></span>
                    {{ item.type === 'individual' ? item.member.FirstName : item.primary.FirstName }}
                    {{ item.type === 'individual' ? item.member.LastName : item.primary.LastName }}
                    <span v-if="item.type === 'household' && item.family.length > 0" class="text-xs text-gray-500 dark:text-gray-400">
                      (+{{ item.family.length }} family)
                    </span>
                  </div>
                </td>
                <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {{ item.type === 'individual' ? item.member.Email : item.primary.Email }}
                </td>
                <td class="px-4 py-4">
                  <span
                    :class="[
                      'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                      (item.type === 'individual' ? item.member.Status : item.primary.Status) === 'Active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'
                    ]"
                  >
                    {{ item.type === 'individual' ? item.member.Status : item.primary.Status }}
                  </span>
                </td>
                <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                  {{ formatYear(item.type === 'individual' ? item.member.LastPaidYear : item.primary.LastPaidYear) }}
                </td>
                <td class="px-4 py-4 text-right text-sm">
                  <button
                    v-if="item.type === 'household'"
                    @click="openAddFamilyModal(item.primary)"
                    class="mr-3 text-blue-500 hover:text-blue-600 dark:text-blue-400"
                  >
                    Add Family
                  </button>
                  <button
                    @click="openEditModal(item.type === 'individual' ? item.member : item.primary)"
                    class="mr-3 text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    Edit
                  </button>
                  <button
                    @click="deleteMember(item.type === 'individual' ? item.member.MemberID : item.primary.MemberID)"
                    class="text-red-500 hover:text-red-600 dark:text-red-400"
                  >
                    Delete
                  </button>
                </td>
              </tr>
              
              <!-- Family Members (nested) -->
              <template v-if="item.type === 'household' && item.expanded">
                <tr
                  v-for="familyMember in item.family"
                  :key="familyMember.MemberID"
                  class="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50"
                >
                  <td class="px-4 py-4 text-sm text-gray-800 dark:text-white/90">
                    <div class="flex items-center gap-2 pl-8">
                      <svg class="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      {{ familyMember.FirstName }} {{ familyMember.LastName }}
                    </div>
                  </td>
                  <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{{ familyMember.Email }}</td>
                  <td class="px-4 py-4">
                    <span
                      :class="[
                        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                        familyMember.Status === 'Active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-400'
                      ]"
                    >
                      {{ familyMember.Status }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {{ formatYear(familyMember.LastPaidYear) }}
                  </td>
                  <td class="px-4 py-4 text-right text-sm">
                    <button
                      @click="openEditModal(familyMember)"
                      class="mr-3 text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      Edit
                    </button>
                    <button
                      @click="deleteMember(familyMember.MemberID)"
                      class="text-red-500 hover:text-red-600 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              </template>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Member Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      @click.self="closeModal"
    >
      <div class="w-full max-w-4xl my-8 rounded-xl bg-white p-6 dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
        <h3 class="mb-6 text-xl font-semibold text-gray-800 dark:text-white/90">
          {{ isEditing ? 'Edit Member' : 'Add Member' }}
        </h3>
        
        <form @submit.prevent="saveMember">
          <!-- Basic Information -->
          <div class="mb-6">
            <h4 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Basic Information</h4>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  First Name<span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.FirstName"
                  type="text"
                  required
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Last Name<span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.LastName"
                  type="text"
                  required
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Email<span class="text-red-500">*</span>
                </label>
                <input
                  v-model="formData.Email"
                  type="email"
                  required
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Phone
                </label>
                <input
                  v-model="formData.Phone"
                  type="tel"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  EAA Number
                </label>
                <input
                  v-model="formData.EAANumber"
                  type="text"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Household ID
                </label>
                <input
                  v-model.number="formData.HouseholdID"
                  type="number"
                  placeholder="Leave empty for individual"
                  :disabled="isFamilyMember"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
                />
                <p v-if="isFamilyMember" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Family members are linked to the primary member’s household.
                </p>
              </div>
            </div>
          </div>

          <!-- Membership Details -->
          <div v-if="!isFamilyMember" class="mb-6">
            <h4 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Membership Details</h4>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Member Type
                </label>
                <select
                  v-model="formData.MemberType"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="Individual">Individual</option>
                  <option value="Family">Family</option>
                  <option value="Student">Student</option>
                </select>
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Status
                </label>
                <select
                  v-model="formData.Status"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Last Paid Year
                </label>
                <input
                  v-model.number="formData.LastPaidYear"
                  type="number"
                  min="2000"
                  max="2030"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Dues Rate
                </label>
                <input
                  v-model.number="formData.DuesRate"
                  type="number"
                  step="0.01"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Amount Due
                </label>
                <input
                  v-model.number="formData.AmountDue"
                  type="number"
                  step="0.01"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
              
            </div>
          </div>

          <!-- Certifications & Expirations -->
          <div class="mb-6">
            <h4 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Certifications & Expirations</h4>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Youth Protection Expiration
                </label>
                <input
                  v-model="formData.YouthProtectionExpiration"
                  type="date"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Background Check Expiration
                </label>
                <input
                  v-model="formData.BackgroundCheckExpiration"
                  type="date"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
              </div>
            </div>
          </div>

          <!-- Roles & Activities -->
          <div class="mb-6">
            <h4 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Roles & Activities</h4>
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
                <input
                  v-model="formData.YoungEaglePilot"
                  type="checkbox"
                  :true-value="1"
                  :false-value="0"
                  class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                Young Eagle Pilot
              </label>
              
              <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
                <input
                  v-model="formData.YoungEagleVolunteer"
                  type="checkbox"
                  :true-value="1"
                  :false-value="0"
                  class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                YE Volunteer
              </label>
              
              <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
                <input
                  v-model="formData.EaglePilot"
                  type="checkbox"
                  :true-value="1"
                  :false-value="0"
                  class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                Eagle Pilot
              </label>
              
              <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
                <input
                  v-model="formData.EagleFlightVolunteer"
                  type="checkbox"
                  :true-value="1"
                  :false-value="0"
                  class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                Eagle Flight Volunteer
              </label>
              
              <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
                <input
                  v-model="formData.BoardMember"
                  type="checkbox"
                  :true-value="1"
                  :false-value="0"
                  class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                Board Member
              </label>
              
              <label class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
                <input
                  v-model="formData.Officer"
                  type="checkbox"
                  :true-value="1"
                  :false-value="0"
                  class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                Officer
              </label>
            </div>
          </div>

          <!-- Notes -->
          <div class="mb-6">
            <h4 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</h4>
            <textarea
              v-model="formData.Notes"
              rows="3"
              class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="Additional notes about this member..."
            ></textarea>
          </div>
          
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              @click="closeModal"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              {{ isEditing ? 'Update' : 'Add' }} Member
            </button>
          </div>
        </form>
      </div>
    </div>
  </AdminLayout>

  <!-- Import Instructions Modal -->
  <div
    v-if="showImportHelp"
    class="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
    @click.self="showImportHelp = false"
  >
    <div class="w-full max-w-3xl my-8 rounded-xl bg-white p-6 dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
      <div class="flex items-start justify-between gap-4 mb-4">
        <h3 class="text-xl font-semibold text-gray-800 dark:text-white/90">CSV Import Instructions</h3>
        <button
          @click="showImportHelp = false"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div class="space-y-3 text-sm text-gray-700 dark:text-gray-200">
        <p>Use the sample CSV for column order. Required columns: FirstName, LastName, Email. Others are optional.</p>
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>MemberID</strong>: leave blank (auto-generated).</li>
          <li><strong>HouseholdID</strong>: optional. Use the same number to group family members; leave blank for individuals.</li>
          <li><strong>MemberType</strong>: Individual, Family, Student, or Family Member.</li>
          <li><strong>Status</strong>: Active, Inactive, or Pending.</li>
          <li><strong>DuesRate</strong>, <strong>AmountDue</strong>: numeric; optional.</li>
          <li><strong>LastPaidYear</strong>: numeric year (e.g., 2025); optional.</li>
          <li><strong>Payments</strong>: semi-colon list of year:amount entries, e.g., <code>2025:30; 2024:30</code>. If LastPaidYear is blank, it will be set to the max year provided.</li>
          <li><strong>Email</strong> &amp; <strong>Phone</strong>: email required, phone optional.</li>
        </ul>
        <p>Family grouping: assign the same HouseholdID to the primary member and all related family members. No automatic household creation is done during import.</p>
        <p class="text-gray-500 dark:text-gray-400">Tip: Download the sample CSV, fill it, then use Import CSV.</p>
      </div>
      <div class="mt-6 flex justify-end">
        <button
          @click="showImportHelp = false"
          class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { auth } from '@/firebase'

const currentPageTitle = ref('Members')
const members = ref<any[]>([])
const showModal = ref(false)
const showImportHelp = ref(false)
const isEditing = ref(false)
const searchQuery = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const expandedHouseholds = ref<Set<number>>(new Set())
const memberTypes = ref<any[]>([])

const isFamilyMember = computed(() => formData.value.MemberType === 'Family Member')

const formData = ref({
  MemberID: null,
  HouseholdID: null,
  FirstName: '',
  LastName: '',
  Email: '',
  Phone: '',
  EAANumber: '',
  MemberType: 'Individual',
  Status: 'Active',
  DuesRate: 0,
  LastPaidYear: null,
  AmountDue: 0,
  YouthProtectionExpiration: '',
  BackgroundCheckExpiration: '',
  YoungEaglePilot: 0,
  YoungEagleVolunteer: 0,
  EaglePilot: 0,
  EagleFlightVolunteer: 0,
  BoardMember: 0,
  Officer: 0,
  Notes: ''
})

const filteredMembers = computed(() => {
  if (!searchQuery.value) return members.value
  
  const query = searchQuery.value.toLowerCase()
  return members.value.filter(member => 
    member.FirstName?.toLowerCase().includes(query) ||
    member.LastName?.toLowerCase().includes(query) ||
    member.Email?.toLowerCase().includes(query)
  )
})

const groupedMembers = computed(() => {
  const households = new Map<number, any[]>()
  const individuals: any[] = []
  
  filteredMembers.value.forEach(member => {
    if (member.HouseholdID) {
      if (!households.has(member.HouseholdID)) {
        households.set(member.HouseholdID, [])
      }
      households.get(member.HouseholdID)!.push(member)
    } else {
      individuals.push(member)
    }
  })
  
  const result: any[] = []
  
  // Add individuals first
  individuals.forEach(member => {
    result.push({ type: 'individual', member })
  })
  
  // Add households
  households.forEach((householdMembers, householdId) => {
    // Sort by MemberID to get primary member first
    householdMembers.sort((a, b) => a.MemberID - b.MemberID)
    const primary = householdMembers[0]
    const family = householdMembers.slice(1)
    
    result.push({
      type: 'household',
      householdId,
      primary,
      family,
      expanded: expandedHouseholds.value.has(householdId)
    })
  })
  
  return result
})

const toggleHousehold = (householdId: number) => {
  if (expandedHouseholds.value.has(householdId)) {
    expandedHouseholds.value.delete(householdId)
  } else {
    expandedHouseholds.value.add(householdId)
  }
  expandedHouseholds.value = new Set(expandedHouseholds.value)
}

const getAuthHeaders = async () => {
  const user = auth.currentUser
  if (!user) {
    throw new Error('No authenticated user')
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
    const response = await fetch('/api/members', { headers })
    if (response.ok) {
      members.value = await response.json()
    } else {
      console.error('Failed to fetch members:', response.statusText)
    }
  } catch (error) {
    console.error('Error fetching members:', error)
  }
}

const fetchMemberTypes = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch('/api/settings/member-types', { headers })
    if (response.ok) {
      memberTypes.value = await response.json()
    }
  } catch (error) {
    console.error('Error fetching member types:', error)
  }
}

// Watch for member type changes and update dues rate
watch(() => formData.value.MemberType, (newType) => {
  if (newType === 'Family Member') return
  const memberType = memberTypes.value.find(t => t.Name === newType)
  if (memberType) {
    formData.value.DuesRate = memberType.DuesRate
  }
})

const openAddModal = () => {
  isEditing.value = false
  formData.value = {
    MemberID: null,
    HouseholdID: null,
    FirstName: '',
    LastName: '',
    Email: '',
    Phone: '',
    EAANumber: '',
    MemberType: 'Individual',
    Status: 'Active',
    DuesRate: 0,
    LastPaidYear: null,
    AmountDue: 0,
    YouthProtectionExpiration: '',
    BackgroundCheckExpiration: '',
    YoungEaglePilot: 0,
    YoungEagleVolunteer: 0,
    EaglePilot: 0,
    EagleFlightVolunteer: 0,
    BoardMember: 0,
    Officer: 0,
    Notes: ''
  }
  showModal.value = true
}

const openAddFamilyModal = (primaryMember: any) => {
  isEditing.value = false
  formData.value = {
    MemberID: null,
    HouseholdID: primaryMember.HouseholdID || primaryMember.MemberID,
    FirstName: '',
    LastName: '',
    Email: '',
    Phone: '',
    EAANumber: '',
    MemberType: 'Family Member',
    Status: 'Active',
    DuesRate: 0,
    LastPaidYear: null,
    AmountDue: 0,
    YouthProtectionExpiration: '',
    BackgroundCheckExpiration: '',
    YoungEaglePilot: 0,
    YoungEagleVolunteer: 0,
    EaglePilot: 0,
    EagleFlightVolunteer: 0,
    BoardMember: 0,
    Officer: 0,
    Notes: ''
  }
  showModal.value = true
}

const openEditModal = (member: any) => {
  isEditing.value = true
  formData.value = { ...member }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  formData.value = {
    MemberID: null,
    HouseholdID: null,
    FirstName: '',
    LastName: '',
    Email: '',
    Phone: '',
    EAANumber: '',
    MemberType: 'Individual',
    Status: 'Active',
    DuesRate: 0,
    LastPaidYear: null,
    AmountDue: 0,
    YouthProtectionExpiration: '',
    BackgroundCheckExpiration: '',
    YoungEaglePilot: 0,
    YoungEagleVolunteer: 0,
    EaglePilot: 0,
    EagleFlightVolunteer: 0,
    BoardMember: 0,
    Officer: 0,
    Notes: ''
  }
}

const saveMember = async () => {
  try {
    const url = isEditing.value ? `/api/members/${formData.value.MemberID}` : '/api/members'
    const method = isEditing.value ? 'PUT' : 'POST'
    const headers = await getAuthHeaders()
    
    const response = await fetch(url, {
      method,
      headers,
      body: JSON.stringify(formData.value),
    })
    
    if (response.ok) {
      await fetchMembers()
      closeModal()
    } else {
      const error = await response.json()
      alert(error.error || 'Failed to save member')
    }
  } catch (error) {
    console.error('Error saving member:', error)
    alert('Failed to save member')
  }
}

const deleteMember = async (id: number) => {
  if (!confirm('Are you sure you want to delete this member?')) return
  
  try {
    const headers = await getAuthHeaders()
    const response = await fetch(`/api/members/${id}`, {
      method: 'DELETE',
      headers
    })
    
    if (response.ok) {
      await fetchMembers()
    } else {
      alert('Failed to delete member')
    }
  } catch (error) {
    console.error('Error deleting member:', error)
    alert('Failed to delete member')
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  const uploadData = new FormData()
  uploadData.append('file', file)
  
  try {
    const user = auth.currentUser
    if (!user) throw new Error('No authenticated user')
    const token = await user.getIdToken()
    
    const response = await fetch('/api/members/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: uploadData,
    })
    
    if (response.ok) {
      await fetchMembers()
      alert('Members imported successfully')
    } else {
      const error = await response.json()
      alert(error.error || 'Failed to import members')
    }
  } catch (error) {
    console.error('Error importing members:', error)
    alert('Failed to import members')
  }
  
  // Reset file input
  if (target) target.value = ''
}

const downloadSampleCsv = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await fetch('/api/members/import/template', { headers })
    if (!response.ok) throw new Error('Failed to download template')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'members-template.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading template:', error)
    alert('Failed to download template')
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString()
}

const formatYear = (year: number | string | null) => {
  if (year === null || year === undefined) return 'N/A'
  const num = typeof year === 'string' ? parseInt(year, 10) : year
  if (!Number.isFinite(num) || num <= 0) return 'N/A'
  return String(num)
}

onMounted(() => {
  fetchMembers()
  fetchMemberTypes()
})
</script>
