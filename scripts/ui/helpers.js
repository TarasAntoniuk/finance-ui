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
            'DRAFT': 'Draft',
            'POSTED': 'Posted',
            'CANCELLED': 'Cancelled'
        };
        return translations[status] || status;
    },

    translatePaymentType(type) {
        const translations = {
            'SUPPLIER_PAYMENT': 'Supplier Payment',
            'SALARY': 'Salary',
            'TAX_PAYMENT': 'Tax Payment',
            'LOAN_REPAYMENT': 'Loan Repayment',
            'CONTRACTOR_PAYMENT': 'Contractor Payment',
            'UTILITY_PAYMENT': 'Utility Payment',
            'RENT': 'Rent',
            'REFUND': 'Refund',
            'INTERNAL_TRANSFER': 'Internal Transfer',
            'OTHER': 'Other'
        };
        return translations[type] || type;
    },

    translateReceiptType(type) {
        const translations = {
            'CUSTOMER_PAYMENT': 'Customer Payment',
            'LOAN_RECEIVED': 'Loan Received',
            'INVESTMENT': 'Investment',
            'REFUND': 'Refund',
            'INTEREST_INCOME': 'Interest Income',
            'INTERNAL_TRANSFER': 'Internal Transfer',
            'OTHER_INCOME': 'Other Income'
        };
        return translations[type] || type;
    },

    translateAccountStatus(status) {
        const translations = {
            'ACTIVE': 'Active',
            'INACTIVE': 'Inactive',
            'CLOSED': 'Closed'
        };
        return translations[status] || status;
    },

    translateCounterpartyType(type) {
        const translations = {
            'CUSTOMER': 'Customer',
            'SUPPLIER': 'Supplier',
            'BOTH': 'Customer and Supplier'
        };
        return translations[type] || type;
    },

    renderPagination(elementId, metadata, onPageChange) {
        const container = document.getElementById(elementId);
        if (!container || !metadata) return;

        const { currentPage, totalPages, hasNext, hasPrevious } = metadata;

        container.innerHTML = `
            <button ${!hasPrevious ? 'disabled' : ''} onclick="AppState.currentPage = ${currentPage - 1}; ${onPageChange.toString()}()">
                ◀ Previous
            </button>
            <span>Page ${currentPage + 1} of ${totalPages}</span>
            <button ${!hasNext ? 'disabled' : ''} onclick="AppState.currentPage = ${currentPage + 1}; ${onPageChange.toString()}()">
                Next ▶
            </button>
        `;
    }
});
