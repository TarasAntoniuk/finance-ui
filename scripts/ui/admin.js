/**
 * Admin Module - ECB Rate Sync
 */

if (typeof modules === 'undefined') {
    window.modules = {}
}

Object.assign(modules, {
    async 'ecb-sync'() {
        document.getElementById('module-title').textContent = 'ECB Rate Sync'
        const contentBody = document.getElementById('content-body')

        contentBody.innerHTML = `
            <div class="welcome-screen">
                <h2>ECB Exchange Rate Synchronization</h2>
                <p>Sync exchange rates from the European Central Bank</p>
                <div class="quick-stats mt-3">
                    <div class="stat-card">
                        <h4>Daily Sync</h4>
                        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
                            Fetch today's exchange rates from ECB
                        </p>
                        <button class="btn btn-primary" onclick="modules.runEcbDailySync()" id="ecb-daily-btn">
                            Sync Daily Rates
                        </button>
                    </div>
                    <div class="stat-card">
                        <h4>History Sync</h4>
                        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem;">
                            Fetch historical exchange rates from ECB
                        </p>
                        <button class="btn btn-primary" onclick="modules.runEcbHistorySync()" id="ecb-history-btn">
                            Sync History
                        </button>
                    </div>
                </div>
            </div>
        `
    },

    async runEcbDailySync() {
        const btn = document.getElementById('ecb-daily-btn')
        btn.disabled = true
        btn.textContent = 'Syncing...'

        try {
            await api.syncEcbDaily()
            utils.showToast('Daily ECB rates synced successfully')
        } catch (error) {
            utils.showToast('Error syncing: ' + error.message, 'error')
        } finally {
            btn.disabled = false
            btn.textContent = 'Sync Daily Rates'
        }
    },

    async runEcbHistorySync() {
        const btn = document.getElementById('ecb-history-btn')
        btn.disabled = true
        btn.textContent = 'Syncing...'

        try {
            await api.syncEcbHistory()
            utils.showToast('ECB history synced successfully')
        } catch (error) {
            utils.showToast('Error syncing: ' + error.message, 'error')
        } finally {
            btn.disabled = false
            btn.textContent = 'Sync History'
        }
    }
})
