/**
 * Exchange Rates Module
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Store for exchange rates state
const exchangeRateState = {
    allRates: [],
    currentPage: 0,
    totalPages: 0,
    pageSize: 50
};

// Add Exchange Rates module
Object.assign(modules, {
    async 'exchange-rates'() {
        document.getElementById('module-title').textContent = 'Exchange Rates';
        const contentBody = document.getElementById('content-body');

        // Get today's date as default
        const today = new Date().toISOString().split('T')[0];

        contentBody.innerHTML = `
            <div class="action-bar">
                <div class="action-bar-left">
                    <button class="btn btn-primary" onclick="modules.createExchangeRate()">
                        ➕ New Exchange Rate
                    </button>
                    <button class="btn btn-secondary" onclick="modules.syncECBDaily()">
                        🔄 Sync Daily Rates
                    </button>
                    <button class="btn btn-secondary" onclick="modules.syncECBHistory()">
                        📥 Sync Historical Rates
                    </button>
                </div>
                <div class="action-bar-right">
                    <input type="date" id="rate-date-filter" value="${today}">
                    <button class="btn btn-primary" onclick="modules.filterByDate()">
                        🔍 Filter by Date
                    </button>
                    <button class="btn btn-secondary" onclick="modules.loadAllExchangeRates()">
                        📋 Show All
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>From Currency</th>
                            <th>To Currency</th>
                            <th>Rate</th>
                            <th>Source</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="exchange-rates-tbody">
                        <tr><td colspan="7" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div id="pagination-container" class="pagination"></div>
        `;

        try {
            await modules.loadAllExchangeRates();
        } catch (error) {
            utils.showToast('Error loading exchange rates: ' + error.message, 'error');
        }
    },

    async loadAllExchangeRates(page = 0) {
        try {
            const response = await api.getExchangeRates(page, exchangeRateState.pageSize);

            exchangeRateState.allRates = response.content || [];
            exchangeRateState.currentPage = response.currentPage || 0;
            exchangeRateState.totalPages = response.totalPages || 0;

            modules.renderExchangeRatesTable();
            modules.renderExchangeRatesPagination();
        } catch (error) {
            utils.showToast('Error loading exchange rates: ' + error.message, 'error');
        }
    },

    async filterByDate() {
        const date = document.getElementById('rate-date-filter').value;
        if (!date) {
            utils.showToast('Please select a date', 'warning');
            return;
        }

        try {
            const rates = await api.getExchangeRatesByDate(date);
            exchangeRateState.allRates = rates;
            exchangeRateState.currentPage = 0;
            exchangeRateState.totalPages = 1;

            modules.renderExchangeRatesTable();
            modules.renderExchangeRatesPagination();
        } catch (error) {
            utils.showToast('Error filtering by date: ' + error.message, 'error');
        }
    },

    renderExchangeRatesTable() {
        const tbody = document.getElementById('exchange-rates-tbody');
        const rates = exchangeRateState.allRates;

        if (!rates || rates.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No exchange rates found</td></tr>';
            return;
        }

        tbody.innerHTML = rates.map(rate => {
            const statusBadge = rate.isActive
                ? '<span class="badge badge-active">Active</span>'
                : '<span class="badge badge-inactive">Inactive</span>';

            const toggleAction = rate.isActive
                ? `<button class="btn-icon" onclick="modules.deactivateExchangeRate(${rate.id})" title="Deactivate">⏸️</button>`
                : `<button class="btn-icon" onclick="modules.activateExchangeRate(${rate.id})" title="Activate">▶️</button>`;

            return `
                <tr>
                    <td>${utils.formatDate(rate.exchangeDate)}</td>
                    <td><strong>${rate.currencyFrom?.code || '-'}</strong> ${rate.currencyFrom?.name || ''}</td>
                    <td><strong>${rate.currencyTo?.code || '-'}</strong> ${rate.currencyTo?.name || ''}</td>
                    <td class="text-right"><strong>${rate.rate.toFixed(6)}</strong></td>
                    <td>${rate.source || '-'}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn-icon" onclick="modules.viewExchangeRate(${rate.id})" title="View">👁️</button>
                        <button class="btn-icon" onclick="modules.editExchangeRate(${rate.id})" title="Edit">✏️</button>
                        ${toggleAction}
                        <button class="btn-icon" onclick="modules.deleteExchangeRate(${rate.id})" title="Delete">🗑️</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderExchangeRatesPagination() {
        const container = document.getElementById('pagination-container');
        if (!container || exchangeRateState.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        const { currentPage, totalPages } = exchangeRateState;
        const hasPrevious = currentPage > 0;
        const hasNext = currentPage < totalPages - 1;

        container.innerHTML = `
            <button ${!hasPrevious ? 'disabled' : ''} onclick="modules.loadAllExchangeRates(${currentPage - 1})">
                ◀ Previous
            </button>
            <span>Page ${currentPage + 1} of ${totalPages}</span>
            <button ${!hasNext ? 'disabled' : ''} onclick="modules.loadAllExchangeRates(${currentPage + 1})">
                Next ▶
            </button>
        `;
    },

    async createExchangeRate() {
        try {
            const currencies = await api.getCurrencies();
            const today = new Date().toISOString().split('T')[0];

            const formHtml = `
                <form id="exchange-rate-form" onsubmit="modules.submitExchangeRate(event)">
                    <div class="form-group">
                        <label>Exchange Date *</label>
                        <input type="date" name="exchangeDate" required value="${today}">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>From Currency *</label>
                            <select name="currencyFromId" required>
                                <option value="">Select currency</option>
                                ${currencies.filter(c => c.isActive).map(c => `<option value="${c.id}">${c.code} - ${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>To Currency *</label>
                            <select name="currencyToId" required>
                                <option value="">Select currency</option>
                                ${currencies.filter(c => c.isActive).map(c => `<option value="${c.id}">${c.code} - ${c.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Exchange Rate *</label>
                        <input type="number" name="rate" required min="0.000001" step="0.000001" placeholder="1.123456">
                        <small>Minimum value: 0.000001</small>
                    </div>

                    <div class="form-group">
                        <label>Source *</label>
                        <input type="text" name="source" required maxlength="100" placeholder="ECB, Manual, etc.">
                    </div>

                    <div class="form-group">
                        <label>Source URL</label>
                        <input type="url" name="sourceUrl" maxlength="500" placeholder="https://...">
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="isActive" checked>
                            Active
                        </label>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Create</button>
                    </div>
                </form>
            `;

            utils.showModal('New Exchange Rate', formHtml);
        } catch (error) {
            utils.showToast('Error loading form: ' + error.message, 'error');
        }
    },

    async editExchangeRate(id) {
        try {
            const [rate, currencies] = await Promise.all([
                api.getExchangeRateById(id),
                api.getCurrencies()
            ]);

            const formHtml = `
                <form id="exchange-rate-form" onsubmit="modules.submitExchangeRate(event, ${id})">
                    <div class="form-group">
                        <label>Exchange Date *</label>
                        <input type="date" name="exchangeDate" required value="${rate.exchangeDate}">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>From Currency *</label>
                            <select name="currencyFromId" required>
                                <option value="">Select currency</option>
                                ${currencies.map(c => `<option value="${c.id}" ${c.id === rate.currencyFrom?.id ? 'selected' : ''}>${c.code} - ${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>To Currency *</label>
                            <select name="currencyToId" required>
                                <option value="">Select currency</option>
                                ${currencies.map(c => `<option value="${c.id}" ${c.id === rate.currencyTo?.id ? 'selected' : ''}>${c.code} - ${c.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Exchange Rate *</label>
                        <input type="number" name="rate" required min="0.000001" step="0.000001" value="${rate.rate}">
                        <small>Minimum value: 0.000001</small>
                    </div>

                    <div class="form-group">
                        <label>Source *</label>
                        <input type="text" name="source" required maxlength="100" value="${rate.source || ''}">
                    </div>

                    <div class="form-group">
                        <label>Source URL</label>
                        <input type="url" name="sourceUrl" maxlength="500" value="${rate.sourceUrl || ''}">
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" name="isActive" ${rate.isActive ? 'checked' : ''}>
                            Active
                        </label>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save</button>
                    </div>
                </form>
            `;

            utils.showModal('Edit Exchange Rate', formHtml);
        } catch (error) {
            utils.showToast('Error loading exchange rate: ' + error.message, 'error');
        }
    },

    async viewExchangeRate(id) {
        try {
            const rate = await api.getExchangeRateById(id);

            const viewHtml = `
                <div class="rate-details">
                    <div class="detail-row">
                        <strong>Date:</strong> ${utils.formatDate(rate.exchangeDate)}
                    </div>
                    <div class="detail-row">
                        <strong>From Currency:</strong> ${rate.currencyFrom?.code} - ${rate.currencyFrom?.name}
                    </div>
                    <div class="detail-row">
                        <strong>To Currency:</strong> ${rate.currencyTo?.code} - ${rate.currencyTo?.name}
                    </div>
                    <div class="detail-row">
                        <strong>Exchange Rate:</strong> ${rate.rate.toFixed(6)}
                    </div>
                    <div class="detail-row">
                        <strong>Source:</strong> ${rate.source || '-'}
                    </div>
                    ${rate.sourceUrl ? `<div class="detail-row"><strong>Source URL:</strong> <a href="${rate.sourceUrl}" target="_blank">${rate.sourceUrl}</a></div>` : ''}
                    <div class="detail-row">
                        <strong>Status:</strong> ${rate.isActive ? '<span class="badge badge-active">Active</span>' : '<span class="badge badge-inactive">Inactive</span>'}
                    </div>
                    <div class="detail-row">
                        <strong>Created:</strong> ${utils.formatDateTime(rate.createdAt)}
                    </div>
                    ${rate.updatedAt ? `<div class="detail-row"><strong>Updated:</strong> ${utils.formatDateTime(rate.updatedAt)}</div>` : ''}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="utils.hideModal()">Close</button>
                    <button type="button" class="btn btn-primary" onclick="utils.hideModal(); modules.editExchangeRate(${id})">Edit</button>
                </div>
            `;

            utils.showModal('Exchange Rate Details', viewHtml);
        } catch (error) {
            utils.showToast('Error loading details: ' + error.message, 'error');
        }
    },

    async submitExchangeRate(event, id = null) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const data = {
            exchangeDate: formData.get('exchangeDate'),
            currencyFromId: parseInt(formData.get('currencyFromId')),
            currencyToId: parseInt(formData.get('currencyToId')),
            rate: parseFloat(formData.get('rate')),
            source: formData.get('source'),
            sourceUrl: formData.get('sourceUrl') || null,
            isActive: formData.get('isActive') === 'on'
        };

        // Validation
        if (data.currencyFromId === data.currencyToId) {
            utils.showToast('From and To currencies must be different', 'error');
            return;
        }

        if (data.rate < 0.000001) {
            utils.showToast('Rate must be at least 0.000001', 'error');
            return;
        }

        try {
            if (id) {
                await api.updateExchangeRate(id, data);
                utils.showToast('Exchange rate updated');
            } else {
                await api.createExchangeRate(data);
                utils.showToast('Exchange rate created');
            }
            utils.hideModal();
            modules['exchange-rates']();
        } catch (error) {
            utils.showToast('Error: ' + error.message, 'error');
        }
    },

    async deleteExchangeRate(id) {
        if (await utils.confirm('Delete exchange rate? This action cannot be undone.')) {
            try {
                await api.deleteExchangeRate(id);
                utils.showToast('Exchange rate deleted');
                modules['exchange-rates']();
            } catch (error) {
                utils.showToast('Error: ' + error.message, 'error');
            }
        }
    },

    async activateExchangeRate(id) {
        try {
            await api.activateExchangeRate(id);
            utils.showToast('Exchange rate activated');
            modules.loadAllExchangeRates(exchangeRateState.currentPage);
        } catch (error) {
            utils.showToast('Activation error: ' + error.message, 'error');
        }
    },

    async deactivateExchangeRate(id) {
        if (await utils.confirm('Deactivate exchange rate?')) {
            try {
                await api.deactivateExchangeRate(id);
                utils.showToast('Exchange rate deactivated');
                modules.loadAllExchangeRates(exchangeRateState.currentPage);
            } catch (error) {
                utils.showToast('Deactivation error: ' + error.message, 'error');
            }
        }
    },

    async syncECBDaily() {
        if (await utils.confirm('Sync daily ECB exchange rates? This will fetch the latest rates from European Central Bank.')) {
            try {
                utils.showToast('Syncing daily rates...', 'info');
                const result = await api.syncECBDaily();
                utils.showToast('Daily rates synced successfully');
                modules['exchange-rates']();
            } catch (error) {
                utils.showToast('Sync error: ' + error.message, 'error');
            }
        }
    },

    async syncECBHistory() {
        if (await utils.confirm('Sync historical ECB exchange rates? This may take several minutes and will fetch all available historical data.')) {
            try {
                utils.showToast('Syncing historical rates... This may take a while.', 'info');
                const result = await api.syncECBHistory();
                utils.showToast('Historical rates synced successfully');
                modules['exchange-rates']();
            } catch (error) {
                utils.showToast('Sync error: ' + error.message, 'error');
            }
        }
    }
});
