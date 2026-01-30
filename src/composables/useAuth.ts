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
const userRole = ref<string>('user')
const isLoading = ref(true)

export function useAuth() {
  const router = useRouter()

  const isAuthenticated = computed(() => !!currentUser.value)
  const isAdmin = computed(() => userRole.value === 'admin')

  const fetchUserRole = async () => {
    if (!currentUser.value) return
    
    try {
      const token = await currentUser.value.getIdToken()
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        userRole.value = userData.role || 'user'
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
      userRole.value = 'user'
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
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
    onAuthStateChanged(auth, async (user) => {
      currentUser.value = user
      if (user) {
        await fetchUserRole()
      } else {
        userRole.value = 'user'
      }
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
    isAdmin,
    userRole,
    isLoading,
    signIn,
    signOut,
    initAuth
  }
}
