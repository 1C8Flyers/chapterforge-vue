<template>
  <AdminLayout>
    <PageBreadcrumb pageTitle="Help" />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside class="lg:sticky lg:top-24">
        <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            On this page
          </h3>
          <div v-if="isLoading" class="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Loading...
          </div>
          <div v-else-if="loadError" class="mt-3 text-sm text-red-600 dark:text-red-400">
            {{ loadError }}
          </div>
          <ul v-else class="mt-3 space-y-2 text-sm">
            <li v-for="item in tocItems" :key="item.id">
              <a
                :href="`#${item.id}`"
                :class="[
                  'block text-gray-700 transition-colors hover:text-brand-500 dark:text-gray-300 dark:hover:text-brand-400',
                  item.level === 2 ? 'pl-3' : item.level >= 3 ? 'pl-6' : ''
                ]"
              >
                {{ item.text }}
              </a>
            </li>
          </ul>
        </div>
      </aside>

      <section class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div v-if="isLoading" class="text-sm text-gray-500 dark:text-gray-400">
          Loading manual...
        </div>
        <div v-else-if="loadError" class="text-sm text-red-600 dark:text-red-400">
          {{ loadError }}
        </div>
        <div v-else class="prose max-w-none text-gray-800 dark:prose-invert">
          <div v-html="manualHtml"></div>
        </div>
      </section>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MarkdownIt from 'markdown-it'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'

type TocItem = {
  id: string
  text: string
  level: number
}

const manualHtml = ref('')
const tocItems = ref<TocItem[]>([])
const isLoading = ref(true)
const loadError = ref('')

const slugify = (text: string, counts: Record<string, number>) => {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

  const slugRoot = base || 'section'
  const current = counts[slugRoot] || 0
  counts[slugRoot] = current + 1

  return current === 0 ? slugRoot : `${slugRoot}-${current + 1}`
}

const buildManual = (markdown: string) => {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
  })

  const tokens = md.parse(markdown, {})
  const counts: Record<string, number> = {}
  const toc: TocItem[] = []

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (token.type === 'heading_open') {
      const titleToken = tokens[i + 1]
      if (titleToken && titleToken.type === 'inline') {
        const level = Number(token.tag.replace('h', ''))
        const title = titleToken.content
        const id = slugify(title, counts)
        token.attrSet('id', id)
        if (level <= 3) {
          toc.push({ id, text: title, level })
        }
      }
    }
  }

  manualHtml.value = md.renderer.render(tokens, md.options, {})
  tocItems.value = toc
}

onMounted(async () => {
  try {
    const response = await fetch('/FRONTEND_USER_MANUAL.md')
    if (!response.ok) {
      throw new Error('Manual not available yet.')
    }
    const markdown = await response.text()
    buildManual(markdown)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unable to load the manual.'
  } finally {
    isLoading.value = false
  }
})
</script>
