/**
 * Account Turnover Details Module - Drill-down view
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Add Account Turnover Details module
Object.assign(modules, {
    viewDocumentFromTurnover(documentId, documentType) {
        // Open the appropriate document based on type
        if (documentType === 'BankPayment') {
            modules.viewBankPayment(documentId);
        } else if (documentType === 'BankReceipt') {
            modules.viewBankReceipt(documentId);
        } else {
            utils.showToast('Unknown document type: ' + documentType, 'error');
        }
    },

    async 'account-turnover-details'(accountId, startDate, endDate, organizationId) {
        document.getElementById('module-title').textContent = 'Account Turnover Details';
        const contentBody = document.getElementById('content-body');

        // Show loading state
        contentBody.innerHTML = `
            <div class="text-center" style="padding: 3rem;">
                <p>Loading account details...</p>
            </div>
        `;

        try {
            // Fetch account turnover details
            const details = await api.getAccountTurnoverDetails(accountId, startDate, endDate, organizationId);

            // Calculate net change
            const netChange = details.closingBalance - details.openingBalance;
            const netChangeClass = netChange >= 0 ? 'success-color' : 'danger-color';
            const netChangeSign = netChange >= 0 ? '+' : '';

            contentBody.innerHTML = `
                <div class="action-bar">
                    <div class="action-bar-left">
                        <button class="btn" onclick="modules['account-turnovers']()">
                            ◀ Back to Summary
                        </button>
                    </div>
                </div>

                <!-- Account Header -->
                <div class="card" style="margin-bottom: 1.5rem;">
                    <div class="card-header">
                        <h3>Account Turnover Details</h3>
                    </div>
                    <div class="card-body">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                            <div>
                                <strong>Account:</strong><br>
                                <span>${details.accountNumber}</span>
                            </div>
                            <div>
                                <strong>Bank:</strong><br>
                                <span>${details.accountName}</span>
                            </div>
                            <div>
                                <strong>Currency:</strong><br>
                                <span>${details.currency}</span>
                            </div>
                            <div>
                                <strong>Period:</strong><br>
                                <span>${utils.formatDate(startDate)} to ${utils.formatDate(endDate)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Balance Summary Cards -->
                <div class="quick-stats" style="margin-bottom: 1.5rem;">
                    <div class="stat-card">
                        <h4>Opening Balance</h4>
                        <p class="stat-value">${utils.formatCurrency(details.openingBalance, details.currency)}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Closing Balance</h4>
                        <p class="stat-value">${utils.formatCurrency(details.closingBalance, details.currency)}</p>
                    </div>
                    <div class="stat-card">
                        <h4>Net Change</h4>
                        <p class="stat-value" style="color: var(--${netChangeClass});">
                            ${netChangeSign}${utils.formatCurrency(Math.abs(netChange), details.currency)}
                        </p>
                    </div>
                </div>

                <!-- Movements Table -->
                <div class="card">
                    <div class="card-header">
                        <h3>Transactions</h3>
                        <span class="badge">${details.movements.length} transactions</span>
                    </div>
                    <div class="card-body">
                        ${details.movements.length === 0 ? `
                            <div class="text-center" style="padding: 2rem;">
                                <p>No transactions found for the selected period</p>
                                <p style="color: var(--text-secondary);">Opening and closing balances are equal: ${utils.formatCurrency(details.openingBalance, details.currency)}</p>
                            </div>
                        ` : `
                            <div class="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Date & Time</th>
                                            <th>Document</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                            <th class="text-right">Debit</th>
                                            <th class="text-right">Credit</th>
                                            <th class="text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${details.movements.map(movement => {
                                            const docTypeBadge = movement.documentType === 'BankReceipt'
                                                ? '<span class="badge badge-success">Receipt</span>'
                                                : movement.documentType === 'BankPayment'
                                                ? '<span class="badge badge-danger">Payment</span>'
                                                : `<span class="badge">${movement.documentType}</span>`;

                                            const balanceClass = movement.runningBalance < 0 ? 'style="color: var(--danger-color); font-weight: bold;"' : '';
                                            const debitDisplay = movement.debit > 0
                                                ? `<span style="color: var(--success-color);">${utils.formatCurrency(movement.debit, details.currency)}</span>`
                                                : '-';
                                            const creditDisplay = movement.credit > 0
                                                ? `<span style="color: var(--danger-color);">${utils.formatCurrency(movement.credit, details.currency)}</span>`
                                                : '-';
                                            const description = movement.description || '-';

                                            return `
                                                <tr>
                                                    <td>${utils.formatDateTime(movement.documentDate)}</td>
                                                    <td><a href="#" onclick="event.preventDefault(); modules.viewDocumentFromTurnover(${movement.documentId}, '${movement.documentType}');">#${movement.documentId}</a></td>
                                                    <td>${docTypeBadge}</td>
                                                    <td>${description}</td>
                                                    <td class="text-right">${debitDisplay}</td>
                                                    <td class="text-right">${creditDisplay}</td>
                                                    <td class="text-right" ${balanceClass}><strong>${utils.formatCurrency(movement.runningBalance, details.currency)}</strong></td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        `}
                    </div>
                </div>
            `;

        } catch (error) {
            let errorMessage = 'Unable to load account details. Please try again.';

            if (error.message.includes('404')) {
                errorMessage = 'Account not found';
            } else if (error.message.includes('400')) {
                errorMessage = 'Invalid request. Please check the account and date range.';
            }

            contentBody.innerHTML = `
                <div class="action-bar">
                    <div class="action-bar-left">
                        <button class="btn" onclick="modules['account-turnovers']()">
                            ◀ Back to Summary
                        </button>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body text-center" style="padding: 3rem;">
                        <p style="color: var(--danger-color); font-size: 1.2rem;">⚠️ ${errorMessage}</p>
                        <p style="color: var(--text-secondary);">${error.message}</p>
                    </div>
                </div>
            `;
            utils.showToast(errorMessage, 'error');
        }
    }
});
