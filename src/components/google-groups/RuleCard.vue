<template>
  <div class="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
    <div class="flex flex-1 flex-wrap items-center gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <template v-if="conditionChips.length">
          <span
            v-for="chip in conditionChips"
            :key="chip"
            class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"
          >
            {{ chip }}
          </span>
        </template>
        <span v-else class="text-xs text-gray-400 dark:text-gray-500">No conditions</span>
      </div>

      <span class="text-gray-400">→</span>

      <div class="flex flex-wrap items-center gap-2">
        <template v-if="groupChips.length">
          <span
            v-for="chip in groupChips"
            :key="chip"
            class="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/10 dark:text-brand-200"
          >
            {{ chip }}
          </span>
        </template>
        <span v-else class="text-xs text-gray-400 dark:text-gray-500">No groups</span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        @click="$emit('edit')"
      >
        Edit
      </button>
      <button
        type="button"
        class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/40 dark:text-red-300 dark:hover:bg-red-900/20"
        @click="$emit('delete')"
      >
        Delete
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  mapping: { type: Object, required: true },
  roleOptions: { type: Array, required: true },
  activityOptions: { type: Array, required: true },
  groupLabels: { type: Object, required: true }
})

defineEmits(['edit', 'delete'])

const roleLabelMap = computed(() => {
  const map: Record<string, string> = {}
  props.roleOptions.forEach((role: any) => {
    map[role.value] = role.label
  })
  return map
})

const activityLabelMap = computed(() => {
  const map: Record<string, string> = {}
  props.activityOptions.forEach((activity: any) => {
    map[activity.value] = activity.label
  })
  return map
})

const conditionChips = computed(() => {
  const chips: string[] = []
  const memberTypes = Array.isArray(props.mapping.memberTypes) ? props.mapping.memberTypes : []
  const roles = Array.isArray(props.mapping.roles) ? props.mapping.roles : []
  const activities = Array.isArray(props.mapping.activities) ? props.mapping.activities : []

  memberTypes.forEach((type: string) => chips.push(type))
  roles.forEach((role: string) => chips.push(roleLabelMap.value[role] || role))
  activities.forEach((activity: string) => chips.push(activityLabelMap.value[activity] || activity))

  return chips
})

const groupChips = computed(() => {
  const groups = Array.isArray(props.mapping.groups) ? props.mapping.groups : []
  return groups.map((email: string) => props.groupLabels[email] || email)
})
</script>
