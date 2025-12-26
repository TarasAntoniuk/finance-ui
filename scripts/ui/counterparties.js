/**
 * Counterparties Module
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Add Counterparties methods
Object.assign(modules, {
    async counterparties() {
        document.getElementById('module-title').textContent = 'Counterparties';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <button class="btn btn-primary" onclick="modules.createCounterparty()">
                    ➕ New Counterparty
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Code</th>
                            <th>Type</th>
                            <th>Country</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="counterparties-tbody">
                        <tr><td colspan="7" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" id="counterparties-pagination"></div>
        `;

        try {
            const data = await api.getCounterparties(AppState.currentPage, AppState.pageSize);
            const tbody = document.getElementById('counterparties-tbody');

            if (data.content.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No counterparties found</td></tr>';
                return;
            }

            tbody.innerHTML = data.content.map(cp => `
                <tr>
                    <td><strong>${cp.name}</strong></td>
                    <td>${cp.code}</td>
                    <td>${modules.translateCounterpartyType(cp.type)}</td>
                    <td>${cp.country?.name || '-'}</td>
                    <td>${cp.email || '-'}</td>
                    <td><span class="badge badge-${cp.isActive ? 'active' : 'inactive'}">${cp.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <button class="btn-icon" onclick="modules.viewCounterparty(${cp.id})" title="View">👁️</button>
                        <button class="btn-icon" onclick="modules.editCounterparty(${cp.id})" title="Edit">✏️</button>
                        <button class="btn-icon" onclick="modules.deleteCounterparty(${cp.id})" title="Delete">🗑️</button>
                    </td>
                </tr>
            `).join('');

            modules.renderPagination('counterparties-pagination', data.metadata, () => modules.counterparties());
        } catch (error) {
            utils.showToast('Error loading counterparties: ' + error.message, 'error');
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
    }
});
