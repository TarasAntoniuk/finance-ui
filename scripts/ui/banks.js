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
        document.getElementById('module-title').textContent = 'Банки';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <button class="btn btn-primary" onclick="modules.createBank()">
                    ➕ Новий банк
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Назва</th>
                            <th>SWIFT</th>
                            <th>Країна</th>
                            <th>Телефон</th>
                            <th>Статус</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody id="banks-tbody">
                        <tr><td colspan="6" class="text-center">Завантаження...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        try {
            const data = await api.getBanks();
            const tbody = document.getElementById('banks-tbody');

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">Банків не знайдено</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(bank => `
                <tr>
                    <td><strong>${bank.name}</strong></td>
                    <td>${bank.swiftCode}</td>
                    <td>${bank.country?.name || '-'}</td>
                    <td>${bank.phoneNumber || '-'}</td>
                    <td><span class="badge badge-${bank.isActive ? 'active' : 'inactive'}">${bank.isActive ? 'Активний' : 'Неактивний'}</span></td>
                    <td>
                        <button class="btn-icon" onclick="modules.editBank(${bank.id})" title="Редагувати">✏️</button>
                        <button class="btn-icon" onclick="modules.deleteBank(${bank.id})" title="Видалити">🗑️</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            utils.showToast('Помилка завантаження банків: ' + error.message, 'error');
        }
    },

    async createBank() {
        utils.showToast('Форма в розробці', 'warning');
    },
    async editBank(id) {
        utils.showToast('Форма в розробці', 'warning');
    },
    async deleteBank(id) {
        if (await utils.confirm('Видалити банк?')) {
            try {
                await api.deleteBank(id);
                utils.showToast('Банк видалено');
                modules.banks();
            } catch (error) {
                utils.showToast('Помилка: ' + error.message, 'error');
            }
        }
    }
});
