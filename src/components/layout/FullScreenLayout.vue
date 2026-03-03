<template>
  <div class="flex min-h-screen flex-col">
    <main class="flex-1">
      <slot></slot>
    </main>
    <footer class="border-t border-gray-200 px-6 py-4 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
      Copyright 2026 1C8 Flyers, LLC. All rights reserved.
    </footer>
  </div>
</template>

<script setup lang="ts"></script>
