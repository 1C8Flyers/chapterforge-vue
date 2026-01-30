import { ref, computed, onMounted, watch } from 'vue'
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { auth } from '../firebase'
import { useRouter } from 'vue-router'
import { getAuthHeaders as buildAuthHeaders } from '@/utils/apiAuth'

const currentUser = ref<User | null>(null)
const userRole = ref<string>('user')
const isLoading = ref(true)
let authInitialized = false

export function useAuth() {
  const router = useRouter()

  const isAuthenticated = computed(() => !!currentUser.value)
  const isAdmin = computed(() => userRole.value === 'admin')

  const fetchUserRole = async () => {
    if (!currentUser.value) return

    try {
      const headers = await buildAuthHeaders()
      const response = await fetch('/api/users/me', { headers })

      if (response.ok) {
        const userData = await response.json()
        userRole.value = userData.role || 'user'
      } else {
        userRole.value = 'user'
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      userRole.value = 'user'
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      currentUser.value = userCredential.user
      await fetchUserRole()
      return userCredential.user
    } catch (error: any) {
      console.error('Sign in error:', error)
      throw new Error(error.message || 'Failed to sign in')
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      userRole.value = 'user'
      router.push('/signin')
    } catch (error: any) {
      console.error('Sign out error:', error)
      throw new Error(error.message || 'Failed to sign out')
    }
  }

  const initAuth = () => {
    if (authInitialized) return
    authInitialized = true

    onAuthStateChanged(auth, async (user) => {
      currentUser.value = user
      isLoading.value = false
    })
  }

  watch(
    currentUser,
    async (user) => {
      if (user) {
        await fetchUserRole()
      } else {
        userRole.value = 'user'
      }
    },
    { immediate: true }
  )

  onMounted(() => {
    initAuth()
  })

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    userRole,
    isLoading,
    getAuthHeaders: buildAuthHeaders,
    signIn,
    signOut,
    initAuth
  }
}
