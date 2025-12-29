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
        document.getElementById('module-title').textContent = 'Облікові політики';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <div class="action-bar-left">
                    <button class="btn btn-primary" onclick="modules.createAccountingPolicy()">
                        ➕ Нова облікова політика
                    </button>
                </div>
                <div class="action-bar-right">
                    <select id="policy-org-filter" onchange="modules.filterAccountingPolicies()">
                        <option value="">Усі організації</option>
                    </select>
                    <input type="number" id="policy-year-filter" placeholder="Рік"
                           min="1900" max="2100" style="width: 100px;"
                           onchange="modules.filterAccountingPolicies()">
                    <select id="policy-status-filter" onchange="modules.filterAccountingPolicies()">
                        <option value="">Усі статуси</option>
                        <option value="active">Активні</option>
                        <option value="inactive">Неактивні</option>
                    </select>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Організація</th>
                            <th>Рік</th>
                            <th>Валюта</th>
                            <th>Початок фін. року</th>
                            <th>Статус</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody id="policies-tbody">
                        <tr><td colspan="6" class="text-center">Завантаження...</td></tr>
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
            utils.showToast('Помилка завантаження облікових політик: ' + error.message, 'error');
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
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Облікові політики не знайдено</td></tr>';
            return;
        }

        const monthNames = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
                           'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];

        tbody.innerHTML = policies.map(policy => {
            const monthName = policy.fiscalYearStartMonth ? monthNames[policy.fiscalYearStartMonth - 1] : 'Січень';
            const statusBadge = policy.isActive
                ? '<span class="badge badge-active">Активна</span>'
                : '<span class="badge badge-inactive">Неактивна</span>';

            const toggleAction = policy.isActive
                ? `<button class="btn-icon" onclick="modules.deactivateAccountingPolicy(${policy.id})" title="Деактивувати">⏸️</button>`
                : `<button class="btn-icon" onclick="modules.activateAccountingPolicy(${policy.id})" title="Активувати">▶️</button>`;

            return `
                <tr>
                    <td><strong>${policy.organizationName}</strong></td>
                    <td>${policy.year}</td>
                    <td>${policy.currencyCode}</td>
                    <td>${monthName} (${policy.fiscalYearStartMonth || 1})</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn-icon" onclick="modules.viewAccountingPolicy(${policy.id})" title="Переглянути">👁️</button>
                        <button class="btn-icon" onclick="modules.editAccountingPolicy(${policy.id})" title="Редагувати">✏️</button>
                        ${toggleAction}
                        <button class="btn-icon" onclick="modules.deleteAccountingPolicy(${policy.id})" title="Видалити">🗑️</button>
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
                        <label>Організація *</label>
                        <select name="organizationId" required>
                            <option value="">Оберіть організацію</option>
                            ${organizations.map(org => `<option value="${org.id}">${org.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Рік *</label>
                            <input type="number" name="year" required min="1900" max="2100"
                                   placeholder="2024" value="${new Date().getFullYear()}">
                        </div>
                        <div class="form-group">
                            <label>Валюта *</label>
                            <select name="currencyId" required>
                                <option value="">Оберіть валюту</option>
                                ${currencies.filter(c => c.isActive).map(c => `<option value="${c.id}">${c.code} - ${c.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Початок фінансового року (місяць)</label>
                        <select name="fiscalYearStartMonth">
                            <option value="1">Січень</option>
                            <option value="2">Лютий</option>
                            <option value="3">Березень</option>
                            <option value="4">Квітень</option>
                            <option value="5">Травень</option>
                            <option value="6">Червень</option>
                            <option value="7">Липень</option>
                            <option value="8">Серпень</option>
                            <option value="9">Вересень</option>
                            <option value="10">Жовтень</option>
                            <option value="11">Листопад</option>
                            <option value="12">Грудень</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Метод амортизації</label>
                        <input type="text" name="depreciationMethod" maxlength="50" placeholder="Прямолінійний">
                    </div>

                    <div class="form-group">
                        <label>Метод оцінки запасів</label>
                        <input type="text" name="inventoryValuationMethod" maxlength="50" placeholder="FIFO">
                    </div>

                    <div class="form-group">
                        <label>Метод визнання доходу</label>
                        <input type="text" name="revenueRecognitionMethod" maxlength="50" placeholder="Нарахування">
                    </div>

                    <div class="form-group">
                        <label>Метод обліку ПДВ</label>
                        <input type="text" name="vatAccountingMethod" maxlength="50" placeholder="За рахунком-фактурою">
                    </div>

                    <div class="form-group">
                        <label>Примітки</label>
                        <textarea name="notes" rows="3" placeholder="Додаткова інформація..."></textarea>
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="isActive" checked>
                            Активна політика
                        </label>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Скасувати</button>
                        <button type="submit" class="btn btn-primary">Створити</button>
                    </div>
                </form>
            `;

            utils.showModal('Нова облікова політика', formHtml);
        } catch (error) {
            utils.showToast('Помилка завантаження форми: ' + error.message, 'error');
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
                        <label>Організація *</label>
                        <select name="organizationId" required>
                            <option value="">Оберіть організацію</option>
                            ${organizations.map(org => `<option value="${org.id}" ${org.id === policy.organization?.id ? 'selected' : ''}>${org.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Рік *</label>
                            <input type="number" name="year" required min="1900" max="2100" value="${policy.year}">
                        </div>
                        <div class="form-group">
                            <label>Валюта *</label>
                            <select name="currencyId" required>
                                <option value="">Оберіть валюту</option>
                                ${currencies.map(c => `<option value="${c.id}" ${c.id === policy.currency?.id ? 'selected' : ''}>${c.code} - ${c.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Початок фінансового року (місяць)</label>
                        <select name="fiscalYearStartMonth">
                            ${[1,2,3,4,5,6,7,8,9,10,11,12].map(month => {
                                const months = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
                                              'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
                                return `<option value="${month}" ${month === policy.fiscalYearStartMonth ? 'selected' : ''}>${months[month-1]}</option>`;
                            }).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Метод амортизації</label>
                        <input type="text" name="depreciationMethod" maxlength="50" value="${policy.depreciationMethod || ''}">
                    </div>

                    <div class="form-group">
                        <label>Метод оцінки запасів</label>
                        <input type="text" name="inventoryValuationMethod" maxlength="50" value="${policy.inventoryValuationMethod || ''}">
                    </div>

                    <div class="form-group">
                        <label>Метод визнання доходу</label>
                        <input type="text" name="revenueRecognitionMethod" maxlength="50" value="${policy.revenueRecognitionMethod || ''}">
                    </div>

                    <div class="form-group">
                        <label>Метод обліку ПДВ</label>
                        <input type="text" name="vatAccountingMethod" maxlength="50" value="${policy.vatAccountingMethod || ''}">
                    </div>

                    <div class="form-group">
                        <label>Примітки</label>
                        <textarea name="notes" rows="3">${policy.notes || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="isActive" ${policy.isActive ? 'checked' : ''}>
                            Активна політика
                        </label>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Скасувати</button>
                        <button type="submit" class="btn btn-primary">Зберегти</button>
                    </div>
                </form>
            `;

            utils.showModal('Редагувати облікову політику', formHtml);
        } catch (error) {
            utils.showToast('Помилка завантаження політики: ' + error.message, 'error');
        }
    },

    async viewAccountingPolicy(id) {
        try {
            const policy = await api.getAccountingPolicyById(id);

            const monthNames = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
                               'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];
            const monthName = policy.fiscalYearStartMonth ? monthNames[policy.fiscalYearStartMonth - 1] : 'Січень';

            const viewHtml = `
                <div class="policy-details">
                    <div class="detail-row">
                        <strong>Організація:</strong> ${policy.organization?.name || 'Unknown'}
                    </div>
                    <div class="detail-row">
                        <strong>Рік:</strong> ${policy.year}
                    </div>
                    <div class="detail-row">
                        <strong>Валюта:</strong> ${policy.currency?.code || 'Unknown'}
                    </div>
                    <div class="detail-row">
                        <strong>Початок фінансового року:</strong> ${monthName} (${policy.fiscalYearStartMonth || 1})
                    </div>
                    <div class="detail-row">
                        <strong>Метод амортизації:</strong> ${policy.depreciationMethod || '-'}
                    </div>
                    <div class="detail-row">
                        <strong>Метод оцінки запасів:</strong> ${policy.inventoryValuationMethod || '-'}
                    </div>
                    <div class="detail-row">
                        <strong>Метод визнання доходу:</strong> ${policy.revenueRecognitionMethod || '-'}
                    </div>
                    <div class="detail-row">
                        <strong>Метод обліку ПДВ:</strong> ${policy.vatAccountingMethod || '-'}
                    </div>
                    <div class="detail-row">
                        <strong>Статус:</strong> ${policy.isActive ? '<span class="badge badge-active">Активна</span>' : '<span class="badge badge-inactive">Неактивна</span>'}
                    </div>
                    ${policy.notes ? `<div class="detail-row"><strong>Примітки:</strong><br>${policy.notes}</div>` : ''}
                    <div class="detail-row">
                        <strong>Створено:</strong> ${utils.formatDateTime(policy.createdAt)}
                    </div>
                    ${policy.updatedAt ? `<div class="detail-row"><strong>Оновлено:</strong> ${utils.formatDateTime(policy.updatedAt)}</div>` : ''}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Закрити</button>
                    <button type="button" class="btn btn-primary" onclick="utils.hideModal(); modules.editAccountingPolicy(${id})">Редагувати</button>
                </div>
            `;

            utils.showModal('Деталі облікової політики', viewHtml);
        } catch (error) {
            utils.showToast('Помилка завантаження деталей: ' + error.message, 'error');
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
                utils.showToast('Облікову політику оновлено');
            } else {
                await api.createAccountingPolicy(data);
                utils.showToast('Облікову політику створено');
            }
            utils.hideModal();
            modules['accounting-policies']();
        } catch (error) {
            if (error.message.includes('409') || error.message.includes('Conflict')) {
                utils.showToast('Облікова політика для цієї організації та року вже існує', 'error');
            } else if (error.message.includes('404')) {
                utils.showToast('Організацію або валюту не знайдено', 'error');
            } else {
                utils.showToast('Помилка: ' + error.message, 'error');
            }
        }
    },

    async deleteAccountingPolicy(id) {
        if (await utils.confirm('Видалити облікову політику? Цю дію не можна скасувати.')) {
            try {
                await api.deleteAccountingPolicy(id);
                utils.showToast('Облікову політику видалено');
                modules['accounting-policies']();
            } catch (error) {
                utils.showToast('Помилка: ' + error.message, 'error');
            }
        }
    },

    async activateAccountingPolicy(id) {
        try {
            await api.activateAccountingPolicy(id);
            utils.showToast('Облікову політику активовано');
            modules['accounting-policies']();
        } catch (error) {
            utils.showToast('Помилка активації: ' + error.message, 'error');
        }
    },

    async deactivateAccountingPolicy(id) {
        if (await utils.confirm('Деактивувати облікову політику?')) {
            try {
                await api.deactivateAccountingPolicy(id);
                utils.showToast('Облікову політику деактивовано');
                modules['accounting-policies']();
            } catch (error) {
                utils.showToast('Помилка деактивації: ' + error.message, 'error');
            }
        }
    }
});
