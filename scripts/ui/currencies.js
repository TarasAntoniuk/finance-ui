/**
 * Currencies Module
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Add Currencies methods
Object.assign(modules, {
    async currencies() {
        document.getElementById('module-title').textContent = 'Currencies';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                ${auth.canWrite() ? `<button class="btn btn-primary" onclick="modules.createCurrency()">
                    ➕ New Currency
                </button>` : ''}
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Symbol</th>
                            <th>Numeric Code</th>
                            <th>Decimal Places</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="currencies-tbody">
                        <tr><td colspan="7" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        try {
            const data = await api.getCurrencies();
            const tbody = document.getElementById('currencies-tbody');

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No currencies found</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(curr => `
                <tr>
                    <td><strong>${curr.code}</strong></td>
                    <td>${curr.name}</td>
                    <td>${curr.symbol || '-'}</td>
                    <td>${curr.numericCode}</td>
                    <td>${curr.minorUnit}</td>
                    <td><span class="badge badge-${curr.isActive ? 'active' : 'inactive'}">${curr.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        ${auth.canWrite() ? `
                            <button class="btn-icon" onclick="modules.editCurrency(${curr.id})" title="Edit">✏️</button>
                            <button class="btn-icon" onclick="modules.deleteCurrency(${curr.id})" title="Delete">🗑️</button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            utils.showToast('Error loading currencies: ' + error.message, 'error');
        }
    },

    async createCurrency() {
        utils.showToast('Form under development', 'warning');
    },
    async editCurrency(id) {
        utils.showToast('Form under development', 'warning');
    },
    async deleteCurrency(id) {
        if (await utils.confirm('Delete currency?')) {
            try {
                await api.deleteCurrency(id);
                utils.showToast('Currency deleted successfully');
                modules.currencies();
            } catch (error) {
                utils.showToast('Error: ' + error.message, 'error');
            }
        }
    }
});
