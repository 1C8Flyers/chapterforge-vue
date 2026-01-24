import { ref, computed, onMounted } from 'vue'
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { auth } from '../firebase'
import { useRouter } from 'vue-router'

const currentUser = ref<User | null>(null)
const isLoading = ref(true)

export function useAuth() {
  const router = useRouter()

  const isAuthenticated = computed(() => !!currentUser.value)

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      return userCredential.user
    } catch (error: any) {
      console.error('Sign in error:', error)
      throw new Error(error.message || 'Failed to sign in')
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      router.push('/signin')
    } catch (error: any) {
      console.error('Sign out error:', error)
      throw new Error(error.message || 'Failed to sign out')
    }
  }

  const initAuth = () => {
    onAuthStateChanged(auth, (user) => {
      currentUser.value = user
      isLoading.value = false
    })
  }

  onMounted(() => {
    if (isLoading.value) {
      initAuth()
    }
  })

  return {
    currentUser,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
    initAuth
  }
}
