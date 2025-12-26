// API Configuration
// const API_BASE_URL = 'https://api.tarasantoniuk.com';
const API_BASE_URL = 'http://localhost:8080'; // For local development

// API Client
class FinanceAPI {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.message || `HTTP error! status: ${response.status}`);
            }

            // Handle 204 No Content
            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
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

    // Health check
    async checkConnection() {
        try {
            await this.request('/api/currencies');
            return true;
        } catch (error) {
            return false;
        }
    }
}
