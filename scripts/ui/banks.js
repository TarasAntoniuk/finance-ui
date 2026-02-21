/**
 * Banks Module
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Add Banks methods
Object.assign(modules, {
    async banks() {
        document.getElementById('module-title').textContent = 'Banks';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                ${auth.canWrite() ? `<button class="btn btn-primary" onclick="modules.createBank()">
                    ➕ New Bank
                </button>` : ''}
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>SWIFT</th>
                            <th>Country</th>
                            <th>Phone</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="banks-tbody">
                        <tr><td colspan="6" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        try {
            const data = await api.getBanks();
            const tbody = document.getElementById('banks-tbody');

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No banks found</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(bank => `
                <tr>
                    <td><strong>${bank.name}</strong></td>
                    <td>${bank.swiftCode}</td>
                    <td>${bank.country?.name || '-'}</td>
                    <td>${bank.phoneNumber || '-'}</td>
                    <td><span class="badge badge-${bank.isActive ? 'active' : 'inactive'}">${bank.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        ${auth.canWrite() ? `
                            <button class="btn-icon" onclick="modules.editBank(${bank.id})" title="Edit">✏️</button>
                            <button class="btn-icon" onclick="modules.deleteBank(${bank.id})" title="Delete">🗑️</button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            utils.showToast('Error loading banks: ' + error.message, 'error');
        }
    },

    async createBank() {
        utils.showToast('Form under development', 'warning');
    },
    async editBank(id) {
        utils.showToast('Form under development', 'warning');
    },
    async deleteBank(id) {
        if (await utils.confirm('Delete bank?')) {
            try {
                await api.deleteBank(id);
                utils.showToast('Bank deleted successfully');
                modules.banks();
            } catch (error) {
                utils.showToast('Error: ' + error.message, 'error');
            }
        }
    }
});
