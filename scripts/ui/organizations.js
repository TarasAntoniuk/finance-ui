/**
 * Organizations Module
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Add Organizations methods
Object.assign(modules, {
    async organizations() {
        document.getElementById('module-title').textContent = 'Organizations';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <button class="btn btn-primary" onclick="modules.createOrganization()">
                    ➕ New Organization
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Registration Number</th>
                            <th>VAT Number</th>
                            <th>Country</th>
                            <th>Email</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="organizations-tbody">
                        <tr><td colspan="6" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        try {
            const data = await api.getOrganizations();
            const tbody = document.getElementById('organizations-tbody');

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">No organizations found</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(org => `
                <tr>
                    <td><strong>${org.name}</strong></td>
                    <td>${org.registrationNumber || '-'}</td>
                    <td>${org.vatNumber || '-'}</td>
                    <td>${org.country?.name || '-'}</td>
                    <td>${org.email || '-'}</td>
                    <td>
                        <button class="btn-icon" onclick="modules.editOrganization(${org.id})" title="Edit">✏️</button>
                        <button class="btn-icon" onclick="modules.deleteOrganization(${org.id})" title="Delete">🗑️</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            utils.showToast('Error loading organizations: ' + error.message, 'error');
        }
    },

    async createOrganization() {
        utils.showToast('Form under development', 'warning');
    },
    async editOrganization(id) {
        utils.showToast('Form under development', 'warning');
    },
    async deleteOrganization(id) {
        if (await utils.confirm('Delete organization?')) {
            try {
                await api.deleteOrganization(id);
                utils.showToast('Organization deleted');
                modules.organizations();
            } catch (error) {
                utils.showToast('Error: ' + error.message, 'error');
            }
        }
    }
});
