/**
 * Account Turnovers Module
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Add Account Turnovers methods
Object.assign(modules, {
    async 'account-turnovers'() {
        document.getElementById('module-title').textContent = 'Account Turnovers';
        const contentBody = document.getElementById('content-body');

        // Period calculation helpers
        const formatDateLocal = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const calculatePeriodDates = (periodType, referenceDate = new Date()) => {
            const date = new Date(referenceDate);
            let startDate, endDate;

            switch (periodType) {
                case 'DAY':
                    startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    endDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                    break;
                case 'MONTH':
                    startDate = new Date(date.getFullYear(), date.getMonth(), 1);
                    endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                    break;
                case 'QUARTER':
                    const quarter = Math.floor(date.getMonth() / 3);
                    startDate = new Date(date.getFullYear(), quarter * 3, 1);
                    endDate = new Date(date.getFullYear(), quarter * 3 + 3, 0);
                    break;
                case 'YEAR':
                    startDate = new Date(date.getFullYear(), 0, 1);
                    endDate = new Date(date.getFullYear(), 11, 31);
                    break;
                default:
                    return null;
            }

            return {
                startDate: formatDateLocal(startDate),
                endDate: formatDateLocal(endDate)
            };
        };

        const navigatePeriod = (periodType, currentStart, direction) => {
            // Parse date in local timezone to avoid UTC conversion issues
            const parts = currentStart.split('-');
            const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

            switch (periodType) {
                case 'DAY':
                    date.setDate(date.getDate() + direction);
                    break;
                case 'MONTH':
                    date.setMonth(date.getMonth() + direction);
                    break;
                case 'QUARTER':
                    date.setMonth(date.getMonth() + (direction * 3));
                    break;
                case 'YEAR':
                    date.setFullYear(date.getFullYear() + direction);
                    break;
            }

            return calculatePeriodDates(periodType, date);
        };

        // Get current month dates as default
        const initialPeriod = calculatePeriodDates('MONTH');

        contentBody.innerHTML = `
            <div class="action-bar">
                <div class="action-bar-left">
                    <h3>Account Turnover Report</h3>
                </div>
                <div class="action-bar-right">
                    <select id="period-type">
                        <option value="DAY">Day</option>
                        <option value="MONTH" selected>Month</option>
                        <option value="QUARTER">Quarter</option>
                        <option value="YEAR">Year</option>
                        <option value="CUSTOM">Custom</option>
                    </select>
                    <button class="btn" id="prev-period" title="Previous period">◀</button>
                    <input type="date" id="start-date" value="${initialPeriod.startDate}">
                    <input type="date" id="end-date" value="${initialPeriod.endDate}">
                    <button class="btn" id="next-period" title="Next period">▶</button>
                    <select id="org-filter-turnover">
                        <option value="">All Organizations</option>
                    </select>
                    <select id="account-filter">
                        <option value="">All Accounts</option>
                    </select>
                    <select id="currency-filter-turnover">
                        <option value="">All Currencies</option>
                    </select>
                    <button class="btn btn-primary" id="generate-turnover-report">
                        🔍 Generate Report
                    </button>
                </div>
            </div>
            <div id="report-content-turnover">
                <div class="text-center">
                    <p>Select period and filters, then click "Generate Report"</p>
                </div>
            </div>
        `;

        // Setup period controls event listeners
        const periodTypeSelect = document.getElementById('period-type');
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const prevButton = document.getElementById('prev-period');
        const nextButton = document.getElementById('next-period');

        const updateNavigationButtons = () => {
            const isCustom = periodTypeSelect.value === 'CUSTOM';
            prevButton.disabled = isCustom;
            nextButton.disabled = isCustom;
            prevButton.style.opacity = isCustom ? '0.5' : '1';
            nextButton.style.opacity = isCustom ? '0.5' : '1';
        };

        periodTypeSelect.addEventListener('change', (e) => {
            const periodType = e.target.value;

            if (periodType !== 'CUSTOM') {
                const dates = calculatePeriodDates(periodType);
                startDateInput.value = dates.startDate;
                endDateInput.value = dates.endDate;
            }

            updateNavigationButtons();
        });

        prevButton.addEventListener('click', () => {
            const periodType = periodTypeSelect.value;
            if (periodType !== 'CUSTOM') {
                const dates = navigatePeriod(periodType, startDateInput.value, -1);
                startDateInput.value = dates.startDate;
                endDateInput.value = dates.endDate;
            }
        });

        nextButton.addEventListener('click', () => {
            const periodType = periodTypeSelect.value;
            if (periodType !== 'CUSTOM') {
                const dates = navigatePeriod(periodType, startDateInput.value, 1);
                startDateInput.value = dates.startDate;
                endDateInput.value = dates.endDate;
            }
        });

        // Switch to custom when dates are manually edited
        const onManualDateChange = () => {
            if (periodTypeSelect.value !== 'CUSTOM') {
                periodTypeSelect.value = 'CUSTOM';
                updateNavigationButtons();
            }
        };

        startDateInput.addEventListener('change', onManualDateChange);
        endDateInput.addEventListener('change', onManualDateChange);

        // Initialize navigation button state
        updateNavigationButtons();

        // Function to load and display the report
        const loadTurnoverReport = async () => {
            try {
                const periodType = document.getElementById('period-type').value;
                const start = document.getElementById('start-date').value;
                const end = document.getElementById('end-date').value;
                const orgId = document.getElementById('org-filter-turnover').value || null;
                const accId = document.getElementById('account-filter').value || null;
                const currId = document.getElementById('currency-filter-turnover').value || null;

                const report = await api.getAccountTurnovers(periodType, start, end, orgId, accId, currId);

                const reportContent = document.getElementById('report-content-turnover');
                reportContent.innerHTML = `
                    <div class="report-header">
                        <p><strong>Period:</strong> ${utils.formatDate(report.period.startDate)} - ${utils.formatDate(report.period.endDate)}</p>
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
                                    <th class="text-right">Opening Balance</th>
                                    <th class="text-right">Debit Turnover</th>
                                    <th class="text-right">Credit Turnover</th>
                                    <th class="text-right">Closing Balance</th>
                                    <th class="text-center">Transactions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${report.accounts.map(acc => `
                                    <tr>
                                        <td>${acc.organizationName}</td>
                                        <td>${acc.accountNumber}</td>
                                        <td>${acc.bankName} (${acc.bankSwiftCode})</td>
                                        <td>${acc.currencyCode}</td>
                                        <td class="text-right">${utils.formatCurrency(acc.openingBalance, acc.currencySymbol)}</td>
                                        <td class="text-right" style="color: var(--success-color);">${utils.formatCurrency(acc.debitTurnover, acc.currencySymbol)}</td>
                                        <td class="text-right" style="color: var(--danger-color);">${utils.formatCurrency(acc.creditTurnover, acc.currencySymbol)}</td>
                                        <td class="text-right"><strong>${utils.formatCurrency(acc.closingBalance, acc.currencySymbol)}</strong></td>
                                        <td class="text-center">${acc.transactionCount}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    ${Object.keys(report.summaryByCurrency).length > 0 ? `
                        <div class="report-summary">
                            <h4>Summary Totals by Currency</h4>
                            <div class="quick-stats">
                                ${Object.entries(report.summaryByCurrency).map(([currency, summary]) => `
                                    <div class="stat-card">
                                        <h4>${currency}</h4>
                                        <p><small>Opening:</small> ${utils.formatNumber(summary.totalOpeningBalance, 2)}</p>
                                        <p style="color: var(--success-color);"><small>Debit:</small> ${utils.formatNumber(summary.totalDebitTurnover, 2)}</p>
                                        <p style="color: var(--danger-color);"><small>Credit:</small> ${utils.formatNumber(summary.totalCreditTurnover, 2)}</p>
                                        <p class="stat-value">${utils.formatNumber(summary.totalClosingBalance, 2)}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                `;
            } catch (error) {
                utils.showToast('Error loading report: ' + error.message, 'error');
            }
        };

        // Add event listener to generate report button
        document.getElementById('generate-turnover-report').addEventListener('click', loadTurnoverReport);

        try {
            // Load filter options
            const [organizations, accounts, currencies] = await Promise.all([
                api.getOrganizations(),
                api.getBankAccounts(),
                api.getCurrencies()
            ]);

            const orgFilter = document.getElementById('org-filter-turnover');
            organizations.forEach(org => {
                const option = document.createElement('option');
                option.value = org.id;
                option.textContent = org.name;
                orgFilter.appendChild(option);
            });

            const accFilter = document.getElementById('account-filter');
            accounts.forEach(acc => {
                const option = document.createElement('option');
                option.value = acc.id;
                option.textContent = `${acc.accountNumber} (${acc.bankName})`;
                accFilter.appendChild(option);
            });

            const currFilter = document.getElementById('currency-filter-turnover');
            currencies.forEach(curr => {
                const option = document.createElement('option');
                option.value = curr.id;
                option.textContent = `${curr.code} - ${curr.name}`;
                currFilter.appendChild(option);
            });
        } catch (error) {
            utils.showToast('Error loading filters: ' + error.message, 'error');
        }
    }
});
