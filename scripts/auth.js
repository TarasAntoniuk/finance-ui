/**
 * Authentication Module
 * JWT token management, role-based access control, login/logout flows
 */

// Access token lives in localStorage; the refresh token is an HttpOnly cookie
// set by the backend on /api/auth/refresh and never readable from JavaScript.
const ACCESS_TOKEN_KEY = 'accessToken'
const LEGACY_REFRESH_TOKEN_KEY = 'refreshToken'

const auth = {
    // Token refresh state
    _isRefreshing: false,
    _refreshQueue: [],

    /**
     * Decode JWT payload without verification (for UI purposes only)
     */
    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            )
            return JSON.parse(jsonPayload)
        } catch {
            return null
        }
    },

    /**
     * Save the access token returned by an auth endpoint
     */
    saveAccessToken(accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
        localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
    },

    /**
     * Clear all auth data from localStorage
     */
    clearTokens() {
        localStorage.removeItem(ACCESS_TOKEN_KEY)
        localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY)
    },

    /**
     * Get current access token
     */
    getAccessToken() {
        return localStorage.getItem(ACCESS_TOKEN_KEY)
    },

    /**
     * Get current user info from decoded access token
     * @returns {Object|null} {id, email, role} or null
     */
    getCurrentUser() {
        const token = this.getAccessToken()
        if (!token) return null
        const payload = this.parseJwt(token)
        if (!payload) return null
        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role
        }
    },

    /**
     * Get current user role
     * @returns {string|null} 'GUEST' | 'USER' | 'ADMIN' | null
     */
    getCurrentRole() {
        const user = this.getCurrentUser()
        return user ? user.role : null
    },

    /**
     * Check if current user can create/edit/delete records
     */
    canWrite() {
        const role = this.getCurrentRole()
        return role === 'USER' || role === 'ADMIN'
    },

    /**
     * Check if current user is admin
     */
    isAdmin() {
        return this.getCurrentRole() === 'ADMIN'
    },

    /**
     * Check if user is authenticated (has a token)
     */
    isAuthenticated() {
        return !!this.getAccessToken()
    },

    /**
     * Check if access token expires within threshold
     * @param {number} thresholdSeconds - seconds before expiry to consider "expiring soon"
     */
    isTokenExpiringSoon(thresholdSeconds = 60) {
        const token = this.getAccessToken()
        if (!token) return true
        try {
            const payload = this.parseJwt(token)
            if (!payload || !payload.exp) return true
            const expiresAt = payload.exp * 1000
            return Date.now() > expiresAt - thresholdSeconds * 1000
        } catch {
            return true
        }
    },

    /**
     * Check if access token is fully expired
     */
    isTokenExpired() {
        return this.isTokenExpiringSoon(0)
    },

    /**
     * Ensure we have a valid token before making a request.
     * Proactively refreshes if token is expiring soon.
     * @returns {boolean} true if we have a valid token
     */
    async ensureValidToken() {
        if (!this.isTokenExpiringSoon()) return true

        return this.refreshTokens()
    },

    /**
     * Refresh the access token using the HttpOnly refresh token cookie.
     * Handles concurrent refresh requests with a queue.
     * @returns {boolean} true if refresh succeeded
     */
    async refreshTokens() {
        if (this._isRefreshing) {
            return new Promise((resolve) => {
                this._refreshQueue.push(resolve)
            })
        }

        this._isRefreshing = true

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include'
            })

            if (!response.ok) {
                this.clearTokens()
                this._processQueue(false)
                return false
            }

            const data = await response.json()
            this.saveAccessToken(data.accessToken)
            this._processQueue(true)
            return true
        } catch {
            this.clearTokens()
            this._processQueue(false)
            return false
        } finally {
            this._isRefreshing = false
        }
    },

    /**
     * Process queued refresh requests
     */
    _processQueue(success) {
        this._refreshQueue.forEach(resolve => resolve(success))
        this._refreshQueue = []
    },

    /**
     * Login with email and password
     * @returns {Object} {success, user, error, validationErrors}
     */
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            if (response.ok) {
                const data = await response.json()
                this.saveAccessToken(data.accessToken)
                return { success: true, user: this.getCurrentUser() }
            }

            const errorData = await response.json().catch(() => ({}))

            if (response.status === 401) {
                return { success: false, error: 'Invalid email or password' }
            }
            if (response.status === 403) {
                return { success: false, error: 'Your account has been disabled' }
            }
            if (response.status === 400 && errorData.validationErrors) {
                return { success: false, error: 'Validation failed', validationErrors: errorData.validationErrors }
            }

            return { success: false, error: errorData.message || 'Login failed' }
        } catch {
            return { success: false, error: 'Network error. Please check your connection.' }
        }
    },

    /**
     * Login with a Google ID token obtained from Google Identity Services.
     * New users are auto-provisioned on the backend (GUEST role).
     * @returns {Object} {success, user, error}
     */
    async loginWithGoogle(idToken) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            })

            if (response.ok) {
                const data = await response.json()
                this.saveAccessToken(data.accessToken)
                return { success: true, user: this.getCurrentUser() }
            }

            const errorData = await response.json().catch(() => ({}))

            if (response.status === 403) {
                return { success: false, error: 'Your account has been disabled' }
            }

            return { success: false, error: errorData.message || 'Google sign-in failed' }
        } catch {
            return { success: false, error: 'Network error. Please check your connection.' }
        }
    },

    /**
     * Register a new account
     * @returns {Object} {success, user, error, validationErrors}
     */
    async register(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            if (response.status === 201) {
                const data = await response.json()
                this.saveAccessToken(data.accessToken)
                return { success: true, user: this.getCurrentUser() }
            }

            const errorData = await response.json().catch(() => ({}))

            if (response.status === 409) {
                return { success: false, error: errorData.message || 'Email already registered' }
            }
            if (response.status === 400 && errorData.validationErrors) {
                return { success: false, error: 'Validation failed', validationErrors: errorData.validationErrors }
            }

            return { success: false, error: errorData.message || 'Registration failed' }
        } catch {
            return { success: false, error: 'Network error. Please check your connection.' }
        }
    },

    /**
     * Logout - revoke tokens on server and clear local storage
     */
    async logout() {
        const accessToken = this.getAccessToken()

        // Always clear local tokens regardless of server response
        this.clearTokens()

        if (accessToken) {
            try {
                await fetch(`${API_BASE_URL}/api/auth/logout`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                })
            } catch {
                // Ignore errors - local cleanup is what matters
            }
        }
    }
}
