// Bank Accounts API
(function() {
    Object.assign(FinanceAPI.prototype, {
        async getBankAccounts() {
            return this.getAll('bank-accounts');
        },

        async getBankAccountsByHolderType(holderType) {
            return this.request(`/api/bank-accounts/holder/${holderType}`);
        },

        async getBankAccountsByHolder(holderType, holderId) {
            return this.request(`/api/bank-accounts/holder/${holderType}/${holderId}`);
        },

        async createBankAccount(data) {
            return this.create('bank-accounts', data);
        },

        async updateBankAccount(id, data) {
            return this.update('bank-accounts', id, data);
        },

        async deleteBankAccount(id) {
            return this.delete('bank-accounts', id);
        },

        async setDefaultBankAccount(id) {
            return this.request(`/api/bank-accounts/${id}/set-default`, {
                method: 'PATCH'
            });
        },

        async changeBankAccountStatus(id, status) {
            return this.request(`/api/bank-accounts/${id}/status/${status}`, {
                method: 'PATCH'
            });
        }
    });
})();
