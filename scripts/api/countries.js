// Countries API
(function() {
    Object.assign(FinanceAPI.prototype, {
        async getCountries() {
            return this.getAll('countries');
        },

        async createCountry(data) {
            return this.create('countries', data);
        },

        async updateCountry(id, data) {
            return this.update('countries', id, data);
        },

        async deleteCountry(id) {
            return this.delete('countries', id);
        }
    });
})();
