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
        document.getElementById('module-title').textContent = 'Валюти';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <button class="btn btn-primary" onclick="modules.createCurrency()">
                    ➕ Нова валюта
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Код</th>
                            <th>Назва</th>
                            <th>Символ</th>
                            <th>Числовий код</th>
                            <th>Десяткових знаків</th>
                            <th>Статус</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody id="currencies-tbody">
                        <tr><td colspan="7" class="text-center">Завантаження...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        try {
            const data = await api.getCurrencies();
            const tbody = document.getElementById('currencies-tbody');

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">Валют не знайдено</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(curr => `
                <tr>
                    <td><strong>${curr.code}</strong></td>
                    <td>${curr.name}</td>
                    <td>${curr.symbol || '-'}</td>
                    <td>${curr.numericCode}</td>
                    <td>${curr.minorUnit}</td>
                    <td><span class="badge badge-${curr.isActive ? 'active' : 'inactive'}">${curr.isActive ? 'Активна' : 'Неактивна'}</span></td>
                    <td>
                        <button class="btn-icon" onclick="modules.editCurrency(${curr.id})" title="Редагувати">✏️</button>
                        <button class="btn-icon" onclick="modules.deleteCurrency(${curr.id})" title="Видалити">🗑️</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            utils.showToast('Помилка завантаження валют: ' + error.message, 'error');
        }
    },

    async createCurrency() {
        utils.showToast('Форма в розробці', 'warning');
    },
    async editCurrency(id) {
        utils.showToast('Форма в розробці', 'warning');
    },
    async deleteCurrency(id) {
        if (await utils.confirm('Видалити валюту?')) {
            try {
                await api.deleteCurrency(id);
                utils.showToast('Валюту видалено');
                modules.currencies();
            } catch (error) {
                utils.showToast('Помилка: ' + error.message, 'error');
            }
        }
    }
});
