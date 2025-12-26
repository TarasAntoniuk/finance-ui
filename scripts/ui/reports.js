/**
 * Reports Module
 */

// Initialize modules object if needed
if (typeof modules === 'undefined') {
    window.modules = {};
}

// Add Reports module
Object.assign(modules, {
    async reports() {
        document.getElementById('module-title').textContent = 'Звіти';
        const contentBody = document.getElementById('content-body');
        contentBody.innerHTML = `
            <div class="welcome-screen">
                <h2>📊 Звіти</h2>
                <p>Модуль звітів в розробці</p>
                <p>Доступні звіти:</p>
                <ul style="text-align: left; max-width: 400px; margin: 2rem auto;">
                    <li>Залишки по рахунках</li>
                    <li>Обороти по рахунках</li>
                    <li>Аналіз платежів</li>
                    <li>Аналіз надходжень</li>
                </ul>
            </div>
        `;
    }
});
