/**
 * Bank Receipts Module
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Add Bank Receipts methods
Object.assign(modules, {
    async 'bank-receipts'() {
        document.getElementById('module-title').textContent = 'Bank Receipts';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <div class="action-bar-left">
                    ${auth.canWrite() ? `<button class="btn btn-primary" onclick="modules.createBankReceipt()">
                        ➕ New Receipt
                    </button>` : ''}
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Counterparty</th>
                            <th>Amount</th>
                            <th>Currency</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="receipts-tbody">
                        <tr><td colspan="7" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" id="receipts-pagination"></div>
        `;

        try {
            const data = await api.getBankReceipts(AppState.currentPage, AppState.pageSize);
            const tbody = document.getElementById('receipts-tbody');

            if (data.content.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No receipts found</td></tr>';
                return;
            }

            tbody.innerHTML = data.content.map(receipt => `
                <tr>
                    <td>${utils.formatDate(receipt.transactionDateTime)}</td>
                    <td>${modules.translateReceiptType(receipt.receiptType)}</td>
                    <td>${receipt.counterparty?.name || '-'}</td>
                    <td class="text-right">${utils.formatNumber(receipt.amount)}</td>
                    <td>${receipt.currency?.code || '-'}</td>
                    <td><span class="badge badge-${receipt.status.toLowerCase()}">${modules.translateStatus(receipt.status)}</span></td>
                    <td>
                        <button class="btn-icon" onclick="modules.viewBankReceipt(${receipt.id})" title="View">👁️</button>
                        ${receipt.status === 'DRAFT' && auth.canWrite() ? `
                            <button class="btn-icon" onclick="modules.editBankReceipt(${receipt.id})" title="Edit">✏️</button>
                            <button class="btn-icon" onclick="modules.postBankReceipt(${receipt.id})" title="Post">✅</button>
                            <button class="btn-icon" onclick="modules.deleteBankReceipt(${receipt.id})" title="Delete">🗑️</button>
                        ` : ''}
                        ${receipt.status === 'POSTED' && auth.canWrite() ? `
                            <button class="btn-icon" onclick="modules.unpostBankReceipt(${receipt.id})" title="Unpost">↩️</button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');

            modules.renderPagination('receipts-pagination', data.metadata, () => modules['bank-receipts']());
        } catch (error) {
            utils.showToast('Error loading receipts: ' + error.message, 'error');
        }
    },

    // Bank Receipt Forms (similar structure)
    async createBankReceipt() {
        const [accounts, counterparties, currencies, organizations] = await Promise.all([
            api.getBankAccounts(),
            api.getCounterparties(0, 1000),
            api.getCurrencies(),
            api.getOrganizations()
        ]);

        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

        const formHtml = `
            <form id="receipt-form" onsubmit="modules.submitBankReceipt(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>Transaction Date & Time *</label>
                        <input type="datetime-local" name="transactionDateTime" required value="${localDateTime}">
                    </div>
                    <div class="form-group">
                        <label>Receipt Type *</label>
                        <select name="receiptType" required>
                            <option value="CUSTOMER_PAYMENT">Customer Payment</option>
                            <option value="LOAN_RECEIVED">Loan Received</option>
                            <option value="INVESTMENT">Investment</option>
                            <option value="INTEREST_INCOME">Interest Income</option>
                            <option value="OTHER_INCOME">Other Income</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Organization *</label>
                        <select name="organizationId" id="receiptOrganizationSelect" required>
                            <option value="">Select organization</option>
                            ${organizations.map(org => `<option value="${org.id}">${org.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Account *</label>
                        <select name="accountId" id="receiptAccountSelect" required>
                            <option value="">Select account</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Counterparty *</label>
                        <select name="counterpartyId" id="receiptCounterpartySelect" required>
                            <option value="">Select counterparty</option>
                            ${counterparties.content.map(cp => `<option value="${cp.id}">${cp.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Counterparty Account</label>
                        <select name="counterpartyAccountId" id="receiptCounterpartyAccountSelect">
                            <option value="">Select counterparty account</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Currency *</label>
                        <select name="currencyId" required>
                            <option value="">Select currency</option>
                            ${currencies.map(curr => `<option value="${curr.id}">${curr.code} - ${curr.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Amount *</label>
                        <input type="number" step="0.01" name="amount" required min="0.01">
                    </div>
                </div>

                <div class="form-group">
                    <label>Bank Commission</label>
                    <input type="number" step="0.01" name="bankCommission" min="0">
                </div>

                <div class="form-group">
                    <label>Payment Purpose *</label>
                    <textarea name="paymentPurpose" required></textarea>
                </div>

                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description"></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Payment Reference</label>
                        <input type="text" name="paymentReference">
                    </div>
                    <div class="form-group">
                        <label>Incoming Document Number</label>
                        <input type="text" name="incomingDocumentNumber">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Value Date</label>
                        <input type="date" name="valueDate">
                    </div>
                    <div class="form-group">
                        <label>External Transaction ID</label>
                        <input type="text" name="externalTransactionId">
                    </div>
                </div>

                <div class="form-group">
                    <label>Bank Reference</label>
                    <input type="text" name="bankReference">
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create</button>
                </div>
            </form>
        `;

        utils.showModal('New Bank Receipt', formHtml);

        // Store accounts data globally for filtering
        window.receiptFormAccounts = accounts;

        // Setup event listeners for dynamic filtering
        const organizationSelect = document.getElementById('receiptOrganizationSelect');
        const accountSelect = document.getElementById('receiptAccountSelect');
        const counterpartySelect = document.getElementById('receiptCounterpartySelect');
        const counterpartyAccountSelect = document.getElementById('receiptCounterpartyAccountSelect');

        // Filter accounts when organization changes
        organizationSelect.addEventListener('change', function() {
            const orgId = parseInt(this.value);
            accountSelect.innerHTML = '<option value="">Select account</option>';

            if (orgId) {
                const orgAccounts = accounts.filter(acc =>
                    acc.holderType === 'ORGANIZATION' && acc.holderId === orgId
                );

                orgAccounts.forEach(acc => {
                    const option = document.createElement('option');
                    option.value = acc.id;
                    option.textContent = `${acc.accountNumber} (${acc.currency.code})`;
                    accountSelect.appendChild(option);
                });
            }
        });

        // Filter counterparty accounts when counterparty changes
        counterpartySelect.addEventListener('change', async function() {
            const cpId = parseInt(this.value);
            counterpartyAccountSelect.innerHTML = '<option value="">Select counterparty account</option>';

            if (cpId) {
                try {
                    const cpAccounts = await api.getBankAccountsByHolder('COUNTERPARTY', cpId);

                    cpAccounts.forEach(acc => {
                        const option = document.createElement('option');
                        option.value = acc.id;
                        option.textContent = `${acc.accountNumber} (${acc.currency.code})`;
                        counterpartyAccountSelect.appendChild(option);
                    });
                } catch (error) {
                    console.error('Error loading counterparty accounts:', error);
                }
            }
        });
    },

    async submitBankReceipt(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const data = {
            transactionDateTime: formData.get('transactionDateTime'),
            receiptType: formData.get('receiptType'),
            amount: parseFloat(formData.get('amount')),
            bankCommission: formData.get('bankCommission') ? parseFloat(formData.get('bankCommission')) : undefined,
            accountId: parseInt(formData.get('accountId')),
            counterpartyId: parseInt(formData.get('counterpartyId')),
            counterpartyBankAccountId: formData.get('counterpartyAccountId') ? parseInt(formData.get('counterpartyAccountId')) : undefined,
            currencyId: parseInt(formData.get('currencyId')),
            organizationId: parseInt(formData.get('organizationId')),
            paymentPurpose: formData.get('paymentPurpose'),
            description: formData.get('description') || undefined,
            paymentReference: formData.get('paymentReference') || undefined,
            incomingDocumentNumber: formData.get('incomingDocumentNumber') || undefined,
            valueDate: formData.get('valueDate') || undefined,
            externalTransactionId: formData.get('externalTransactionId') || undefined,
            bankReference: formData.get('bankReference') || undefined
        };

        try {
            await api.createBankReceipt(data);
            utils.hideModal();
            utils.showToast('Receipt created successfully');
            modules['bank-receipts']();
        } catch (error) {
            utils.showToast('Error creating receipt: ' + error.message, 'error');
        }
    },

    async viewBankReceipt(id) {
        try {
            const receipt = await api.getBankReceiptById(id);
            const html = `
                <div class="detail-view">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Date & Time</label>
                            <p>${utils.formatDateTime(receipt.transactionDateTime)}</p>
                        </div>
                        <div class="form-group">
                            <label>Type</label>
                            <p>${modules.translateReceiptType(receipt.receiptType)}</p>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <p><span class="badge badge-${receipt.status.toLowerCase()}">${modules.translateStatus(receipt.status)}</span></p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Organization</label>
                            <p>${receipt.organization?.name || '-'}</p>
                        </div>
                        <div class="form-group">
                            <label>Account</label>
                            <p>${receipt.account?.accountNumber || '-'}</p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Counterparty</label>
                            <p>${receipt.counterparty?.name || '-'}</p>
                        </div>
                        <div class="form-group">
                            <label>Counterparty Account</label>
                            <p>${receipt.counterpartyBankAccount?.accountNumber || '-'}</p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Amount</label>
                            <p><strong>${utils.formatCurrency(receipt.amount, receipt.currency?.symbol)}</strong></p>
                        </div>
                        ${receipt.bankCommission ? `
                        <div class="form-group">
                            <label>Bank Commission</label>
                            <p>${utils.formatCurrency(receipt.bankCommission, receipt.currency?.symbol)}</p>
                        </div>
                        ` : ''}
                    </div>

                    <div class="form-group">
                        <label>Payment Purpose</label>
                        <p>${receipt.paymentPurpose || '-'}</p>
                    </div>

                    ${receipt.description ? `
                    <div class="form-group">
                        <label>Description</label>
                        <p>${receipt.description}</p>
                    </div>
                    ` : ''}

                    ${receipt.paymentReference ? `
                    <div class="form-group">
                        <label>Payment Reference</label>
                        <p>${receipt.paymentReference}</p>
                    </div>
                    ` : ''}

                    ${receipt.incomingDocumentNumber ? `
                    <div class="form-group">
                        <label>Incoming Document Number</label>
                        <p>${receipt.incomingDocumentNumber}</p>
                    </div>
                    ` : ''}

                    ${receipt.valueDate ? `
                    <div class="form-group">
                        <label>Value Date</label>
                        <p>${utils.formatDate(receipt.valueDate)}</p>
                    </div>
                    ` : ''}

                    ${receipt.externalTransactionId ? `
                    <div class="form-group">
                        <label>External Transaction ID</label>
                        <p>${receipt.externalTransactionId}</p>
                    </div>
                    ` : ''}

                    ${receipt.bankReference ? `
                    <div class="form-group">
                        <label>Bank Reference</label>
                        <p>${receipt.bankReference}</p>
                    </div>
                    ` : ''}

                    <div class="form-row">
                        <div class="form-group">
                            <label>Created</label>
                            <p>${utils.formatDateTime(receipt.createdAt)}</p>
                        </div>
                        ${receipt.postedAt ? `
                        <div class="form-group">
                            <label>Posted</label>
                            <p>${utils.formatDateTime(receipt.postedAt)}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            utils.showModal('View Receipt #' + id, html);
        } catch (error) {
            utils.showToast('Error loading: ' + error.message, 'error');
        }
    },

    async postBankReceipt(id) {
        if (await utils.confirm('Post receipt?')) {
            try {
                await api.postBankReceipt(id);
                utils.showToast('Receipt posted successfully');
                modules['bank-receipts']();
            } catch (error) {
                utils.showToast('Error: ' + error.message, 'error');
            }
        }
    },

    async unpostBankReceipt(id) {
        if (await utils.confirm('Unpost receipt?')) {
            try {
                await api.unpostBankReceipt(id);
                utils.showToast('Receipt unposted successfully');
                modules['bank-receipts']();
            } catch (error) {
                utils.showToast('Error: ' + error.message, 'error');
            }
        }
    },

    async deleteBankReceipt(id) {
        if (await utils.confirm('Delete receipt?')) {
            try {
                await api.deleteBankReceipt(id);
                utils.showToast('Receipt deleted successfully');
                modules['bank-receipts']();
            } catch (error) {
                utils.showToast('Error: ' + error.message, 'error');
            }
        }
    },

    async editBankReceipt(id) {
        try {
            const [receipt, accounts, counterparties, currencies, organizations] = await Promise.all([
                api.getBankReceiptById(id),
                api.getBankAccounts(),
                api.getCounterparties(0, 1000),
                api.getCurrencies(),
                api.getOrganizations()
            ]);

            // Convert transactionDateTime to datetime-local format
            const transactionDateTime = receipt.transactionDateTime ? receipt.transactionDateTime.slice(0, 16) : '';

            const formHtml = `
                <form id="receipt-form" onsubmit="modules.submitBankReceiptEdit(event, ${id})">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Transaction Date & Time *</label>
                            <input type="datetime-local" name="transactionDateTime" required value="${transactionDateTime}">
                        </div>
                        <div class="form-group">
                            <label>Receipt Type *</label>
                            <select name="receiptType" required>
                                <option value="CUSTOMER_PAYMENT" ${receipt.receiptType === 'CUSTOMER_PAYMENT' ? 'selected' : ''}>Customer Payment</option>
                                <option value="LOAN_RECEIVED" ${receipt.receiptType === 'LOAN_RECEIVED' ? 'selected' : ''}>Loan Received</option>
                                <option value="INVESTMENT" ${receipt.receiptType === 'INVESTMENT' ? 'selected' : ''}>Investment</option>
                                <option value="INTEREST_INCOME" ${receipt.receiptType === 'INTEREST_INCOME' ? 'selected' : ''}>Interest Income</option>
                                <option value="OTHER_INCOME" ${receipt.receiptType === 'OTHER_INCOME' ? 'selected' : ''}>Other Income</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Organization *</label>
                            <select name="organizationId" id="editReceiptOrganizationSelect" required>
                                <option value="">Select organization</option>
                                ${organizations.map(org => `<option value="${org.id}" ${receipt.organization?.id === org.id ? 'selected' : ''}>${org.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Account *</label>
                            <select name="accountId" id="editReceiptAccountSelect" required>
                                <option value="">Select account</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Counterparty *</label>
                            <select name="counterpartyId" id="editReceiptCounterpartySelect" required>
                                <option value="">Select counterparty</option>
                                ${counterparties.content.map(cp => `<option value="${cp.id}" ${receipt.counterparty?.id === cp.id ? 'selected' : ''}>${cp.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Counterparty Account</label>
                            <select name="counterpartyAccountId" id="editReceiptCounterpartyAccountSelect">
                                <option value="">Select counterparty account</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Currency *</label>
                            <select name="currencyId" required>
                                <option value="">Select currency</option>
                                ${currencies.map(curr => `<option value="${curr.id}" ${receipt.currency?.id === curr.id ? 'selected' : ''}>${curr.code} - ${curr.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Amount *</label>
                            <input type="number" step="0.01" name="amount" required min="0.01" value="${receipt.amount}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Bank Commission</label>
                        <input type="number" step="0.01" name="bankCommission" min="0" value="${receipt.bankCommission || ''}">
                    </div>

                    <div class="form-group">
                        <label>Payment Purpose *</label>
                        <textarea name="paymentPurpose" required>${receipt.paymentPurpose || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description">${receipt.description || ''}</textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Payment Reference</label>
                            <input type="text" name="paymentReference" value="${receipt.paymentReference || ''}">
                        </div>
                        <div class="form-group">
                            <label>Incoming Document Number</label>
                            <input type="text" name="incomingDocumentNumber" value="${receipt.incomingDocumentNumber || ''}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Value Date</label>
                            <input type="date" name="valueDate" value="${receipt.valueDate || ''}">
                        </div>
                        <div class="form-group">
                            <label>External Transaction ID</label>
                            <input type="text" name="externalTransactionId" value="${receipt.externalTransactionId || ''}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Bank Reference</label>
                        <input type="text" name="bankReference" value="${receipt.bankReference || ''}">
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Update</button>
                    </div>
                </form>
            `;

            utils.showModal('Edit Bank Receipt #' + id, formHtml);

            // Store accounts data globally for filtering
            window.editReceiptFormAccounts = accounts;

            // Setup event listeners for dynamic filtering
            const organizationSelect = document.getElementById('editReceiptOrganizationSelect');
            const accountSelect = document.getElementById('editReceiptAccountSelect');
            const counterpartySelect = document.getElementById('editReceiptCounterpartySelect');
            const counterpartyAccountSelect = document.getElementById('editReceiptCounterpartyAccountSelect');

            // Initial population of accounts for selected organization
            const orgId = receipt.organization?.id;
            if (orgId) {
                const orgAccounts = accounts.filter(acc =>
                    acc.holderType === 'ORGANIZATION' && acc.holderId === orgId
                );

                orgAccounts.forEach(acc => {
                    const option = document.createElement('option');
                    option.value = acc.id;
                    option.textContent = `${acc.accountNumber} (${acc.currency.code})`;
                    option.selected = receipt.account?.id === acc.id;
                    accountSelect.appendChild(option);
                });
            }

            // Initial population of counterparty accounts
            const cpId = receipt.counterparty?.id;
            if (cpId) {
                try {
                    const cpAccounts = await api.getBankAccountsByHolder('COUNTERPARTY', cpId);
                    cpAccounts.forEach(acc => {
                        const option = document.createElement('option');
                        option.value = acc.id;
                        option.textContent = `${acc.accountNumber} (${acc.currency.code})`;
                        option.selected = receipt.counterpartyBankAccount?.id === acc.id;
                        counterpartyAccountSelect.appendChild(option);
                    });
                } catch (error) {
                    console.error('Error loading counterparty accounts:', error);
                }
            }

            // Filter accounts when organization changes
            organizationSelect.addEventListener('change', function() {
                const newOrgId = parseInt(this.value);
                accountSelect.innerHTML = '<option value="">Select account</option>';

                if (newOrgId) {
                    const orgAccounts = accounts.filter(acc =>
                        acc.holderType === 'ORGANIZATION' && acc.holderId === newOrgId
                    );

                    orgAccounts.forEach(acc => {
                        const option = document.createElement('option');
                        option.value = acc.id;
                        option.textContent = `${acc.accountNumber} (${acc.currency.code})`;
                        accountSelect.appendChild(option);
                    });
                }
            });

            // Filter counterparty accounts when counterparty changes
            counterpartySelect.addEventListener('change', async function() {
                const newCpId = parseInt(this.value);
                counterpartyAccountSelect.innerHTML = '<option value="">Select counterparty account</option>';

                if (newCpId) {
                    try {
                        const cpAccounts = await api.getBankAccountsByHolder('COUNTERPARTY', newCpId);

                        cpAccounts.forEach(acc => {
                            const option = document.createElement('option');
                            option.value = acc.id;
                            option.textContent = `${acc.accountNumber} (${acc.currency.code})`;
                            counterpartyAccountSelect.appendChild(option);
                        });
                    } catch (error) {
                        console.error('Error loading counterparty accounts:', error);
                    }
                }
            });

        } catch (error) {
            utils.showToast('Error loading receipt: ' + error.message, 'error');
        }
    },

    async submitBankReceiptEdit(event, id) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const data = {
            transactionDateTime: formData.get('transactionDateTime'),
            receiptType: formData.get('receiptType'),
            amount: parseFloat(formData.get('amount')),
            bankCommission: formData.get('bankCommission') ? parseFloat(formData.get('bankCommission')) : undefined,
            accountId: parseInt(formData.get('accountId')),
            counterpartyId: parseInt(formData.get('counterpartyId')),
            counterpartyBankAccountId: formData.get('counterpartyAccountId') ? parseInt(formData.get('counterpartyAccountId')) : undefined,
            currencyId: parseInt(formData.get('currencyId')),
            organizationId: parseInt(formData.get('organizationId')),
            paymentPurpose: formData.get('paymentPurpose'),
            description: formData.get('description') || undefined,
            paymentReference: formData.get('paymentReference') || undefined,
            incomingDocumentNumber: formData.get('incomingDocumentNumber') || undefined,
            valueDate: formData.get('valueDate') || undefined,
            externalTransactionId: formData.get('externalTransactionId') || undefined,
            bankReference: formData.get('bankReference') || undefined
        };

        try {
            await api.updateBankReceipt(id, data);
            utils.hideModal();
            utils.showToast('Receipt updated successfully');
            modules['bank-receipts']();
        } catch (error) {
            utils.showToast('Error updating receipt: ' + error.message, 'error');
        }
    }
});
