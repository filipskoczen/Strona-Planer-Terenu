/* ============================================
   AUTOSAVE MANAGER
   Automatic saving at configurable intervals
   ============================================ */

class AutosaveManager {
    constructor(projectManager, uiManager) {
        this.projectManager = projectManager;
        this.uiManager = uiManager;
        this.interval = 30; // seconds
        this.timer = null;
        this.enabled = true;
        this.lastSaveTime = null;
        this.saveCount = 0;

        this._loadSettings();
        this.start();
    }

    start() {
        this.stop();
        if (!this.enabled) return;
        this.timer = setInterval(() => this._autoSave(), this.interval * 1000);
    }

    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    setInterval(seconds) {
        this.interval = Math.max(5, Math.min(300, seconds));
        this._saveSettings();
        if (this.enabled) this.start();
    }

    toggle() {
        this.enabled = !this.enabled;
        this._saveSettings();
        if (this.enabled) {
            this.start();
            this.uiManager?.showMessage('✅ Autozapis włączony', 'success');
        } else {
            this.stop();
            this.uiManager?.showMessage('⏸️ Autozapis wyłączony', 'info');
        }
        this._updateIndicator();
        return this.enabled;
    }

    _autoSave() {
        try {
            const project = this.projectManager?.getProject();
            if (!project) return;

            // Save project
            if (this.uiManager?.saveProject) {
                this.uiManager.saveProject(true); // silent save
            } else {
                StorageManager.saveProject(project);
            }

            this.lastSaveTime = new Date();
            this.saveCount++;
            this._updateIndicator();
        } catch (e) {
            console.warn('⚠️ Autosave failed:', e);
        }
    }

    _updateIndicator() {
        let indicator = document.getElementById('autosaveIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autosaveIndicator';
            indicator.className = 'autosave-indicator';
            document.getElementById('canvasContainer')?.appendChild(indicator);
        }

        if (!this.enabled) {
            indicator.textContent = '⏸️ Autozapis wyłączony';
            indicator.classList.add('disabled');
            return;
        }

        indicator.classList.remove('disabled');
        if (this.lastSaveTime) {
            const time = this.lastSaveTime.toLocaleTimeString('pl-PL');
            indicator.textContent = `💾 Zapisano: ${time}`;
            indicator.classList.add('flash');
            setTimeout(() => indicator.classList.remove('flash'), 1500);
        } else {
            indicator.textContent = `💾 Autozapis co ${this.interval}s`;
        }
    }

    _saveSettings() {
        try {
            localStorage.setItem('landPlanner_autosave', JSON.stringify({
                enabled: this.enabled,
                interval: this.interval
            }));
        } catch (e) { /* ignore */ }
    }

    _loadSettings() {
        try {
            const data = JSON.parse(localStorage.getItem('landPlanner_autosave') || '{}');
            if (data.enabled !== undefined) this.enabled = data.enabled;
            if (data.interval) this.interval = data.interval;
        } catch (e) { /* ignore */ }
    }
}
