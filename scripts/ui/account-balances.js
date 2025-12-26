/**
 * Account Balances Module
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Add Account Balances methods
Object.assign(modules, {
    // Banking Reports
    async 'account-balances'() {
        document.getElementById('module-title').textContent = 'Account Balances';
        const contentBody = document.getElementById('content-body');

        // Get current date as default
        const today = new Date().toISOString().split('T')[0];

        contentBody.innerHTML = `
            <div class="action-bar">
                <div class="action-bar-left">
                    <h3>Account Balance Report</h3>
                </div>
                <div class="action-bar-right">
                    <input type="date" id="as-of-date" value="${today}">
                    <select id="org-filter">
                        <option value="">All Organizations</option>
                    </select>
                    <select id="currency-filter">
                        <option value="">All Currencies</option>
                    </select>
                    <button class="btn btn-primary" onclick="modules['account-balances']()">
                        🔍 Generate Report
                    </button>
                </div>
            </div>
            <div id="report-content">
                <div class="text-center">
                    <p>Select filters and click "Generate Report"</p>
                </div>
            </div>
        `;

        try {
            // Load filter options
            const [organizations, currencies] = await Promise.all([
                api.getOrganizations(),
                api.getCurrencies()
            ]);

            const orgFilter = document.getElementById('org-filter');
            organizations.forEach(org => {
                const option = document.createElement('option');
                option.value = org.id;
                option.textContent = org.name;
                orgFilter.appendChild(option);
            });

            const currFilter = document.getElementById('currency-filter');
            currencies.forEach(curr => {
                const option = document.createElement('option');
                option.value = curr.id;
                option.textContent = `${curr.code} - ${curr.name}`;
                currFilter.appendChild(option);
            });

            // Load report data
            const asOfDate = document.getElementById('as-of-date').value;
            const orgId = document.getElementById('org-filter').value || null;
            const currId = document.getElementById('currency-filter').value || null;

            const report = await api.getAccountBalances(asOfDate, orgId, currId);

            const reportContent = document.getElementById('report-content');
            reportContent.innerHTML = `
                <div class="report-header">
                    <p><strong>Report Date:</strong> ${utils.formatDate(report.reportDate)}</p>
                    <p><strong>Generated:</strong> ${utils.formatDateTime(report.generatedAt)}</p>
                    <p><strong>Total Accounts:</strong> ${report.totalAccounts}</p>
                </div>

                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Organization</th>
                                <th>Account Number</th>
                                <th>Bank</th>
                                <th>Currency</th>
                                <th class="text-right">Balance</th>
                                <th>Last Transaction</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${report.accounts.map(acc => `
                                <tr>
                                    <td>${acc.organizationName}</td>
                                    <td>${acc.accountNumber}</td>
                                    <td>${acc.bankName} (${acc.bankSwiftCode})</td>
                                    <td>${acc.currencyCode}</td>
                                    <td class="text-right"><strong>${utils.formatCurrency(acc.balance, acc.currencySymbol)}</strong></td>
                                    <td>${acc.lastTransactionDate ? utils.formatDate(acc.lastTransactionDate) : '-'}</td>
                                    <td><span class="badge badge-${acc.status.toLowerCase()}">${modules.translateAccountStatus(acc.status)}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                ${Object.keys(report.grandTotalByCurrency).length > 0 ? `
                    <div class="report-summary">
                        <h4>Grand Totals by Currency</h4>
                        <div class="quick-stats">
                            ${Object.entries(report.grandTotalByCurrency).map(([currency, total]) => `
                                <div class="stat-card">
                                    <h4>${currency}</h4>
                                    <p class="stat-value">${utils.formatNumber(total, 2)}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            `;
        } catch (error) {
            utils.showToast('Error loading report: ' + error.message, 'error');
        }
    }
});
