// Exchange Rates API
(function() {
    Object.assign(FinanceAPI.prototype, {
        // Base CRUD operations
        async getExchangeRates(page = 0, size = 200) {
            return this.getPaginated('/api/exchange-rates', page, size);
        },

        async getExchangeRateById(id) {
            return this.getById('exchange-rates', id);
        },

        async createExchangeRate(data) {
            return this.create('exchange-rates', data);
        },

        async updateExchangeRate(id, data) {
            return this.update('exchange-rates', id, data);
        },

        async deleteExchangeRate(id) {
            return this.delete('exchange-rates', id);
        },

        // Activation/Deactivation
        async activateExchangeRate(id) {
            return this.request(`/api/exchange-rates/${id}/activate`, 'POST');
        },

        async deactivateExchangeRate(id) {
            return this.request(`/api/exchange-rates/${id}/deactivate`, 'POST');
        },

        // Query endpoints
        async getExchangeRatesByDate(date) {
            return this.request(`/api/exchange-rates/date/${date}`);
        },

        async getLatestExchangeRates(date) {
            return this.request(`/api/exchange-rates/latest/${date}`);
        },

        async getExchangeRatesByDateAndSource(date, source) {
            return this.request(`/api/exchange-rates/date/${date}/source/${source}`);
        },

        async getExchangeRatesByDateRange(startDate, endDate, page = 0, size = 200) {
            return this.getPaginated(`/api/exchange-rates/date-range?startDate=${startDate}&endDate=${endDate}`, page, size);
        },

        async getExchangeRatesByCurrencyPair(currencyFromId, currencyToId, page = 0, size = 200) {
            return this.getPaginated(`/api/exchange-rates/currency-pair?currencyFromId=${currencyFromId}&currencyToId=${currencyToId}`, page, size);
        },

        // Admin sync operations
        async syncECBDaily() {
            return this.request('/api/admin/external-rate-sync/ecb/daily', 'POST');
        },

        async syncECBHistory() {
            return this.request('/api/admin/external-rate-sync/ecb/history', 'POST');
        }
    });
})();
