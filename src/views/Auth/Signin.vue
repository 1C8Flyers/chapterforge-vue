<template>
  <FullScreenLayout>
    <div class="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div
        class="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900"
      >
        <div class="flex flex-col flex-1 w-full lg:w-1/2">
          <div class="w-full max-w-md pt-10 mx-auto">
            <h1
              class="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md text-center"
            >
              {{ chapterName }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
              Sign in to access your chapter management dashboard
            </p>
          </div>
          <div class="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div id="firebaseui-auth-container"></div>
          </div>
        </div>
        <div
          class="relative items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid"
        >
          <div class="flex items-center justify-center z-1">
            <common-grid-shape />
            <div class="flex flex-col items-center max-w-xs">
              <div class="mb-4">
                <h2 class="text-2xl font-bold text-white mb-2">ChapterForge</h2>
              </div>
              <p class="text-center text-gray-400 dark:text-white/60">
                EAA Chapter Management System
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FullScreenLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CommonGridShape from '@/components/common/CommonGridShape.vue'
import FullScreenLayout from '@/components/layout/FullScreenLayout.vue'
import { auth } from '@/firebase'
import * as firebaseui from 'firebaseui'
import 'firebaseui/dist/firebaseui.css'
import { EmailAuthProvider, GoogleAuthProvider } from 'firebase/auth'

const router = useRouter()
const chapterName = ref(import.meta.env.VITE_CHAPTER_NAME || 'EAA Chapter')

let ui: firebaseui.auth.AuthUI | null = null

onMounted(() => {
  // Initialize FirebaseUI
  ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth)
  
  const uiConfig: firebaseui.auth.Config = {
    signInOptions: [
      EmailAuthProvider.PROVIDER_ID,
      GoogleAuthProvider.PROVIDER_ID
    ],
    signInSuccessUrl: '/',
    callbacks: {
      signInSuccessWithAuthResult: () => {
        router.push('/')
        return false
      }
    },
    signInFlow: 'popup',
    tosUrl: '/terms',
    privacyPolicyUrl: '/privacy'
  }

  ui.start('#firebaseui-auth-container', uiConfig)
})
</script>
