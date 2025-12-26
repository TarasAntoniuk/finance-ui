/**
 * Bank Accounts Module
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Add Bank Accounts methods
Object.assign(modules, {
    async 'bank-accounts'() {
        document.getElementById('module-title').textContent = 'Bank Accounts';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <button class="btn btn-primary" onclick="modules.createBankAccount()">
                    ➕ New Bank Account
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Account Number</th>
                            <th>Bank</th>
                            <th>Currency</th>
                            <th>Holder Type</th>
                            <th>Holder</th>
                            <th>Status</th>
                            <th>Default</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="accounts-tbody">
                        <tr><td colspan="8" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        try {
            // Load accounts, organizations and counterparties in parallel
            const [accounts, organizations, counterparties] = await Promise.all([
                api.getBankAccounts(),
                api.getOrganizations(),
                api.getCounterparties(0, 1000)
            ]);

            const tbody = document.getElementById('accounts-tbody');

            if (accounts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">No bank accounts found</td></tr>';
                return;
            }

            // Create lookup maps for quick access
            const orgMap = {};
            organizations.forEach(org => {
                orgMap[org.id] = org;
            });

            const cpMap = {};
            counterparties.content.forEach(cp => {
                cpMap[cp.id] = cp;
            });

            tbody.innerHTML = accounts.map(account => {
                // Get holder name based on holder type
                let holderName = '-';
                if (account.holderType === 'ORGANIZATION' && orgMap[account.holderId]) {
                    holderName = orgMap[account.holderId].name;
                } else if (account.holderType === 'COUNTERPARTY' && cpMap[account.holderId]) {
                    holderName = cpMap[account.holderId].name;
                }

                return `
                    <tr>
                        <td><strong>${account.accountNumber}</strong>${account.accountName ? '<br><small>' + account.accountName + '</small>' : ''}</td>
                        <td>${account.bank?.name || '-'}<br><small>${account.bank?.swiftCode || ''}</small></td>
                        <td>${account.currency?.code || '-'}</td>
                        <td>${account.holderType === 'ORGANIZATION' ? '🏢 Organization' : '🤝 Counterparty'}</td>
                        <td><strong>${holderName}</strong></td>
                        <td><span class="badge badge-${account.status.toLowerCase()}">${modules.translateAccountStatus(account.status)}</span></td>
                        <td>${account.isDefault ? '⭐' : ''}</td>
                        <td>
                            <button class="btn-icon" onclick="modules.viewBankAccount(${account.id})" title="View">👁️</button>
                            <button class="btn-icon" onclick="modules.editBankAccount(${account.id})" title="Edit">✏️</button>
                            <button class="btn-icon" onclick="modules.deleteBankAccount(${account.id})" title="Delete">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            utils.showToast('Error loading bank accounts: ' + error.message, 'error');
        }
    },

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
    }
});
