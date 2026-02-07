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
              <th 
                @click="sortBy('name')"
                class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div class="flex items-center gap-2">
                  Name
                  <span v-if="sortColumn === 'name'" class="text-xs text-brand-500">
                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
              </th>
              <th 
                @click="sortBy('email')"
                class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div class="flex items-center gap-2">
                  Email
                  <span v-if="sortColumn === 'email'" class="text-xs text-brand-500">
                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
              </th>
              <th 
                @click="sortBy('status')"
                class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div class="flex items-center gap-2">
                  Status
                  <span v-if="sortColumn === 'status'" class="text-xs text-brand-500">
                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
              </th>
              <th 
                @click="sortBy('lastPaid')"
                class="px-4 py-3 text-left text-sm font-semibold text-gray-800 dark:text-white/90 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div class="flex items-center gap-2">
                  Last Paid
                  <span v-if="sortColumn === 'lastPaid'" class="text-xs text-brand-500">
                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                  </span>
                </div>
              </th>
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
                    @click="openViewModal(item.type === 'individual' ? item.member : item.primary)"
                    class="mr-3 text-brand-500 hover:text-brand-600 dark:text-brand-400"
                  >
                    View
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
                      @click="openViewModal(familyMember)"
                      class="mr-3 text-brand-500 hover:text-brand-600 dark:text-brand-400"
                    >
                      View
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
        <div class="mb-6 flex items-center justify-between gap-4">
          <h3 class="text-xl font-semibold text-gray-800 dark:text-white/90">
            {{ isViewOnly ? 'View Member' : (isEditing ? 'Edit Member' : 'Add Member') }}
          </h3>
          <button
            v-if="isViewOnly"
            type="button"
            @click="enterEditMode"
            class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Edit
          </button>
        </div>
        
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
                  :disabled="isViewOnly"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
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
                  :disabled="isViewOnly"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
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
                  :disabled="isViewOnly"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
                />
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Phone
                </label>
                <input
                  v-model="formData.Phone"
                  type="tel"
                  :disabled="isViewOnly"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
                />
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  EAA Number
                </label>
                <input
                  v-model="formData.EAANumber"
                  type="text"
                  :disabled="isViewOnly"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
                />
              </div>
              
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Street Address
                </label>
                <input
                  v-model="formData.Street"
                  type="text"
                  :disabled="isViewOnly"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
                />
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  City
                </label>
                <input
                  v-model="formData.City"
                  type="text"
                  :disabled="isViewOnly"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
                />
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  State
                </label>
                <input
                  v-model="formData.State"
                  type="text"
                  maxlength="2"
                  placeholder="TX"
                  :disabled="isViewOnly"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
                />
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  ZIP Code
                </label>
                <input
                  v-model="formData.Zip"
                  type="text"
                  maxlength="10"
                  placeholder="75001"
                  :disabled="isViewOnly"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
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
                  :disabled="isViewOnly"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
                >
                  <option v-if="memberTypes.length === 0" value="Individual">Individual</option>
                  <option v-if="memberTypes.length === 0" value="Family">Family</option>
                  <option v-if="memberTypes.length === 0" value="Student">Student</option>
                  <option
                    v-for="type in memberTypes"
                    :key="type.Name"
                    :value="type.Name"
                  >
                    {{ type.Name }}
                  </option>
                </select>
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Status
                </label>
                <select
                  v-model="formData.Status"
                  :disabled="isViewOnly"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
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
                  :disabled="isViewOnly"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
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
                  :disabled="isViewOnly"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
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
                  :disabled="isViewOnly"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
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
                  :disabled="isViewOnly"
                  :value="formData.YouthProtectionExpiration || ''"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
                />
              </div>
              
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Background Check Expiration
                </label>
                <input
                  v-model="formData.BackgroundCheckExpiration"
                  type="date"
                  :disabled="isViewOnly"
                  :value="formData.BackgroundCheckExpiration || ''"
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
                />
              </div>
            </div>
          </div>

          <!-- Roles & Activities -->
          <div class="mb-6">
            <h4 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Roles & Activities</h4>
            <div class="space-y-4">
              <div>
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Roles</p>
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <label
                    v-for="role in roleOptions"
                    :key="role.value"
                    class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400"
                  >
                    <input
                      v-model="formData[role.value]"
                      type="checkbox"
                      :true-value="1"
                      :false-value="0"
                      :disabled="isViewOnly"
                      class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    {{ role.label }}
                  </label>
                </div>
                <p v-if="roleOptions.length === 0" class="text-xs text-gray-400">No roles configured.</p>
              </div>

              <div>
                <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Activities</p>
                <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <label
                    v-for="activity in activityOptions"
                    :key="activity.value"
                    class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400"
                  >
                    <input
                      v-model="formData[activity.value]"
                      type="checkbox"
                      :true-value="1"
                      :false-value="0"
                      :disabled="isViewOnly"
                      class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    {{ activity.label }}
                  </label>
                </div>
                <p v-if="activityOptions.length === 0" class="text-xs text-gray-400">No activities configured.</p>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="mb-6">
            <h4 class="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">Notes</h4>
            <textarea
              v-model="formData.Notes"
              rows="3"
              :disabled="isViewOnly"
              class="w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 disabled:opacity-60 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
              placeholder="Additional notes about this member..."
            ></textarea>
          </div>
          
          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              @click="closeModal"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {{ isViewOnly ? 'Close' : 'Cancel' }}
            </button>
            <button
              v-if="!isViewOnly"
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
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import { auth } from '@/firebase'
import { getAuthHeaders, apiFetch, AuthError } from '@/utils/apiAuth'

const router = useRouter()

const currentPageTitle = ref('Members')
const members = ref<any[]>([])
const showModal = ref(false)
const showImportHelp = ref(false)
const isEditing = ref(false)
const isViewOnly = ref(false)
const familyPrimaryId = ref<number | null>(null)
const searchQuery = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const expandedHouseholds = ref<Set<number>>(new Set())
const memberTypes = ref<any[]>([])
const sortColumn = ref<'name' | 'email' | 'status' | 'lastPaid' | null>(null)
const sortDirection = ref<'asc' | 'desc'>('asc')

type MemberOption = { value: string; label: string }

const defaultRoleOptions: MemberOption[] = [
  { value: 'BoardMember', label: 'Board Member' },
  { value: 'Officer', label: 'Officer' }
]

const defaultActivityOptions: MemberOption[] = [
  { value: 'YoungEaglePilot', label: 'Young Eagle Pilot' },
  { value: 'YoungEagleVolunteer', label: 'Young Eagle Volunteer' },
  { value: 'EaglePilot', label: 'Eagle Pilot' },
  { value: 'EagleFlightVolunteer', label: 'Eagle Flight Volunteer' }
]

const memberOptionSettings = ref<{ roles: MemberOption[]; activities: MemberOption[] }>({
  roles: [...defaultRoleOptions],
  activities: [...defaultActivityOptions]
})

const roleOptions = computed(() => memberOptionSettings.value.roles)
const activityOptions = computed(() => memberOptionSettings.value.activities)

const toOptionLabel = (value: string) => {
  if (!value) return ''
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const toOptionValue = (label: string) => {
  const raw = String(label || '').trim()
  if (!raw) return ''
  if (/^[A-Za-z][A-Za-z0-9_]*$/.test(raw)) return raw
  const cleaned = raw.replace(/[^A-Za-z0-9_ ]+/g, ' ')
  const words = cleaned.replace(/[_-]+/g, ' ').split(' ').filter(Boolean)
  if (words.length === 0) return ''
  const pascal = words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')
  if (!pascal) return ''
  return /^[A-Za-z]/.test(pascal) ? pascal : `Option${pascal}`
}

const buildMemberForm = (overrides: Record<string, any> = {}) => {
  const base: Record<string, any> = {
    MemberID: null,
    HouseholdID: null,
    FirstName: '',
    LastName: '',
    Email: '',
    Phone: '',
    EAANumber: '',
    Street: '',
    City: '',
    State: '',
    Zip: '',
    MemberType: 'Individual',
    Status: 'Active',
    DuesRate: 0,
    LastPaidYear: null,
    AmountDue: 0,
    YouthProtectionExpiration: '',
    BackgroundCheckExpiration: '',
    Notes: ''
  }

  const options = [...roleOptions.value, ...activityOptions.value]
  options.forEach(option => {
    base[option.value] = 0
  })

  return { ...base, ...overrides }
}

const isFamilyMember = computed(() => formData.value.MemberType === 'Family Member')

const formData = ref(buildMemberForm())

const filteredMembers = computed(() => {
  let filtered = members.value
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    const matchedOptions = [...roleOptions.value, ...activityOptions.value].filter(option => {
      const label = option.label?.toLowerCase() || ''
      const value = option.value?.toLowerCase() || ''
      return label.includes(query) || value.includes(query)
    })

    const matchesRoleActivity = (member: any) =>
      matchedOptions.some(option => Number(member?.[option.value]) === 1)

    const isMatch = (member: any) =>
      member.FirstName?.toLowerCase().includes(query) ||
      member.LastName?.toLowerCase().includes(query) ||
      member.Email?.toLowerCase().includes(query) ||
      matchesRoleActivity(member)

    const matchingMembers = members.value.filter(isMatch)
    const matchingHouseholds = new Set(
      matchingMembers
        .filter(member => member.HouseholdID)
        .map(member => Number(member.HouseholdID))
    )

    filtered = members.value.filter(member => {
      if (member.HouseholdID && matchingHouseholds.has(Number(member.HouseholdID))) {
        return true
      }
      return isMatch(member)
    })
  }

  // Apply sorting
  if (sortColumn.value) {
    filtered = [...filtered].sort((a, b) => {
      let aVal: any, bVal: any

      if (sortColumn.value === 'name') {
        aVal = `${a.FirstName} ${a.LastName}`.toLowerCase()
        bVal = `${b.FirstName} ${b.LastName}`.toLowerCase()
      } else if (sortColumn.value === 'email') {
        aVal = (a.Email || '').toLowerCase()
        bVal = (b.Email || '').toLowerCase()
      } else if (sortColumn.value === 'status') {
        aVal = a.Status || ''
        bVal = b.Status || ''
      } else if (sortColumn.value === 'lastPaid') {
        aVal = a.LastPaidYear || 0
        bVal = b.LastPaidYear || 0
      }

      if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
      return 0
    })
  }

  return filtered
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

const sortBy = (column: 'name' | 'email' | 'status' | 'lastPaid') => {
  if (sortColumn.value === column) {
    // Toggle direction if clicking the same column
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // Set new column and reset to ascending
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

const fetchMembers = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/members', { headers })
    if (response.ok) {
      const data = await response.json()
      members.value = data.map((member: any) => ({
        ...member,
        HouseholdID:
          member.HouseholdID !== null && member.HouseholdID !== undefined && member.HouseholdID !== ''
            ? Number(member.HouseholdID)
            : null
      }))
    } else {
      console.error('Failed to fetch members:', response.statusText)
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching members:', error)
    }
  }
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
      const normalizeOptions = (items: any, defaults: MemberOption[]) => {
        const list = Array.isArray(items) ? items : []
        const normalized: MemberOption[] = []
        const seen = new Set<string>()
        list.forEach((item: any) => {
          const rawValue = typeof item === 'string' ? item : item?.value || item?.label || ''
          const value = toOptionValue(rawValue)
          if (!value || seen.has(value)) return
          const label = typeof item === 'object' && item?.label ? String(item.label).trim() : toOptionLabel(value)
          if (!label) return
          normalized.push({ value, label })
          seen.add(value)
        })
        if (normalized.length === 0) {
          return [...defaults]
        }
        return normalized
      }

      memberOptionSettings.value = {
        roles: normalizeOptions(data.roles, defaultRoleOptions),
        activities: normalizeOptions(data.activities, defaultActivityOptions)
      }
    }
  } catch (error) {
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error fetching member options:', error)
    }
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

watch([roleOptions, activityOptions], () => {
  const optionKeys = [...roleOptions.value, ...activityOptions.value].map(option => option.value)
  optionKeys.forEach(key => {
    if (!(key in formData.value)) {
      formData.value[key] = 0
    }
  })
})

const openAddModal = () => {
  isEditing.value = false
  formData.value = buildMemberForm()
  showModal.value = true
}

const openAddFamilyModal = (primaryMember: any) => {
  isEditing.value = false
  isViewOnly.value = false
  familyPrimaryId.value = primaryMember.MemberID
  formData.value = buildMemberForm({
    HouseholdID: primaryMember.HouseholdID || primaryMember.MemberID,
    MemberType: 'Family Member'
  })
  showModal.value = true
}

const openEditModal = (member: any) => {
  isEditing.value = true
  isViewOnly.value = false
  familyPrimaryId.value = null
  formData.value = buildMemberForm(member)
  showModal.value = true
}

const openViewModal = (member: any) => {
  isEditing.value = false
  isViewOnly.value = true
  familyPrimaryId.value = null
  formData.value = buildMemberForm(member)
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  isViewOnly.value = false
  isEditing.value = false
  familyPrimaryId.value = null
  formData.value = buildMemberForm()
}

const enterEditMode = () => {
  isViewOnly.value = false
  isEditing.value = Boolean(formData.value.MemberID)
}

const saveMember = async () => {
  try {
    const isFamily = formData.value.MemberType === 'Family Member'
    const isAddingFamily = !isEditing.value && isFamily && familyPrimaryId.value
    const url = isAddingFamily
      ? `/api/members/${familyPrimaryId.value}/family`
      : (isEditing.value ? `/api/members/${formData.value.MemberID}` : '/api/members')
    const method = isAddingFamily ? 'POST' : (isEditing.value ? 'PUT' : 'POST')
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
    const headers = await getAuthHeaders()
    
    const response = await apiFetch('/api/members/import', {
      method: 'POST',
      headers,
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
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error importing members:', error)
      alert('Failed to import members')
    }
  }
  
  // Reset file input
  if (target) target.value = ''
}

const downloadSampleCsv = async () => {
  try {
    const headers = await getAuthHeaders()
    const response = await apiFetch('/api/members/import/template', { headers })
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
    if (error instanceof AuthError) {
      router.push('/signin')
    } else {
      console.error('Error downloading template:', error)
      alert('Failed to download template')
    }
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
  fetchMemberOptions()
})
</script>
