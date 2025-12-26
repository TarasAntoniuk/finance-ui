// Accounting Policies API
(function() {
    Object.assign(FinanceAPI.prototype, {
        async getAccountingPolicies() {
            return this.getAll('accounting-policies');
        },

        async createAccountingPolicy(data) {
            return this.create('accounting-policies', data);
        },

        async updateAccountingPolicy(id, data) {
            return this.update('accounting-policies', id, data);
        },

        async deleteAccountingPolicy(id) {
            return this.delete('accounting-policies', id);
        }
    });
})();
