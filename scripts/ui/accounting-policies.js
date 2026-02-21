/**
 * Accounting Policies Module
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Store for filters
const accountingPolicyState = {
    allPolicies: [],
    filteredPolicies: [],
    filters: {
        organizationId: '',
        year: '',
        status: ''
    }
};

// Add Accounting Policies module
Object.assign(modules, {
    async 'accounting-policies'() {
        document.getElementById('module-title').textContent = 'Accounting Policies';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <div class="action-bar-left">
                    ${auth.canWrite() ? `<button class="btn btn-primary" onclick="modules.createAccountingPolicy()">
                        ➕ New Accounting Policy
                    </button>` : ''}
                </div>
                <div class="action-bar-right">
                    <select id="policy-org-filter" onchange="modules.filterAccountingPolicies()">
                        <option value="">All Organizations</option>
                    </select>
                    <input type="number" id="policy-year-filter" placeholder="Year"
                           min="1900" max="2100" style="width: 100px;"
                           onchange="modules.filterAccountingPolicies()">
                    <select id="policy-status-filter" onchange="modules.filterAccountingPolicies()">
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Organization</th>
                            <th>Year</th>
                            <th>Currency</th>
                            <th>Fiscal Year Start</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="policies-tbody">
                        <tr><td colspan="6" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        try {
            // Load all data in parallel
            const [policies, organizations, currencies] = await Promise.all([
                api.getAccountingPolicies(),
                api.getOrganizations(),
                api.getCurrencies()
            ]);

            // Enrich policies with organization and currency info
            const enrichedPolicies = policies.map(policy => ({
                ...policy,
                organizationId: policy.organization?.id,
                organizationName: policy.organization?.name || 'Unknown',
                currencyId: policy.currency?.id,
                currencyCode: policy.currency?.code || 'Unknown'
            }));

            // Store in state
            accountingPolicyState.allPolicies = enrichedPolicies;
            accountingPolicyState.filteredPolicies = enrichedPolicies;

            // Populate filter dropdowns
            const orgFilter = document.getElementById('policy-org-filter');
            organizations.forEach(org => {
                const option = document.createElement('option');
                option.value = org.id;
                option.textContent = org.name;
                orgFilter.appendChild(option);
            });

            // Render table
            modules.renderAccountingPoliciesTable();
        } catch (error) {
            utils.showToast('Error loading accounting policies: ' + error.message, 'error');
        }
    },

    filterAccountingPolicies() {
        const orgId = document.getElementById('policy-org-filter').value;
        const year = document.getElementById('policy-year-filter').value;
        const status = document.getElementById('policy-status-filter').value;

        accountingPolicyState.filters = { organizationId: orgId, year, status };

        let filtered = accountingPolicyState.allPolicies;

        if (orgId) {
            filtered = filtered.filter(p => p.organizationId == orgId);
        }
        if (year) {
            filtered = filtered.filter(p => p.year == year);
        }
        if (status === 'active') {
            filtered = filtered.filter(p => p.isActive === true);
        } else if (status === 'inactive') {
            filtered = filtered.filter(p => p.isActive === false);
        }

        accountingPolicyState.filteredPolicies = filtered;
        modules.renderAccountingPoliciesTable();
    },

    renderAccountingPoliciesTable() {
        const tbody = document.getElementById('policies-tbody');
        const policies = accountingPolicyState.filteredPolicies;

        if (policies.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No accounting policies found</td></tr>';
            return;
        }

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];

        tbody.innerHTML = policies.map(policy => {
            const monthName = policy.fiscalYearStartMonth ? monthNames[policy.fiscalYearStartMonth - 1] : 'January';
            const statusBadge = policy.isActive
                ? '<span class="badge badge-active">Active</span>'
                : '<span class="badge badge-inactive">Inactive</span>';

            const toggleAction = policy.isActive
                ? `<button class="btn-icon" onclick="modules.deactivateAccountingPolicy(${policy.id})" title="Deactivate">⏸️</button>`
                : `<button class="btn-icon" onclick="modules.activateAccountingPolicy(${policy.id})" title="Activate">▶️</button>`;

            return `
                <tr>
                    <td><strong>${policy.organizationName}</strong></td>
                    <td>${policy.year}</td>
                    <td>${policy.currencyCode}</td>
                    <td>${monthName} (${policy.fiscalYearStartMonth || 1})</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn-icon" onclick="modules.viewAccountingPolicy(${policy.id})" title="View">👁️</button>
                        ${auth.canWrite() ? `
                            <button class="btn-icon" onclick="modules.editAccountingPolicy(${policy.id})" title="Edit">✏️</button>
                            ${toggleAction}
                            <button class="btn-icon" onclick="modules.deleteAccountingPolicy(${policy.id})" title="Delete">🗑️</button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    },

    async createAccountingPolicy() {
        try {
            const [organizations, currencies] = await Promise.all([
                api.getOrganizations(),
                api.getCurrencies()
            ]);

            const formHtml = `
                <form id="accounting-policy-form" onsubmit="modules.submitAccountingPolicy(event)">
                    <div class="form-group">
                        <label>Organization *</label>
                        <select name="organizationId" required>
                            <option value="">Select organization</option>
                            ${organizations.map(org => `<option value="${org.id}">${org.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Year *</label>
                            <input type="number" name="year" required min="1900" max="2100"
                                   placeholder="2024" value="${new Date().getFullYear()}">
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
                        <label>Fiscal Year Start Month</label>
                        <select name="fiscalYearStartMonth">
                            <option value="1">January</option>
                            <option value="2">February</option>
                            <option value="3">March</option>
                            <option value="4">April</option>
                            <option value="5">May</option>
                            <option value="6">June</option>
                            <option value="7">July</option>
                            <option value="8">August</option>
                            <option value="9">September</option>
                            <option value="10">October</option>
                            <option value="11">November</option>
                            <option value="12">December</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Depreciation Method</label>
                        <input type="text" name="depreciationMethod" maxlength="50" placeholder="Straight-line">
                    </div>

                    <div class="form-group">
                        <label>Inventory Valuation Method</label>
                        <input type="text" name="inventoryValuationMethod" maxlength="50" placeholder="FIFO">
                    </div>

                    <div class="form-group">
                        <label>Revenue Recognition Method</label>
                        <input type="text" name="revenueRecognitionMethod" maxlength="50" placeholder="Accrual">
                    </div>

                    <div class="form-group">
                        <label>VAT Accounting Method</label>
                        <input type="text" name="vatAccountingMethod" maxlength="50" placeholder="By Invoice">
                    </div>

                    <div class="form-group">
                        <label>Notes</label>
                        <textarea name="notes" rows="3" placeholder="Additional information..."></textarea>
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="isActive" checked>
                            Active Policy
                        </label>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create</button>
                    </div>
                </form>
            `;

            utils.showModal('New Accounting Policy', formHtml);
        } catch (error) {
            utils.showToast('Error loading form: ' + error.message, 'error');
        }
    },

    async editAccountingPolicy(id) {
        try {
            const [policy, organizations, currencies] = await Promise.all([
                api.getAccountingPolicyById(id),
                api.getOrganizations(),
                api.getCurrencies()
            ]);

            const formHtml = `
                <form id="accounting-policy-form" onsubmit="modules.submitAccountingPolicy(event, ${id})">
                    <div class="form-group">
                        <label>Organization *</label>
                        <select name="organizationId" required>
                            <option value="">Select organization</option>
                            ${organizations.map(org => `<option value="${org.id}" ${org.id === policy.organization?.id ? 'selected' : ''}>${org.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Year *</label>
                            <input type="number" name="year" required min="1900" max="2100" value="${policy.year}">
                        </div>
                        <div class="form-group">
                            <label>Currency *</label>
                            <select name="currencyId" required>
                                <option value="">Select currency</option>
                                ${currencies.map(c => `<option value="${c.id}" ${c.id === policy.currency?.id ? 'selected' : ''}>${c.code} - ${c.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Fiscal Year Start Month</label>
                        <select name="fiscalYearStartMonth">
                            ${[1,2,3,4,5,6,7,8,9,10,11,12].map(month => {
                                const months = ['January', 'February', 'March', 'April', 'May', 'June',
                                              'July', 'August', 'September', 'October', 'November', 'December'];
                                return `<option value="${month}" ${month === policy.fiscalYearStartMonth ? 'selected' : ''}>${months[month-1]}</option>`;
                            }).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Depreciation Method</label>
                        <input type="text" name="depreciationMethod" maxlength="50" value="${policy.depreciationMethod || ''}">
                    </div>

                    <div class="form-group">
                        <label>Inventory Valuation Method</label>
                        <input type="text" name="inventoryValuationMethod" maxlength="50" value="${policy.inventoryValuationMethod || ''}">
                    </div>

                    <div class="form-group">
                        <label>Revenue Recognition Method</label>
                        <input type="text" name="revenueRecognitionMethod" maxlength="50" value="${policy.revenueRecognitionMethod || ''}">
                    </div>

                    <div class="form-group">
                        <label>VAT Accounting Method</label>
                        <input type="text" name="vatAccountingMethod" maxlength="50" value="${policy.vatAccountingMethod || ''}">
                    </div>

                    <div class="form-group">
                        <label>Notes</label>
                        <textarea name="notes" rows="3">${policy.notes || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="isActive" ${policy.isActive ? 'checked' : ''}>
                            Active Policy
                        </label>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save</button>
                    </div>
                </form>
            `;

            utils.showModal('Edit Accounting Policy', formHtml);
        } catch (error) {
            utils.showToast('Error loading policy: ' + error.message, 'error');
        }
    },

    async viewAccountingPolicy(id) {
        try {
            const policy = await api.getAccountingPolicyById(id);

            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                               'July', 'August', 'September', 'October', 'November', 'December'];
            const monthName = policy.fiscalYearStartMonth ? monthNames[policy.fiscalYearStartMonth - 1] : 'January';

            const viewHtml = `
                <div class="policy-details">
                    <div class="detail-row">
                        <strong>Organization:</strong> ${policy.organization?.name || 'Unknown'}
                    </div>
                    <div class="detail-row">
                        <strong>Year:</strong> ${policy.year}
                    </div>
                    <div class="detail-row">
                        <strong>Currency:</strong> ${policy.currency?.code || 'Unknown'}
                    </div>
                    <div class="detail-row">
                        <strong>Fiscal Year Start:</strong> ${monthName} (${policy.fiscalYearStartMonth || 1})
                    </div>
                    <div class="detail-row">
                        <strong>Depreciation Method:</strong> ${policy.depreciationMethod || '-'}
                    </div>
                    <div class="detail-row">
                        <strong>Inventory Valuation Method:</strong> ${policy.inventoryValuationMethod || '-'}
                    </div>
                    <div class="detail-row">
                        <strong>Revenue Recognition Method:</strong> ${policy.revenueRecognitionMethod || '-'}
                    </div>
                    <div class="detail-row">
                        <strong>VAT Accounting Method:</strong> ${policy.vatAccountingMethod || '-'}
                    </div>
                    <div class="detail-row">
                        <strong>Status:</strong> ${policy.isActive ? '<span class="badge badge-active">Active</span>' : '<span class="badge badge-inactive">Inactive</span>'}
                    </div>
                    ${policy.notes ? `<div class="detail-row"><strong>Notes:</strong><br>${policy.notes}</div>` : ''}
                    <div class="detail-row">
                        <strong>Created:</strong> ${utils.formatDateTime(policy.createdAt)}
                    </div>
                    ${policy.updatedAt ? `<div class="detail-row"><strong>Updated:</strong> ${utils.formatDateTime(policy.updatedAt)}</div>` : ''}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Close</button>
                    ${auth.canWrite() ? `<button type="button" class="btn btn-primary" onclick="utils.hideModal(); modules.editAccountingPolicy(${id})">Edit</button>` : ''}
                </div>
            `;

            utils.showModal('Accounting Policy Details', viewHtml);
        } catch (error) {
            utils.showToast('Error loading details: ' + error.message, 'error');
        }
    },

    async submitAccountingPolicy(event, id = null) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const data = {
            organizationId: parseInt(formData.get('organizationId')),
            year: parseInt(formData.get('year')),
            currencyId: parseInt(formData.get('currencyId')),
            fiscalYearStartMonth: parseInt(formData.get('fiscalYearStartMonth') || 1),
            depreciationMethod: formData.get('depreciationMethod') || null,
            inventoryValuationMethod: formData.get('inventoryValuationMethod') || null,
            revenueRecognitionMethod: formData.get('revenueRecognitionMethod') || null,
            vatAccountingMethod: formData.get('vatAccountingMethod') || null,
            notes: formData.get('notes') || null,
            isActive: formData.get('isActive') === 'on'
        };

        try {
            if (id) {
                await api.updateAccountingPolicy(id, data);
                utils.showToast('Accounting policy updated');
            } else {
                await api.createAccountingPolicy(data);
                utils.showToast('Accounting policy created');
            }
            utils.hideModal();
            modules['accounting-policies']();
        } catch (error) {
            if (error.message.includes('409') || error.message.includes('Conflict')) {
                utils.showToast('Accounting policy for this organization and year already exists', 'error');
            } else if (error.message.includes('404')) {
                utils.showToast('Organization or currency not found', 'error');
            } else {
                utils.showToast('Error: ' + error.message, 'error');
            }
        }
    },

    async deleteAccountingPolicy(id) {
        if (await utils.confirm('Delete accounting policy? This action cannot be undone.')) {
            try {
                await api.deleteAccountingPolicy(id);
                utils.showToast('Accounting policy deleted');
                modules['accounting-policies']();
            } catch (error) {
                utils.showToast('Error: ' + error.message, 'error');
            }
        }
    },

    async activateAccountingPolicy(id) {
        try {
            await api.activateAccountingPolicy(id);
            utils.showToast('Accounting policy activated');
            modules['accounting-policies']();
        } catch (error) {
            utils.showToast('Activation error: ' + error.message, 'error');
        }
    },

    async deactivateAccountingPolicy(id) {
        if (await utils.confirm('Deactivate accounting policy?')) {
            try {
                await api.deactivateAccountingPolicy(id);
                utils.showToast('Accounting policy deactivated');
                modules['accounting-policies']();
            } catch (error) {
                utils.showToast('Deactivation error: ' + error.message, 'error');
            }
        }
    }
});
