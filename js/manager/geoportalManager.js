/* ============================================
   GEOPORTAL MANAGER
   Handles import of land plots from GUS/geoportal
   
   Feature: Supports irregular plot shapes
   ✓ Rectangles - Simple plots
   ✓ L-shapes - Common residential plots
   ✓ Trapezoids - Plots along sloped roads
   ✓ Polygons - Complex boundaries with 5+ vertices
   
   All shapes rendered as precise polygons matching
   actual cadastral geometry from GUGiK database.
   ============================================ */

class GeoportalManager {
    // Geoportal API endpoints
    static API_BASE = 'https://integracja.gugik.gov.pl/api';
    
    // Public WFS endpoint for parcel data
    static WFS_URL = 'https://wms.geoportal.gov.pl/wfs';
    
    // Local proxy server (run with: npm start or node server.js)
    static LOCAL_PROXY = 'http://localhost:3004/api';
    
    // CORS Proxy for development (fallback)
    static CORS_PROXY = 'https://api.allorigins.win/raw?url=';
    
    // Enable/disable CORS proxy
    static USE_CORS_PROXY = true; // ✅ Włączony domyślnie
    
    // Enable/disable local proxy
    static USE_LOCAL_PROXY = true; // ✅ Używaj serwera proxy gdy jest dostępny
    
    // EPSG codes (coordinate systems)
    static EPSG_2180 = 'EPSG:2180'; // Polish coordinate system
    static EPSG_4326 = 'EPSG:4326'; // WGS84

    /**
     * Search for plot (działka) by teryt codes
     * @param {string} voivodeship - Voivodeship TERYT code (2 digits)
     * @param {string} district - District TERYT code (2 digits)
     * @param {string} commune - Commune TERYT code (2 digits)
     * @param {string} plotNumber - Plot number (działka)
     * @returns {Promise<GeoJSON>}
     */
    static async searchPlotByNumber(voivodeship, district, commune, plotNumber) {
        try {
            // Build TERYT code
            const terytCode = `${voivodeship}${district}${commune}`;
            
            console.log('🔍 Searching for plot...');
            console.log('TERYT:', terytCode);
            console.log('Plot number:', plotNumber);

            // Try local proxy first (requires running server.js)
            if (this.USE_LOCAL_PROXY) {
                try {
                    const plot = await this.queryViaLocalProxy(terytCode, plotNumber);
                    if (plot) {
                        console.log('✅ Plot found via local proxy');
                        return plot;
                    }
                } catch (error) {
                    console.warn('⚠️ Local proxy unavailable, falling back to public API');
                }
            }

            // Fallback to public API
            const filteredPlots = await this.queryParcelsByNumber(
                terytCode, 
                plotNumber
            );

            if (!filteredPlots || filteredPlots.length === 0) {
                throw new Error('Nie znaleziono działki o podanym numerze');
            }

            // Get the first matching plot
            const plot = filteredPlots[0];
            
            console.log('✅ Plot found:', plot);
            return plot;

        } catch (error) {
            console.error('❌ Error searching for plot:', error);
            throw error;
        }
    }

    /**
     * Query parcel using local Node.js proxy server
     * @private
     */
    static async queryViaLocalProxy(terytCode, plotNumber) {
        try {
            console.log('🚀 Querying local proxy server...');
            
            const url = `${this.LOCAL_PROXY}/search`;
            const [voivodeship, district, commune] = [
                terytCode.substring(0, 2),
                terytCode.substring(2, 4),
                terytCode.substring(4, 6)
            ];

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    voivodeship,
                    district,
                    commune,
                    plotNumber
                })
            });

            if (!response.ok) {
                throw new Error(`Proxy error: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('📊 Local proxy returned parcel data');
            return data;

        } catch (error) {
            console.error('❌ Local proxy query failed:', error.message);
            return null;
        }
    }

    /**
     * Query parcels using WFS (Web Feature Service)
     * @private
     */
    static async queryParcelsByNumber(terytCode, plotNumber) {
        try {
            // Use WFS GetFeature request to query EGiB parcels
            const params = new URLSearchParams({
                service: 'WFS',
                version: '2.0.0',
                request: 'GetFeature',
                typeNames: 'EGiB:eGrid_Dzialki', // Parcels layer
                outputFormat: 'application/json',
                CQL_FILTER: `(gml_id LIKE 'eGrid_Dzialki.%' AND ST_Contains(the_geom, ST_Point(0,0)))`,
                srsname: this.EPSG_2180
            });

            let wfsUrl = `${this.WFS_URL}?${params.toString()}`;
            
            // Use CORS proxy if enabled
            if (this.USE_CORS_PROXY) {
                console.log('🌐 Using CORS proxy for WFS request');
                wfsUrl = this.CORS_PROXY + encodeURIComponent(wfsUrl);
            }
            
            console.log('📡 Fetching from:', this.USE_CORS_PROXY ? 'CORS PROXY' : 'Direct');
            const response = await fetch(wfsUrl);
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.features || data.features.length === 0) {
                console.warn('⚠️ No features found in WFS response');
                return [];
            }

            console.log('✅ WFS returned', data.features.length, 'features');

            // Filter features by plot number
            const filteredFeatures = data.features.filter(feature => {
                const props = feature.properties || {};
                const nr_dzialki = props.nr_dzialki || props['nr_dzialki'] || '';
                return nr_dzialki.toString().includes(plotNumber.toString());
            });

            return filteredFeatures;

        } catch (error) {
            console.warn('⚠️ WFS query failed:', error.message);
            return await this.queryUsingPublicAPI(terytCode, plotNumber);
        }
    }

    /**
     * Alternative method using public GUGiK API
     * @private
     */
    static async queryUsingPublicAPI(terytCode, plotNumber) {
        try {
            // Try to use the GUGiK REST API
            let url = `${this.API_BASE}/parcel/${terytCode}/${plotNumber}`;
            
            // Use CORS proxy if enabled
            if (this.USE_CORS_PROXY) {
                url = this.CORS_PROXY + encodeURIComponent(url);
            }
            
            console.log('🔗 Using GUGiK REST API endpoint via', this.USE_CORS_PROXY ? 'proxy' : 'direct');

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API request failed (${response.status}): ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ GUGiK API returned data');
            
            if (data.geom) {
                return [data];
            }

            return [];

        } catch (error) {
            console.error('❌ GUGiK API failed:', error.message);
            console.warn('⚠️ No API access - using example plot for demonstration');
            console.info('💡 Tip: To get real data, use a CORS proxy or deploy a backend proxy');
            
            // Notify user about fallback
            const uiManager = window.uiManager;
            if (uiManager) {
                uiManager.showMessage('⚠️ API niedostępne - używam PRZYKŁADOWĄ działkę', 'warning');
            }
            
            // Return example plot for testing
            return this.getExamplePlot();
        }
    }

    /**
     * Convert coordinates from EPSG:2180 to canvas coordinates
     * @param {Array<[number, number]>} coordinates - Array of [x, y] coordinates in EPSG:2180
     * @param {Object} options - Conversion options
     * @returns {Array<[number, number]>} - Converted coordinates
     */
    static convertCoordinates(coordinates, options = {}) {
        const {
            centerX = 0,
            centerY = 0,
            pixelsPerMeter = 30
        } = options;

        return coordinates.map(([x, y]) => {
            // Center the coordinates
            const relX = x - centerX;
            const relY = y - centerY;
            
            // Convert meters to pixels (and flip Y axis for canvas)
            const canvasX = relX * pixelsPerMeter;
            const canvasY = -relY * pixelsPerMeter; // Flip Y axis
            
            return [canvasX, canvasY];
        });
    }

    /**
     * Extract polygon coordinates from GeoJSON feature
     * 
     * Supports all geometry types:
     * - Polygon: Simple or complex boundaries
     * - MultiPolygon: Takes the largest part
     * - Point: Creates small reference square
     * 
     * Handles irregular shapes:
     * - Triangles (3 vertices)
     * - Rectangles (4 vertices)
     * - L-shapes (6-8 vertices)
     * - Complex boundaries (10+ vertices)
     * 
     * @param {Object} feature - GeoJSON feature
     * @returns {Array<[number, number]>|null}
     */
    static extractPolygonCoordinates(feature) {
        if (!feature || !feature.geometry) {
            console.warn('⚠️ Feature has no geometry');
            return null;
        }

        const geom = feature.geometry;

        if (geom.type === 'Polygon' && geom.coordinates && geom.coordinates[0]) {
            // Standard polygon - return outer ring
            return geom.coordinates[0];
        } else if (geom.type === 'MultiPolygon' && geom.coordinates && geom.coordinates.length > 0) {
            // Multiple polygons - take the largest one
            console.log(`📦 MultiPolygon with ${geom.coordinates.length} parts, using largest`);
            let largestRing = geom.coordinates[0][0];
            let largestArea = this.calculateBounds(geom.coordinates[0][0]).width * this.calculateBounds(geom.coordinates[0][0]).height;
            
            for (let i = 1; i < geom.coordinates.length; i++) {
                if (geom.coordinates[i][0]) {
                    const bounds = this.calculateBounds(geom.coordinates[i][0]);
                    const area = bounds.width * bounds.height;
                    if (area > largestArea) {
                        largestRing = geom.coordinates[i][0];
                        largestArea = area;
                    }
                }
            }
            return largestRing;
        } else if (geom.type === 'Point' && geom.coordinates) {
            // For point geometry, create a small reference square
            const [x, y] = geom.coordinates;
            const offset = 50; // 50 meters
            console.log('📍 Point geometry, creating reference square');
            return [
                [x - offset, y - offset],
                [x + offset, y - offset],
                [x + offset, y + offset],
                [x - offset, y + offset],
                [x - offset, y - offset]
            ];
        } else if (geom.type === 'LineString' && geom.coordinates) {
            // For line geometry, create a buffer around it
            const coords = geom.coordinates;
            const offset = 10; // 10 meter buffer
            console.log('📏 LineString geometry, creating buffered polygon');
            
            // Forward pass
            const forward = coords.map(([x, y]) => [x, y + offset]);
            // Reverse pass (builds buffer)
            const backward = coords.slice().reverse().map(([x, y]) => [x, y - offset]);
            // Close the ring
            forward.push(forward[0]);
            return [...forward, ...backward];
        }

        console.warn('⚠️ Unsupported geometry type:', geom.type);
        return null;
    }

    /**
     * Calculate center and bounds of polygon
     * @param {Array<[number, number]>} coordinates
     * @returns {Object} - {centerX, centerY, minX, maxX, minY, maxY}
     */
    static calculateBounds(coordinates) {
        if (!coordinates || coordinates.length === 0) {
            return null;
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        coordinates.forEach(([x, y]) => {
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        return {
            centerX,
            centerY,
            minX,
            maxX,
            minY,
            maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * Get example plot for testing
     * @private
     */
    static getExamplePlot() {
        // Example plot - realistic sized plot (100x100 meters in EPSG:2180)
        // This is used when API is unavailable (CORS restrictions)
        return [{
            type: 'Feature',
            properties: {
                nr_dzialki: '001/2024',
                pole_pow: 10000, // 100 * 100 in square meters
                obreb: 'Przykład',
                note: 'PRZYKŁADOWA DZIAŁKA - API Geoportalu niedostępne'
            },
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [0, 0],
                    [100, 0],
                    [100, 100],
                    [0, 100],
                    [0, 0]
                ]]
            }
        }];
    }

    /**
     * Create a polygon element from plot data
     * @param {Object} plotData - Plot GeoJSON feature
     * @param {Object} projectData - Project data with pixelsPerMeter
     * @returns {Element|null}
     */
    static createPlotElement(plotData, projectData) {
        try {
            const coordinates = this.extractPolygonCoordinates(plotData);
            if (!coordinates) {
                throw new Error('Could not extract coordinates from plot');
            }

            console.log('📍 Extracted coordinates:', coordinates);

            const bounds = this.calculateBounds(coordinates);
            if (!bounds) {
                throw new Error('Could not calculate bounds');
            }

            console.log('📦 Plot bounds (in meters):', {
                width: `${bounds.width}m`,
                height: `${bounds.height}m`,
                center: `(${bounds.centerX}, ${bounds.centerY})`
            });

            // Get pixel scale from project (default 1 pixel = 1 meter for 1:1 display)
            const pixelsPerMeter = projectData?.pixelsPerMeter || 1;
            
            // Convert dimensions from meters to pixels
            const widthInPixels = bounds.width * pixelsPerMeter;
            const heightInPixels = bounds.height * pixelsPerMeter;

            // Store relative coordinates (centered on element)
            const relativeCoordinates = coordinates.map(([x, y]) => [
                (x - bounds.centerX) * pixelsPerMeter,
                -(y - bounds.centerY) * pixelsPerMeter  // Flip Y axis for canvas
            ]);

            console.log('📐 Relative coordinates (scaled to pixels):', relativeCoordinates);

            // Extract plot properties
            const props = plotData.properties || {};
            const area = props.pole_pow || props.area || 0;
            
            // Create element representing the plot boundary
            const plotElement = new Element(
                'land_plot',
                bounds.centerX,
                bounds.centerY,
                widthInPixels,
                heightInPixels,
                {
                    name: props.nr_dzialki || 'Działka',
                    color: '#9ca3af',
                    opacity: 0.4,
                    shape: 'polygon', // Use polygon shape for rendering
                    properties: {
                        // Plot identification
                        plotNumber: props.nr_dzialki,
                        plotArea: area,  // Square meters
                        obreb: props.obreb || props.obreb_nazwa,
                        teryt: props.je_sop_kod,
                        
                        // Geometry info
                        geometryType: plotData.geometry?.type,
                        boundsMeters: {
                            width: Math.round(bounds.width * 100) / 100,
                            height: Math.round(bounds.height * 100) / 100
                        },
                        
                        // Coordinates (relative, in pixels)
                        coordinates: relativeCoordinates,
                        
                        // Source info
                        source: 'geoportal',
                        pixelsPerMeter: pixelsPerMeter,
                        
                        // Original coordinates (in meters EPSG:2180)
                        originalCoordinates: coordinates
                    }
                }
            );

            // Log detailed info
            console.log('✅ Plot element created:', {
                id: plotElement.id,
                name: plotElement.name,
                position: { x: plotElement.x, y: plotElement.y },
                sizePixels: { width: widthInPixels, height: heightInPixels },
                sizeMeters: { width: bounds.width, height: bounds.height },
                area: `${area} m²`,
                coordsCount: relativeCoordinates.length
            });

            return plotElement;

        } catch (error) {
            console.error('Error creating plot element:', error);
            return null;
        }
    }

    /**
     * Import plot from geoportal
     * @param {string} plotNumber - Full plot identifier
     * @param {Object} projectManager - Project manager instance
     * @param {Object} canvasManager - Canvas manager instance
     * @returns {Promise<boolean>}
     */
    static async importPlot(plotNumber, projectManager, canvasManager, voivodeship = '12', district = '34', commune = '46') {
        let uiManager = window.uiManager;
        
        try {
            if (!uiManager) {
                throw new Error('UI Manager not initialized');
            }

            uiManager.showMessage('🔄 Pobieranie danych działki...', 'info');

            // Validate input
            if (!plotNumber || plotNumber.trim() === '') {
                throw new Error('Podaj numer działki');
            }

            if (!voivodeship || !district || !commune ||
                voivodeship.length !== 2 || district.length !== 2 || commune.length !== 2) {
                throw new Error('Kody TERYT muszą mieć dokładnie 2 cyfry');
            }

            const plotNum = plotNumber.trim();

            console.log(`📍 Importing plot ${plotNum} with TERYT: ${voivodeship}-${district}-${commune}`);

            // Query for the plot
            const plotData = await this.searchPlotByNumber(
                voivodeship,
                district,
                commune,
                plotNum
            );

            if (!plotData || plotData.length === 0) {
                throw new Error('Plot not found');
            }

            // Get the first result
            const plot = Array.isArray(plotData) ? plotData[0] : plotData;

            // Get project for coordinate conversion
            const project = projectManager.getProject();
            if (!project) {
                throw new Error('No active project');
            }

            // For 1:1 scale from Geoportal, use 1 pixel = 1 meter
            // This ensures imported plots display with actual dimensions
            const pixelsPerMeterFor1To1 = 1;

            // Create element with 1:1 scale
            const plotElement = this.createPlotElement(plot, {
                pixelsPerMeter: pixelsPerMeterFor1To1
            });

            if (!plotElement) {
                throw new Error('Could not create plot element');
            }

            // Add to project
            project.addElement(plotElement);
            canvasManager.addElement(plotElement);

            // Show detailed info about imported plot
            const plotProps = plotElement.properties;
            const dimensions = plotProps.boundsMeters;
            uiManager.showMessage(
                `✅ Zaimportowano: ${plotProps.plotNumber} (${dimensions.width}m × ${dimensions.height}m, ${plotProps.plotArea}m²)`,
                'success'
            );

            return true;

        } catch (error) {
            console.error('Error importing plot:', error);
            const message = error.message || 'Nieznany błąd przy importowaniu działki';
            if (uiManager) {
                uiManager.showMessage(`❌ ${message}`, 'error');
            } else {
                console.error('Cannot show error message - UIManager not available');
            }
            return false;
        }
    }

    /**
     * Import a GeoJSON feature directly (from file upload)
     */
    static async importGeoJSONFeature(feature, projectManager, canvasManager) {
        let uiManager = window.uiManager;
        
        try {
            if (!uiManager) {
                throw new Error('UI Manager not initialized');
            }

            uiManager.showMessage('📥 Wczytywanie GeoJSON...', 'info');

            if (!feature || !feature.geometry) {
                throw new Error('Feature brakuje geometry');
            }

            // Get project
            const project = projectManager.getProject();
            if (!project) {
                throw new Error('No active project');
            }

            // Create element from feature
            const plotElement = this.createPlotElement(feature, {
                pixelsPerMeter: project.pixelsPerMeter
            });

            if (!plotElement) {
                throw new Error('Could not create plot element from GeoJSON');
            }

            // Add to project
            project.addElement(plotElement);
            canvasManager.addElement(plotElement);

            uiManager.showMessage(
                `✅ GeoJSON zaimportowany pomyślnie!`,
                'success'
            );

            return true;

        } catch (error) {
            console.error('Error importing GeoJSON:', error);
            const message = error.message || 'Nieznany błąd przy importowaniu GeoJSON';
            if (uiManager) {
                uiManager.showMessage(`❌ ${message}`, 'error');
            } else {
                console.error(message);
            }
            return false;
        }
    }
}
