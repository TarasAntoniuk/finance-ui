/**
 * Bank Payments Module
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Add Bank Payments methods
Object.assign(modules, {
    async 'bank-payments'() {
        document.getElementById('module-title').textContent = 'Bank Payments';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <div class="action-bar-left">
                    <button class="btn btn-primary" onclick="modules.createBankPayment()">
                        ➕ New Payment
                    </button>
                </div>
                <div class="action-bar-right">
                    <select id="status-filter" onchange="modules['bank-payments']()">
                        <option value="">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="POSTED">Posted</option>
                    </select>
                </div>
            </div>
            <div class="table-container">
                <table id="payments-table">
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
                    <tbody id="payments-tbody">
                        <tr><td colspan="7" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" id="payments-pagination"></div>
        `;

        try {
            const statusFilter = document.getElementById('status-filter')?.value;
            let data;

            if (statusFilter) {
                data = await api.getBankPaymentsByStatus(statusFilter, AppState.currentPage, AppState.pageSize);
            } else {
                data = await api.getBankPayments(AppState.currentPage, AppState.pageSize);
            }

            const tbody = document.getElementById('payments-tbody');

            if (data.content.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No payments found</td></tr>';
                return;
            }

            tbody.innerHTML = data.content.map(payment => `
                <tr>
                    <td>${utils.formatDate(payment.transactionDateTime)}</td>
                    <td>${modules.translatePaymentType(payment.paymentType)}</td>
                    <td>${payment.counterparty?.name || '-'}</td>
                    <td class="text-right">${utils.formatNumber(payment.amount)}</td>
                    <td>${payment.currency?.code || '-'}</td>
                    <td><span class="badge badge-${payment.status.toLowerCase()}">${modules.translateStatus(payment.status)}</span></td>
                    <td>
                        <button class="btn-icon" onclick="modules.viewBankPayment(${payment.id})" title="View">👁️</button>
                        ${payment.status === 'DRAFT' ? `
                            <button class="btn-icon" onclick="modules.editBankPayment(${payment.id})" title="Edit">✏️</button>
                            <button class="btn-icon" onclick="modules.postBankPayment(${payment.id})" title="Post">✅</button>
                            <button class="btn-icon" onclick="modules.deleteBankPayment(${payment.id})" title="Delete">🗑️</button>
                        ` : ''}
                        ${payment.status === 'POSTED' ? `
                            <button class="btn-icon" onclick="modules.unpostBankPayment(${payment.id})" title="Unpost">↩️</button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');

            modules.renderPagination('payments-pagination', data.metadata, () => modules['bank-payments']());
        } catch (error) {
            utils.showToast('Error loading payments: ' + error.message, 'error');
            document.getElementById('payments-tbody').innerHTML = '<tr><td colspan="7" class="text-center">Loading error</td></tr>';
        }
    },

    // Bank Payment Forms
    async createBankPayment() {
        const [accounts, counterparties, currencies, organizations] = await Promise.all([
            api.getBankAccounts(),
            api.getCounterparties(0, 1000),
            api.getCurrencies(),
            api.getOrganizations()
        ]);

        const now = new Date();
        const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

        const formHtml = `
            <form id="payment-form" onsubmit="modules.submitBankPayment(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>Transaction Date & Time *</label>
                        <input type="datetime-local" name="transactionDateTime" required value="${localDateTime}">
                    </div>
                    <div class="form-group">
                        <label>Payment Type *</label>
                        <select name="paymentType" required>
                            <option value="SUPPLIER_PAYMENT">Supplier Payment</option>
                            <option value="SALARY">Salary</option>
                            <option value="TAX_PAYMENT">Tax Payment</option>
                            <option value="CONTRACTOR_PAYMENT">Contractor Payment</option>
                            <option value="UTILITY_PAYMENT">Utility Payment</option>
                            <option value="RENT">Rent</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Organization *</label>
                        <select name="organizationId" id="organizationSelect" required>
                            <option value="">Select organization</option>
                            ${organizations.map(org => `<option value="${org.id}">${org.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Account *</label>
                        <select name="accountId" id="accountSelect" required>
                            <option value="">Select account</option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Counterparty *</label>
                        <select name="counterpartyId" id="counterpartySelect" required>
                            <option value="">Select counterparty</option>
                            ${counterparties.content.map(cp => `<option value="${cp.id}">${cp.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Counterparty Account</label>
                        <select name="counterpartyAccountId" id="counterpartyAccountSelect">
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
                        <label>Outgoing Document Number</label>
                        <input type="text" name="outgoingDocumentNumber">
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

        utils.showModal('New Bank Payment', formHtml);

        // Store accounts data globally for filtering
        window.paymentFormAccounts = accounts;

        // Setup event listeners for dynamic filtering
        const organizationSelect = document.getElementById('organizationSelect');
        const accountSelect = document.getElementById('accountSelect');
        const counterpartySelect = document.getElementById('counterpartySelect');
        const counterpartyAccountSelect = document.getElementById('counterpartyAccountSelect');

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

    async submitBankPayment(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const data = {
            transactionDateTime: formData.get('transactionDateTime'),
            paymentType: formData.get('paymentType'),
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
            outgoingDocumentNumber: formData.get('outgoingDocumentNumber') || undefined,
            valueDate: formData.get('valueDate') || undefined,
            externalTransactionId: formData.get('externalTransactionId') || undefined,
            bankReference: formData.get('bankReference') || undefined
        };

        try {
            await api.createBankPayment(data);
            utils.hideModal();
            utils.showToast('Payment created successfully');
            modules['bank-payments']();
        } catch (error) {
            utils.showToast('Error creating payment: ' + error.message, 'error');
        }
    },

    async viewBankPayment(id) {
        try {
            const payment = await api.getBankPaymentById(id);
            const html = `
                <div class="detail-view">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Дата та час</label>
                            <p>${utils.formatDateTime(payment.transactionDateTime)}</p>
                        </div>
                        <div class="form-group">
                            <label>Тип</label>
                            <p>${modules.translatePaymentType(payment.paymentType)}</p>
                        </div>
                        <div class="form-group">
                            <label>Статус</label>
                            <p><span class="badge badge-${payment.status.toLowerCase()}">${modules.translateStatus(payment.status)}</span></p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Організація</label>
                            <p>${payment.organization?.name || '-'}</p>
                        </div>
                        <div class="form-group">
                            <label>Рахунок</label>
                            <p>${payment.account?.accountNumber || '-'}</p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Контрагент</label>
                            <p>${payment.counterparty?.name || '-'}</p>
                        </div>
                        <div class="form-group">
                            <label>Рахунок контрагента</label>
                            <p>${payment.counterpartyBankAccount?.accountNumber || '-'}</p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Сума</label>
                            <p><strong>${utils.formatCurrency(payment.amount, payment.currency?.symbol)}</strong></p>
                        </div>
                        ${payment.bankCommission ? `
                        <div class="form-group">
                            <label>Комісія банку</label>
                            <p>${utils.formatCurrency(payment.bankCommission, payment.currency?.symbol)}</p>
                        </div>
                        ` : ''}
                    </div>

                    <div class="form-group">
                        <label>Призначення платежу</label>
                        <p>${payment.paymentPurpose || '-'}</p>
                    </div>

                    ${payment.description ? `
                    <div class="form-group">
                        <label>Опис</label>
                        <p>${payment.description}</p>
                    </div>
                    ` : ''}

                    ${payment.paymentReference ? `
                    <div class="form-group">
                        <label>Референс платежу</label>
                        <p>${payment.paymentReference}</p>
                    </div>
                    ` : ''}

                    ${payment.outgoingDocumentNumber ? `
                    <div class="form-group">
                        <label>Номер вихідного документа</label>
                        <p>${payment.outgoingDocumentNumber}</p>
                    </div>
                    ` : ''}

                    ${payment.valueDate ? `
                    <div class="form-group">
                        <label>Дата валютування</label>
                        <p>${utils.formatDate(payment.valueDate)}</p>
                    </div>
                    ` : ''}

                    ${payment.externalTransactionId ? `
                    <div class="form-group">
                        <label>Зовнішній ID транзакції</label>
                        <p>${payment.externalTransactionId}</p>
                    </div>
                    ` : ''}

                    ${payment.bankReference ? `
                    <div class="form-group">
                        <label>Банківський референс</label>
                        <p>${payment.bankReference}</p>
                    </div>
                    ` : ''}

                    <div class="form-row">
                        <div class="form-group">
                            <label>Створено</label>
                            <p>${utils.formatDateTime(payment.createdAt)}</p>
                        </div>
                        ${payment.postedAt ? `
                        <div class="form-group">
                            <label>Проведено</label>
                            <p>${utils.formatDateTime(payment.postedAt)}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            utils.showModal('Перегляд платежу #' + id, html);
        } catch (error) {
            utils.showToast('Помилка завантаження: ' + error.message, 'error');
        }
    },

    async postBankPayment(id) {
        if (await utils.confirm('Провести платіж? Після проведення документ не можна буде редагувати.')) {
            try {
                await api.postBankPayment(id);
                utils.showToast('Платіж успішно проведено');
                modules['bank-payments']();
            } catch (error) {
                utils.showToast('Помилка проведення: ' + error.message, 'error');
            }
        }
    },

    async unpostBankPayment(id) {
        if (await utils.confirm('Скасувати проведення платежу?')) {
            try {
                await api.unpostBankPayment(id);
                utils.showToast('Проведення скасовано');
                modules['bank-payments']();
            } catch (error) {
                utils.showToast('Помилка: ' + error.message, 'error');
            }
        }
    },

    async deleteBankPayment(id) {
        if (await utils.confirm('Видалити платіж? Цю дію не можна буде скасувати.')) {
            try {
                await api.deleteBankPayment(id);
                utils.showToast('Платіж видалено');
                modules['bank-payments']();
            } catch (error) {
                utils.showToast('Помилка видалення: ' + error.message, 'error');
            }
        }
    },

    async editBankPayment(id) {
        try {
            const [payment, accounts, counterparties, currencies, organizations] = await Promise.all([
                api.getBankPaymentById(id),
                api.getBankAccounts(),
                api.getCounterparties(0, 1000),
                api.getCurrencies(),
                api.getOrganizations()
            ]);

            // Convert transactionDateTime to datetime-local format
            const transactionDateTime = payment.transactionDateTime ? payment.transactionDateTime.slice(0, 16) : '';

            const formHtml = `
                <form id="payment-form" onsubmit="modules.submitBankPaymentEdit(event, ${id})">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Transaction Date & Time *</label>
                            <input type="datetime-local" name="transactionDateTime" required value="${transactionDateTime}">
                        </div>
                        <div class="form-group">
                            <label>Payment Type *</label>
                            <select name="paymentType" required>
                                <option value="SUPPLIER_PAYMENT" ${payment.paymentType === 'SUPPLIER_PAYMENT' ? 'selected' : ''}>Supplier Payment</option>
                                <option value="SALARY" ${payment.paymentType === 'SALARY' ? 'selected' : ''}>Salary</option>
                                <option value="TAX_PAYMENT" ${payment.paymentType === 'TAX_PAYMENT' ? 'selected' : ''}>Tax Payment</option>
                                <option value="CONTRACTOR_PAYMENT" ${payment.paymentType === 'CONTRACTOR_PAYMENT' ? 'selected' : ''}>Contractor Payment</option>
                                <option value="UTILITY_PAYMENT" ${payment.paymentType === 'UTILITY_PAYMENT' ? 'selected' : ''}>Utility Payment</option>
                                <option value="RENT" ${payment.paymentType === 'RENT' ? 'selected' : ''}>Rent</option>
                                <option value="OTHER" ${payment.paymentType === 'OTHER' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Organization *</label>
                            <select name="organizationId" id="editOrganizationSelect" required>
                                <option value="">Select organization</option>
                                ${organizations.map(org => `<option value="${org.id}" ${payment.organization?.id === org.id ? 'selected' : ''}>${org.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Account *</label>
                            <select name="accountId" id="editAccountSelect" required>
                                <option value="">Select account</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Counterparty *</label>
                            <select name="counterpartyId" id="editCounterpartySelect" required>
                                <option value="">Select counterparty</option>
                                ${counterparties.content.map(cp => `<option value="${cp.id}" ${payment.counterparty?.id === cp.id ? 'selected' : ''}>${cp.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Counterparty Account</label>
                            <select name="counterpartyAccountId" id="editCounterpartyAccountSelect">
                                <option value="">Select counterparty account</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Currency *</label>
                            <select name="currencyId" required>
                                <option value="">Select currency</option>
                                ${currencies.map(curr => `<option value="${curr.id}" ${payment.currency?.id === curr.id ? 'selected' : ''}>${curr.code} - ${curr.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Amount *</label>
                            <input type="number" step="0.01" name="amount" required min="0.01" value="${payment.amount}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Bank Commission</label>
                        <input type="number" step="0.01" name="bankCommission" min="0" value="${payment.bankCommission || ''}">
                    </div>

                    <div class="form-group">
                        <label>Payment Purpose *</label>
                        <textarea name="paymentPurpose" required>${payment.paymentPurpose || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label>Description</label>
                        <textarea name="description">${payment.description || ''}</textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Payment Reference</label>
                            <input type="text" name="paymentReference" value="${payment.paymentReference || ''}">
                        </div>
                        <div class="form-group">
                            <label>Outgoing Document Number</label>
                            <input type="text" name="outgoingDocumentNumber" value="${payment.outgoingDocumentNumber || ''}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Value Date</label>
                            <input type="date" name="valueDate" value="${payment.valueDate || ''}">
                        </div>
                        <div class="form-group">
                            <label>External Transaction ID</label>
                            <input type="text" name="externalTransactionId" value="${payment.externalTransactionId || ''}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Bank Reference</label>
                        <input type="text" name="bankReference" value="${payment.bankReference || ''}">
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Update</button>
                    </div>
                </form>
            `;

            utils.showModal('Edit Bank Payment #' + id, formHtml);

            // Store accounts data globally for filtering
            window.editPaymentFormAccounts = accounts;

            // Setup event listeners for dynamic filtering
            const organizationSelect = document.getElementById('editOrganizationSelect');
            const accountSelect = document.getElementById('editAccountSelect');
            const counterpartySelect = document.getElementById('editCounterpartySelect');
            const counterpartyAccountSelect = document.getElementById('editCounterpartyAccountSelect');

            // Initial population of accounts for selected organization
            const orgId = payment.organization?.id;
            if (orgId) {
                const orgAccounts = accounts.filter(acc =>
                    acc.holderType === 'ORGANIZATION' && acc.holderId === orgId
                );

                orgAccounts.forEach(acc => {
                    const option = document.createElement('option');
                    option.value = acc.id;
                    option.textContent = `${acc.accountNumber} (${acc.currency.code})`;
                    option.selected = payment.account?.id === acc.id;
                    accountSelect.appendChild(option);
                });
            }

            // Initial population of counterparty accounts
            const cpId = payment.counterparty?.id;
            if (cpId) {
                try {
                    const cpAccounts = await api.getBankAccountsByHolder('COUNTERPARTY', cpId);
                    cpAccounts.forEach(acc => {
                        const option = document.createElement('option');
                        option.value = acc.id;
                        option.textContent = `${acc.accountNumber} (${acc.currency.code})`;
                        option.selected = payment.counterpartyBankAccount?.id === acc.id;
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
            utils.showToast('Error loading payment: ' + error.message, 'error');
        }
    },

    async submitBankPaymentEdit(event, id) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const data = {
            transactionDateTime: formData.get('transactionDateTime'),
            paymentType: formData.get('paymentType'),
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
            outgoingDocumentNumber: formData.get('outgoingDocumentNumber') || undefined,
            valueDate: formData.get('valueDate') || undefined,
            externalTransactionId: formData.get('externalTransactionId') || undefined,
            bankReference: formData.get('bankReference') || undefined
        };

        try {
            await api.updateBankPayment(id, data);
            utils.hideModal();
            utils.showToast('Payment updated successfully');
            modules['bank-payments']();
        } catch (error) {
            utils.showToast('Error updating payment: ' + error.message, 'error');
        }
    }
});
