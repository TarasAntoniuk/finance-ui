// Accounting Policies API
(function() {
    Object.assign(FinanceAPI.prototype, {
        // Base CRUD operations
        async getAccountingPolicies() {
            return this.getAll('accounting-policies');
        },

        async getAccountingPolicyById(id) {
            return this.getById('accounting-policies', id);
        },

        async createAccountingPolicy(data) {
            return this.create('accounting-policies', data);
        },

        async updateAccountingPolicy(id, data) {
            return this.update('accounting-policies', id, data);
        },

        async deleteAccountingPolicy(id) {
            return this.delete('accounting-policies', id);
        },

        // Activation/Deactivation
        async activateAccountingPolicy(id) {
            return this.request(`/api/accounting-policies/${id}/activate`, 'PATCH');
        },

        async deactivateAccountingPolicy(id) {
            return this.request(`/api/accounting-policies/${id}/deactivate`, 'PATCH');
        },

        // Query endpoints
        async getAccountingPoliciesByOrganization(organizationId) {
            return this.request(`/api/accounting-policies/organization/${organizationId}`);
        },

        async getActiveAccountingPolicyByOrganization(organizationId) {
            return this.request(`/api/accounting-policies/organization/${organizationId}/active`);
        },

        async getAccountingPolicyByOrganizationAndYear(organizationId, year) {
            return this.request(`/api/accounting-policies/organization/${organizationId}/year/${year}`);
        },

        async getAccountingPoliciesByYear(year) {
            return this.request(`/api/accounting-policies/year/${year}`);
        },

        async getAccountingPoliciesByYearRange(startYear, endYear) {
            return this.request(`/api/accounting-policies/year-range?startYear=${startYear}&endYear=${endYear}`);
        },

        async getAccountingPoliciesByCurrency(currencyId) {
            return this.request(`/api/accounting-policies/currency/${currencyId}`);
        }
    });
})();
