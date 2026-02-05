<template>
  <div v-if="open" class="fixed inset-0 z-40 flex">
    <div class="absolute inset-0 bg-black/30" @click="handleClose"></div>
    <div class="relative ml-auto h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl dark:bg-gray-900">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">Define conditions and target Google Groups.</p>
        </div>
        <button
          class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          type="button"
          @click="handleClose"
        >
          Close
        </button>
      </div>

      <div class="space-y-4 text-sm text-gray-700 dark:text-gray-200">
        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">Member Types (optional)</label>
          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <label v-for="type in memberTypes" :key="type.MemberTypeID" class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
              <input
                v-model="localMapping.memberTypes"
                type="checkbox"
                :value="type.Name"
                class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              {{ type.Name }}
            </label>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">Roles (optional)</label>
          <div class="mt-1 flex flex-wrap gap-3 text-xs text-gray-700 dark:text-gray-300">
            <label v-for="role in roleOptions" :key="role.value" class="flex items-center gap-2">
              <input v-model="localMapping.roles" type="checkbox" :value="role.value" class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
              {{ role.label }}
            </label>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">Activities (optional)</label>
          <div class="mt-1 flex flex-wrap gap-3 text-xs text-gray-700 dark:text-gray-300">
            <label v-for="activity in activityOptions" :key="activity.value" class="flex items-center gap-2">
              <input v-model="localMapping.activities" type="checkbox" :value="activity.value" class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
              {{ activity.label }}
            </label>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 dark:text-gray-400">Google Groups</label>
          <input
            v-model="localMapping.groupSearch"
            type="text"
            placeholder="Search groups..."
            class="mt-1 h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
          <div class="mt-2 max-h-52 overflow-y-auto rounded-lg border border-gray-200 p-2 text-xs text-gray-700 dark:border-gray-800 dark:text-gray-300">
            <label
              v-for="group in filteredGroups"
              :key="group.email"
              class="flex items-center gap-2 py-1"
            >
              <input v-model="localMapping.groups" type="checkbox" :value="group.email" class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
              <span>{{ group.name ? `${group.name} (${group.email})` : group.email }}</span>
            </label>
          </div>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ localMapping.groups.length }} selected
          </p>
        </div>
      </div>

      <div class="mt-8 flex items-center justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          @click="handleClose"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          @click="handleSave"
        >
          Save Rule
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  mapping: { type: Object, required: true },
  memberTypes: { type: Array, required: true },
  roleOptions: { type: Array, required: true },
  activityOptions: { type: Array, required: true },
  availableGroups: { type: Array, required: true },
  mode: { type: String, default: 'add' }
})

const emit = defineEmits(['save', 'close'])

const localMapping = ref({
  memberTypes: [] as string[],
  roles: [] as string[],
  activities: [] as string[],
  groups: [] as string[],
  groupSearch: ''
})

watch(
  () => props.mapping,
  (value: any) => {
    localMapping.value = {
      memberTypes: Array.isArray(value?.memberTypes) ? [...value.memberTypes] : [],
      roles: Array.isArray(value?.roles) ? [...value.roles] : [],
      activities: Array.isArray(value?.activities) ? [...value.activities] : [],
      groups: Array.isArray(value?.groups) ? [...value.groups] : [],
      groupSearch: value?.groupSearch || ''
    }
  },
  { immediate: true, deep: true }
)

const title = computed(() => (props.mode === 'edit' ? 'Edit Rule' : 'Add Rule'))

const filteredGroups = computed(() => {
  const normalized = String(localMapping.value.groupSearch || '').trim().toLowerCase()
  if (!normalized) return props.availableGroups
  return (props.availableGroups as any[]).filter(group => {
    return group.email.includes(normalized) || (group.name || '').toLowerCase().includes(normalized)
  })
})

const handleSave = () => {
  emit('save', { ...localMapping.value })
}

const handleClose = () => {
  emit('close')
}
</script>
