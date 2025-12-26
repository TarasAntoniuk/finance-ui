// Banks API
(function() {
    Object.assign(FinanceAPI.prototype, {
        async getBanks() {
            return this.getAll('banks');
        },

        async createBank(data) {
            return this.create('banks', data);
        },

        async updateBank(id, data) {
            return this.update('banks', id, data);
        },

        async deleteBank(id) {
            return this.delete('banks', id);
        },

        async activateBank(id) {
            return this.request(`/api/banks/${id}/activate`, {
                method: 'PATCH'
            });
        },

        async deactivateBank(id) {
            return this.request(`/api/banks/${id}/deactivate`, {
                method: 'PATCH'
            });
        }
    });
})();
