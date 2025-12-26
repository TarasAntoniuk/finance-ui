// Bank Payments API
(function() {
    Object.assign(FinanceAPI.prototype, {
        async getBankPayments(page = 0, size = 20, sort = 'transactionDateTime,desc') {
            return this.getPaginated('/api/v1/bank-payments', page, size, sort);
        },

        async getBankPaymentById(id) {
            return this.request(`/api/v1/bank-payments/${id}`);
        },

        async createBankPayment(data) {
            return this.request('/api/v1/bank-payments', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        },

        async updateBankPayment(id, data) {
            return this.request(`/api/v1/bank-payments/${id}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        },

        async deleteBankPayment(id) {
            return this.request(`/api/v1/bank-payments/${id}`, {
                method: 'DELETE'
            });
        },

        async postBankPayment(id) {
            return this.request(`/api/v1/bank-payments/${id}/post`, {
                method: 'POST'
            });
        },

        async unpostBankPayment(id) {
            return this.request(`/api/v1/bank-payments/${id}/unpost`, {
                method: 'POST'
            });
        },

        async getBankPaymentsByStatus(status, page = 0, size = 20) {
            return this.getPaginated(`/api/v1/bank-payments/status/${status}`, page, size);
        },

        async getBankPaymentsByDateRange(startDate, endDate, page = 0, size = 20) {
            const params = new URLSearchParams({
                startDate,
                endDate,
                page: page.toString(),
                size: size.toString()
            });
            return this.request(`/api/v1/bank-payments/date-range?${params}`);
        }
    });
})();
