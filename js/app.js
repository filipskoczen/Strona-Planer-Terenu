/* ============================================
   LAND PLANNER APP - MAIN APPLICATION
   ============================================ */

let canvasManager;
let projectManager;
let uiManager;
let storageManager = StorageManager;
let selectionManager;
let measurementManager;
let exportManager;
let mapOverlayManager;
let uiEnhancementsManager;
let advancedElementsManager;
let infrastructureManager;
let drawingManager;
let snapManager;
let groupManager;
let annotationManager;
let layerManager;
let autosaveManager;
let view3dManager;

/**
 * Initialize application
 */
function initializeApp() {
    try {
        // Check if DOM is ready
        if (!document.body) {
            console.error('DOM not ready yet');
            setTimeout(initializeApp, 100);
            return;
        }

        // Wait for Konva.js to load from CDN
        if (typeof Konva === 'undefined') {
            console.warn('⏳ Waiting for Konva.js to load from CDN...');
            setTimeout(initializeApp, 100);
            return;
        }

        console.log('🚀 Initializing Land Planner...');

        // Initialize managers
        canvasManager = new CanvasManager('canvas');
        console.log('✅ CanvasManager initialized');

        projectManager = new ProjectManager(canvasManager);
        console.log('✅ ProjectManager initialized');

        uiManager = new UIManager(projectManager, canvasManager);
        console.log('✅ UIManager initialized');

        // Initialize new feature managers
        selectionManager = new SelectionManager(canvasManager, projectManager, uiManager);
        console.log('✅ SelectionManager initialized');

        measurementManager = new MeasurementManager(canvasManager, projectManager);
        console.log('✅ MeasurementManager initialized');

        exportManager = new ExportManager(canvasManager, projectManager);
        console.log('✅ ExportManager initialized');

        mapOverlayManager = new MapOverlayManager(canvasManager, projectManager);
        console.log('✅ MapOverlayManager initialized');

        uiEnhancementsManager = new UIEnhancementsManager(canvasManager, projectManager, uiManager);
        console.log('✅ UIEnhancementsManager initialized');

        advancedElementsManager = new AdvancedElementsManager(canvasManager, projectManager, uiManager);
        advancedElementsManager.loadSavedCustomElements();
        console.log('✅ AdvancedElementsManager initialized');

        infrastructureManager = new InfrastructureManager(canvasManager, projectManager, uiManager);
        console.log('✅ InfrastructureManager initialized');

        drawingManager = new DrawingManager(canvasManager, projectManager);
        console.log('✅ DrawingManager initialized');

        snapManager = new SnapManager(canvasManager);
        console.log('✅ SnapManager initialized');

        groupManager = new GroupManager(canvasManager, selectionManager);
        console.log('✅ GroupManager initialized');

        annotationManager = new AnnotationManager(canvasManager);
        console.log('✅ AnnotationManager initialized');

        layerManager = new LayerManager(canvasManager, uiManager);
        console.log('✅ LayerManager initialized');

        view3dManager = new View3dManager(canvasManager);
        console.log('✅ View3dManager initialized');

        autosaveManager = new AutosaveManager(projectManager, uiManager);
        console.log('✅ AutosaveManager initialized');

        // Make managers globally accessible
        window.uiManager = uiManager;
        window.canvasManager = canvasManager;
        window.projectManager = projectManager;
        window.selectionManager = selectionManager;
        window.measurementManager = measurementManager;
        window.exportManager = exportManager;
        window.mapOverlayManager = mapOverlayManager;
        window.uiEnhancementsManager = uiEnhancementsManager;
        window.advancedElementsManager = advancedElementsManager;
        window.infrastructureManager = infrastructureManager;
        window.drawingManager = drawingManager;
        window.snapManager = snapManager;
        window.groupManager = groupManager;
        window.annotationManager = annotationManager;
        window.layerManager = layerManager;
        window.view3dManager = view3dManager;
        window.autosaveManager = autosaveManager;

        // Load previous project or create new one
        const savedProject = StorageManager.loadCurrentProject();
        if (savedProject) {
            projectManager.loadProject(savedProject);
            uiManager.updateProjectInfo();
            uiManager.updateLayersList();
            uiManager.updateMinimap();
            uiManager.updateHistoryButtons();
            uiManager.showMessage(`Wczytano projekt: ${savedProject.name}`, 'success');
            console.log('✅ Previous project loaded');
        } else {
            // Open new project modal
            uiManager.openNewProjectModal();
            console.log('✅ New project modal opened');
        }

        // Setup window events
        window.addEventListener('beforeunload', (e) => {
            const project = projectManager.getProject();
            if (project && uiManager.history.getLength() > 0) {
                e.preventDefault();
                e.returnValue = 'Masz niezapisane zmiany. Czy naprawdę chcesz opuścić stronę?';
            }
        });

        // Make functions global for HTML callbacks
        window.loadProject = (projectId) => {
            uiManager.loadProject(projectId);
        };

        // ============================================
        // Wire up new toolbar buttons
        // ============================================

        // Theme toggle
        const themeToggleBtn = document.getElementById('themeToggleBtn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                uiEnhancementsManager.toggleTheme();
                const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
                themeToggleBtn.querySelector('.icon').textContent = isDark ? '☀️' : '🌙';
                themeToggleBtn.querySelector('.btn-label').textContent = isDark ? 'Jasny' : 'Ciemny';
            });
        }

        // Shortcuts panel
        const shortcutsBtn = document.getElementById('shortcutsBtn');
        if (shortcutsBtn) {
            shortcutsBtn.addEventListener('click', () => {
                uiEnhancementsManager.showShortcutsPanel();
            });
        }

        // Tutorial
        const tutorialBtn = document.getElementById('tutorialBtn');
        if (tutorialBtn) {
            tutorialBtn.addEventListener('click', () => {
                uiEnhancementsManager.startTutorial();
            });
        }

        // Lasso selection
        const lassoBtn = document.getElementById('lassoBtn');
        if (lassoBtn) {
            lassoBtn.addEventListener('click', () => {
                if (selectionManager.isLassoMode) {
                    selectionManager.disableLassoMode();
                    lassoBtn.classList.remove('active');
                } else {
                    selectionManager.enableLassoMode();
                    lassoBtn.classList.add('active');
                }
            });
        }

        // Clear lasso / deselect all
        const clearLassoBtn = document.getElementById('clearLassoBtn');
        if (clearLassoBtn) {
            clearLassoBtn.addEventListener('click', () => {
                selectionManager.disableLassoMode();
                selectionManager.deselectAll();
                if (lassoBtn) lassoBtn.classList.remove('active');
                uiManager.showMessage('Zaznaczenie wyczyszczone', 'info');
            });
        }

        // Measure tool
        const measureBtn = document.getElementById('measureBtn');
        if (measureBtn) {
            measureBtn.addEventListener('click', () => {
                if (measurementManager.isMeasuring) {
                    measurementManager.disableMeasureMode();
                    measureBtn.classList.remove('active');
                } else {
                    measurementManager.enableMeasureMode();
                    measureBtn.classList.add('active');
                }
            });
        }

        // Clear measurements
        const clearMeasureBtn = document.getElementById('clearMeasureBtn');
        if (clearMeasureBtn) {
            clearMeasureBtn.addEventListener('click', () => {
                measurementManager.disableMeasureMode();
                measurementManager.disableAngleMode();
                measurementManager.clearMeasurements();
                if (measureBtn) measureBtn.classList.remove('active');
                const angleBtnEl = document.getElementById('angleBtn');
                if (angleBtnEl) angleBtnEl.classList.remove('active');
                const perimeterBtnEl = document.getElementById('perimeterBtn');
                if (perimeterBtnEl) perimeterBtnEl.classList.remove('active');
                uiManager.showMessage('Pomiary wyczyszczone', 'info');
            });
        }

        // Setback lines
        const setbackBtn = document.getElementById('setbackBtn');
        if (setbackBtn) {
            setbackBtn.addEventListener('click', () => {
                measurementManager.drawSetbackLines();
            });
        }

        // Collision check
        const collisionBtn = document.getElementById('collisionBtn');
        if (collisionBtn) {
            collisionBtn.addEventListener('click', () => {
                const result = measurementManager.checkCollisions();
                if (result && (result.collisions > 0 || result.boundaryWarnings > 0)) {
                    let msg = '';
                    if (result.collisions > 0) msg += `${result.collisions} kolizji elementów`;
                    if (result.boundaryWarnings > 0) {
                        if (msg) msg += ', ';
                        msg += `${result.boundaryWarnings} za blisko granicy`;
                    }
                    uiManager.showMessage(`\u26a0\ufe0f Wykryto: ${msg}`, 'warning');
                } else {
                    uiManager.showMessage('✅ Brak kolizji', 'success');
                }
            });
        }

        // Coverage stats
        const coverageBtn = document.getElementById('coverageBtn');
        if (coverageBtn) {
            coverageBtn.addEventListener('click', () => {
                const stats = measurementManager.calculateCoverage();
                if (stats) {
                    const panel = document.getElementById('coveragePanel');
                    const content = document.getElementById('coverageContent');
                    if (panel && content) {
                        content.innerHTML = `
                            <div class="coverage-stat">
                                <span class="coverage-stat-label">Powierzchnia działki:</span>
                                <span class="coverage-stat-value">${stats.totalArea?.toFixed(1) || '?'} m²</span>
                            </div>
                            <div class="coverage-stat">
                                <span class="coverage-stat-label">Zabudowa:</span>
                                <span class="coverage-stat-value">${stats.buildingArea?.toFixed(1) || 0} m² (${stats.buildingPercent?.toFixed(1) || 0}%)</span>
                            </div>
                            <div class="coverage-bar"><div class="coverage-bar-fill" style="width:${stats.buildingPercent || 0}%;background:var(--danger);"></div></div>
                            <div class="coverage-stat">
                                <span class="coverage-stat-label">Pow. biologiczna:</span>
                                <span class="coverage-stat-value">${stats.bioArea?.toFixed(1) || 0} m² (${stats.bioPercent?.toFixed(1) || 0}%)</span>
                            </div>
                            <div class="coverage-bar"><div class="coverage-bar-fill" style="width:${stats.bioPercent || 0}%;background:var(--success);"></div></div>
                            <div class="coverage-stat">
                                <span class="coverage-stat-label">Utwardzenia:</span>
                                <span class="coverage-stat-value">${stats.hardscapeArea?.toFixed(1) || 0} m² (${stats.hardscapePercent?.toFixed(1) || 0}%)</span>
                            </div>
                            <div class="coverage-bar"><div class="coverage-bar-fill" style="width:${stats.hardscapePercent || 0}%;background:var(--warning);"></div></div>
                        `;
                        panel.classList.remove('hidden');
                    }
                } else {
                    uiManager.showMessage('Brak danych o działce', 'warning');
                }
            });
        }



        // Custom element
        const customElementBtn = document.getElementById('customElementBtn');
        if (customElementBtn) {
            customElementBtn.addEventListener('click', () => {
                advancedElementsManager.showCreateCustomElementDialog();
            });
        }

        // Export menu
        const exportMenuBtn = document.getElementById('exportMenuBtn');
        if (exportMenuBtn) {
            exportMenuBtn.addEventListener('click', () => {
                uiManager.openExportModal();
            });
        }

        // Element search
        const elementSearch = document.getElementById('elementSearch');
        if (elementSearch) {
            elementSearch.addEventListener('input', (e) => {
                uiEnhancementsManager.searchElements(e.target.value);
            });
        }

        // ============================================
        // Drawing tools
        // ============================================
        const freehandBtn = document.getElementById('freehandBtn');
        if (freehandBtn) {
            freehandBtn.addEventListener('click', () => {
                if (drawingManager.mode === 'freehand') {
                    drawingManager.disableAllModes();
                    freehandBtn.classList.remove('active');
                } else {
                    drawingManager.enableFreehandMode();
                    document.querySelectorAll('#freehandBtn,#polylineBtn,#bezierBtn,#eraserBtn').forEach(b => b.classList.remove('active'));
                    freehandBtn.classList.add('active');
                }
            });
        }

        const polylineBtn = document.getElementById('polylineBtn');
        if (polylineBtn) {
            polylineBtn.addEventListener('click', () => {
                if (drawingManager.mode === 'polyline') {
                    drawingManager.disableAllModes();
                    polylineBtn.classList.remove('active');
                } else {
                    drawingManager.enablePolylineMode();
                    document.querySelectorAll('#freehandBtn,#polylineBtn,#bezierBtn,#eraserBtn').forEach(b => b.classList.remove('active'));
                    polylineBtn.classList.add('active');
                }
            });
        }

        const bezierBtn = document.getElementById('bezierBtn');
        if (bezierBtn) {
            bezierBtn.addEventListener('click', () => {
                if (drawingManager.mode === 'bezier') {
                    drawingManager.disableAllModes();
                    bezierBtn.classList.remove('active');
                } else {
                    drawingManager.enableBezierMode();
                    document.querySelectorAll('#freehandBtn,#polylineBtn,#bezierBtn,#eraserBtn').forEach(b => b.classList.remove('active'));
                    bezierBtn.classList.add('active');
                }
            });
        }

        const stopDrawingBtn = document.getElementById('stopDrawingBtn');
        if (stopDrawingBtn) {
            stopDrawingBtn.addEventListener('click', () => {
                drawingManager.disableAllModes();
                document.querySelectorAll('#freehandBtn,#polylineBtn,#bezierBtn').forEach(b => b.classList.remove('active'));
            });
        }

        const clearDrawingsBtn = document.getElementById('clearDrawingsBtn');
        if (clearDrawingsBtn) {
            clearDrawingsBtn.addEventListener('click', () => {
                if (drawingManager.drawings.length === 0) {
                    uiManager.showMessage('Brak rysunków do usunięcia', 'info');
                    return;
                }
                drawingManager.disableAllModes();
                drawingManager.clearAllDrawings();
                document.querySelectorAll('#freehandBtn,#polylineBtn,#bezierBtn,#eraserBtn').forEach(b => b.classList.remove('active'));
                uiManager.showMessage('🗑️ Usunięto wszystkie rysunki', 'success');
            });
        }

        const eraserBtn = document.getElementById('eraserBtn');
        if (eraserBtn) {
            eraserBtn.addEventListener('click', () => {
                if (drawingManager.mode === 'eraser') {
                    drawingManager.disableAllModes();
                    eraserBtn.classList.remove('active');
                } else {
                    drawingManager.enableEraserMode();
                    document.querySelectorAll('#freehandBtn,#polylineBtn,#bezierBtn,#eraserBtn').forEach(b => b.classList.remove('active'));
                    eraserBtn.classList.add('active');
                }
            });
        }

        // ============================================
        // Annotation tools
        // ============================================
        const addTextBtn = document.getElementById('addTextBtn');
        if (addTextBtn) {
            addTextBtn.addEventListener('click', () => {
                if (annotationManager.mode === 'text') {
                    annotationManager.disableAllModes();
                    addTextBtn.classList.remove('active');
                } else {
                    annotationManager.enableTextMode();
                    document.querySelectorAll('#addTextBtn,#addArrowBtn,#addNoteBtn').forEach(b => b.classList.remove('active'));
                    addTextBtn.classList.add('active');
                }
            });
        }

        const addArrowBtn = document.getElementById('addArrowBtn');
        if (addArrowBtn) {
            addArrowBtn.addEventListener('click', () => {
                if (annotationManager.mode === 'arrow') {
                    annotationManager.disableAllModes();
                    addArrowBtn.classList.remove('active');
                } else {
                    annotationManager.enableArrowMode();
                    document.querySelectorAll('#addTextBtn,#addArrowBtn,#addNoteBtn').forEach(b => b.classList.remove('active'));
                    addArrowBtn.classList.add('active');
                }
            });
        }

        const addNoteBtn = document.getElementById('addNoteBtn');
        if (addNoteBtn) {
            addNoteBtn.addEventListener('click', () => {
                if (annotationManager.mode === 'note') {
                    annotationManager.disableAllModes();
                    addNoteBtn.classList.remove('active');
                } else {
                    annotationManager.enableNoteMode();
                    document.querySelectorAll('#addTextBtn,#addArrowBtn,#addNoteBtn').forEach(b => b.classList.remove('active'));
                    addNoteBtn.classList.add('active');
                }
            });
        }

        const stopAnnotationBtn = document.getElementById('stopAnnotationBtn');
        if (stopAnnotationBtn) {
            stopAnnotationBtn.addEventListener('click', () => {
                annotationManager.disableAllModes();
                document.querySelectorAll('#addTextBtn,#addArrowBtn,#addNoteBtn').forEach(b => b.classList.remove('active'));
            });
        }

        // ============================================
        // Measurement: angle & perimeter
        // ============================================
        const angleBtn = document.getElementById('angleBtn');
        if (angleBtn) {
            angleBtn.addEventListener('click', () => {
                if (angleBtn.classList.contains('active')) {
                    measurementManager.disableAngleMode();
                    angleBtn.classList.remove('active');
                } else {
                    measurementManager.enableAngleMode();
                    angleBtn.classList.add('active');
                }
            });
        }

        const perimeterBtn = document.getElementById('perimeterBtn');
        if (perimeterBtn) {
            perimeterBtn.addEventListener('click', () => {
                measurementManager.measurePerimeterArea();
                perimeterBtn.classList.toggle('active', measurementManager._perimeterActive);
            });
        }

        // ============================================
        // Snap toggle
        // ============================================
        const snapToggleBtn = document.getElementById('snapToggleBtn');
        if (snapToggleBtn) {
            snapToggleBtn.addEventListener('click', () => {
                const enabled = snapManager.toggle();
                snapToggleBtn.classList.toggle('active', enabled);
                uiManager.showMessage(enabled ? '🧲 Snap włączony' : '🧲 Snap wyłączony', 'info');
            });
        }

        // ============================================
        // Grouping (Ctrl+G / Ctrl+Shift+G)
        // ============================================
        const groupBtn = document.getElementById('groupBtn');
        if (groupBtn) {
            groupBtn.addEventListener('click', () => {
                groupManager.groupSelected();
            });
        }

        const ungroupBtn = document.getElementById('ungroupBtn');
        if (ungroupBtn) {
            ungroupBtn.addEventListener('click', () => {
                groupManager.ungroupSelected();
            });
        }

        // ============================================
        // 3D View
        // ============================================
        const view3dBtn = document.getElementById('view3dBtn');
        if (view3dBtn) {
            view3dBtn.addEventListener('click', () => {
                view3dManager.toggle();
            });
        }

        // ============================================
        // Autosave toggle
        // ============================================
        const autosaveToggleBtn = document.getElementById('autosaveToggleBtn');
        if (autosaveToggleBtn) {
            autosaveToggleBtn.addEventListener('click', () => {
                const enabled = autosaveManager.toggle();
                autosaveToggleBtn.classList.toggle('active', enabled);
            });
        }

        // ============================================
        // User Layers - add layer button
        // ============================================
        const addLayerBtn = document.getElementById('addLayerBtn');
        if (addLayerBtn) {
            addLayerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const name = prompt('Nazwa nowej warstwy:', `Warstwa ${layerManager.nextLayerId}`);
                if (name) {
                    layerManager.createLayer(name);
                    uiManager.showMessage(`✅ Dodano warstwę: ${name}`, 'success');
                }
            });
        }

        // Sidebar panel collapse toggles
        document.querySelectorAll('.infra-panel h3, .minimap-panel h3').forEach(header => {
            header.addEventListener('click', () => {
                const content = header.nextElementSibling;
                if (content && content.classList.contains('collapsible-content')) {
                    content.classList.toggle('collapsed');
                    const toggle = header.querySelector('.panel-toggle');
                    if (toggle) toggle.classList.toggle('collapsed');
                }
            });
        });

        // Ctrl+S save shortcut
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                uiManager.saveProject();
            }
            // Ctrl+G group
            if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'g') {
                e.preventDefault();
                groupManager.groupSelected();
            }
            // Ctrl+Shift+G ungroup
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
                e.preventDefault();
                groupManager.ungroupSelected();
            }
            // Delete selected drawing/annotation
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (drawingManager.selectedDrawing) {
                    drawingManager.deleteSelectedDrawing();
                }
                if (annotationManager.selectedAnnotation) {
                    annotationManager.deleteSelectedAnnotation();
                }
            }
        });

        console.log('%c✅ Aplikacja Land Planner zainicjalizowana pomyślnie!', 'color: #10b981; font-weight: bold; font-size: 14px;');
        console.log('%cWersja: 1.0', 'color: #6366f1; font-size: 12px;');
        console.log('%cCanvas: Konva.js', 'color: #6366f1; font-size: 12px;');

    } catch (error) {
        console.error('❌ Błąd inicjalizacji aplikacji:', error);
        console.error('Stack:', error.stack);
        console.error('Details:', {
            message: error.message,
            canvasManager: typeof canvasManager,
            projectManager: typeof projectManager,
            uiManager: typeof uiManager
        });
        alert('❌ Błąd inicjalizacji aplikacji:\n\n' + error.message + '\n\nSprawdź konsolę (F12) dla szczegółów.');
    }
}

/**
 * Initialize on DOM ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

/**
 * Keyboard shortcuts info
 */
console.log(`
╔════════════════════════════════════════════╗
║   🌳 LAND PLANNER - SKRÓTY KLAWISZOWE      ║
╠════════════════════════════════════════════╣
║ Ctrl+Z / Cmd+Z    - Cofnij                 ║
║ Ctrl+Y / Cmd+Y    - Ponów                  ║
║ Ctrl++ / Cmd++    - Powiększ                ║
║ Ctrl+- / Cmd+-    - Zmniejsz                ║
║ Delete            - Usuń zaznaczony element ║
║ Kliknij na element - Zaznacz                ║
║ Przeciągnij element - Przesuń               ║
╚════════════════════════════════════════════╝
`);
