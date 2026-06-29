// Organizations API
(function() {
    Object.assign(FinanceAPI.prototype, {
        async getOrganizations() {
            // Backend returns a paginated wrapper { content, metadata };
            // unwrap to a plain array since all callers expect a list.
            const response = await this.getAll('organizations');
            return Array.isArray(response) ? response : (response?.content ?? []);
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
