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
        },

        async getUsers(page = 0, size = 20) {
            return this.getPaginated('/api/admin/users', page, size)
        },

        async getUser(id) {
            return this.request(`/api/admin/users/${id}`)
        },

        async changeUserRole(id, role) {
            return this.request(`/api/admin/users/${id}/role?role=${encodeURIComponent(role)}`, {
                method: 'PATCH'
            })
        },

        async changeUserStatus(id, active) {
            return this.request(`/api/admin/users/${id}/status?active=${active}`, {
                method: 'PATCH'
            })
        }
    })
})()
