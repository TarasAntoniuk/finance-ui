// Bank Receipts API
(function() {
    Object.assign(FinanceAPI.prototype, {
        async getBankReceipts(page = 0, size = 20, sort = 'transactionDateTime,desc') {
            return this.getPaginated('/api/v1/bank-receipts', page, size, sort);
        },

        async getBankReceiptById(id) {
            return this.request(`/api/v1/bank-receipts/${id}`);
        },

        async createBankReceipt(data) {
            return this.request('/api/v1/bank-receipts', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async updateBankReceipt(id, data) {
            return this.request(`/api/v1/bank-receipts/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        async deleteBankReceipt(id) {
            return this.request(`/api/v1/bank-receipts/${id}`, {
                method: 'DELETE'
            });
        },

        async postBankReceipt(id) {
            return this.request(`/api/v1/bank-receipts/${id}/post`, {
                method: 'POST'
            });
        },

        async unpostBankReceipt(id) {
            return this.request(`/api/v1/bank-receipts/${id}/unpost`, {
                method: 'POST'
            });
        }
    });
})();
