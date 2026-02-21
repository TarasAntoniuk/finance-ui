/**
 * Detects current environment based on hostname
 * @returns {string} 'local' or 'production'
 */
function detectEnvironment() {
    const hostname = window.location.hostname

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'local'
    }

    // Any other domain is considered production
    return 'production'
}

/**
 * Gets API base URL based on environment
 * @param {string} environment - 'local' or 'production'
 * @returns {string} API base URL
 */
function getApiBaseUrl(environment) {
    switch (environment) {
        case 'local':
            return 'http://localhost:8080'
        case 'production':
            return 'https://api.tarasantoniuk.com'
        default:
            return 'https://api.tarasantoniuk.com'
    }
}

// API Configuration - Automatically detect environment
const CURRENT_ENVIRONMENT = detectEnvironment()
const API_BASE_URL = getApiBaseUrl(CURRENT_ENVIRONMENT)

console.log(`🔧 API Configuration: ${CURRENT_ENVIRONMENT} environment - ${API_BASE_URL}`)

// API Client
class FinanceAPI {
    constructor(baseUrl) {
        this.baseUrl = baseUrl
        this.environment = CURRENT_ENVIRONMENT
    }

    /**
     * Gets connection information for display purposes
     * @returns {Object} Connection info with environment, baseUrl, hostname
     */
    getConnectionInfo() {
        return {
            environment: this.environment,
            baseUrl: this.baseUrl,
            hostname: window.location.hostname,
            protocol: window.location.protocol,
            isProduction: this.environment === 'production'
        }
    }

    /**
     * Check if an endpoint is a public auth endpoint (no token needed)
     */
    _isAuthEndpoint(endpoint) {
        return endpoint.startsWith('/api/auth/')
    }

    async request(endpoint, options = {}, _isRetry = false) {
        const url = `${this.baseUrl}${endpoint}`
        const isAuthEndpoint = this._isAuthEndpoint(endpoint)

        // Proactive token refresh for non-auth endpoints
        if (!isAuthEndpoint && typeof auth !== 'undefined' && auth.isAuthenticated()) {
            await auth.ensureValidToken()
        }

        // Build headers - attach Bearer token for non-auth endpoints
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        }

        if (!isAuthEndpoint && typeof auth !== 'undefined') {
            const token = auth.getAccessToken()
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }
        }

        const config = {
            ...options,
            headers
        }

        try {
            const response = await fetch(url, config)

            // Handle 401 - attempt token refresh and retry once
            if (response.status === 401 && !isAuthEndpoint && !_isRetry && typeof auth !== 'undefined') {
                const refreshed = await auth.refreshTokens()
                if (refreshed) {
                    return this.request(endpoint, options, true)
                }
                // Refresh failed - redirect to login
                auth.clearTokens()
                if (typeof showLoginPage === 'function') {
                    showLoginPage()
                }
                const error = await response.json().catch(() => ({}))
                throw new Error(error.message || 'Session expired. Please log in again.')
            }

            // Handle 403 - show access denied, do NOT redirect
            if (response.status === 403 && !isAuthEndpoint) {
                const error = await response.json().catch(() => ({}))
                if (typeof utils !== 'undefined') {
                    utils.showToast(error.message || 'You do not have permission to perform this action', 'error')
                }
                throw new Error(error.message || 'Access denied')
            }

            if (!response.ok) {
                const error = await response.json().catch(() => ({}))
                throw new Error(error.message || `HTTP error! status: ${response.status}`)
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return null
            }

            return await response.json()
        } catch (error) {
            console.error('API Request failed:', error)
            throw error
        }
    }

    // Generic CRUD operations
    async getAll(resource) {
        return this.request(`/api/${resource}`);
    }

    async getById(resource, id) {
        return this.request(`/api/${resource}/${id}`);
    }

    async create(resource, data) {
        return this.request(`/api/${resource}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async update(resource, id, data) {
        return this.request(`/api/${resource}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(resource, id) {
        return this.request(`/api/${resource}/${id}`, {
            method: 'DELETE'
        });
    }

    // Paginated requests
    async getPaginated(endpoint, page = 0, size = 20, sort = '') {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString()
        });
        if (sort) params.append('sort', sort);
        return this.request(`${endpoint}?${params}`);
    }

    // Health check - uses a simple fetch to avoid auth interceptor issues
    async checkConnection() {
        try {
            const headers = { 'Content-Type': 'application/json' }
            const token = typeof auth !== 'undefined' ? auth.getAccessToken() : null
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }
            const response = await fetch(`${this.baseUrl}/api/currencies`, { headers })
            return response.ok || response.status === 401 || response.status === 403
        } catch {
            return false
        }
    }
}
