// Application State
const AppState = {
    currentModule: null,
    currentPage: 0,
    pageSize: 20,
    data: {}
};

// Utility Functions
const utils = {
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA');
    },

    formatDateTime(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('uk-UA');
    },

    formatNumber(number, decimals = 2) {
        if (number === null || number === undefined) return '-';
        return Number(number).toFixed(decimals);
    },

    formatCurrency(amount, currencySymbol = '') {
        if (amount === null || amount === undefined) return '-';
        const formatted = Number(amount).toFixed(2);
        return currencySymbol ? `${formatted} ${currencySymbol}` : formatted;
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    showModal(title, content) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        modalTitle.textContent = title;
        modalBody.innerHTML = content;
        modal.classList.add('active');
    },

    hideModal() {
        const modal = document.getElementById('modal');
        modal.classList.remove('active');
    },

    async confirm(message) {
        return new Promise((resolve) => {
            const content = `
                <p>${message}</p>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="utils.hideModal(); window.confirmResult(false);">Скасувати</button>
                    <button class="btn btn-danger" onclick="utils.hideModal(); window.confirmResult(true);">Підтвердити</button>
                </div>
            `;
            utils.showModal('Підтвердження', content);
            window.confirmResult = resolve;
        });
    }
};

// Module Renderers
const modules = {
    async 'bank-payments'() {
        document.getElementById('module-title').textContent = 'Bank Payments';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <div class="action-bar-left">
                    <button class="btn btn-primary" onclick="modules.createBankPayment()">
                        ➕ New Payment
                    </button>
                </div>
                <div class="action-bar-right">
                    <select id="status-filter" onchange="modules['bank-payments']()">
                        <option value="">All Statuses</option>
                        <option value="DRAFT">Draft</option>
                        <option value="POSTED">Posted</option>
                    </select>
                </div>
            </div>
            <div class="table-container">
                <table id="payments-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Counterparty</th>
                            <th>Amount</th>
                            <th>Currency</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="payments-tbody">
                        <tr><td colspan="7" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" id="payments-pagination"></div>
        `;

        try {
            const statusFilter = document.getElementById('status-filter')?.value;
            let data;
            
            if (statusFilter) {
                data = await api.getBankPaymentsByStatus(statusFilter, AppState.currentPage, AppState.pageSize);
            } else {
                data = await api.getBankPayments(AppState.currentPage, AppState.pageSize);
            }

            const tbody = document.getElementById('payments-tbody');
            
            if (data.content.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No payments found</td></tr>';
                return;
            }

            tbody.innerHTML = data.content.map(payment => `
                <tr>
                    <td>${utils.formatDate(payment.transactionDateTime)}</td>
                    <td>${modules.translatePaymentType(payment.paymentType)}</td>
                    <td>${payment.counterparty?.name || '-'}</td>
                    <td class="text-right">${utils.formatNumber(payment.amount)}</td>
                    <td>${payment.currency?.code || '-'}</td>
                    <td><span class="badge badge-${payment.status.toLowerCase()}">${modules.translateStatus(payment.status)}</span></td>
                    <td>
                        <button class="btn-icon" onclick="modules.viewBankPayment(${payment.id})" title="View">👁️</button>
                        ${payment.status === 'DRAFT' ? `
                            <button class="btn-icon" onclick="modules.editBankPayment(${payment.id})" title="Edit">✏️</button>
                            <button class="btn-icon" onclick="modules.postBankPayment(${payment.id})" title="Post">✅</button>
                            <button class="btn-icon" onclick="modules.deleteBankPayment(${payment.id})" title="Delete">🗑️</button>
                        ` : ''}
                        ${payment.status === 'POSTED' ? `
                            <button class="btn-icon" onclick="modules.unpostBankPayment(${payment.id})" title="Unpost">↩️</button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');

            modules.renderPagination('payments-pagination', data.metadata, () => modules['bank-payments']());
        } catch (error) {
            utils.showToast('Error loading payments: ' + error.message, 'error');
            document.getElementById('payments-tbody').innerHTML = '<tr><td colspan="7" class="text-center">Loading error</td></tr>';
        }
    },

    async 'bank-receipts'() {
        document.getElementById('module-title').textContent = 'Банківські надходження';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <div class="action-bar-left">
                    <button class="btn btn-primary" onclick="modules.createBankReceipt()">
                        ➕ Нове надходження
                    </button>
                </div>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Дата</th>
                            <th>Тип</th>
                            <th>Контрагент</th>
                            <th>Сума</th>
                            <th>Валюта</th>
                            <th>Статус</th>
                            <th>Дії</th>
                        </tr>
                    </thead>
                    <tbody id="receipts-tbody">
                        <tr><td colspan="7" class="text-center">Завантаження...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" id="receipts-pagination"></div>
        `;

        try {
            const data = await api.getBankReceipts(AppState.currentPage, AppState.pageSize);
            const tbody = document.getElementById('receipts-tbody');
            
            if (data.content.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">Надходжень не знайдено</td></tr>';
                return;
            }

            tbody.innerHTML = data.content.map(receipt => `
                <tr>
                    <td>${utils.formatDate(receipt.transactionDateTime)}</td>
                    <td>${modules.translateReceiptType(receipt.receiptType)}</td>
                    <td>${receipt.counterparty?.name || '-'}</td>
                    <td class="text-right">${utils.formatNumber(receipt.amount)}</td>
                    <td>${receipt.currency?.code || '-'}</td>
                    <td><span class="badge badge-${receipt.status.toLowerCase()}">${modules.translateStatus(receipt.status)}</span></td>
                    <td>
                        <button class="btn-icon" onclick="modules.viewBankReceipt(${receipt.id})" title="Переглянути">👁️</button>
                        ${receipt.status === 'DRAFT' ? `
                            <button class="btn-icon" onclick="modules.editBankReceipt(${receipt.id})" title="Редагувати">✏️</button>
                            <button class="btn-icon" onclick="modules.postBankReceipt(${receipt.id})" title="Провести">✅</button>
                            <button class="btn-icon" onclick="modules.deleteBankReceipt(${receipt.id})" title="Видалити">🗑️</button>
                        ` : ''}
                        ${receipt.status === 'POSTED' ? `
                            <button class="btn-icon" onclick="modules.unpostBankReceipt(${receipt.id})" title="Скасувати проведення">↩️</button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');

            modules.renderPagination('receipts-pagination', data.metadata, () => modules['bank-receipts']());
        } catch (error) {
            utils.showToast('Помилка завантаження надходжень: ' + error.message, 'error');
        }
    },

    async 'bank-accounts'() {
        document.getElementById('module-title').textContent = 'Bank Accounts';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <button class="btn btn-primary" onclick="modules.createBankAccount()">
                    ➕ New Bank Account
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Account Number</th>
                            <th>Bank</th>
                            <th>Currency</th>
                            <th>Holder Type</th>
                            <th>Holder</th>
                            <th>Status</th>
                            <th>Default</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="accounts-tbody">
                        <tr><td colspan="8" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        try {
            // Load accounts, organizations and counterparties in parallel
            const [accounts, organizations, counterparties] = await Promise.all([
                api.getBankAccounts(),
                api.getOrganizations(),
                api.getCounterparties(0, 1000)
            ]);

            const tbody = document.getElementById('accounts-tbody');

            if (accounts.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center">No bank accounts found</td></tr>';
                return;
            }

            // Create lookup maps for quick access
            const orgMap = {};
            organizations.forEach(org => {
                orgMap[org.id] = org;
            });

            const cpMap = {};
            counterparties.content.forEach(cp => {
                cpMap[cp.id] = cp;
            });

            tbody.innerHTML = accounts.map(account => {
                // Get holder name based on holder type
                let holderName = '-';
                if (account.holderType === 'ORGANIZATION' && orgMap[account.holderId]) {
                    holderName = orgMap[account.holderId].name;
                } else if (account.holderType === 'COUNTERPARTY' && cpMap[account.holderId]) {
                    holderName = cpMap[account.holderId].name;
                }

                return `
                    <tr>
                        <td><strong>${account.accountNumber}</strong>${account.accountName ? '<br><small>' + account.accountName + '</small>' : ''}</td>
                        <td>${account.bank?.name || '-'}<br><small>${account.bank?.swiftCode || ''}</small></td>
                        <td>${account.currency?.code || '-'}</td>
                        <td>${account.holderType === 'ORGANIZATION' ? '🏢 Organization' : '🤝 Counterparty'}</td>
                        <td><strong>${holderName}</strong></td>
                        <td><span class="badge badge-${account.status.toLowerCase()}">${modules.translateAccountStatus(account.status)}</span></td>
                        <td>${account.isDefault ? '⭐' : ''}</td>
                        <td>
                            <button class="btn-icon" onclick="modules.viewBankAccount(${account.id})" title="View">👁️</button>
                            <button class="btn-icon" onclick="modules.editBankAccount(${account.id})" title="Edit">✏️</button>
                            <button class="btn-icon" onclick="modules.deleteBankAccount(${account.id})" title="Delete">🗑️</button>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            utils.showToast('Error loading bank accounts: ' + error.message, 'error');
        }
    },

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

    async counterparties() {
        document.getElementById('module-title').textContent = 'Counterparties';
        const contentBody = document.getElementById('content-body');

        contentBody.innerHTML = `
            <div class="action-bar">
                <button class="btn btn-primary" onclick="modules.createCounterparty()">
                    ➕ New Counterparty
                </button>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Code</th>
                            <th>Type</th>
                            <th>Country</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="counterparties-tbody">
                        <tr><td colspan="7" class="text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" id="counterparties-pagination"></div>
        `;

        try {
            const data = await api.getCounterparties(AppState.currentPage, AppState.pageSize);
            const tbody = document.getElementById('counterparties-tbody');

            if (data.content.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">No counterparties found</td></tr>';
                return;
            }

            tbody.innerHTML = data.content.map(cp => `
                <tr>
                    <td><strong>${cp.name}</strong></td>
                    <td>${cp.code}</td>
                    <td>${modules.translateCounterpartyType(cp.type)}</td>
                    <td>${cp.country?.name || '-'}</td>
                    <td>${cp.email || '-'}</td>
                    <td><span class="badge badge-${cp.isActive ? 'active' : 'inactive'}">${cp.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td>
                        <button class="btn-icon" onclick="modules.viewCounterparty(${cp.id})" title="View">👁️</button>
                        <button class="btn-icon" onclick="modules.editCounterparty(${cp.id})" title="Edit">✏️</button>
                        <button class="btn-icon" onclick="modules.deleteCounterparty(${cp.id})" title="Delete">🗑️</button>
                    </td>
                </tr>
            `).join('');

            modules.renderPagination('counterparties-pagination', data.metadata, () => modules.counterparties());
        } catch (error) {
            utils.showToast('Error loading counterparties: ' + error.message, 'error');
        }
    },

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

    // Helper functions for translations
    translateStatus(status) {
        const translations = {
            'DRAFT': 'Чернетка',
            'POSTED': 'Проведено',
            'CANCELLED': 'Скасовано'
        };
        return translations[status] || status;
    },

    translatePaymentType(type) {
        const translations = {
            'SUPPLIER_PAYMENT': 'Оплата постачальнику',
            'SALARY': 'Зарплата',
            'TAX_PAYMENT': 'Податковий платіж',
            'LOAN_REPAYMENT': 'Погашення кредиту',
            'CONTRACTOR_PAYMENT': 'Оплата підряднику',
            'UTILITY_PAYMENT': 'Комунальні послуги',
            'RENT': 'Оренда',
            'REFUND': 'Повернення',
            'INTERNAL_TRANSFER': 'Внутрішній переказ',
            'OTHER': 'Інше'
        };
        return translations[type] || type;
    },

    translateReceiptType(type) {
        const translations = {
            'CUSTOMER_PAYMENT': 'Оплата від клієнта',
            'LOAN_RECEIVED': 'Отриманий кредит',
            'INVESTMENT': 'Інвестиція',
            'REFUND': 'Повернення',
            'INTEREST_INCOME': 'Відсотковий дохід',
            'INTERNAL_TRANSFER': 'Внутрішній переказ',
            'OTHER_INCOME': 'Інший дохід'
        };
        return translations[type] || type;
    },

    translateAccountStatus(status) {
        const translations = {
            'ACTIVE': 'Активний',
            'INACTIVE': 'Неактивний',
            'CLOSED': 'Закритий'
        };
        return translations[status] || status;
    },

    translateCounterpartyType(type) {
        const translations = {
            'CUSTOMER': 'Клієнт',
            'SUPPLIER': 'Постачальник',
            'BOTH': 'Клієнт та постачальник'
        };
        return translations[type] || type;
    },

    renderPagination(elementId, metadata, onPageChange) {
        const container = document.getElementById(elementId);
        if (!container || !metadata) return;

        const { currentPage, totalPages, hasNext, hasPrevious } = metadata;

        container.innerHTML = `
            <button ${!hasPrevious ? 'disabled' : ''} onclick="AppState.currentPage = ${currentPage - 1}; ${onPageChange.toString()}()">
                ◀ Попередня
            </button>
            <span>Сторінка ${currentPage + 1} з ${totalPages}</span>
            <button ${!hasNext ? 'disabled' : ''} onclick="AppState.currentPage = ${currentPage + 1}; ${onPageChange.toString()}()">
                Наступна ▶
            </button>
        `;
    }
};

// Initialize App
async function initApp() {
    // Check API connection
    const statusDot = document.getElementById('api-status-dot');
    const statusText = document.getElementById('api-status-text');

    try {
        const connected = await api.checkConnection();
        if (connected) {
            statusDot.classList.add('connected');
            statusText.textContent = 'Connected';

            // Load quick stats
            loadQuickStats();
        } else {
            statusDot.classList.add('error');
            statusText.textContent = 'Connection Error';
        }
    } catch (error) {
        statusDot.classList.add('error');
        statusText.textContent = 'Not Connected';
    }

    // Setup collapsible navigation groups
    setupNavigationGroups();

    // Setup navigation items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const module = e.currentTarget.dataset.module;
            if (module && modules[module]) {
                // Reset pagination
                AppState.currentPage = 0;

                // Update active state
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                e.currentTarget.classList.add('active');

                // Load module
                AppState.currentModule = module;
                modules[module]();
            }
        });
    });

    // Setup modal close
    document.getElementById('modal-close').addEventListener('click', utils.hideModal);
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') {
            utils.hideModal();
        }
    });

    // Setup refresh button
    document.getElementById('refresh-btn').addEventListener('click', () => {
        if (AppState.currentModule && modules[AppState.currentModule]) {
            modules[AppState.currentModule]();
        }
    });
}

// Setup collapsible navigation groups
function setupNavigationGroups() {
    const groupHeaders = document.querySelectorAll('.nav-group-header');
    const subgroupHeaders = document.querySelectorAll('.nav-subgroup-header');

    // Load saved group states from localStorage
    const savedStates = JSON.parse(localStorage.getItem('navGroupStates') || '{}');

    // Setup main groups
    groupHeaders.forEach(header => {
        const groupName = header.dataset.group;
        const groupContent = document.querySelector(`[data-group-content="${groupName}"]`);

        // Default to collapsed if no saved state exists
        const shouldBeExpanded = savedStates[groupName] === true;

        if (!shouldBeExpanded) {
            header.classList.add('collapsed');
            groupContent.classList.add('collapsed');
        }

        // Add click handler
        header.addEventListener('click', () => {
            const isCurrentlyCollapsed = header.classList.contains('collapsed');

            header.classList.toggle('collapsed');
            groupContent.classList.toggle('collapsed');

            savedStates[groupName] = isCurrentlyCollapsed;
            localStorage.setItem('navGroupStates', JSON.stringify(savedStates));
        });
    });

    // Setup subgroups
    subgroupHeaders.forEach(header => {
        const subgroupName = header.dataset.subgroup;
        const subgroupContent = document.querySelector(`[data-subgroup-content="${subgroupName}"]`);

        // Default to collapsed if no saved state exists
        const shouldBeExpanded = savedStates[`sub_${subgroupName}`] === true;

        if (!shouldBeExpanded) {
            header.classList.add('collapsed');
            subgroupContent.classList.add('collapsed');
        }

        // Add click handler
        header.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent parent group from toggling
            const isCurrentlyCollapsed = header.classList.contains('collapsed');

            header.classList.toggle('collapsed');
            subgroupContent.classList.toggle('collapsed');

            savedStates[`sub_${subgroupName}`] = isCurrentlyCollapsed;
            localStorage.setItem('navGroupStates', JSON.stringify(savedStates));
        });
    });
}

async function loadQuickStats() {
    try {
        const [accounts, counterparties, organizations] = await Promise.all([
            api.getBankAccounts(),
            api.getCounterparties(0, 1),
            api.getOrganizations()
        ]);

        document.getElementById('accounts-count').textContent = accounts.length;
        document.getElementById('counterparties-count').textContent = counterparties.metadata?.totalElements || 0;
        document.getElementById('organizations-count').textContent = organizations.length;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);