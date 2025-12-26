// Counterparties API
(function() {
    Object.assign(FinanceAPI.prototype, {
        async getCounterparties(page = 0, size = 50) {
            return this.getPaginated('/api/counterparties', page, size);
        },

        async createCounterparty(data) {
            return this.create('counterparties', data);
        },

        async updateCounterparty(id, data) {
            return this.update('counterparties', id, data);
        },

        async deleteCounterparty(id) {
            return this.delete('counterparties', id);
        },

        async activateCounterparty(id) {
            return this.request(`/api/counterparties/${id}/activate`, {
                method: 'PATCH'
            });
        },

        async deactivateCounterparty(id) {
            return this.request(`/api/counterparties/${id}/deactivate`, {
                method: 'PATCH'
            });
        }
    });
})();
