/**
 * Countries Module
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Add Countries methods
Object.assign(modules, {
    async countries() {
        document.getElementById('module-title').textContent = 'Countries';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <button class="btn btn-primary" onclick="modules.createCountry()">
                    ➕ New Country
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>ISO Code</th>
                            <th>Phone Code</th>
                            <th>Currency</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="countries-tbody">
                        <tr><td colspan="5" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        try {
            const data = await api.getCountries();
            const tbody = document.getElementById('countries-tbody');

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">No countries found</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(country => `
                <tr>
                    <td><strong>${country.name}</strong></td>
                    <td>${country.isoCode}</td>
                    <td>${country.phoneCode || '-'}</td>
                    <td>${country.currency?.code || '-'}</td>
                    <td>
                        <button class="btn-icon" onclick="modules.editCountry(${country.id})" title="Edit">✏️</button>
                        <button class="btn-icon" onclick="modules.deleteCountry(${country.id})" title="Delete">🗑️</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            utils.showToast('Error loading countries: ' + error.message, 'error');
        }
    },

    async createCountry() {
        utils.showToast('Form under development', 'warning');
    },
    async editCountry(id) {
        utils.showToast('Form under development', 'warning');
    },
    async deleteCountry(id) {
        if (await utils.confirm('Delete country?')) {
            try {
                await api.deleteCountry(id);
                utils.showToast('Country deleted successfully');
                modules.countries();
            } catch (error) {
                utils.showToast('Error: ' + error.message, 'error');
            }
        }
    }
});
