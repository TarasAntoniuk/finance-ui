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
        document.getElementById('module-title').textContent = 'Країни';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <button class="btn btn-primary" onclick="modules.createCountry()">
                    ➕ Нова країна
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Назва</th>
                            <th>ISO код</th>
                            <th>Телефонний код</th>
                            <th>Валюта</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody id="countries-tbody">
                        <tr><td colspan="5" class="text-center">Завантаження...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        try {
            const data = await api.getCountries();
            const tbody = document.getElementById('countries-tbody');

            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">Країн не знайдено</td></tr>';
                return;
            }

            tbody.innerHTML = data.map(country => `
                <tr>
                    <td><strong>${country.name}</strong></td>
                    <td>${country.isoCode}</td>
                    <td>${country.phoneCode || '-'}</td>
                    <td>${country.currency?.code || '-'}</td>
                    <td>
                        <button class="btn-icon" onclick="modules.editCountry(${country.id})" title="Редагувати">✏️</button>
                        <button class="btn-icon" onclick="modules.deleteCountry(${country.id})" title="Видалити">🗑️</button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            utils.showToast('Помилка завантаження країн: ' + error.message, 'error');
        }
    },

    async createCountry() {
        utils.showToast('Форма в розробці', 'warning');
    },
    async editCountry(id) {
        utils.showToast('Форма в розробці', 'warning');
    },
    async deleteCountry(id) {
        if (await utils.confirm('Видалити країну?')) {
            try {
                await api.deleteCountry(id);
                utils.showToast('Країну видалено');
                modules.countries();
            } catch (error) {
                utils.showToast('Помилка: ' + error.message, 'error');
            }
        }
    }
});
