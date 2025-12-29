/**
 * Utility Functions
 * Common helper functions for formatting, modals, toasts, etc.
 */

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
                    <button class="btn btn-secondary" onclick="utils.hideModal(); window.confirmResult(false);">Cancel</button>
                    <button class="btn btn-danger" onclick="utils.hideModal(); window.confirmResult(true);">Confirm</button>
                </div>
            `;
            utils.showModal('Confirmation', content);
            window.confirmResult = resolve;
        });
    }
};
