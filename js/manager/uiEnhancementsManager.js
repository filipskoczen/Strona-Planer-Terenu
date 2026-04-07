/* ============================================
   UI ENHANCEMENTS MANAGER
   Theme toggle, Tutorial/Onboarding, 
   Shortcuts panel, Minimap, Element search,
   Templates
   ============================================ */

class UIEnhancementsManager {
    constructor(canvasManager, projectManager, uiManager) {
        this.canvasManager = canvasManager;
        this.projectManager = projectManager;
        this.uiManager = uiManager;
        this.currentTheme = localStorage.getItem('landPlanner_theme') || 'dark';
        this.minimapCanvas = null;
        this.tutorialStep = 0;
        this.tutorialOverlay = null;

        this.applyTheme(this.currentTheme);
        this.setupMinimap();
    }

    // ---- Theme Toggle ----

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('landPlanner_theme', this.currentTheme);
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        const btn = document.getElementById('themeToggleBtn');
        if (btn) {
            btn.querySelector('.icon').textContent = theme === 'dark' ? '☀️' : '🌙';
            btn.querySelector('.btn-label').textContent = theme === 'dark' ? 'Jasny' : 'Ciemny';
        }
    }

    // ---- Minimap ----

    setupMinimap() {
        const container = document.getElementById('minimapContainer');
        if (!container) return;

        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 150;
        canvas.id = 'minimapCanvas';
        canvas.style.cssText = 'width:100%;border-radius:4px;cursor:pointer;';
        container.appendChild(canvas);
        this.minimapCanvas = canvas;

        // Click on minimap to navigate
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.navigateFromMinimap(x / rect.width, y / rect.height);
        });

        // Update minimap periodically
        setInterval(() => this.updateMinimap(), 1000);
    }

    updateMinimap() {
        if (!this.minimapCanvas || !this.canvasManager.project) return;

        const ctx = this.minimapCanvas.getContext('2d');
        const cw = this.minimapCanvas.width;
        const ch = this.minimapCanvas.height;
        const project = this.canvasManager.project;
        const ppm = project.pixelsPerMeter;

        ctx.clearRect(0, 0, cw, ch);

        // Background
        ctx.fillStyle = this.currentTheme === 'dark' ? '#0f172a' : '#f1f5f9';
        ctx.fillRect(0, 0, cw, ch);

        // Scale
        const scaleX = cw / (project.landWidth * ppm);
        const scaleY = ch / (project.landHeight * ppm);
        const scale = Math.min(scaleX, scaleY) * 0.9;
        const offsetX = (cw - project.landWidth * ppm * scale) / 2;
        const offsetY = (ch - project.landHeight * ppm * scale) / 2;

        // Land area
        ctx.fillStyle = project.landColor;
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 1;
        ctx.fillRect(offsetX, offsetY, project.landWidth * ppm * scale, project.landHeight * ppm * scale);
        ctx.strokeRect(offsetX, offsetY, project.landWidth * ppm * scale, project.landHeight * ppm * scale);

        // Elements
        project.elements.forEach(el => {
            if (el.type === 'land_plot') return;
            const x = offsetX + el.x * ppm * scale;
            const y = offsetY + el.y * ppm * scale;
            const w = el.width * ppm * scale;
            const h = el.height * ppm * scale;
            ctx.fillStyle = el.color;
            ctx.fillRect(x - w / 2, y - h / 2, w, h);
        });

        // Viewport rectangle
        const stage = this.canvasManager.stage;
        const stageScale = stage.scaleX();
        const vpX = -stage.x() / stageScale;
        const vpY = -stage.y() / stageScale;
        const vpW = stage.width() / stageScale;
        const vpH = stage.height() / stageScale;

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(
            offsetX + vpX * scale,
            offsetY + vpY * scale,
            vpW * scale,
            vpH * scale
        );
        ctx.setLineDash([]);
    }

    navigateFromMinimap(ratioX, ratioY) {
        const project = this.canvasManager.project;
        if (!project) return;
        const ppm = project.pixelsPerMeter;
        const stage = this.canvasManager.stage;
        const targetX = ratioX * project.landWidth * ppm;
        const targetY = ratioY * project.landHeight * ppm;
        const scale = stage.scaleX();

        stage.position({
            x: -targetX * scale + stage.width() / 2,
            y: -targetY * scale + stage.height() / 2
        });
        stage.batchDraw();
    }

    // ---- Tutorial / Onboarding ----

    startTutorial() {
        this.tutorialStep = 0;
        const steps = [
            {
                target: '.sidebar-header',
                title: '👋 Witaj w Land Planner!',
                text: 'To jest planer zagospodarowania Twojej działki. Zacznijmy od krótkiego samouczka.',
                position: 'right'
            },
            {
                target: '#newProjectBtn',
                title: '📋 Nowy Projekt',
                text: 'Kliknij tutaj, aby utworzyć nowy projekt. Możesz podać wymiary działki lub zaimportować plik KML/GeoJSON z Geoportalu.',
                position: 'right'
            },
            {
                target: '.elements-panel',
                title: '🏠 Elementy',
                text: 'Wybierz element z listy i kliknij na planszę, aby go umieścić. Możesz też przeciągnąć element na planszę.',
                position: 'right'
            },
            {
                target: '.canvas-container',
                title: '🎨 Plansza',
                text: 'Tutaj rysujesz plan. Scroll = zoom, przeciągnij tło = panorama. Kliknij element, aby go wybrać.',
                position: 'left'
            },
            {
                target: '.properties-panel',
                title: '⚙️ Właściwości',
                text: 'Po zaznaczeniu elementu, tutaj możesz zmienić jego rozmiar, kolor, obrót i inne parametry.',
                position: 'left'
            },
            {
                target: '.view-controls',
                title: '🔍 Widok',
                text: 'Przyciski zoom, dopasuj widok i reset. Użyj też Ctrl+Scroll na planszy.',
                position: 'left'
            }
        ];

        this.showTutorialStep(steps, 0);
    }

    showTutorialStep(steps, index) {
        // Remove previous overlay
        this.closeTutorial();

        if (index >= steps.length) {
            this.uiManager.showMessage('🎉 Samouczek zakończony! Powodzenia!', 'success');
            return;
        }

        const step = steps[index];
        const targetEl = document.querySelector(step.target);
        if (!targetEl) {
            this.showTutorialStep(steps, index + 1);
            return;
        }

        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'tutorial-overlay';
        overlay.id = 'tutorialOverlay';

        // Spotlight
        const rect = targetEl.getBoundingClientRect();
        const spotlight = document.createElement('div');
        spotlight.className = 'tutorial-spotlight';
        spotlight.style.cssText = `top:${rect.top - 4}px;left:${rect.left - 4}px;width:${rect.width + 8}px;height:${rect.height + 8}px;`;

        // Tooltip — calculate position ensuring it stays within viewport
        const tooltip = document.createElement('div');
        tooltip.className = `tutorial-tooltip tutorial-tooltip--${step.position}`;
        
        const TOOLTIP_WIDTH = 320;
        const MARGIN = 16;
        let tooltipTop = rect.top;
        let tooltipLeft = rect.left;

        if (step.position === 'right') {
            tooltipLeft = rect.right + MARGIN;
            // If doesn't fit to the right, try left
            if (tooltipLeft + TOOLTIP_WIDTH > window.innerWidth - MARGIN) {
                tooltipLeft = rect.left - TOOLTIP_WIDTH - MARGIN;
            }
        } else if (step.position === 'left') {
            tooltipLeft = rect.left - TOOLTIP_WIDTH - MARGIN;
            // If doesn't fit to the left, try right
            if (tooltipLeft < MARGIN) {
                tooltipLeft = rect.right + MARGIN;
            }
        } else if (step.position === 'bottom') {
            tooltipTop = rect.bottom + MARGIN;
        }

        // Clamp to viewport
        tooltipLeft = Math.max(MARGIN, Math.min(tooltipLeft, window.innerWidth - TOOLTIP_WIDTH - MARGIN));
        tooltipTop = Math.max(MARGIN, Math.min(tooltipTop, window.innerHeight - 200));

        tooltip.style.cssText = `top:${tooltipTop}px;left:${tooltipLeft}px;`;
        tooltip.innerHTML = `
            <h4>${step.title}</h4>
            <p>${step.text}</p>
            <div class="tutorial-buttons">
                <span class="tutorial-step-indicator">${index + 1} / ${steps.length}</span>
                <button class="btn btn-secondary btn-sm" id="tutorialSkip">Pomiń</button>
                <button class="btn btn-primary btn-sm" id="tutorialNext">${index < steps.length - 1 ? 'Dalej →' : 'Zakończ ✓'}</button>
            </div>
        `;

        overlay.appendChild(spotlight);
        overlay.appendChild(tooltip);
        document.body.appendChild(overlay);
        this.tutorialOverlay = overlay;

        // Prevent events from bubbling through the tooltip
        tooltip.addEventListener('mousedown', (e) => e.stopPropagation());
        tooltip.addEventListener('click', (e) => e.stopPropagation());

        document.getElementById('tutorialNext').addEventListener('click', (e) => {
            e.stopPropagation();
            this.showTutorialStep(steps, index + 1);
        });
        document.getElementById('tutorialSkip').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTutorial();
        });

        // Close on overlay background click — but only if click started on overlay itself
        let mouseDownOnOverlay = false;
        overlay.addEventListener('mousedown', (e) => {
            mouseDownOnOverlay = (e.target === overlay);
        });
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && mouseDownOnOverlay) {
                this.closeTutorial();
            }
            mouseDownOnOverlay = false;
        });
    }

    closeTutorial() {
        const overlay = document.getElementById('tutorialOverlay');
        if (overlay) overlay.remove();
        this.tutorialOverlay = null;
    }

    // ---- Shortcuts Panel ----

    showShortcutsPanel() {
        const existing = document.getElementById('shortcutsModal');
        if (existing) { existing.classList.toggle('hidden'); return; }

        const shortcuts = [
            ['Ctrl+Z', 'Cofnij'],
            ['Ctrl+Y', 'Ponów'],
            ['Ctrl+C', 'Kopiuj'],
            ['Ctrl+V', 'Wklej'],
            ['Ctrl+D', 'Duplikuj'],
            ['Ctrl+A', 'Zaznacz wszystko'],
            ['Ctrl+S', 'Zapisz projekt'],
            ['Delete', 'Usuń element'],
            ['Escape', 'Odznacz / Anuluj'],
            ['←↑→↓', 'Przesuń element (0.5m)'],
            ['Shift+←↑→↓', 'Przesuń element (1m)'],
            ['Ctrl++', 'Powiększ'],
            ['Ctrl+-', 'Pomniejsz'],
            ['Scroll', 'Zoom na planszy'],
        ];

        const modal = document.createElement('div');
        modal.id = 'shortcutsModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-content--small">
                <div class="modal-header">
                    <h2>⌨️ Skróty klawiszowe</h2>
                    <button class="modal-close" onclick="document.getElementById('shortcutsModal').classList.add('hidden')">✕</button>
                </div>
                <div class="modal-body">
                    <div class="shortcuts-grid">
                        ${shortcuts.map(([key, desc]) => `
                            <div class="shortcut-item">
                                <kbd>${key}</kbd>
                                <span>${desc}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // ---- Element Search ----

    searchElements(query) {
        if (!query) return this.projectManager.getAllElements();
        const q = query.toLowerCase();
        return this.projectManager.getAllElements().filter(el => 
            el.name.toLowerCase().includes(q) || el.type.toLowerCase().includes(q)
        );
    }

    // ---- Project Templates ----

    getTemplates() {
        return [
            {
                name: 'Mała działka (15×25m)',
                icon: '🏡',
                width: 15, height: 25, gridSize: 1,
                elements: [
                    { type: 'house', x: 7.5, y: 10, w: 8, h: 10 },
                    { type: 'driveway', x: 3, y: 20, w: 3, h: 5 },
                    { type: 'lawn', x: 10, y: 20, w: 8, h: 8 }
                ]
            },
            {
                name: 'Średnia działka (25×40m)',
                icon: '🏠',
                width: 25, height: 40, gridSize: 1,
                elements: [
                    { type: 'house', x: 12, y: 12, w: 10, h: 12 },
                    { type: 'garage', x: 5, y: 12, w: 6, h: 7 },
                    { type: 'garden', x: 18, y: 30, w: 10, h: 10 },
                    { type: 'driveway', x: 5, y: 25, w: 4, h: 12 },
                    { type: 'path', x: 12, y: 30, w: 2, h: 8 }
                ]
            },
            {
                name: 'Duża działka (40×60m)',
                icon: '🏘️',
                width: 40, height: 60, gridSize: 2,
                elements: [
                    { type: 'house', x: 20, y: 15, w: 12, h: 14 },
                    { type: 'garage', x: 8, y: 15, w: 6, h: 7 },
                    { type: 'garden', x: 30, y: 40, w: 15, h: 15 },
                    { type: 'pool', x: 30, y: 20, w: 5, h: 10 },
                    { type: 'gazebo', x: 15, y: 45, w: 4, h: 4 },
                    { type: 'shed', x: 5, y: 50, w: 4, h: 5 },
                    { type: 'driveway', x: 8, y: 30, w: 4, h: 15 },
                    { type: 'lawn', x: 20, y: 45, w: 15, h: 12 },
                    { type: 'tree', x: 35, y: 10, w: 2, h: 2 },
                    { type: 'tree', x: 5, y: 40, w: 2, h: 2 }
                ]
            },
            {
                name: 'Ogródek warzywny',
                icon: '🌱',
                width: 20, height: 30, gridSize: 1,
                elements: [
                    { type: 'greenhouse', x: 10, y: 8, w: 4, h: 8 },
                    { type: 'crop', x: 5, y: 20, w: 6, h: 8 },
                    { type: 'crop', x: 15, y: 20, w: 6, h: 8 },
                    { type: 'compost', x: 18, y: 5, w: 1.5, h: 2 },
                    { type: 'rainwater_tank', x: 3, y: 5, w: 1.5, h: 1.5 },
                    { type: 'path', x: 10, y: 20, w: 2, h: 10 },
                    { type: 'fruit_tree', x: 5, y: 5, w: 3, h: 3 },
                    { type: 'blueberry', x: 15, y: 12, w: 1.5, h: 1.5 }
                ]
            },
            {
                name: 'Pusta działka',
                icon: '📐',
                width: 30, height: 40, gridSize: 1,
                elements: []
            }
        ];
    }

    applyTemplate(templateIndex) {
        const templates = this.getTemplates();
        if (templateIndex < 0 || templateIndex >= templates.length) return;

        const t = templates[templateIndex];
        const project = this.projectManager.createProject(t.name, t.width, t.height, t.gridSize);

        t.elements.forEach(el => {
            const options = {};
            if (el.w) options.width = el.w;
            if (el.h) options.height = el.h;
            this.projectManager.addElement(el.type, el.x, el.y, options);
        });

        this.uiManager.history.clear();
        this.uiManager.updateProjectInfo();
        this.uiManager.updateLayersList();
        this.uiManager.showMessage(`Wczytano szablon: ${t.name}`, 'success');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIEnhancementsManager;
}
