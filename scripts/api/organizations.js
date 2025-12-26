// Organizations API
(function() {
    Object.assign(FinanceAPI.prototype, {
        async getOrganizations() {
            return this.getAll('organizations');
        },

        async createOrganization(data) {
            return this.create('organizations', data);
        },

        async updateOrganization(id, data) {
            return this.update('organizations', id, data);
        },

        async deleteOrganization(id) {
            return this.delete('organizations', id);
        }
    });
})();
