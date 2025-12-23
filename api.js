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

    // Bank Payments
    async getBankPayments(page = 0, size = 20, sort = 'transactionDateTime,desc') {
        return this.getPaginated('/api/v1/bank-payments', page, size, sort);
    }

    async getBankPaymentById(id) {
        return this.request(`/api/v1/bank-payments/${id}`);
    }

    async createBankPayment(data) {
        return this.request('/api/v1/bank-payments', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateBankPayment(id, data) {
        return this.request(`/api/v1/bank-payments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteBankPayment(id) {
        return this.request(`/api/v1/bank-payments/${id}`, {
            method: 'DELETE'
        });
    }

    async postBankPayment(id) {
        return this.request(`/api/v1/bank-payments/${id}/post`, {
            method: 'POST'
        });
    }

    async unpostBankPayment(id) {
        return this.request(`/api/v1/bank-payments/${id}/unpost`, {
            method: 'POST'
        });
    }

    async getBankPaymentsByStatus(status, page = 0, size = 20) {
        return this.getPaginated(`/api/v1/bank-payments/status/${status}`, page, size);
    }

    async getBankPaymentsByDateRange(startDate, endDate, page = 0, size = 20) {
        const params = new URLSearchParams({
            startDate,
            endDate,
            page: page.toString(),
            size: size.toString()
        });
        return this.request(`/api/v1/bank-payments/date-range?${params}`);
    }

    // Bank Receipts
    async getBankReceipts(page = 0, size = 20, sort = 'transactionDateTime,desc') {
        return this.getPaginated('/api/v1/bank-receipts', page, size, sort);
    }

    async getBankReceiptById(id) {
        return this.request(`/api/v1/bank-receipts/${id}`);
    }

    async createBankReceipt(data) {
        return this.request('/api/v1/bank-receipts', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateBankReceipt(id, data) {
        return this.request(`/api/v1/bank-receipts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteBankReceipt(id) {
        return this.request(`/api/v1/bank-receipts/${id}`, {
            method: 'DELETE'
        });
    }

    async postBankReceipt(id) {
        return this.request(`/api/v1/bank-receipts/${id}/post`, {
            method: 'POST'
        });
    }

    async unpostBankReceipt(id) {
        return this.request(`/api/v1/bank-receipts/${id}/unpost`, {
            method: 'POST'
        });
    }

    // Bank Accounts
    async getBankAccounts() {
        return this.getAll('bank-accounts');
    }

    async getBankAccountsByHolder(holderType, holderId) {
        return this.request(`/api/bank-accounts/holder/${holderType}/${holderId}`);
    }

    async createBankAccount(data) {
        return this.create('bank-accounts', data);
    }

    async updateBankAccount(id, data) {
        return this.update('bank-accounts', id, data);
    }

    async deleteBankAccount(id) {
        return this.delete('bank-accounts', id);
    }

    async setDefaultBankAccount(id) {
        return this.request(`/api/bank-accounts/${id}/set-default`, {
            method: 'PATCH'
        });
    }

    async changeBankAccountStatus(id, status) {
        return this.request(`/api/bank-accounts/${id}/status/${status}`, {
            method: 'PATCH'
        });
    }

    // Banks
    async getBanks() {
        return this.getAll('banks');
    }

    async createBank(data) {
        return this.create('banks', data);
    }

    async updateBank(id, data) {
        return this.update('banks', id, data);
    }

    async deleteBank(id) {
        return this.delete('banks', id);
    }

    async activateBank(id) {
        return this.request(`/api/banks/${id}/activate`, {
            method: 'PATCH'
        });
    }

    async deactivateBank(id) {
        return this.request(`/api/banks/${id}/deactivate`, {
            method: 'PATCH'
        });
    }

    // Organizations
    async getOrganizations() {
        return this.getAll('organizations');
    }

    async createOrganization(data) {
        return this.create('organizations', data);
    }

    async updateOrganization(id, data) {
        return this.update('organizations', id, data);
    }

    async deleteOrganization(id) {
        return this.delete('organizations', id);
    }

    // Counterparties
    async getCounterparties(page = 0, size = 50) {
        return this.getPaginated('/api/counterparties', page, size);
    }

    async createCounterparty(data) {
        return this.create('counterparties', data);
    }

    async updateCounterparty(id, data) {
        return this.update('counterparties', id, data);
    }

    async deleteCounterparty(id) {
        return this.delete('counterparties', id);
    }

    async activateCounterparty(id) {
        return this.request(`/api/counterparties/${id}/activate`, {
            method: 'PATCH'
        });
    }

    async deactivateCounterparty(id) {
        return this.request(`/api/counterparties/${id}/deactivate`, {
            method: 'PATCH'
        });
    }

    // Currencies
    async getCurrencies() {
        return this.getAll('currencies');
    }

    async createCurrency(data) {
        return this.create('currencies', data);
    }

    async updateCurrency(id, data) {
        return this.update('currencies', id, data);
    }

    async deleteCurrency(id) {
        return this.delete('currencies', id);
    }

    // Countries
    async getCountries() {
        return this.getAll('countries');
    }

    async createCountry(data) {
        return this.create('countries', data);
    }

    async updateCountry(id, data) {
        return this.update('countries', id, data);
    }

    async deleteCountry(id) {
        return this.delete('countries', id);
    }

    // Exchange Rates
    async getExchangeRates(page = 0, size = 200) {
        return this.getPaginated('/api/exchange-rates', page, size);
    }

    async createExchangeRate(data) {
        return this.create('exchange-rates', data);
    }

    async updateExchangeRate(id, data) {
        return this.update('exchange-rates', id, data);
    }

    async deleteExchangeRate(id) {
        return this.delete('exchange-rates', id);
    }

    async syncECBDaily() {
        return this.request('/api/admin/external-rate-sync/ecb/daily', {
            method: 'POST'
        });
    }

    async syncECBHistory() {
        return this.request('/api/admin/external-rate-sync/ecb/history', {
            method: 'POST'
        });
    }

    // Accounting Policies
    async getAccountingPolicies() {
        return this.getAll('accounting-policies');
    }

    async createAccountingPolicy(data) {
        return this.create('accounting-policies', data);
    }

    async updateAccountingPolicy(id, data) {
        return this.update('accounting-policies', id, data);
    }

    async deleteAccountingPolicy(id) {
        return this.delete('accounting-policies', id);
    }

    // Reports
    async getAccountBalances(asOfDate, organizationId = null, currencyId = null) {
        const params = new URLSearchParams({ asOfDate });
        if (organizationId) params.append('organizationId', organizationId);
        if (currencyId) params.append('currencyId', currencyId);
        return this.request(`/api/v1/banking/reports/account-balances?${params}`);
    }

    async getAccountTurnovers(startDate, endDate, organizationId = null, accountId = null, currencyId = null) {
        const params = new URLSearchParams({ startDate, endDate });
        if (organizationId) params.append('organizationId', organizationId);
        if (accountId) params.append('accountId', accountId);
        if (currencyId) params.append('currencyId', currencyId);
        return this.request(`/api/v1/banking/reports/account-turnovers?${params}`);
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

// Create global API instance
const api = new FinanceAPI(API_BASE_URL);