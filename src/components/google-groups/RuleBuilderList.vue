<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h4 class="text-sm font-semibold text-gray-800 dark:text-white/90">Rules</h4>
        <p class="text-xs text-gray-500 dark:text-gray-400">Map member criteria to Google Groups.</p>
      </div>
      <button
        type="button"
        class="rounded-lg bg-brand-500 px-3 py-2 text-xs font-medium text-white hover:bg-brand-600"
        @click="openAdd"
      >
        + Add Rule
      </button>
    </div>

    <div v-if="mappings.length === 0" class="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
      No rules yet. Click “Add Rule” to create your first mapping.
    </div>

    <div v-else class="space-y-3">
      <RuleCard
        v-for="(mapping, index) in mappings"
        :key="`rule-${index}`"
        :mapping="mapping"
        :roleOptions="roleOptions"
        :activityOptions="activityOptions"
        :groupLabels="groupLabels"
        @edit="openEdit(index)"
        @delete="removeRule(index)"
      />
    </div>

    <RuleDrawer
      :open="drawerOpen"
      :mapping="draftMapping"
      :memberTypes="memberTypes"
      :roleOptions="roleOptions"
      :activityOptions="activityOptions"
      :availableGroups="availableGroups"
      :mode="drawerMode"
      @save="saveRule"
      @close="closeDrawer"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import RuleCard from '@/components/google-groups/RuleCard.vue'
import RuleDrawer from '@/components/google-groups/RuleDrawer.vue'

const props = defineProps({
  mappings: { type: Array, required: true },
  memberTypes: { type: Array, required: true },
  roleOptions: { type: Array, required: true },
  activityOptions: { type: Array, required: true },
  availableGroups: { type: Array, required: true }
})

const emit = defineEmits(['update:mappings'])

const drawerOpen = ref(false)
const drawerMode = ref<'add' | 'edit'>('add')
const editingIndex = ref<number | null>(null)
const draftMapping = ref(createEmptyMapping())

function createEmptyMapping() {
  return {
    memberTypes: [] as string[],
    roles: [] as string[],
    activities: [] as string[],
    groups: [] as string[],
    groupSearch: ''
  }
}

const groupLabels = computed(() => {
  const labels: Record<string, string> = {}
  ;(props.availableGroups as any[]).forEach(group => {
    if (group?.email) {
      labels[String(group.email)] = group.name ? `${group.name} (${group.email})` : String(group.email)
    }
  })
  return labels
})

const openAdd = () => {
  drawerMode.value = 'add'
  editingIndex.value = null
  draftMapping.value = createEmptyMapping()
  drawerOpen.value = true
}

const openEdit = (index: number) => {
  drawerMode.value = 'edit'
  editingIndex.value = index
  const current = props.mappings[index] as any
  draftMapping.value = {
    memberTypes: Array.isArray(current?.memberTypes) ? [...current.memberTypes] : [],
    roles: Array.isArray(current?.roles) ? [...current.roles] : [],
    activities: Array.isArray(current?.activities) ? [...current.activities] : [],
    groups: Array.isArray(current?.groups) ? [...current.groups] : [],
    groupSearch: current?.groupSearch || ''
  }
  drawerOpen.value = true
}

const closeDrawer = () => {
  drawerOpen.value = false
}

const saveRule = (mapping: any) => {
  const updated = [...(props.mappings as any[])]
  if (editingIndex.value === null || editingIndex.value === undefined) {
    updated.push({ ...mapping })
  } else {
    updated.splice(editingIndex.value, 1, { ...mapping })
  }
  emit('update:mappings', updated)
  drawerOpen.value = false
}

const removeRule = (index: number) => {
  const updated = [...(props.mappings as any[])]
  updated.splice(index, 1)
  emit('update:mappings', updated)
}
</script>
