/**
 * UI Helpers - Translation and Pagination functions
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Add helper functions to modules object
Object.assign(modules, {
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
});
