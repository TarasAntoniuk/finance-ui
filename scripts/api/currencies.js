// Currencies API
(function() {
    Object.assign(FinanceAPI.prototype, {
        async getCurrencies() {
            return this.getAll('currencies');
        },

        async createCurrency(data) {
            return this.create('currencies', data);
        },

        async updateCurrency(id, data) {
            return this.update('currencies', id, data);
        },

        async deleteCurrency(id) {
            return this.delete('currencies', id);
        }
    });
})();
