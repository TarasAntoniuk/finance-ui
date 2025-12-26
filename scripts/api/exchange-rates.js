// Exchange Rates API
(function() {
    Object.assign(FinanceAPI.prototype, {
        async getExchangeRates(page = 0, size = 200) {
            return this.getPaginated('/api/exchange-rates', page, size);
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

        async syncECBDaily() {
            return this.request('/api/admin/external-rate-sync/ecb/daily', {
                method: 'POST'
            });
        },

        async syncECBHistory() {
            return this.request('/api/admin/external-rate-sync/ecb/history', {
                method: 'POST'
            });
        }
    });
})();
