/* ============================================
   UI MANAGER
   ============================================ */

class UIManager {
    // Mapping of Polish voivodeship names to TERYT codes
    static VOIVODESHIP_CODES = {
        'dolnośląskie': '02',
        'kujawsko-pomorskie': '04',
        'lubelskie': '06',
        'lubuskie': '08',
        'łódzkie': '10',
        'małopolskie': '12',
        'mazowieckie': '14',
        'opolskie': '16',
        'podkarpackie': '18',
        'podlaskie': '20',
        'pomorskie': '22',
        'śląskie': '24',
        'świętokrzyskie': '26',
        'warmińsko-mazurskie': '28',
        'wielkopolskie': '30',
        'zachodniopomorskie': '32'
    };

    constructor(projectManager, canvasManager) {
        this.projectManager = projectManager;
        this.canvasManager = canvasManager;
        this.history = new HistoryManager();
        
        // Store dimensions from imported plot
        this.importedPlotWidth = null;
        this.importedPlotHeight = null;
        
        // Loading state
        this.loadingTotal = 0;
        this.loadingCurrent = 0;

        this.initializeEventListeners();
        this.setupModalHandlers();
        this.setupDragAndDrop();
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Helper to safely bind event listeners
        const bindClick = (elementId, callback) => {
            const el = document.getElementById(elementId);
            if (el) {
                el.addEventListener('click', callback);
            } else {
                console.warn(`Element #${elementId} not found`);
            }
        };

        // New Project Button
        bindClick('newProjectBtn', () => this.openNewProjectModal());

        // Save Project Button
        bindClick('saveProjectBtn', () => this.saveCurrentProject());

        // Load Project Button
        bindClick('loadProjectBtn', () => this.openLoadProjectDialog());

        // Undo/Redo
        bindClick('undoBtn', () => this.handleUndo());
        bindClick('redoBtn', () => this.handleRedo());

        // Zoom controls
        bindClick('zoomInBtn', () => {
            this.canvasManager.handleZoom({ evt: { deltaY: -1 } });
        });

        bindClick('zoomOutBtn', () => {
            this.canvasManager.handleZoom({ evt: { deltaY: 1 } });
        });

        bindClick('fitViewBtn', () => this.canvasManager.fitView());
        bindClick('resetViewBtn', () => this.canvasManager.resetView());

        // Custom events
        document.addEventListener('elementSelected', (e) => {
            this.updatePropertiesPanel(e.detail.elementId);
        });

        document.addEventListener('elementMoved', (e) => {
            // Don't add to history while dragging
        });

        document.addEventListener('elementDropped', (e) => {
            this.addToHistory('moveElement', {
                elementId: e.detail.elementId,
                element: this.projectManager.getElement(e.detail.elementId)?.toJSON()
            });
        });

        document.addEventListener('deleteElement', (e) => {
            const element = this.projectManager.getElement(e.detail.elementId);
            if (element) {
                this.addToHistory('deleteElement', {
                    elementId: e.detail.elementId,
                    element: element.toJSON()
                });
                this.projectManager.removeElement(e.detail.elementId);
                this.updateLayersList();
                this.updateMinimap();
            }
        });

        document.addEventListener('cursorMoved', (e) => {
            this.updateCoordinatesDisplay(e.detail.x, e.detail.y, e.detail.scale);
        });

        document.addEventListener('zoomChanged', (e) => {
            this.updateCoordinatesDisplay(0, 0, e.detail.scale);
        });

        // Element buttons
        document.querySelectorAll('.element-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const elementType = btn.dataset.element;
                this.startElementCreation(elementType);
            });
        });

        // Close Properties Button
        const closePropertiesBtn = document.getElementById('closePropertiesBtn');
        if (closePropertiesBtn) {
            closePropertiesBtn.addEventListener('click', () => {
                this.closePropertiesPanel();
            });
        }

        // Panel Toggle Buttons
        this.setupPanelToggles();
    }

    /**
     * Setup panel toggle functionality
     */
    setupPanelToggles() {
        const toggles = document.querySelectorAll('.panel-toggle');
        
        toggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const header = toggle.closest('h3');
                const panel = header.nextElementSibling;
                
                if (panel && panel.classList.contains('collapsible-content')) {
                    panel.classList.toggle('collapsed');
                    toggle.classList.toggle('collapsed');
                }
            });
        });

        // Make headers clickable too
        const headers = document.querySelectorAll('.minimap-panel h3, .project-info h3, .elements-panel h3, .layers-panel h3');
        headers.forEach(header => {
            header.addEventListener('click', (e) => {
                // Only toggle if clicking on the header itself or toggle button
                if (e.target === header || e.target.classList.contains('panel-toggle')) {
                    const toggle = header.querySelector('.panel-toggle');
                    if (toggle) {
                        toggle.click();
                    }
                }
            });
        });
    }

    /**
     * Update minimap
     */
    updateMinimap() {
        // Minimap disabled - no longer needed
        return;
    }

    /**
     * Close Properties Button
     */
    setupModalHandlers() {
        const modals = document.querySelectorAll('.modal');

        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    modal.classList.add('hidden');
                });
            }
        });

        // New Project Modal
        const confirmNewProjectBtn = document.getElementById('confirmNewProjectBtn');
        if (confirmNewProjectBtn) {
            confirmNewProjectBtn.addEventListener('click', () => {
                this.createNewProject();
            });
        }

        const cancelNewProjectBtn = document.getElementById('cancelNewProjectBtn');
        if (cancelNewProjectBtn) {
            cancelNewProjectBtn.addEventListener('click', () => {
                const modal = document.getElementById('newProjectModal');
                if (modal) {
                    modal.classList.add('hidden');
                }
            });
        }

        // Import Plot checkbox in New Project modal
        const importPlotCheckbox = document.getElementById('importPlotCheckbox');
        const importPlotFields = document.getElementById('importPlotFields');
        const dimensionFields = document.getElementById('dimensionFields');
        if (importPlotCheckbox && importPlotFields) {
            importPlotCheckbox.addEventListener('change', () => {
                const isChecked = importPlotCheckbox.checked;
                
                // Show/hide import file field
                importPlotFields.style.display = isChecked ? 'block' : 'none';
                
                // Hide/show dimension fields when import is checked
                if (dimensionFields) {
                    dimensionFields.style.display = isChecked ? 'none' : 'block';
                }
            });
        }

        // Export Modal Buttons
        const exportPngBtn = document.getElementById('exportPngBtn');
        if (exportPngBtn) {
            exportPngBtn.addEventListener('click', () => {
                this.exportAsImage();
            });
        }

        const exportJsonBtn = document.getElementById('exportJsonBtn');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => {
                this.exportAsJSON();
            });
        }

        const exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => {
                if (window.exportManager) {
                    window.exportManager.exportPDF();
                } else {
                    this.showMessage('ExportManager nie jest zainicjalizowany', 'error');
                }
            });
        }

        const exportSvgBtn = document.getElementById('exportSvgBtn');
        if (exportSvgBtn) {
            exportSvgBtn.addEventListener('click', () => {
                if (window.exportManager) {
                    window.exportManager.exportSVG();
                } else {
                    this.showMessage('ExportManager nie jest zainicjalizowany', 'error');
                }
            });
        }

        const exportHiResBtn = document.getElementById('exportHiResBtn');
        if (exportHiResBtn) {
            exportHiResBtn.addEventListener('click', () => {
                if (window.exportManager) {
                    window.exportManager.exportHighResPNG();
                } else {
                    this.showMessage('ExportManager nie jest zainicjalizowany', 'error');
                }
            });
        }

        // Handle project Excel file upload
        const projectImportFile = document.getElementById('projectImportFile');
        if (projectImportFile) {
            projectImportFile.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    // First create a temporary project to import into
                    if (!this.projectManager.getProject()) {
                        const tempProject = this.projectManager.createProject('Tymczasowy', 30, 40);
                    }
                    
                    // Import the file immediately based on type
                    this.showMessage('🔄 Czytam plik...', 'info');
                    
                    const ext = file.name.split('.').pop().toLowerCase();
                    if (ext === 'kml' || ext === 'json' || ext === 'geojson') {
                        await this.handleKMLGeoJSONImport(file);
                    } else {
                        await this.handleProjectExcelImport(file);
                    }
                    
                    // Show info about loaded dimensions
                    if (this.importedPlotWidth && this.importedPlotHeight) {
                        this.showMessage(
                            `📐 Wymiary: ${this.importedPlotWidth}m × ${this.importedPlotHeight}m`,
                            'success'
                        );
                    }
                }
            });
        }
    }

    /**
     * Parse and import Excel file
     */
    async handleProjectExcelImport(file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                // Validate XLSX library
                if (typeof XLSX === 'undefined') {
                    throw new Error('Biblioteka Excel nie załadowała się - spróbuj ponownie');
                }

                // Parse Excel file
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                    throw new Error('Plik Excel nie zawiera żadnych arkuszy');
                }

                console.log('📊 Znalezione arkusze:', workbook.SheetNames);

                // Count total rows to import first
                let totalRows = 0;
                for (const sheetName of workbook.SheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                    
                    if (!rows || rows.length === 0) continue;

                    // Log first few rows for debugging
                    console.log(`📄 Arkusz "${sheetName}" - pierwszy wiersz:`, rows[0]);
                    if (rows.length > 1) {
                        console.log(`📄 Arkusz "${sheetName}" - drugi wiersz (dane):`, rows[1]);
                    }

                    // Detect header row
                    let startRow = 0;
                    if (rows[0] && rows[0][0] && typeof rows[0][0] === 'string') {
                        const firstCell = String(rows[0][0]).toLowerCase();
                        if (firstCell.includes('numer') || firstCell.includes('id') || 
                            firstCell.includes('działka') || firstCell.includes('województwo')) {
                            startRow = 1;
                        }
                    }

                    totalRows += (rows.length - startRow);
                }

                // Show loading overlay
                this.showLoadingOverlay(totalRows);

                let imported = 0;
                let failed = 0;
                let currentProgress = 0;

                for (const sheetName of workbook.SheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                    
                    console.log(`📄 Arkusz "${sheetName}" - ${rows.length} wierszy`);

                    if (!rows || rows.length === 0) continue;

                    // Detect header row
                    let startRow = 0;
                    if (rows[0] && rows[0][0] && typeof rows[0][0] === 'string') {
                        const firstCell = String(rows[0][0]).toLowerCase();
                        if (firstCell.includes('numer') || firstCell.includes('id') || 
                            firstCell.includes('działka') || firstCell.includes('województwo')) {
                            startRow = 1;
                        }
                    }

                    // Import each data row
                    for (let i = startRow; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row || !row[0]) continue;

                        try {
                            // Log raw row data for debugging
                            console.log(`📋 Wiersz ${i} (surowe dane):`, row);

                            let plotNumber = String(row[0]).trim();
                            let voivodeship = String(row[1] || '14').trim();
                            let district = String(row[2] || '20').trim();
                            let commune = String(row[3] || '12').trim();

                            console.log(`📋 Wiersz ${i} (parsowane):`, { plotNumber, voivodeship, district, commune });

                            // Parse TERYT codes from plot ID if format is VVPPGGCC_S.SSSS.NNN
                            if (plotNumber.includes('_')) {
                                const match = plotNumber.match(/^(\d{2})(\d{2})(\d{2})/);
                                if (match) {
                                    voivodeship = match[1];
                                    district = match[2];
                                    commune = match[3];
                                    
                                    const parts = plotNumber.split('_');
                                    if (parts.length > 1) {
                                        const numParts = parts[1].split('.');
                                        plotNumber = numParts[numParts.length - 1];
                                    }
                                    
                                    console.log(`✅ Sparsowano TERYT: ${voivodeship}-${district}-${commune}, Działka: ${plotNumber}`);
                                }
                            }

                            // Convert voivodeship name to code if needed
                            if (!/^\d{2}$/.test(voivodeship)) {
                                const vCode = UIManager.VOIVODESHIP_CODES[voivodeship.toLowerCase()];
                                if (vCode) {
                                    console.log(`🗺️  Zamieniam "${voivodeship}" na kod: ${vCode}`);
                                    voivodeship = vCode;
                                } else {
                                    console.warn(`⚠️  Nieznane województwo: ${voivodeship}`);
                                    failed++;
                                    currentProgress++;
                                    this.updateLoadingProgress(currentProgress, `Nieznane województwo: ${voivodeship}`);
                                    continue;
                                }
                            }

                            // Ensure district and commune are numeric
                            if (!/^\d{2}$/.test(district)) {
                                district = '20'; // Default
                            }
                            if (!/^\d{2}$/.test(commune)) {
                                commune = '12'; // Default
                            }

                            // Validate
                            if (!plotNumber) {
                                failed++;
                                currentProgress++;
                                this.updateLoadingProgress(currentProgress, `Działka: ${plotNumber} (błędy danych)`);
                                continue;
                            }

                            if (!/^\d{2}$/.test(voivodeship) || !/^\d{2}$/.test(district) || !/^\d{2}$/.test(commune)) {
                                failed++;
                                currentProgress++;
                                this.updateLoadingProgress(currentProgress, `Działka: ${plotNumber} (niepoprawny kod)`);
                                continue;
                            }

                            // Import the plot
                            const success = await GeoportalManager.importPlot(
                                plotNumber,
                                this.projectManager,
                                this.canvasManager,
                                voivodeship,
                                district,
                                commune
                            );

                            currentProgress++;
                            if (success) {
                                imported++;
                                this.updateLoadingProgress(currentProgress, `✅ Działka: ${plotNumber} (${voivodeship}-${district}-${commune})`);
                            } else {
                                failed++;
                                this.updateLoadingProgress(currentProgress, `⚠️ Działka: ${plotNumber} (pobieranie nie powiodło się)`);
                            }

                            await new Promise(resolve => setTimeout(resolve, 300));

                        } catch (error) {
                            console.error(`Błąd wiersza ${i}:`, error);
                            failed++;
                            currentProgress++;
                            this.updateLoadingProgress(currentProgress, `❌ Błąd wiersza ${i}`);
                        }
                    }
                }

                // Hide loading overlay
                this.hideLoadingOverlay();

                // Update UI
                this.updateLayersList();
                this.updateMinimap();
                this.updateProjectInfo();
                this.addToHistory('importExcel', {
                    fileName: file.name,
                    imported: imported,
                    failed: failed
                });

                // Extract dimensions from imported plot and show details
                if (imported > 0) {
                    const project = this.projectManager.getProject();
                    if (project && project.elements.length > 0) {
                        // Get the last imported plot (most recent element)
                        const lastElement = project.elements[project.elements.length - 1];
                        
                        if (lastElement.type === 'land_plot') {
                            // Since pixels are 1:1 with meters (pixelsPerMeter=1), dimensions are exact
                            this.importedPlotWidth = lastElement.width;
                            this.importedPlotHeight = lastElement.height;
                            
                            console.log(`📐 Wymiary importowanej działki: ${this.importedPlotWidth}m × ${this.importedPlotHeight}m`);
                            
                            // Show plot details if properties available
                            if (lastElement.properties) {
                                this.showPlotDetails(lastElement.properties);
                            }
                        }
                    }
                }

                // Show result
                if (imported > 0) {
                    this.showMessage(
                        `✅ Zaimportowano działek: ${imported}`,
                        'success'
                    );
                }
                if (failed > 0) {
                    this.showMessage(
                        `⚠️ Błędy importu: ${failed}`,
                        'warning'
                    );
                }

            } catch (error) {
                console.error('Excel import error:', error);
                this.showMessage(`❌ Błąd: ${error.message}`, 'danger');
            }
        };
        
        reader.onerror = () => {
            this.showMessage('❌ Błąd czytania pliku', 'danger');
        };
        
        reader.readAsArrayBuffer(file);
    }

    /**
     * Import KML or GeoJSON file
     * Extracts coordinates and calculates dimensions
     */
    async handleKMLGeoJSONImport(file) {
        return new Promise((resolveImport, rejectImport) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target.result;
                const ext = file.name.split('.').pop().toLowerCase();
                
                let coordinates = [];
                
                if (ext === 'kml') {
                    // Parse KML
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(content, 'text/xml');
                    const coords = xmlDoc.querySelector('coordinates');
                    
                    if (!coords) {
                        throw new Error('❌ Nie znaleziono współrzędnych w pliku KML');
                    }
                    
                    // Parse coordinate string: "lon,lat lon,lat ..."
                    const coordStr = coords.textContent.trim();
                    coordinates = coordStr.split(' ')
                        .filter(c => c.trim())
                        .map(coord => {
                            const [lon, lat] = coord.split(',').map(Number);
                            return [lon, lat]; // WGS84 [lon, lat]
                        });
                    
                    console.log(`📍 KML: znaleziono ${coordinates.length} punktów`);
                    
                } else if (ext === 'json' || ext === 'geojson') {
                    // Parse GeoJSON
                    const geojson = JSON.parse(content);
                    
                    // Handle both Feature and FeatureCollection
                    let feature = geojson;
                    if (geojson.type === 'FeatureCollection' && geojson.features.length > 0) {
                        feature = geojson.features[0];
                    }
                    
                    let geom = null;
                    if (feature.type === 'Feature') {
                        geom = feature.geometry;
                    } else if (feature.geometry) {
                        geom = feature.geometry;
                    } else {
                        geom = feature;
                    }
                    
                    // Extract coordinates from Polygon or MultiPolygon
                    if (geom.type === 'Polygon') {
                        coordinates = geom.coordinates[0]; // First ring (outer boundary)
                    } else if (geom.type === 'MultiPolygon') {
                        coordinates = geom.coordinates[0][0]; // First polygon, first ring
                    } else {
                        throw new Error(`❌ Nieobsługiwany typ geometrii: ${geom.type}`);
                    }
                    
                    console.log(`📍 GeoJSON: znaleziono ${coordinates.length} punktów`);
                }
                
                if (coordinates.length < 3) {
                    throw new Error('❌ Zbyt mało punktów do utworzenia wielokąta');
                }
                
                // Remove duplicate closing points (KML often repeats first point at end)
                while (coordinates.length > 3) {
                    const last = coordinates[coordinates.length - 1];
                    const first = coordinates[0];
                    if (Math.abs(last[0] - first[0]) < 0.0000001 && Math.abs(last[1] - first[1]) < 0.0000001) {
                        coordinates.pop();
                    } else {
                        break;
                    }
                }
                
                console.log(`📍 Po usunięciu duplikatów: ${coordinates.length} unikalnych punktów`);
                
                // Get active project
                const project = this.projectManager.getProject();
                if (!project) {
                    throw new Error('❌ Brak aktywnego projektu');
                }
                
                const pixelsPerMeter = project.pixelsPerMeter || 30;
                
                // Find bounds of coordinates (WGS84)
                let minLon = coordinates[0][0];
                let maxLon = coordinates[0][0];
                let minLat = coordinates[0][1];
                let maxLat = coordinates[0][1];
                
                for (const [lon, lat] of coordinates) {
                    minLon = Math.min(minLon, lon);
                    maxLon = Math.max(maxLon, lon);
                    minLat = Math.min(minLat, lat);
                    maxLat = Math.max(maxLat, lat);
                }
                
                console.log(`📏 Granice WGS84: Lon ${minLon.toFixed(6)} - ${maxLon.toFixed(6)}, Lat ${minLat.toFixed(6)} - ${maxLat.toFixed(6)}`);
                
                // Convert WGS84 to approximate meters using reference point for Poland
                // Reference: Warsaw (52.0°N, 21.0°E) ≈ (366000, 674000) in EPSG:2180
                const refLon = 21.0;
                const refLat = 52.0;
                const metersPerDegLon = 74000; // At this latitude
                const metersPerDegLat = 111000; // Approximately constant
                
                // Convert center and bounds
                const centerLon = (minLon + maxLon) / 2;
                const centerLat = (minLat + maxLat) / 2;
                
                const centerX = 366000 + (centerLon - refLon) * metersPerDegLon;
                const centerY = 674000 + (centerLat - refLat) * metersPerDegLat;
                
                const minX = 366000 + (minLon - refLon) * metersPerDegLon;
                const maxX = 366000 + (maxLon - refLon) * metersPerDegLon;
                const minY = 674000 + (minLat - refLat) * metersPerDegLat;
                const maxY = 674000 + (maxLat - refLat) * metersPerDegLat;
                
                // Convert all coordinates to EPSG:2180 for distance calculations
                const convertedCoords = coordinates.map(([lon, lat]) => {
                    const x = 366000 + (lon - refLon) * metersPerDegLon;
                    const y = 674000 + (lat - refLat) * metersPerDegLat;
                    return [x, y];
                });
                
                // Helper function to calculate distance between two points
                const distance = (p1, p2) => {
                    const dx = p2[0] - p1[0];
                    const dy = p2[1] - p1[1];
                    return Math.sqrt(dx * dx + dy * dy);
                };
                
                // Calculate length of each side (edge) of the polygon
                const sides = [];
                let totalPerimeter = 0;
                for (let i = 0; i < convertedCoords.length; i++) {
                    const currentPoint = convertedCoords[i];
                    const nextPoint = convertedCoords[(i + 1) % convertedCoords.length]; // Wrap to first point at end
                    const sideLength = distance(currentPoint, nextPoint);
                    
                    sides.push({
                        from: i,
                        to: (i + 1) % convertedCoords.length,
                        length: Math.round(sideLength * 10) / 10,
                        coordinates: [currentPoint, nextPoint]
                    });
                    
                    totalPerimeter += sideLength;
                }
                
                // Calculate polygon area using Shoelace formula
                let area = 0;
                for (let i = 0; i < convertedCoords.length; i++) {
                    const current = convertedCoords[i];
                    const next = convertedCoords[(i + 1) % convertedCoords.length];
                    area += current[0] * next[1];
                    area -= next[0] * current[1];
                }
                area = Math.abs(area) / 2;
                
                console.log(`📐 Boki działki (${sides.length}): ${sides.map(s => s.length + 'm').join(', ')}`);
                console.log(`📏 Obwód: ${Math.round(totalPerimeter * 10) / 10}m`);
                console.log(`📊 Powierzchnia: ${Math.round(area)}m²`);
                
                // Calculate dimensions from bounding box for UI display
                const widthMeters = Math.abs(maxX - minX);
                const heightMeters = Math.abs(maxY - minY);
                
                // Create relative coordinates in METERS (NOT pixels yet)
                // canvasManager will convert these to pixels using pixelsPerMeter
                const relativeCoordinates = convertedCoords.map(([x, y]) => {
                    return [
                        (x - centerX),  // Meters relative to center
                        -(y - centerY)  // Meters relative to center (flipped Y)
                    ];
                });
                
                console.log(`📍 Współrzędne względne (metry): ${relativeCoordinates.length} punktów`);
                
                // ---- Resize project land to fit the plot ----
                // Add 10% margin around the plot
                const margin = 1.1;
                const newLandWidth = Math.ceil(widthMeters * margin);
                const newLandHeight = Math.ceil(heightMeters * margin);
                
                project.landWidth = Math.max(newLandWidth, 10);
                project.landHeight = Math.max(newLandHeight, 10);
                
                console.log(`📐 Zmieniam wymiary projektu na: ${project.landWidth}m × ${project.landHeight}m`);
                
                // Position element at CENTER of the land area (not at EPSG:2180 absolute coordinates!)
                const elementX = project.landWidth / 2;
                const elementY = project.landHeight / 2;
                
                // Create land plot element with all side information
                const plotElement = new Element(
                    'land_plot',
                    elementX,       // Center of land area
                    elementY,       // Center of land area
                    widthMeters,    // Store in METERS
                    heightMeters,   // Store in METERS
                    {
                        name: file.name.replace(/\.[^.]+$/, ''),
                        color: '#9ca3af',
                        opacity: 0.4,
                        shape: 'polygon',
                        properties: {
                            fileName: file.name,
                            area: Math.round(area),
                            perimeter: Math.round(totalPerimeter * 10) / 10,
                            sides: sides,
                            coordinates: relativeCoordinates,
                            source: 'kml-geojson-import',
                            originalCoordinates: coordinates,
                            convertedCoordinates: convertedCoords,
                            boundingBox: {
                                width: widthMeters,
                                height: heightMeters
                            }
                        }
                    }
                );
                
                // DEBUG: Log element structure
                console.log('🔍 Created element:', {
                    type: plotElement.type,
                    shape: plotElement.shape,
                    x: plotElement.x,
                    y: plotElement.y,
                    width: plotElement.width,
                    height: plotElement.height,
                    hasProperties: !!plotElement.properties,
                    hasCoordinates: !!plotElement.properties?.coordinates,
                    coordinatesLength: plotElement.properties?.coordinates?.length || 0,
                    coordinatesSample: plotElement.properties?.coordinates?.slice(0, 2) || []
                });
                
                project.addElement(plotElement);
                
                // Re-draw canvas with new land dimensions
                // setProject will: clear canvas, draw land/grid, renderAllElements (including our plot), fitView
                this.canvasManager.setProject(project);
                
                // Store imported polygon element for transfer to final project
                this._importedPolygonElement = plotElement;
                
                // Store dimensions for display
                this.importedPlotWidth = Math.round(widthMeters * 10) / 10;
                this.importedPlotHeight = Math.round(heightMeters * 10) / 10;
                
                console.log(`✅ Działka wczytana: ${sides.length} wierzchołków, Powierzchnia: ${Math.round(area)}m²`);
                
                // Update UI
                this.updateLayersList();
                this.updateMinimap();
                this.updateProjectInfo();
                
                // Show plot details with all sides information
                this.showPlotDetails(plotElement.properties);
                
                this.addToHistory('importKMLGeoJSON', { 
                    fileName: file.name,
                    width: this.importedPlotWidth,
                    height: this.importedPlotHeight
                });
                
                resolveImport(plotElement);
                
            } catch (error) {
                console.error('❌ Błąd importu KML/GeoJSON:', error);
                this.showMessage(`❌ Błąd: ${error.message}`, 'danger');
                rejectImport(error);
            }
        };
        
        reader.onerror = () => {
            this.showMessage('❌ Błąd czytania pliku', 'danger');
            rejectImport(new Error('File read error'));
        };
        
        reader.readAsText(file);
        }); // end Promise
    }

    async handleExcelImport(file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                // Validate XLSX library
                if (typeof XLSX === 'undefined') {
                    throw new Error('Biblioteka Excel nie załadowała się - spróbuj ponownie');
                }

                // Parse Excel file
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                    throw new Error('Plik Excel nie zawiera żadnych arkuszy');
                }

                console.log('📊 Znalezione arkusze:', workbook.SheetNames);

                // Try all sheets
                let imported = 0;
                let failed = 0;

                for (const sheetName of workbook.SheetNames) {
                    const sheet = workbook.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                    
                    console.log(`📄 Arkusz "${sheetName}" - ${rows.length} wierszy`);

                    if (!rows || rows.length === 0) continue;

                    // Detect header row - skip if first row contains text-only values
                    let startRow = 0;
                    if (rows[0] && rows[0][0] && typeof rows[0][0] === 'string') {
                        const firstCell = String(rows[0][0]).toLowerCase();
                        // Check if it looks like a header
                        if (firstCell.includes('numer') || firstCell.includes('id') || 
                            firstCell.includes('działka') || firstCell.includes('województwo')) {
                            console.log('⏭️ Pomijam nagłówek');
                            startRow = 1;
                        }
                    }

                    // Import each data row
                    for (let i = startRow; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row || !row[0]) continue; // Skip empty rows

                        try {
                            let plotNumber = String(row[0]).trim();
                            let voivodeship = String(row[1] || '14').trim();
                            let district = String(row[2] || '20').trim();
                            let commune = String(row[3] || '12').trim();

                            console.log(`📍 Wiersz ${i}: ${plotNumber} | ${voivodeship}-${district}-${commune}`);

                            // Try to parse TERYT codes from plot ID (format: VVPPGGCC_S.SSSS.NNN)
                            // Example: 142012_2.0013.162 → voivodeship=14, district=20, commune=12, plotNum=162
                            if (plotNumber.includes('_')) {
                                const match = plotNumber.match(/^(\d{2})(\d{2})(\d{2})/);
                                if (match) {
                                    voivodeship = match[1];
                                    district = match[2];
                                    commune = match[3];
                                    
                                    // Extract plot number from the right side of underscore
                                    const parts = plotNumber.split('_');
                                    if (parts.length > 1) {
                                        const numParts = parts[1].split('.');
                                        plotNumber = numParts[numParts.length - 1]; // Get last part (plot number)
                                    }
                                    
                                    console.log(`✅ Sparsowano TERYT: ${voivodeship}-${district}-${commune}, Działka: ${plotNumber}`);
                                }
                            }

                            // Validate
                            if (!plotNumber) {
                                console.warn(`⚠️ Wiersz ${i}: brakuje numeru działki`);
                                failed++;
                                continue;
                            }

                            if (voivodeship.length !== 2 || district.length !== 2 || commune.length !== 2) {
                                console.warn(`⚠️ Wiersz ${i}: niepoprawny format TERYT (${voivodeship}-${district}-${commune})`);
                                failed++;
                                continue;
                            }

                            // Validate TERYT codes are numeric
                            if (!/^\d{2}$/.test(voivodeship) || !/^\d{2}$/.test(district) || !/^\d{2}$/.test(commune)) {
                                console.warn(`⚠️ Wiersz ${i}: kody TERYT muszą być liczbami dwucyfrowymi`);
                                failed++;
                                continue;
                            }

                            // Import the plot
                            const success = await GeoportalManager.importPlot(
                                plotNumber,
                                this.projectManager,
                                this.canvasManager,
                                voivodeship,
                                district,
                                commune
                            );

                            if (success) {
                                imported++;
                            } else {
                                failed++;
                            }

                            // Delay between requests to avoid overwhelming API
                            await new Promise(resolve => setTimeout(resolve, 300));

                        } catch (error) {
                            console.error(`❌ Błąd wiersza ${i}:`, error);
                            failed++;
                        }
                    }
                }

                // Close modal
                const modal = document.getElementById('importPlotModal');
                if (modal) {
                    modal.classList.add('hidden');
                }

                // Reset form
                document.getElementById('excelFile').value = '';

                // Update UI
                this.updateLayersList();
                this.updateMinimap();
                this.updateProjectInfo();
                this.addToHistory('importExcel', {
                    fileName: file.name,
                    imported: imported,
                    failed: failed,
                    timestamp: new Date().toISOString()
                });

                // Show result message
                if (imported > 0) {
                    this.showMessage(
                        `✅ Zaimportowano: ${imported} | Błędy: ${failed}`,
                        'success'
                    );
                } else {
                    this.showMessage(
                        `⚠️ Nie udało się importować żadnych działek. Sprawdzę format pliku...`,
                        'warning'
                    );
                }


            } catch (error) {
                console.error('Excel import error:', error);
                this.showMessage(`❌ Błąd wczytania: ${error.message}`, 'danger');
            }
        };
        
        reader.onerror = () => {
            this.showMessage('❌ Błąd czytania pliku', 'danger');
        };
        
        reader.readAsArrayBuffer(file);
    }

    /**
     * Setup drag and drop for elements
     */
    setupDragAndDrop() {
        // Track last valid drop position
        let lastDropPos = null;
        
        document.addEventListener('dragstart', (e) => {
            const btn = e.target.closest('.element-btn');
            if (!btn) return;

            const elementType = btn.dataset.element;
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('elementType', elementType);
        });

        const canvas = document.getElementById('canvas');
        if (!canvas) {
            console.warn('Canvas element not found');
            return;
        }

        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            
            // Calculate position during dragover
            if (this.canvasManager.stage) {
                const stage = this.canvasManager.stage;
                const canvasRect = canvas.getBoundingClientRect();
                
                // Browser pixel coordinates
                const browserX = e.clientX;
                const browserY = e.clientY;
                
                // Canvas viewport coordinates
                const canvasX = browserX - canvasRect.left;
                const canvasY = browserY - canvasRect.top;
                
                // Get stage properties
                const stageX = stage.x();
                const stageY = stage.y();
                const scaleX = stage.scaleX();
                const scaleY = stage.scaleY();
                
                // Manual transformation: convert canvas coords to stage coords
                const stagePixelX = (canvasX - stageX) / scaleX;
                const stagePixelY = (canvasY - stageY) / scaleY;
                
                lastDropPos = { x: stagePixelX, y: stagePixelY };
            }
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            const elementType = e.dataTransfer.getData('elementType');

            if (elementType && this.projectManager.getProject() && lastDropPos) {
                const project = this.projectManager.getProject();
                const stage = this.canvasManager.stage;
                
                // Stage pixel coordinates (already transformed in dragover)
                const pixelX = lastDropPos.x;
                const pixelY = lastDropPos.y;
                
                // Convert pixels to meters
                const xMeters = Helpers.pixelsToMeters(pixelX, project.pixelsPerMeter);
                const yMeters = Helpers.pixelsToMeters(pixelY, project.pixelsPerMeter);
                
                console.log(`🎯 Drop: stagePixels=(${pixelX.toFixed(2)}, ${pixelY.toFixed(2)}) => meters=(${xMeters.toFixed(2)}, ${yMeters.toFixed(2)}), stageX=${stage.x().toFixed(2)}, stageY=${stage.y().toFixed(2)}, zoom=${stage.scaleX().toFixed(4)}`);

                const element = this.projectManager.addElement(elementType, xMeters, yMeters);
                this.addToHistory('addElement', {
                    elementId: element.id,
                    element: element.toJSON()
                });
                this.updateLayersList();
                this.updateMinimap();
            }
        });
    }

    /**
     * Open new project modal
     */
    openNewProjectModal() {
        const modal = document.getElementById('newProjectModal');
        if (modal) {
            modal.classList.remove('hidden');
            const projectName = document.getElementById('projectName');
            if (projectName) {
                projectName.focus();
            }
        }
    }

    /**
     * Create new project
     */
    createNewProject() {
        const projectNameEl = document.getElementById('projectName');
        const landWidthEl = document.getElementById('landWidth');
        const landHeightEl = document.getElementById('landHeight');
        const gridSizeEl = document.getElementById('gridSize');
        const landColorEl = document.getElementById('landColor');
        const importPlotCheckboxEl = document.getElementById('importPlotCheckbox');

        if (!projectNameEl || !landWidthEl || !landHeightEl || !gridSizeEl) {
            this.showMessage('Błąd: Formularz nie załadował się poprawnie', 'danger');
            return;
        }

        const name = projectNameEl.value || 'Nowy projekt';
        
        // Use imported plot dimensions if import is checked, otherwise use manual values
        let width, height;
        if (importPlotCheckboxEl && importPlotCheckboxEl.checked) {
            if (this.importedPlotWidth && this.importedPlotHeight) {
                width = this.importedPlotWidth;
                height = this.importedPlotHeight;
                console.log(`📐 Używam wymiary z importu: ${width}m x ${height}m`);
            } else {
                this.showMessage('⚠️ Wymiary działki nie zostały pobrane', 'warning');
                return;
            }
        } else {
            width = parseFloat(landWidthEl.value) || 30;
            height = parseFloat(landHeightEl.value) || 40;
        }

        const gridSize = parseFloat(gridSizeEl.value) || 1;
        const landColor = landColorEl ? landColorEl.value : '#1e293b';

        if (width < 5 || height < 5) {
            this.showMessage('Wymiary muszą być >= 5 metrów', 'danger');
            return;
        }

        const newProject = this.projectManager.createProject(name, width, height, gridSize, landColor);
        
        // Re-add imported polygon element if it exists
        if (this._importedPolygonElement) {
            const poly = this._importedPolygonElement;
            // Update position to center of new project
            poly.x = width / 2;
            poly.y = height / 2;
            newProject.addElement(poly);
            console.log('✅ Przeniesiono wielokąt do nowego projektu');
            // Re-render with the polygon
            this.canvasManager.setProject(newProject);
        }
        
        this.history.clear();
        this.updateProjectInfo();
        this.updateLayersList();
        this.updateMinimap();
        this.updatePropertiesPanel(null);

        const modal = document.getElementById('newProjectModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.showMessage('Projekt utworzony!', 'success');

        // Reset form
        const projectImportFileInput = document.getElementById('projectImportFile');
        if (projectImportFileInput) {
            projectImportFileInput.value = '';
        }
        
        // Reset stored dimensions for next project
        this.importedPlotWidth = null;
        this.importedPlotHeight = null;
        this._importedPolygonElement = null;
    }

    /**
     * Save current project
     */
    saveCurrentProject() {
        const project = this.projectManager.getProject();
        if (!project) {
            this.showMessage('Brak aktywnego projektu', 'warning');
            return;
        }

        if (StorageManager.saveProject(project)) {
            this.showMessage('Projekt zapisany!', 'success');
        } else {
            this.showMessage('Błąd podczas zapisywania', 'danger');
        }
    }

    /**
     * Save project (optionally silent for autosave)
     */
    saveProject(silent) {
        const project = this.projectManager.getProject();
        if (!project) return false;
        const ok = StorageManager.saveProject(project);
        if (!silent) {
            this.showMessage(ok ? 'Projekt zapisany!' : 'Błąd podczas zapisywania', ok ? 'success' : 'danger');
        }
        return ok;
    }

    /**
     * Open load project dialog
     */
    openLoadProjectDialog() {
        const projects = StorageManager.getProjectList();

        if (projects.length === 0) {
            this.showMessage('Brak zapisanych projektów', 'info');
            return;
        }

        let html = '<div style="display: flex; flex-direction: column; gap: 12px;">';

        projects.forEach(project => {
            const createdDate = new Date(project.created).toLocaleDateString('pl-PL');
            html += `
                <div style="padding: 12px; background-color: var(--bg-tertiary); border-radius: 6px; cursor: pointer;" 
                     onclick="window.loadProject('${project.id}')">
                    <div style="font-weight: 500;">${Sanitizer.sanitizeString(project.name)}</div>
                    <div style="font-size: 12px; color: var(--text-tertiary);">
                        Elementy: ${project.elementCount} | Utworzono: ${createdDate}
                    </div>
                </div>
            `;
        });

        html += '</div>';

        const modal = document.getElementById('newProjectModal');
        const originalContent = modal.innerHTML;

        const propertiesPanel = document.querySelector('.properties-panel');
        propertiesPanel.innerHTML = `
            <div class="panel-header">
                <h3>Wczytaj Projekt</h3>
                <button onclick="document.querySelector('.properties-panel').innerHTML = ''; location.reload();" class="close-btn">✕</button>
            </div>
            <div class="properties-content" style="padding: 20px;">
                ${html}
            </div>
        `;
    }

    /**
     * Load project (global function)
     */
    loadProject(projectId) {
        const project = StorageManager.loadProject(projectId);
        if (project) {
            this.projectManager.loadProject(project);
            this.history.clear();
            this.updateProjectInfo();
            this.updateLayersList();
            this.updateMinimap();
            this.updatePropertiesPanel(null);
            this.showMessage('Projekt wczytany!', 'success');
        } else {
            this.showMessage('Błąd podczas wczytywania projektu', 'danger');
        }
    }

    /**
     * Start element creation
     */
    startElementCreation(elementType) {
        if (!this.projectManager.getProject()) {
            this.showMessage('Najpierw utwórz projekt', 'warning');
            return;
        }

        const defaults = CONSTANTS.ELEMENT_DEFAULTS[elementType];
        const canvasContainer = document.getElementById('canvasContainer');
        const canvas = document.getElementById('canvas');

        // Visual: mark active button
        const activeBtn = document.querySelector(`.element-btn[data-element="${elementType}"]`);
        if (activeBtn) activeBtn.classList.add('placing-active');

        // Visual: placement mode on canvas
        canvasContainer.classList.add('placing-mode');

        // Visual: hint banner
        const hint = document.createElement('div');
        hint.className = 'placement-hint';
        hint.id = 'placementHint';
        hint.textContent = `Kliknij na planszy, aby umieścić ${defaults?.icon || ''} ${defaults ? '' : elementType}`;
        canvasContainer.appendChild(hint);

        const cleanup = () => {
            if (activeBtn) activeBtn.classList.remove('placing-active');
            canvasContainer.classList.remove('placing-mode');
            document.getElementById('placementHint')?.remove();
            canvas.removeEventListener('click', handleClick);
            document.removeEventListener('keydown', handleEscape);
        };

        const handleEscape = (e) => {
            if (e.key === 'Escape') cleanup();
        };

        const handleClick = (e) => {
            const rect = canvas.getBoundingClientRect();
            const canvasX = e.clientX - rect.left;
            const canvasY = e.clientY - rect.top;

            const stage = this.canvasManager.stage;
            const stagePixelX = (canvasX - stage.x()) / stage.scaleX();
            const stagePixelY = (canvasY - stage.y()) / stage.scaleY();

            const project = this.projectManager.getProject();
            const xMeters = Helpers.pixelsToMeters(stagePixelX, project.pixelsPerMeter);
            const yMeters = Helpers.pixelsToMeters(stagePixelY, project.pixelsPerMeter);

            const element = this.projectManager.addElement(elementType, xMeters, yMeters);
            this.addToHistory('addElement', {
                elementId: element.id,
                element: element.toJSON()
            });

            this.updateLayersList();
            cleanup();
        };

        canvas.addEventListener('click', handleClick);
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Update properties panel
     */
    updatePropertiesPanel(elementId) {
        const propertiesPanel = document.querySelector('.properties-panel .properties-content');
        const closeBtn = document.getElementById('closePropertiesBtn');

        if (!elementId) {
            propertiesPanel.innerHTML = '<p class="empty-state">Wybierz element, aby edytować jego właściwości</p>';
            closeBtn.style.display = 'none';
            return;
        }

        closeBtn.style.display = 'flex';

        const element = this.projectManager.getElement(elementId);
        if (!element) return;

        let html = `
            <div class="property-item">
                <label>Nazwa</label>
                <input type="text" id="propName" value="${Sanitizer.sanitizeString(element.name)}" maxlength="50">
            </div>

            <div class="property-item">
                <label>Typ</label>
                <div class="property-value">${element.type}</div>
            </div>

            <div class="property-item">
                <label>Kształt</label>
                <select id="propShape">
                    <option value="rectangle" ${element.shape === CONSTANTS.ELEMENT_SHAPES.RECTANGLE ? 'selected' : ''}>▭ Prostokąt</option>
                    <option value="circle" ${element.shape === CONSTANTS.ELEMENT_SHAPES.CIRCLE ? 'selected' : ''}>● Koło</option>
                    <option value="ellipse" ${element.shape === CONSTANTS.ELEMENT_SHAPES.ELLIPSE ? 'selected' : ''}>⬭ Owal</option>
                    <option value="triangle" ${element.shape === CONSTANTS.ELEMENT_SHAPES.TRIANGLE ? 'selected' : ''}>△ Trójkąt</option>
                    <option value="diamond" ${element.shape === CONSTANTS.ELEMENT_SHAPES.DIAMOND ? 'selected' : ''}>◆ Diament</option>
                    <option value="hexagon" ${element.shape === CONSTANTS.ELEMENT_SHAPES.HEXAGON ? 'selected' : ''}>⬡ Sześciokąt</option>
                </select>
            </div>

            <div class="property-row">
                <div class="property-item">
                    <label>Szerokość (m)</label>
                    <input type="number" id="propWidth" value="${Helpers.round(element.width, 2)}" min="1" max="100" step="0.5">
                </div>
                <div class="property-item">
                    <label>Długość (m)</label>
                    <input type="number" id="propHeight" value="${Helpers.round(element.height, 2)}" min="1" max="100" step="0.5">
                </div>
            </div>

            <div class="property-row">
                <div class="property-item">
                    <label>Pozycja X (m)</label>
                    <div class="property-value">${Helpers.round(element.x, 2)}</div>
                </div>
                <div class="property-item">
                    <label>Pozycja Y (m)</label>
                    <div class="property-value">${Helpers.round(element.y, 2)}</div>
                </div>
            </div>

            <div class="property-row">
                <div class="property-item">
                    <div class="range-with-value">
                        <div class="range-header">
                            <label>Obrót</label>
                            <input type="number" id="rotationInput" class="range-number-input" value="${Helpers.round(element.rotation, 0)}" min="0" max="360" step="1"> 
                        </div>
                        <input type="range" id="propRotation" value="${Helpers.round(element.rotation, 0)}" min="0" max="360" step="1">
                    </div>
                </div>
                <div class="property-item">
                    <div class="range-with-value">
                        <div class="range-header">
                            <label>Krycie</label>
                            <input type="number" id="opacityInput" class="range-number-input" value="${Math.round(element.opacity * 100)}" min="0" max="100" step="5">
                        </div>
                        <input type="range" id="propOpacity" value="${Helpers.round(element.opacity, 2)}" min="0" max="1" step="0.05">
                    </div>
                </div>
            </div>

            <div class="property-item">
                <label>Kolor</label>
                <input type="color" id="propColor" value="${element.color}">
            </div>

            <div class="property-buttons">
                <button class="btn btn-primary" id="propLockBtn">${element.locked ? 'Odblokuj' : 'Zablokuj'}</button>
                <button class="btn btn-secondary" id="propDeleteBtn">Usuń</button>
            </div>
        `;

        propertiesPanel.innerHTML = html;

        // Event listeners for property updates
        document.getElementById('propName').addEventListener('change', (e) => {
            this.projectManager.updateElement(elementId, { name: e.target.value });
            this.addToHistory('updateElement', { elementId, updates: { name: e.target.value } });
            this.updateLayersList();
        });

        document.getElementById('propWidth').addEventListener('change', (e) => {
            const value = parseFloat(e.target.value);
            if (value > 0) {
                this.projectManager.updateElement(elementId, { width: value });
                this.addToHistory('updateElement', { elementId, updates: { width: value } });
            }
        });

        document.getElementById('propHeight').addEventListener('change', (e) => {
            const value = parseFloat(e.target.value);
            if (value > 0) {
                this.projectManager.updateElement(elementId, { height: value });
                this.addToHistory('updateElement', { elementId, updates: { height: value } });
            }
        });

        document.getElementById('propRotation').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('rotationInput').value = Math.round(value);
            this.projectManager.updateElement(elementId, { rotation: value });
        });

        document.getElementById('propRotation').addEventListener('change', (e) => {
            const value = parseFloat(e.target.value);
            this.addToHistory('updateElement', { elementId, updates: { rotation: value } });
        });

        document.getElementById('rotationInput').addEventListener('change', (e) => {
            let value = parseFloat(e.target.value) || 0;
            value = Math.max(0, Math.min(360, value));
            e.target.value = value;
            document.getElementById('propRotation').value = value;
            this.projectManager.updateElement(elementId, { rotation: value });
            this.addToHistory('updateElement', { elementId, updates: { rotation: value } });
        });

        document.getElementById('propOpacity').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            document.getElementById('opacityInput').value = Math.round(value * 100);
            this.projectManager.updateElement(elementId, { opacity: value });
        });

        document.getElementById('propOpacity').addEventListener('change', (e) => {
            const value = parseFloat(e.target.value);
            this.addToHistory('updateElement', { elementId, updates: { opacity: value } });
        });

        document.getElementById('opacityInput').addEventListener('change', (e) => {
            let pct = parseFloat(e.target.value) || 0;
            pct = Math.max(0, Math.min(100, pct));
            e.target.value = pct;
            const value = pct / 100;
            document.getElementById('propOpacity').value = value;
            this.projectManager.updateElement(elementId, { opacity: value });
            this.addToHistory('updateElement', { elementId, updates: { opacity: value } });
        });

        document.getElementById('propColor').addEventListener('change', (e) => {
            const value = e.target.value;
            this.projectManager.updateElement(elementId, { color: value });
            this.addToHistory('updateElement', { elementId, updates: { color: value } });
        });

        document.getElementById('propShape').addEventListener('change', (e) => {
            const newShape = e.target.value;
            this.projectManager.updateElement(elementId, { shape: newShape });
            this.addToHistory('updateElement', { elementId, updates: { shape: newShape } });
            this.canvasManager.renderAllElements();
        });

        document.getElementById('propLockBtn').addEventListener('click', () => {
            const newLocked = !element.locked;
            element.locked = newLocked;
            const shape = this.canvasManager.elementsShapes.get(elementId);
            if (shape) shape.draggable(!newLocked);
            this.updatePropertiesPanel(elementId);
        });

        document.getElementById('propDeleteBtn').addEventListener('click', () => {
            if (confirm('Usunąć element?')) {
                this.projectManager.removeElement(elementId);
                this.addToHistory('deleteElement', { elementId, element: element.toJSON() });
                this.updateLayersList();
                this.updateMinimap();
                this.updatePropertiesPanel(null);
                this.showMessage('Element usunięty', 'success');
            }
        });
    }

    /**
     * Close properties panel
     */
    closePropertiesPanel() {
        this.canvasManager.deselectElement();
        this.updatePropertiesPanel(null);
    }

    /**
     * Update layers list
     */
    updateLayersList() {
        const layersList = document.getElementById('layersList');
        const elements = this.projectManager.getAllElements();

        if (elements.length === 0) {
            layersList.innerHTML = '<p class="empty-state">Brak elementów</p>';
            return;
        }

        let html = '';
        elements.forEach((element, index) => {
            const isSelected = element.id === this.canvasManager.selectedElement;
            html += `
                <div class="layer-item ${isSelected ? 'active' : ''}" onclick="_layerListCallbacks.selectLayer('${element.id}')">
                    <span class="layer-eye" onclick="event.stopPropagation(); _layerListCallbacks.toggleVisibility('${element.id}')">
                        ${element.visible ? '👁️' : '🚫'}
                    </span>
                    <div class="layer-name">${CONSTANTS.ELEMENT_DEFAULTS[element.type]?.icon || '📦'} ${Sanitizer.sanitizeString(element.name)}</div>
                </div>
            `;
        });

        layersList.innerHTML = html;
    }

    /**
     * Update project info sidebar
     */
    updateProjectInfo() {
        const infoContent = document.getElementById('projectInfo');
        const project = this.projectManager.getProject();

        if (!project) {
            infoContent.innerHTML = '<p>Brak aktywnego projektu</p>';
            return;
        }

        const stats = this.projectManager.getStatistics();
        const roadOptions = [
            { value: 'north', label: '⬆️ Północ' },
            { value: 'south', label: '⬇️ Południe' },
            { value: 'east', label: '➡️ Wschód' },
            { value: 'west', label: '⬅️ Zachód' },
            { value: null, label: '❌ Brak drogi' }
        ];

        let roadRadios = roadOptions.map(opt => 
            `<label style="display: inline-block; margin-right: 8px;">
                <input type="radio" name="roadSide" value="${opt.value || ''}" 
                    ${project.roadSide === opt.value ? 'checked' : ''} style="margin-right: 3px;">
                ${opt.label}
            </label>`
        ).join('');

        let html = `
            <p><strong>Nazwa:</strong> ${Sanitizer.sanitizeString(project.name)}</p>
            <p><strong>Wymiary:</strong> ${Helpers.round(project.landWidth, 1)}m × ${Helpers.round(project.landHeight, 1)}m</p>
            <p><strong>Siatka:</strong> ${Helpers.round(project.gridSize, 1)}m</p>
            <p><strong>Elementy:</strong> ${stats.totalElements}</p>
            <p><strong>Kolor działki:</strong>
                <input type="color" id="landColorInput" value="${project.landColor}" style="width: 30px; height: 30px; cursor: pointer; border: 1px solid #6366f1; border-radius: 3px;">
            </p>
            <p><strong>Droga:</strong><br/>${roadRadios}</p>
            <p><strong>Modyfikacja:</strong> ${stats.modifiedDate}</p>
        `;

        infoContent.innerHTML = html;

        // Bind color picker event
        const colorInput = document.getElementById('landColorInput');
        if (colorInput) {
            colorInput.addEventListener('change', (e) => {
                const newColor = e.target.value;
                project.landColor = newColor;
                this.canvasManager.drawLand();
                this.canvasManager.stage.draw();
                this.updateMinimap();
                this.addToHistory('updateLandColor', { landColor: newColor });
            });
        }

        // Bind road side selection
        const roadRadios_elements = document.querySelectorAll('input[name="roadSide"]');
        roadRadios_elements.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const newRoadSide = e.target.value || null;
                project.roadSide = newRoadSide;
                this.canvasManager.drawLand();
                this.canvasManager.drawRoad();
                this.canvasManager.stage.draw();
                this.updateMinimap();
                this.addToHistory('updateRoadSide', { roadSide: newRoadSide });
            });
        });
    }

    /**
     * Update coordinates display
     */
    updateCoordinatesDisplay(x, y, scale) {
        const display = document.getElementById('coordinatesDisplay');
        display.textContent = `X: ${Helpers.round(x, 1)}m | Y: ${Helpers.round(y, 1)}m | Zoom: ${Math.round(scale * 100)}%`;
    }

    /**
     * Add state to history
     */
    addToHistory(action, data) {
        this.history.addState(action, data);
        this.updateHistoryButtons();
    }

    /**
     * Update history buttons
     */
    updateHistoryButtons() {
        document.getElementById('undoBtn').disabled = !this.history.canUndo();
        document.getElementById('redoBtn').disabled = !this.history.canRedo();
    }

    /**
     * Handle undo
     */
    handleUndo() {
        const state = this.history.undo();
        if (state) {
            this.applyHistoryState(state, false);
            this.updateHistoryButtons();
        }
    }

    /**
     * Handle redo
     */
    handleRedo() {
        const state = this.history.redo();
        if (state) {
            this.applyHistoryState(state, true);
            this.updateHistoryButtons();
        }
    }

    /**
     * Apply history state
     */
    applyHistoryState(state, isRedo) {
        const action = state.action;
        const data = state.data;

        switch (action) {
            case 'addElement':
                if (isRedo) {
                    const element = Element.fromJSON(data.element);
                    this.projectManager.project.addElement(element);
                    this.canvasManager.addElement(element);
                } else {
                    this.projectManager.removeElement(data.elementId);
                }
                break;

            case 'deleteElement':
                if (isRedo) {
                    this.projectManager.removeElement(data.elementId);
                } else {
                    const element = Element.fromJSON(data.element);
                    this.projectManager.project.addElement(element);
                    this.canvasManager.addElement(element);
                }
                break;

            case 'updateElement':
                this.projectManager.updateElement(data.elementId, data.updates);
                break;

            case 'moveElement':
                this.projectManager.updateElement(data.elementId, {
                    x: data.element.x,
                    y: data.element.y
                });
                break;
        }

        this.updateLayersList();
        this.updateMinimap();
        this.updateProjectInfo();
    }

    /**
     * Export as image
     */
    exportAsImage() {
        const dataUrl = this.canvasManager.exportPNG();
        const project = this.projectManager.getProject();
        const filename = `plan-${Sanitizer.sanitizeString(project.name)}-${Date.now()}.png`;

        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.click();

        this.showMessage('Plan wyeksportowany jako PNG!', 'success');
    }

    /**
     * Export as JSON
     */
    exportAsJSON() {
        const project = this.projectManager.getProject();
        if (StorageManager.exportProjectAsFile(project)) {
            this.showMessage('Projekt wyeksportowany!', 'success');
        } else {
            this.showMessage('Błąd podczas eksportu', 'danger');
        }
    }

    /**
     * Show loading overlay with spinner and counter
     */
    showLoadingOverlay(total) {
        const overlay = document.getElementById('loadingOverlay');
        const totalSpan = document.getElementById('loadingTotal');
        const currentSpan = document.getElementById('loadingCurrent');
        const progressBar = document.getElementById('loadingProgressBar');
        
        this.loadingTotal = total;
        this.loadingCurrent = 0;
        
        // Update counter display
        currentSpan.textContent = '0';
        totalSpan.textContent = total.toString();
        
        // Reset progress bar
        progressBar.style.width = '0%';
        
        // Show overlay
        overlay.classList.remove('hidden');
    }

    /**
     * Update loading progress display
     */
    updateLoadingProgress(current, message) {
        const currentSpan = document.getElementById('loadingCurrent');
        const progressBar = document.getElementById('loadingProgressBar');
        const infoDiv = document.getElementById('loadingInfo');
        
        this.loadingCurrent = current;
        
        // Update current count
        currentSpan.textContent = current.toString();
        
        // Update progress bar (percentage)
        const percentage = (current / this.loadingTotal) * 100;
        progressBar.style.width = percentage + '%';
        
        // Update info message
        if (message) {
            infoDiv.textContent = message;
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('hidden');
        
        // Reset counters
        document.getElementById('loadingCurrent').textContent = '0';
        document.getElementById('loadingTotal').textContent = '0';
        document.getElementById('loadingInfo').textContent = '';
        document.getElementById('loadingProgressBar').style.width = '0%';
    }

    /**
     * Show message
     */
    showMessage(message, type = 'info') {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 16px 20px;
            background-color: ${type === 'success' ? '#10b981' : type === 'danger' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            border-radius: 6px;
            z-index: 1000;
            animation: slideUp 300ms ease-in-out;
            max-width: 400px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideUp 300ms ease-in-out reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    /**
     * Show plot details from KML/GeoJSON or Geoportal import
     */
    showPlotDetails(plotProperties) {
        const modal = document.getElementById('plotDetailsModal');
        if (!modal) return;

        // Handle KML/GeoJSON import with sides info
        if (plotProperties.sides && Array.isArray(plotProperties.sides)) {
            const sidesInfo = plotProperties.sides
                .map((s, i) => `Bok ${i + 1}: ${s.length}m`)
                .join(', ');
            
            const details = {
                'plotDetailNumber': plotProperties.fileName || '-',
                'plotDetailTERYT': plotProperties.source || 'KML/GeoJSON',
                'plotDetailObreb': `${plotProperties.sides.length} wierzchołków`,
                'plotDetailArea': plotProperties.area 
                    ? `${Math.round(plotProperties.area)} m²`
                    : '-',
                'plotDetailDimensions': sidesInfo,
                'plotDetailGeometry': 'Wielokąt',
                'plotDetailVertices': plotProperties.coordinates
                    ? `${plotProperties.coordinates.length} punktów`
                    : '-',
                'plotDetailSource': plotProperties.source || 'Import'
            };

            // Update modal content
            Object.keys(details).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = details[id];
            });

            // Show modal
            modal.classList.remove('hidden');

            // Close button handler
            const closeBtn = document.getElementById('closeplotDetailsBtn');
            if (closeBtn) {
                closeBtn.onclick = null; // Remove old listeners
                closeBtn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            }
        } else {
            // Original Geoportal import logic
            const details = {
                'plotDetailNumber': plotProperties.plotNumber || '-',
                'plotDetailTERYT': plotProperties.teryt || '-',
                'plotDetailObreb': plotProperties.obreb || '-',
                'plotDetailArea': plotProperties.plotArea 
                    ? `${Math.round(plotProperties.plotArea)} m²`
                    : '-',
                'plotDetailDimensions': plotProperties.boundsMeters
                    ? `${plotProperties.boundsMeters.width}m × ${plotProperties.boundsMeters.height}m`
                    : '-',
                'plotDetailGeometry': plotProperties.geometryType || '-',
                'plotDetailVertices': plotProperties.coordinates
                    ? `${plotProperties.coordinates.length} punktów`
                    : '-',
                'plotDetailSource': 'Geoportal GUGiK'
            };

            // Update modal content
            Object.keys(details).forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = details[id];
            });

            // Show modal
            modal.classList.remove('hidden');

            // Close button handler
            const closeBtn = document.getElementById('closeplotDetailsBtn');
            if (closeBtn) {
                closeBtn.onclick = null; // Remove old listeners
                closeBtn.addEventListener('click', () => {
                    modal.classList.add('hidden');
                });
            }
        }
    }
}

// Global reference for layer list callbacks
const _layerListCallbacks = {
    selectLayer(elementId) {
        uiManager.canvasManager.selectElement(elementId);
        uiManager.updatePropertiesPanel(elementId);
    },
    toggleVisibility(elementId) {
        const element = uiManager.projectManager.getElement(elementId);
        if (element) {
            element.visible = !element.visible;
            uiManager.canvasManager.updateElement(elementId, { visible: element.visible });
            uiManager.updateLayersList();
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}
