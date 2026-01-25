import { auth } from '@/firebase'
import { useRouter } from 'vue-router'

export async function getAuthHeaders() {
  const user = auth.currentUser
  if (!user) {
    throw new Error('User not authenticated')
  }
  const token = await user.getIdToken()
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
}

/**
 * Wrapper around fetch that handles auth errors globally.
 * If 401/403 is returned, redirects to signin.
 */
export async function apiFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, init)

  // Handle auth errors - redirect to signin
  if (response.status === 401 || response.status === 403) {
    const router = useRouter()
    router.push('/signin')
    throw new Error(
      response.status === 401
        ? 'Your session has expired. Please sign in again.'
        : 'You do not have permission to access this resource.'
    )
  }

  return response
}
