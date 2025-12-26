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
        document.getElementById('module-title').textContent = 'Організації';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <button class="btn btn-primary" onclick="modules.createOrganization()">
                    ➕ Нова організація
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Назва</th>
                            <th>Реєстр. номер</th>
                            <th>ПДВ номер</th>
                            <th>Країна</th>
                            <th>Email</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody id="organizations-tbody">
                        <tr><td colspan="6" class="text-center">Завантаження...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        try {
            const data = await api.getOrganizations();
            const tbody = document.getElementById('organizations-tbody');

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">Організацій не знайдено</td></tr>';
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
                        <button class="btn-icon" onclick="modules.editOrganization(${org.id})" title="Редагувати">✏️</button>
                        <button class="btn-icon" onclick="modules.deleteOrganization(${org.id})" title="Видалити">🗑️</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            utils.showToast('Помилка завантаження організацій: ' + error.message, 'error');
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
    }
});
