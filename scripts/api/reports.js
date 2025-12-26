// Reports API
(function() {
    Object.assign(FinanceAPI.prototype, {
        async getAccountBalances(asOfDate, organizationId = null, currencyId = null) {
            const params = new URLSearchParams({ asOfDate });
            if (organizationId) params.append('organizationId', organizationId);
            if (currencyId) params.append('currencyId', currencyId);
            return this.request(`/api/v1/banking/reports/account-balances?${params}`);
        },

        async getAccountTurnovers(periodType = 'QUARTER', startDate = null, endDate = null, organizationId = null, accountId = null, currencyId = null) {
            const params = new URLSearchParams();

            // Add periodType
            if (periodType) params.append('periodType', periodType);

            // Add dates based on period type
            if (periodType === 'CUSTOM') {
                // For CUSTOM, both dates are required
                if (startDate) params.append('startDate', startDate);
                if (endDate) params.append('endDate', endDate);
            } else {
                // For other types, only startDate is optional (to determine which period)
                if (startDate) params.append('startDate', startDate);
            }

            // Add optional filters
            if (organizationId) params.append('organizationId', organizationId);
            if (accountId) params.append('accountId', accountId);
            if (currencyId) params.append('currencyId', currencyId);

            return this.request(`/api/v1/banking/reports/account-turnovers?${params}`);
        },

        async getAccountTurnoverDetails(accountId, startDate, endDate, organizationId) {
            const params = new URLSearchParams({
                startDate,
                endDate,
                organizationId: organizationId.toString()
            });
            return this.request(`/api/v1/banking/reports/account-turnovers/${accountId}/details?${params}`);
        }
    });
})();
