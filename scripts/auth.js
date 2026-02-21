/**
 * Authentication Module
 * JWT token management, role-based access control, login/logout flows
 */

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
     * Save tokens to localStorage
     */
    saveTokens(accessToken, refreshToken) {
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
    },

    /**
     * Clear all auth data from localStorage
     */
    clearTokens() {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
    },

    /**
     * Get current access token
     */
    getAccessToken() {
        return localStorage.getItem('accessToken')
    },

    /**
     * Get current refresh token
     */
    getRefreshToken() {
        return localStorage.getItem('refreshToken')
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

        const refreshToken = this.getRefreshToken()
        if (!refreshToken) return false

        return this.refreshTokens()
    },

    /**
     * Refresh tokens using the refresh token
     * Handles concurrent refresh requests with a queue
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
            const refreshToken = this.getRefreshToken()
            if (!refreshToken) {
                this._processQueue(false)
                return false
            }

            const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'X-Refresh-Token': refreshToken }
            })

            if (!response.ok) {
                this.clearTokens()
                this._processQueue(false)
                return false
            }

            const data = await response.json()
            this.saveTokens(data.accessToken, data.refreshToken)
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            if (response.ok) {
                const data = await response.json()
                this.saveTokens(data.accessToken, data.refreshToken)
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
     * Register a new account
     * @returns {Object} {success, user, error, validationErrors}
     */
    async register(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            })

            if (response.status === 201) {
                const data = await response.json()
                this.saveTokens(data.accessToken, data.refreshToken)
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
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                })
            } catch {
                // Ignore errors - local cleanup is what matters
            }
        }
    }
}
