import { auth } from '@/firebase'

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

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Wrapper around fetch that throws AuthError on 401/403.
 * Components should catch AuthError and redirect to signin.
 */
export async function apiFetch(url: string, init?: RequestInit) {
  const response = await fetch(url, init)

  // Handle auth errors
  if (response.status === 401) {
    throw new AuthError(401, 'Your session has expired. Please sign in again.')
  }
  if (response.status === 403) {
    throw new AuthError(403, 'You do not have permission to access this resource.')
  }

  return response
}

