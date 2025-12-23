// Forms module - create/edit operations
Object.assign(modules, {
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
                            <label>Дата та час</label>
                            <p>${utils.formatDateTime(receipt.transactionDateTime)}</p>
                        </div>
                        <div class="form-group">
                            <label>Тип</label>
                            <p>${modules.translateReceiptType(receipt.receiptType)}</p>
                        </div>
                        <div class="form-group">
                            <label>Статус</label>
                            <p><span class="badge badge-${receipt.status.toLowerCase()}">${modules.translateStatus(receipt.status)}</span></p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Організація</label>
                            <p>${receipt.organization?.name || '-'}</p>
                        </div>
                        <div class="form-group">
                            <label>Рахунок</label>
                            <p>${receipt.account?.accountNumber || '-'}</p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Контрагент</label>
                            <p>${receipt.counterparty?.name || '-'}</p>
                        </div>
                        <div class="form-group">
                            <label>Рахунок контрагента</label>
                            <p>${receipt.counterpartyBankAccount?.accountNumber || '-'}</p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Сума</label>
                            <p><strong>${utils.formatCurrency(receipt.amount, receipt.currency?.symbol)}</strong></p>
                        </div>
                        ${receipt.bankCommission ? `
                        <div class="form-group">
                            <label>Комісія банку</label>
                            <p>${utils.formatCurrency(receipt.bankCommission, receipt.currency?.symbol)}</p>
                        </div>
                        ` : ''}
                    </div>

                    <div class="form-group">
                        <label>Призначення платежу</label>
                        <p>${receipt.paymentPurpose || '-'}</p>
                    </div>

                    ${receipt.description ? `
                    <div class="form-group">
                        <label>Опис</label>
                        <p>${receipt.description}</p>
                    </div>
                    ` : ''}

                    ${receipt.paymentReference ? `
                    <div class="form-group">
                        <label>Референс платежу</label>
                        <p>${receipt.paymentReference}</p>
                    </div>
                    ` : ''}

                    ${receipt.incomingDocumentNumber ? `
                    <div class="form-group">
                        <label>Номер вхідного документа</label>
                        <p>${receipt.incomingDocumentNumber}</p>
                    </div>
                    ` : ''}

                    ${receipt.valueDate ? `
                    <div class="form-group">
                        <label>Дата валютування</label>
                        <p>${utils.formatDate(receipt.valueDate)}</p>
                    </div>
                    ` : ''}

                    ${receipt.externalTransactionId ? `
                    <div class="form-group">
                        <label>Зовнішній ID транзакції</label>
                        <p>${receipt.externalTransactionId}</p>
                    </div>
                    ` : ''}

                    ${receipt.bankReference ? `
                    <div class="form-group">
                        <label>Банківський референс</label>
                        <p>${receipt.bankReference}</p>
                    </div>
                    ` : ''}

                    <div class="form-row">
                        <div class="form-group">
                            <label>Створено</label>
                            <p>${utils.formatDateTime(receipt.createdAt)}</p>
                        </div>
                        ${receipt.postedAt ? `
                        <div class="form-group">
                            <label>Проведено</label>
                            <p>${utils.formatDateTime(receipt.postedAt)}</p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            utils.showModal('Перегляд надходження #' + id, html);
        } catch (error) {
            utils.showToast('Помилка завантаження: ' + error.message, 'error');
        }
    },

    async postBankReceipt(id) {
        if (await utils.confirm('Провести надходження?')) {
            try {
                await api.postBankReceipt(id);
                utils.showToast('Надходження проведено');
                modules['bank-receipts']();
            } catch (error) {
                utils.showToast('Помилка: ' + error.message, 'error');
            }
        }
    },

    async unpostBankReceipt(id) {
        if (await utils.confirm('Скасувати проведення?')) {
            try {
                await api.unpostBankReceipt(id);
                utils.showToast('Проведення скасовано');
                modules['bank-receipts']();
            } catch (error) {
                utils.showToast('Помилка: ' + error.message, 'error');
            }
        }
    },

    async deleteBankReceipt(id) {
        if (await utils.confirm('Видалити надходження?')) {
            try {
                await api.deleteBankReceipt(id);
                utils.showToast('Надходження видалено');
                modules['bank-receipts']();
            } catch (error) {
                utils.showToast('Помилка: ' + error.message, 'error');
            }
        }
    },

    // Placeholder functions for other entities
    async createBankAccount() {
        const [banks, currencies, organizations, counterparties] = await Promise.all([
            api.getBanks(),
            api.getCurrencies(),
            api.getOrganizations(),
            api.getCounterparties(0, 1000)
        ]);

        const formHtml = `
            <form id="bank-account-form" onsubmit="modules.submitBankAccount(event)">
                <div class="form-group">
                    <label>Account Number *</label>
                    <input type="text" name="accountNumber" required maxlength="34" placeholder="Enter account number">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Bank *</label>
                        <select name="bankId" required>
                            <option value="">Select bank</option>
                            ${banks.filter(b => b.isActive).map(b => `<option value="${b.id}">${b.name} (${b.swiftCode})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Currency *</label>
                        <select name="currencyId" required>
                            <option value="">Select currency</option>
                            ${currencies.filter(c => c.isActive).map(c => `<option value="${c.id}">${c.code} - ${c.name}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Holder Type *</label>
                    <select name="holderType" id="holderTypeSelect" required>
                        <option value="">Select holder type</option>
                        <option value="ORGANIZATION">Organization</option>
                        <option value="COUNTERPARTY">Counterparty</option>
                    </select>
                </div>

                <div class="form-group" id="holder-select-container" style="display: none;">
                    <label id="holder-label">Holder *</label>
                    <select name="holderId" id="holder-select" required>
                        <option value="">Select holder</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Account Name</label>
                    <input type="text" name="accountName" maxlength="200" placeholder="Optional account name/description">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status">
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="isDefault" value="true">
                            Set as default account for this holder
                        </label>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create</button>
                </div>
            </form>
        `;

        utils.showModal('New Bank Account', formHtml);

        // Store data and setup handler after modal is rendered
        window.bankAccountFormData = {
            organizations: organizations,
            counterparties: counterparties.content
        };

        // Setup change handler
        const holderTypeSelect = document.getElementById('holderTypeSelect');
        if (holderTypeSelect) {
            holderTypeSelect.addEventListener('change', function() {
                modules.updateHolderDropdown(this.value);
            });
        }
    },

    updateHolderDropdown(holderType) {
        const container = document.getElementById('holder-select-container');
        const select = document.getElementById('holder-select');
        const label = document.getElementById('holder-label');

        if (!holderType || !window.bankAccountFormData) {
            if (container) container.style.display = 'none';
            if (select) select.required = false;
            return;
        }

        const data = window.bankAccountFormData;
        let options = '<option value="">Select holder</option>';

        if (holderType === 'ORGANIZATION') {
            label.textContent = 'Organization *';
            options += data.organizations.map(org =>
                `<option value="${org.id}">${org.name}</option>`
            ).join('');
        } else if (holderType === 'COUNTERPARTY') {
            label.textContent = 'Counterparty *';
            options += data.counterparties.map(cp =>
                `<option value="${cp.id}">${cp.name} (${cp.code})</option>`
            ).join('');
        }

        select.innerHTML = options;
        select.required = true;
        container.style.display = 'block';
    },

    async submitBankAccount(event, id = null) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const data = {
            accountNumber: formData.get('accountNumber'),
            holderType: formData.get('holderType'),
            holderId: parseInt(formData.get('holderId')),
            accountName: formData.get('accountName') || undefined,
            status: formData.get('status') || 'ACTIVE',
            isDefault: formData.get('isDefault') === 'true',
            bankId: parseInt(formData.get('bankId')),
            currencyId: parseInt(formData.get('currencyId'))
        };

        try {
            if (id) {
                await api.updateBankAccount(id, data);
                utils.showToast('Bank account updated successfully');
            } else {
                await api.createBankAccount(data);
                utils.showToast('Bank account created successfully');
            }
            utils.hideModal();
            modules['bank-accounts']();
        } catch (error) {
            utils.showToast('Error: ' + error.message, 'error');
        }
    },

    async editBankAccount(id) {
        try {
            const [account, banks, currencies, organizations, counterparties] = await Promise.all([
                api.getById('bank-accounts', id),
                api.getBanks(),
                api.getCurrencies(),
                api.getOrganizations(),
                api.getCounterparties(0, 1000)
            ]);

            const formHtml = `
                <form id="bank-account-form" onsubmit="modules.submitBankAccount(event, ${id})">
                    <div class="form-group">
                        <label>Account Number *</label>
                        <input type="text" name="accountNumber" required maxlength="34" value="${account.accountNumber}">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Bank *</label>
                            <select name="bankId" required>
                                <option value="">Select bank</option>
                                ${banks.map(b => `<option value="${b.id}" ${account.bank?.id === b.id ? 'selected' : ''}>${b.name} (${b.swiftCode})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Currency *</label>
                            <select name="currencyId" required>
                                <option value="">Select currency</option>
                                ${currencies.map(c => `<option value="${c.id}" ${account.currency?.id === c.id ? 'selected' : ''}>${c.code} - ${c.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Holder Type *</label>
                        <select name="holderType" required onchange="modules.updateHolderDropdown(this.value)" disabled>
                            <option value="ORGANIZATION" ${account.holderType === 'ORGANIZATION' ? 'selected' : ''}>Organization</option>
                            <option value="COUNTERPARTY" ${account.holderType === 'COUNTERPARTY' ? 'selected' : ''}>Counterparty</option>
                        </select>
                        <small style="color: var(--text-secondary);">Holder type cannot be changed</small>
                    </div>

                    <div class="form-group" id="holder-select-container">
                        <label id="holder-label">${account.holderType === 'ORGANIZATION' ? 'Organization' : 'Counterparty'} *</label>
                        <select name="holderId" id="holder-select" required disabled>
                            <option value="${account.holderId}" selected>${account.holderType === 'ORGANIZATION' ?
                                organizations.find(o => o.id === account.holderId)?.name :
                                counterparties.content.find(c => c.id === account.holderId)?.name
                            }</option>
                        </select>
                        <small style="color: var(--text-secondary);">Holder cannot be changed</small>
                    </div>

                    <div class="form-group">
                        <label>Account Name</label>
                        <input type="text" name="accountName" maxlength="200" value="${account.accountName || ''}">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Status</label>
                            <select name="status">
                                <option value="ACTIVE" ${account.status === 'ACTIVE' ? 'selected' : ''}>Active</option>
                                <option value="INACTIVE" ${account.status === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
                                <option value="CLOSED" ${account.status === 'CLOSED' ? 'selected' : ''}>Closed</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" name="isDefault" value="true" ${account.isDefault ? 'checked' : ''}>
                                Set as default account for this holder
                            </label>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Update</button>
                    </div>
                </form>
                <script>
                    window.bankAccountFormData = {
                        organizations: ${JSON.stringify(organizations)},
                        counterparties: ${JSON.stringify(counterparties.content)}
                    };
                </script>
            `;

            utils.showModal('Edit Bank Account', formHtml);
        } catch (error) {
            utils.showToast('Error loading account: ' + error.message, 'error');
        }
    },

    async viewBankAccount(id) {
        try {
            const account = await api.getById('bank-accounts', id);

            const html = `
                <div class="detail-view">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Account Number</label>
                            <p><strong>${account.accountNumber}</strong></p>
                        </div>
                        <div class="form-group">
                            <label>Account Name</label>
                            <p>${account.accountName || '-'}</p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Bank</label>
                            <p>${account.bank?.name || '-'}<br>
                            <small>${account.bank?.swiftCode || ''}</small></p>
                        </div>
                        <div class="form-group">
                            <label>Currency</label>
                            <p>${account.currency?.code || '-'} - ${account.currency?.name || ''}</p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Holder Type</label>
                            <p>${account.holderType === 'ORGANIZATION' ? '🏢 Organization' : '🤝 Counterparty'}</p>
                        </div>
                        <div class="form-group">
                            <label>Holder ID</label>
                            <p>${account.holderId}</p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Status</label>
                            <p><span class="badge badge-${account.status.toLowerCase()}">${account.status}</span></p>
                        </div>
                        <div class="form-group">
                            <label>Default Account</label>
                            <p>${account.isDefault ? '⭐ Yes' : 'No'}</p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Created</label>
                            <p>${utils.formatDateTime(account.createdAt)}</p>
                        </div>
                        <div class="form-group">
                            <label>Updated</label>
                            <p>${utils.formatDateTime(account.updatedAt)}</p>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="utils.hideModal()">Close</button>
                        <button class="btn btn-primary" onclick="utils.hideModal(); modules.editBankAccount(${id})">Edit</button>
                    </div>
                </div>
            `;
            utils.showModal('Bank Account Details', html);
        } catch (error) {
            utils.showToast('Error loading: ' + error.message, 'error');
        }
    },

    async deleteBankAccount(id) {
        if (await utils.confirm('Delete this bank account?')) {
            try {
                await api.deleteBankAccount(id);
                utils.showToast('Bank account deleted successfully');
                modules['bank-accounts']();
            } catch (error) {
                utils.showToast('Error: ' + error.message, 'error');
            }
        }
    },

    async createBank() {
        utils.showToast('Форма в розробці', 'warning');
    },
    async editBank(id) {
        utils.showToast('Форма в розробці', 'warning');
    },
    async deleteBank(id) {
        if (await utils.confirm('Видалити банк?')) {
            try {
                await api.deleteBank(id);
                utils.showToast('Банк видалено');
                modules.banks();
            } catch (error) {
                utils.showToast('Помилка: ' + error.message, 'error');
            }
        }
    },

    async createOrganization() {
        utils.showToast('Форма в розробці', 'warning');
    },
    async editOrganization(id) {
        utils.showToast('Форма в розробці', 'warning');
    },
    async deleteOrganization(id) {
        if (await utils.confirm('Видалити організацію?')) {
            try {
                await api.deleteOrganization(id);
                utils.showToast('Організацію видалено');
                modules.organizations();
            } catch (error) {
                utils.showToast('Помилка: ' + error.message, 'error');
            }
        }
    },

    // Counterparty Forms
    async createCounterparty() {
        const countries = await api.getCountries();

        const formHtml = `
            <form id="counterparty-form" onsubmit="modules.submitCounterparty(event)">
                <div class="form-row">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" name="name" required maxlength="255">
                    </div>
                    <div class="form-group">
                        <label>Code *</label>
                        <input type="text" name="code" required maxlength="50">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Type *</label>
                        <select name="type" required>
                            <option value="CUSTOMER">Customer</option>
                            <option value="SUPPLIER">Supplier</option>
                            <option value="BOTH">Customer and Supplier</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Country</label>
                        <select name="countryId">
                            <option value="">Select country</option>
                            ${countries.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Tax Number</label>
                        <input type="text" name="taxNumber" maxlength="20">
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" maxlength="255">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="text" name="phone" maxlength="20">
                    </div>
                    <div class="form-group">
                        <label>Active</label>
                        <select name="isActive">
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Address</label>
                    <textarea name="address" maxlength="500" rows="2"></textarea>
                </div>

                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="notes" maxlength="1000" rows="3"></textarea>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create</button>
                </div>
            </form>
        `;

        utils.showModal('New Counterparty', formHtml);
    },

    async submitCounterparty(event, id = null) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const data = {
            name: formData.get('name'),
            code: formData.get('code'),
            type: formData.get('type'),
            taxNumber: formData.get('taxNumber') || undefined,
            email: formData.get('email') || undefined,
            phone: formData.get('phone') || undefined,
            address: formData.get('address') || undefined,
            isActive: formData.get('isActive') === 'true',
            notes: formData.get('notes') || undefined,
            countryId: formData.get('countryId') ? parseInt(formData.get('countryId')) : undefined
        };

        try {
            if (id) {
                await api.updateCounterparty(id, data);
                utils.showToast('Counterparty updated successfully');
            } else {
                await api.createCounterparty(data);
                utils.showToast('Counterparty created successfully');
            }
            utils.hideModal();
            modules.counterparties();
        } catch (error) {
            utils.showToast('Error: ' + error.message, 'error');
        }
    },

    async editCounterparty(id) {
        try {
            const counterparty = await api.getById('counterparties', id);
            const countries = await api.getCountries();

            const formHtml = `
                <form id="counterparty-form" onsubmit="modules.submitCounterparty(event, ${id})">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Name *</label>
                            <input type="text" name="name" required maxlength="255" value="${counterparty.name}">
                        </div>
                        <div class="form-group">
                            <label>Code *</label>
                            <input type="text" name="code" required maxlength="50" value="${counterparty.code}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Type *</label>
                            <select name="type" required>
                                <option value="CUSTOMER" ${counterparty.type === 'CUSTOMER' ? 'selected' : ''}>Customer</option>
                                <option value="SUPPLIER" ${counterparty.type === 'SUPPLIER' ? 'selected' : ''}>Supplier</option>
                                <option value="BOTH" ${counterparty.type === 'BOTH' ? 'selected' : ''}>Customer and Supplier</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Country</label>
                            <select name="countryId">
                                <option value="">Select country</option>
                                ${countries.map(c => `<option value="${c.id}" ${counterparty.country?.id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Tax Number</label>
                            <input type="text" name="taxNumber" maxlength="20" value="${counterparty.taxNumber || ''}">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" name="email" maxlength="255" value="${counterparty.email || ''}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="text" name="phone" maxlength="20" value="${counterparty.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label>Active</label>
                            <select name="isActive">
                                <option value="true" ${counterparty.isActive ? 'selected' : ''}>Active</option>
                                <option value="false" ${!counterparty.isActive ? 'selected' : ''}>Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Address</label>
                        <textarea name="address" maxlength="500" rows="2">${counterparty.address || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label>Notes</label>
                        <textarea name="notes" maxlength="1000" rows="3">${counterparty.notes || ''}</textarea>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Update</button>
                    </div>
                </form>
            `;

            utils.showModal('Edit Counterparty', formHtml);
        } catch (error) {
            utils.showToast('Error loading counterparty: ' + error.message, 'error');
        }
    },

    async viewCounterparty(id) {
        try {
            const counterparty = await api.getById('counterparties', id);
            const html = `
                <div class="detail-view">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Name</label>
                            <p><strong>${counterparty.name}</strong></p>
                        </div>
                        <div class="form-group">
                            <label>Code</label>
                            <p>${counterparty.code}</p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Type</label>
                            <p>${modules.translateCounterpartyType(counterparty.type)}</p>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <p><span class="badge badge-${counterparty.isActive ? 'active' : 'inactive'}">${counterparty.isActive ? 'Active' : 'Inactive'}</span></p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Country</label>
                            <p>${counterparty.country?.name || '-'}</p>
                        </div>
                        <div class="form-group">
                            <label>Tax Number</label>
                            <p>${counterparty.taxNumber || '-'}</p>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Email</label>
                            <p>${counterparty.email || '-'}</p>
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <p>${counterparty.phone || '-'}</p>
                        </div>
                    </div>

                    ${counterparty.address ? `
                    <div class="form-group">
                        <label>Address</label>
                        <p>${counterparty.address}</p>
                    </div>
                    ` : ''}

                    ${counterparty.notes ? `
                    <div class="form-group">
                        <label>Notes</label>
                        <p>${counterparty.notes}</p>
                    </div>
                    ` : ''}

                    <div class="form-row">
                        <div class="form-group">
                            <label>Created</label>
                            <p>${utils.formatDateTime(counterparty.createdAt)}</p>
                        </div>
                        <div class="form-group">
                            <label>Updated</label>
                            <p>${utils.formatDateTime(counterparty.updatedAt)}</p>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="utils.hideModal()">Close</button>
                        <button class="btn btn-success" onclick="utils.hideModal(); modules.manageCounterpartyBankAccounts(${id}, '${counterparty.name}')">Bank Accounts</button>
                        <button class="btn btn-primary" onclick="utils.hideModal(); modules.editCounterparty(${id})">Edit</button>
                    </div>
                </div>
            `;
            utils.showModal('Counterparty Details', html);
        } catch (error) {
            utils.showToast('Error loading: ' + error.message, 'error');
        }
    },

    async deleteCounterparty(id) {
        if (await utils.confirm('Delete this counterparty? This action cannot be undone.')) {
            try {
                await api.deleteCounterparty(id);
                utils.showToast('Counterparty deleted successfully');
                modules.counterparties();
            } catch (error) {
                utils.showToast('Error: ' + error.message, 'error');
            }
        }
    },

    // Counterparty Bank Accounts Management
    async manageCounterpartyBankAccounts(counterpartyId, counterpartyName) {
        try {
            const accounts = await api.getBankAccountsByHolder('COUNTERPARTY', counterpartyId);

            const html = `
                <div>
                    <p><strong>Counterparty:</strong> ${counterpartyName}</p>
                    <div class="action-bar mt-2">
                        <button class="btn btn-primary" onclick="modules.createCounterpartyBankAccount(${counterpartyId})">
                            ➕ Add Bank Account
                        </button>
                    </div>
                    <div class="table-container mt-2">
                        <table>
                            <thead>
                                <tr>
                                    <th>Account Number</th>
                                    <th>Bank</th>
                                    <th>Currency</th>
                                    <th>Status</th>
                                    <th>Default</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${accounts.length === 0 ?
                                    '<tr><td colspan="6" class="text-center">No bank accounts</td></tr>' :
                                    accounts.map(acc => `
                                        <tr>
                                            <td><strong>${acc.accountNumber}</strong></td>
                                            <td>${acc.bank?.name || '-'}</td>
                                            <td>${acc.currency?.code || '-'}</td>
                                            <td><span class="badge badge-${acc.status.toLowerCase()}">${acc.status}</span></td>
                                            <td>${acc.isDefault ? '⭐' : ''}</td>
                                            <td>
                                                <button class="btn-icon" onclick="modules.editCounterpartyBankAccount(${acc.id}, ${counterpartyId})" title="Edit">✏️</button>
                                                <button class="btn-icon" onclick="modules.deleteCounterpartyBankAccount(${acc.id}, ${counterpartyId}, '${counterpartyName}')" title="Delete">🗑️</button>
                                            </td>
                                        </tr>
                                    `).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            utils.showModal('Bank Accounts - ' + counterpartyName, html);
        } catch (error) {
            utils.showToast('Error loading bank accounts: ' + error.message, 'error');
        }
    },

    async createCounterpartyBankAccount(counterpartyId) {
        const [banks, currencies] = await Promise.all([
            api.getBanks(),
            api.getCurrencies()
        ]);

        const formHtml = `
            <form id="bank-account-form" onsubmit="modules.submitCounterpartyBankAccount(event, ${counterpartyId})">
                <div class="form-group">
                    <label>Account Number *</label>
                    <input type="text" name="accountNumber" required maxlength="34">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Bank *</label>
                        <select name="bankId" required>
                            <option value="">Select bank</option>
                            ${banks.map(b => `<option value="${b.id}">${b.name} (${b.swiftCode})</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Currency *</label>
                        <select name="currencyId" required>
                            <option value="">Select currency</option>
                            ${currencies.filter(c => c.isActive).map(c => `<option value="${c.id}">${c.code} - ${c.name}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Account Name</label>
                        <input type="text" name="accountName" maxlength="200">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status">
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox" name="isDefault" value="true">
                        Set as default account
                    </label>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="utils.hideModal(); modules.manageCounterpartyBankAccounts(${counterpartyId}, '');">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create</button>
                </div>
            </form>
        `;

        utils.showModal('New Bank Account', formHtml);
    },

    async submitCounterpartyBankAccount(event, counterpartyId, accountId = null) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const data = {
            accountNumber: formData.get('accountNumber'),
            holderType: 'COUNTERPARTY',
            holderId: counterpartyId,
            accountName: formData.get('accountName') || undefined,
            status: formData.get('status') || 'ACTIVE',
            isDefault: formData.get('isDefault') === 'true',
            bankId: parseInt(formData.get('bankId')),
            currencyId: parseInt(formData.get('currencyId'))
        };

        try {
            if (accountId) {
                await api.updateBankAccount(accountId, data);
                utils.showToast('Bank account updated successfully');
            } else {
                await api.createBankAccount(data);
                utils.showToast('Bank account created successfully');
            }
            utils.hideModal();
            // Reload counterparty view with bank accounts
            const counterparty = await api.getById('counterparties', counterpartyId);
            modules.manageCounterpartyBankAccounts(counterpartyId, counterparty.name);
        } catch (error) {
            utils.showToast('Error: ' + error.message, 'error');
        }
    },

    async editCounterpartyBankAccount(accountId, counterpartyId) {
        try {
            const [account, banks, currencies] = await Promise.all([
                api.getById('bank-accounts', accountId),
                api.getBanks(),
                api.getCurrencies()
            ]);

            const formHtml = `
                <form id="bank-account-form" onsubmit="modules.submitCounterpartyBankAccount(event, ${counterpartyId}, ${accountId})">
                    <div class="form-group">
                        <label>Account Number *</label>
                        <input type="text" name="accountNumber" required maxlength="34" value="${account.accountNumber}">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Bank *</label>
                            <select name="bankId" required>
                                <option value="">Select bank</option>
                                ${banks.map(b => `<option value="${b.id}" ${account.bank?.id === b.id ? 'selected' : ''}>${b.name} (${b.swiftCode})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Currency *</label>
                            <select name="currencyId" required>
                                <option value="">Select currency</option>
                                ${currencies.filter(c => c.isActive).map(c => `<option value="${c.id}" ${account.currency?.id === c.id ? 'selected' : ''}>${c.code} - ${c.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Account Name</label>
                            <input type="text" name="accountName" maxlength="200" value="${account.accountName || ''}">
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select name="status">
                                <option value="ACTIVE" ${account.status === 'ACTIVE' ? 'selected' : ''}>Active</option>
                                <option value="INACTIVE" ${account.status === 'INACTIVE' ? 'selected' : ''}>Inactive</option>
                                <option value="CLOSED" ${account.status === 'CLOSED' ? 'selected' : ''}>Closed</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="isDefault" value="true" ${account.isDefault ? 'checked' : ''}>
                            Set as default account
                        </label>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="utils.hideModal(); modules.manageCounterpartyBankAccounts(${counterpartyId}, '');">Cancel</button>
                        <button type="submit" class="btn btn-primary">Update</button>
                    </div>
                </form>
            `;

            utils.showModal('Edit Bank Account', formHtml);
        } catch (error) {
            utils.showToast('Error loading account: ' + error.message, 'error');
        }
    },

    async deleteCounterpartyBankAccount(accountId, counterpartyId, counterpartyName) {
        if (await utils.confirm('Delete this bank account?')) {
            try {
                await api.deleteBankAccount(accountId);
                utils.showToast('Bank account deleted successfully');
                modules.manageCounterpartyBankAccounts(counterpartyId, counterpartyName);
            } catch (error) {
                utils.showToast('Error: ' + error.message, 'error');
            }
        }
    },

    async createCurrency() {
        utils.showToast('Форма в розробці', 'warning');
    },
    async editCurrency(id) {
        utils.showToast('Форма в розробці', 'warning');
    },
    async deleteCurrency(id) {
        if (await utils.confirm('Видалити валюту?')) {
            try {
                await api.deleteCurrency(id);
                utils.showToast('Валюту видалено');
                modules.currencies();
            } catch (error) {
                utils.showToast('Помилка: ' + error.message, 'error');
            }
        }
    },

    async createCountry() {
        utils.showToast('Форма в розробці', 'warning');
    },
    async editCountry(id) {
        utils.showToast('Форма в розробці', 'warning');
    },
    async deleteCountry(id) {
        if (await utils.confirm('Видалити країну?')) {
            try {
                await api.deleteCountry(id);
                utils.showToast('Країну видалено');
                modules.countries();
            } catch (error) {
                utils.showToast('Помилка: ' + error.message, 'error');
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
    },

    // Reports placeholder
    async reports() {
        document.getElementById('module-title').textContent = 'Звіти';
        const contentBody = document.getElementById('content-body');
        contentBody.innerHTML = `
            <div class="welcome-screen">
                <h2>📊 Звіти</h2>
                <p>Модуль звітів в розробці</p>
                <p>Доступні звіти:</p>
                <ul style="text-align: left; max-width: 400px; margin: 2rem auto;">
                    <li>Залишки по рахунках</li>
                    <li>Обороти по рахунках</li>
                    <li>Аналіз платежів</li>
                    <li>Аналіз надходжень</li>
                </ul>
            </div>
        `;
    },

    async 'exchange-rates'() {
        utils.showToast('Модуль в розробці', 'warning');
    },

    async 'accounting-policies'() {
        utils.showToast('Модуль в розробці', 'warning');
    }
});