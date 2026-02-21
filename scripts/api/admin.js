// Admin API
(function() {
    Object.assign(FinanceAPI.prototype, {
        async syncEcbDaily() {
            return this.request('/api/admin/external-rate-sync/ecb/daily', {
                method: 'POST'
            })
        },

        async syncEcbHistory() {
            return this.request('/api/admin/external-rate-sync/ecb/history', {
                method: 'POST'
            })
        }
    })
})()
