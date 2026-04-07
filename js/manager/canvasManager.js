/* ============================================
   CANVAS MANAGER
   ============================================ */

class CanvasManager {
    constructor(containerId) {
        this.width = window.innerWidth * 0.7;
        this.height = window.innerHeight;
        this.stage = null;
        this.layer = null;
        this.elementsLayer = null;
        this.gridLayer = null;

        this.selectedElement = null;
        this.elementsShapes = new Map(); // id -> Konva shape
        this.hoveredElement = null;

        this.project = null;

        this.initStage(containerId);
        this.setupEventListeners();
        this.setupKeyboardShortcuts();

        this.isDrawingMode = false;
        this.drawingPath = [];
    }

    /**
     * Initialize Konva stage
     */
    initStage(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Canvas container with id "${containerId}" not found!`);
            console.error('Available elements:', document.querySelectorAll('[id]').length);
            throw new Error(`Canvas container "#${containerId}" not found in DOM`);
        }

        this.width = container.offsetWidth || 800;
        this.height = container.offsetHeight || 600;

        if (this.width === 0 || this.height === 0) {
            console.error('Canvas container has zero dimensions', { width: this.width, height: this.height });
        }

        this.stage = new Konva.Stage({
            container: containerId,
            width: this.width,
            height: this.height,
            draggable: true,
            onclick: () => this.deselectElement()
        });

        // Create layers
        this.gridLayer = new Konva.Layer();
        this.landLayer = new Konva.Layer();
        this.elementsLayer = new Konva.Layer();
        this.roadLayer = new Konva.Layer();
        this.layer = new Konva.Layer();

        this.stage.add(this.landLayer);
        this.stage.add(this.gridLayer);
        this.stage.add(this.elementsLayer);
        this.stage.add(this.roadLayer);
        this.stage.add(this.layer);

        // Zoom with mouse wheel
        this.stage.on('wheel', (e) => {
            e.evt.preventDefault();
            this.handleZoom(e);
        });

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Set project
     */
    setProject(project) {
        this.project = project;
        this.clear();
        this.drawGrid();
        this.drawLand();
        this.drawRoad();
        this.renderAllElements();
        
        // Auto-fit view for large projects
        setTimeout(() => this.fitView(), 100);
    }

    /**
     * Draw grid
     */
    drawGrid() {
        if (!this.project) return;

        this.gridLayer.destroyChildren();

        const gridSize = Helpers.metersToPixels(this.project.gridSize, this.project.pixelsPerMeter);
        const width = Helpers.metersToPixels(this.project.landWidth, this.project.pixelsPerMeter);
        const height = Helpers.metersToPixels(this.project.landHeight, this.project.pixelsPerMeter);

        // Vertical lines
        for (let x = 0; x <= width; x += gridSize) {
            const line = new Konva.Line({
                points: [x, 0, x, height],
                stroke: '#94a3b8',
                strokeWidth: 0.8,
                opacity: 0.35
            });
            this.gridLayer.add(line);
        }

        // Horizontal lines
        for (let y = 0; y <= height; y += gridSize) {
            const line = new Konva.Line({
                points: [0, y, width, y],
                stroke: '#94a3b8',
                strokeWidth: 0.8,
                opacity: 0.35
            });
            this.gridLayer.add(line);
        }

        this.gridLayer.draw();
    }

    /**
     * Draw land border
     */
    drawLand() {
        if (!this.project) return;

        // Clear previous land elements
        this.landLayer.destroyChildren();

        const width = Helpers.metersToPixels(this.project.landWidth, this.project.pixelsPerMeter);
        const height = Helpers.metersToPixels(this.project.landHeight, this.project.pixelsPerMeter);

        // Check if project has an imported polygon plot
        const polygonElement = this.project.elements.find(
            el => el.shape === 'polygon' && el.properties && el.properties.coordinates && el.properties.coordinates.length >= 3
        );

        if (polygonElement) {
            // ---- Draw imported polygon as the land shape ----
            const coords = polygonElement.properties.coordinates;
            const ppm = this.project.pixelsPerMeter;

            // Element position in pixels (center of land)
            const ex = Helpers.metersToPixels(polygonElement.x, ppm);
            const ey = Helpers.metersToPixels(polygonElement.y, ppm);

            // Convert relative-meter coordinates to absolute pixel positions
            const absPoints = coords.map(([mx, my]) => [
                ex + mx * ppm,
                ey + my * ppm
            ]);

            // Flatten for Konva.Line
            const flatPoints = [];
            absPoints.forEach(([px, py]) => {
                flatPoints.push(px);
                flatPoints.push(py);
            });

            // Dark background covering whole canvas area (outside the plot)
            const landColor = this.project.landColor || '#1e293b';
            // No background outside the plot — leave transparent

            // The polygon land shape (normal color, drawn on top of empty background)
            const landPolygon = new Konva.Line({
                points: flatPoints,
                fill: landColor,
                stroke: '#6366f1',
                strokeWidth: 3,
                closed: true,
                lineJoin: 'round',
                listening: false
            });
            this.landLayer.add(landPolygon);

            // Draw side lengths as labels on each edge
            const sides = polygonElement.properties.sides;
            if (sides && sides.length > 0) {
                for (let i = 0; i < absPoints.length; i++) {
                    const p1 = absPoints[i];
                    const p2 = absPoints[(i + 1) % absPoints.length];
                    const midX = (p1[0] + p2[0]) / 2;
                    const midY = (p1[1] + p2[1]) / 2;

                    // Calculate angle of the edge
                    const dx = p2[0] - p1[0];
                    const dy = p2[1] - p1[1];
                    let angle = Math.atan2(dy, dx) * (180 / Math.PI);

                    // Keep text readable (not upside-down)
                    if (angle > 90 || angle < -90) angle += 180;

                    // Get side length from stored data
                    const sideLength = sides[i] ? sides[i].length : '?';

                    // Offset label perpendicular to edge
                    const perpX = -Math.sin(angle * Math.PI / 180) * 18;
                    const perpY = Math.cos(angle * Math.PI / 180) * 18;

                    const sideLabel = new Konva.Text({
                        x: midX + perpX,
                        y: midY + perpY,
                        text: `${sideLength}m`,
                        fontSize: 13,
                        fill: '#fbbf24',
                        fontStyle: 'bold',
                        align: 'center',
                        rotation: angle,
                        listening: false
                    });
                    sideLabel.offsetX(sideLabel.width() / 2);
                    sideLabel.offsetY(sideLabel.height() / 2);
                    this.landLayer.add(sideLabel);
                }
            }

            // Vertex markers
            absPoints.forEach(([px, py], i) => {
                const dot = new Konva.Circle({
                    x: px, y: py,
                    radius: 4,
                    fill: '#fbbf24',
                    stroke: '#1e293b',
                    strokeWidth: 1,
                    listening: false
                });
                this.landLayer.add(dot);
            });

        } else {
            // ---- Standard rectangle land ----
            const landRect = new Konva.Rect({
                x: 0,
                y: 0,
                width: width,
                height: height,
                fill: this.project.landColor || '#1e293b',
                stroke: '#6366f1',
                strokeWidth: 3,
                listening: false
            });
            this.landLayer.add(landRect);

            // Dimension labels
            const widthLabel = new Konva.Text({
                x: width / 2,
                y: -30,
                text: `${Helpers.round(this.project.landWidth, 1)}m`,
                fontSize: 14,
                fill: '#cbd5e1',
                align: 'center',
                listening: false
            });
            widthLabel.offsetX(widthLabel.width() / 2);

            const heightLabel = new Konva.Text({
                x: -50,
                y: height / 2,
                text: `${Helpers.round(this.project.landHeight, 1)}m`,
                fontSize: 14,
                fill: '#cbd5e1',
                align: 'center',
                rotation: -90,
                listening: false
            });
            heightLabel.offsetY(heightLabel.height() / 2);

            this.landLayer.add(widthLabel);
            this.landLayer.add(heightLabel);
        }

        // Apply clip to elementsLayer so elements outside plot boundary are hidden
        this._applyPlotClip();

        this.landLayer.draw();
    }

    /**
     * Apply clipping to elementsLayer so elements outside the plot are hidden
     */
    _applyPlotClip() {
        if (!this.project) return;

        const ppm = this.project.pixelsPerMeter;

        const polygonElement = this.project.elements.find(
            el => el.shape === 'polygon' && el.properties && el.properties.coordinates && el.properties.coordinates.length >= 3
        );

        if (polygonElement) {
            const coords = polygonElement.properties.coordinates;
            const ex = Helpers.metersToPixels(polygonElement.x, ppm);
            const ey = Helpers.metersToPixels(polygonElement.y, ppm);

            const absPoints = coords.map(([mx, my]) => [
                ex + mx * ppm,
                ey + my * ppm
            ]);

            this.elementsLayer.clipFunc(function (ctx) {
                ctx.beginPath();
                ctx.moveTo(absPoints[0][0], absPoints[0][1]);
                for (let i = 1; i < absPoints.length; i++) {
                    ctx.lineTo(absPoints[i][0], absPoints[i][1]);
                }
                ctx.closePath();
            });
        } else {
            const w = Helpers.metersToPixels(this.project.landWidth, ppm);
            const h = Helpers.metersToPixels(this.project.landHeight, ppm);

            this.elementsLayer.clipFunc(function (ctx) {
                ctx.beginPath();
                ctx.rect(0, 0, w, h);
                ctx.closePath();
            });
        }
    }

    /**
     * Darken a hex color by a factor (0 = black, 1 = unchanged)
     */
    _darkenColor(hex, factor) {
        // Remove # if present
        hex = hex.replace('#', '');
        const r = Math.round(parseInt(hex.substring(0, 2), 16) * factor);
        const g = Math.round(parseInt(hex.substring(2, 4), 16) * factor);
        const b = Math.round(parseInt(hex.substring(4, 6), 16) * factor);
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /**
     * Draw road on land edge
     */
    drawRoad() {
        // Clear previous road
        this.roadLayer.destroyChildren();

        if (!this.project || !this.project.roadSide) {
            this.roadLayer.draw();
            return;
        }

        const width = Helpers.metersToPixels(this.project.landWidth, this.project.pixelsPerMeter);
        const height = Helpers.metersToPixels(this.project.landHeight, this.project.pixelsPerMeter);
        const roadWidth = 16; // pixels - road thickness

        // Check for polygon plot
        const polygonElement = this.project.elements.find(
            el => el.shape === 'polygon' && el.properties && el.properties.coordinates && el.properties.coordinates.length >= 3
        );

        if (polygonElement) {
            // ---- Polygon mode: road along the matching edge ----
            const coords = polygonElement.properties.coordinates;
            const ppm = this.project.pixelsPerMeter;
            const ex = Helpers.metersToPixels(polygonElement.x, ppm);
            const ey = Helpers.metersToPixels(polygonElement.y, ppm);

            const absPoints = coords.map(([mx, my]) => [
                ex + mx * ppm,
                ey + my * ppm
            ]);

            // Find the best edge for the chosen side:
            // 1) Compute bounding box of all points
            // 2) Filter edges near the chosen side (within 20% of bbox dimension)
            // 3) Among those, pick the longest edge
            const allX = absPoints.map(p => p[0]);
            const allY = absPoints.map(p => p[1]);
            const minX = Math.min(...allX), maxX = Math.max(...allX);
            const minY = Math.min(...allY), maxY = Math.max(...allY);
            const bboxW = maxX - minX || 1;
            const bboxH = maxY - minY || 1;

            // Build edge list with metadata
            const edges = [];
            for (let i = 0; i < absPoints.length; i++) {
                const p1 = absPoints[i];
                const p2 = absPoints[(i + 1) % absPoints.length];
                const midX = (p1[0] + p2[0]) / 2;
                const midY = (p1[1] + p2[1]) / 2;
                const edgeDx = p2[0] - p1[0];
                const edgeDy = p2[1] - p1[1];
                const edgeLen = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy);
                edges.push({ p1, p2, midX, midY, len: edgeLen, index: i });
            }

            // For the chosen side, compute how close each edge midpoint is to that boundary
            // Then filter to edges within 20% threshold, and pick the longest
            let bestEdge = null;
            const threshold = 0.2; // 20% of bbox dimension

            const candidates = edges.filter(e => {
                switch (this.project.roadSide) {
                    case 'north': return (e.midY - minY) / bboxH <= threshold;
                    case 'south': return (maxY - e.midY) / bboxH <= threshold;
                    case 'east':  return (maxX - e.midX) / bboxW <= threshold;
                    case 'west':  return (e.midX - minX) / bboxW <= threshold;
                }
                return false;
            });

            // Pick the longest candidate edge
            if (candidates.length > 0) {
                bestEdge = candidates.reduce((best, e) => e.len > best.len ? e : best, candidates[0]);
            } else {
                // Fallback: just pick the longest edge overall
                bestEdge = edges.reduce((best, e) => e.len > best.len ? e : best, edges[0]);
            }

            if (bestEdge) {
                const { p1, p2 } = bestEdge;
                const dx = p2[0] - p1[0];
                const dy = p2[1] - p1[1];
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len === 0) return;

                // Unit vector along the edge
                const ux = dx / len;
                const uy = dy / len;

                // Perpendicular vector (pointing outward from the plot)
                // Determine outward direction based on road side
                let nx, ny;
                switch (this.project.roadSide) {
                    case 'north': nx = 0; ny = -1; break;
                    case 'south': nx = 0; ny = 1; break;
                    case 'east':  nx = 1; ny = 0; break;
                    case 'west':  nx = -1; ny = 0; break;
                }

                // Extend 20% beyond each end
                const ext = len * 0.2;
                const startX = p1[0] - ux * ext;
                const startY = p1[1] - uy * ext;
                const endX = p2[0] + ux * ext;
                const endY = p2[1] + uy * ext;

                // Road as a parallelogram offset outward
                const roadPolygon = new Konva.Line({
                    points: [
                        startX, startY,
                        endX, endY,
                        endX + nx * roadWidth, endY + ny * roadWidth,
                        startX + nx * roadWidth, startY + ny * roadWidth
                    ],
                    fill: '#64748b',
                    stroke: '#475569',
                    strokeWidth: 1,
                    closed: true,
                    listening: false
                });
                this.roadLayer.add(roadPolygon);

                // Road label — centered on the road, half the previous size
                const roadLabelFontSize = Math.max(len * 0.05, 8);
                const labelOffset = roadWidth + roadLabelFontSize * 0.8;
                const midX = (startX + endX) / 2 + nx * labelOffset;
                const midY = (startY + endY) / 2 + ny * labelOffset;
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                const readableAngle = (angle > 90 || angle < -90) ? angle + 180 : angle;

                const roadLabel = new Konva.Text({
                    x: midX,
                    y: midY,
                    text: 'DROGA',
                    fontSize: roadLabelFontSize,
                    fill: '#ffffff',
                    fontStyle: 'bold',
                    align: 'center',
                    rotation: readableAngle,
                    listening: false
                });
                roadLabel.offsetX(roadLabel.width() / 2);
                roadLabel.offsetY(roadLabel.height() / 2);
                this.roadLayer.add(roadLabel);
            }

            this.roadLayer.draw();
            return;
        }

        // ---- Standard rectangle mode ----
        let roadRect;
        let roadLabel;

        switch(this.project.roadSide) {
            case 'north':
                roadRect = new Konva.Rect({
                    x: -width * 0.2,
                    y: -roadWidth,
                    width: width * 1.4,
                    height: roadWidth,
                    fill: '#64748b',
                    stroke: '#475569',
                    strokeWidth: 1,
                    listening: false
                });
                break;
            case 'south':
                roadRect = new Konva.Rect({
                    x: -width * 0.2,
                    y: height,
                    width: width * 1.4,
                    height: roadWidth,
                    fill: '#64748b',
                    stroke: '#475569',
                    strokeWidth: 1,
                    listening: false
                });
                break;
            case 'east':
                roadRect = new Konva.Rect({
                    x: width,
                    y: -height * 0.2,
                    width: roadWidth,
                    height: height * 1.4,
                    fill: '#64748b',
                    stroke: '#475569',
                    strokeWidth: 1,
                    listening: false
                });
                break;
            case 'west':
                roadRect = new Konva.Rect({
                    x: -roadWidth,
                    y: -height * 0.2,
                    width: roadWidth,
                    height: height * 1.4,
                    fill: '#64748b',
                    stroke: '#475569',
                    strokeWidth: 1,
                    listening: false
                });
                break;
        }

        if (roadRect) {
            this.roadLayer.add(roadRect);

            // Road label — half the previous size
            const roadLabelFontSize = width * 0.1;
            roadLabel = new Konva.Text({
                text: 'DROGA',
                fontSize: Math.max(roadLabelFontSize, 8),
                fill: '#ffffff',
                fontStyle: 'bold',
                align: 'center',
                verticalAlign: 'middle',
                listening: false
            });

            const labelPadding = 20;
            switch(this.project.roadSide) {
                case 'north':
                    roadLabel.x(width / 2);
                    roadLabel.y(-roadWidth - labelPadding - roadLabel.height() / 2);
                    roadLabel.offsetX(roadLabel.width() / 2);
                    roadLabel.offsetY(roadLabel.height() / 2);
                    break;
                case 'south':
                    roadLabel.x(width / 2);
                    roadLabel.y(height + roadWidth + labelPadding + roadLabel.height() / 2);
                    roadLabel.offsetX(roadLabel.width() / 2);
                    roadLabel.offsetY(roadLabel.height() / 2);
                    break;
                case 'east':
                    roadLabel.x(width + roadWidth + labelPadding + roadLabel.width() / 2);
                    roadLabel.y(height / 2);
                    roadLabel.offsetX(roadLabel.width() / 2);
                    roadLabel.offsetY(roadLabel.height() / 2);
                    roadLabel.rotation(90);
                    break;
                case 'west':
                    roadLabel.x(-roadWidth - labelPadding - roadLabel.width() / 2);
                    roadLabel.y(height / 2);
                    roadLabel.offsetX(roadLabel.width() / 2);
                    roadLabel.offsetY(roadLabel.height() / 2);
                    roadLabel.rotation(90);
                    break;
            }

            this.roadLayer.add(roadLabel);
            this.roadLayer.draw();
        }
    }

    /**
     * Create shape based on element.shape property
     */
    createShapeGroup(element, width, height) {
        let shapeObj;

        switch(element.shape) {
            case 'polygon':
                // Handle polygon shapes (e.g., from geoportal import)
                if (element.properties && element.properties.coordinates && Array.isArray(element.properties.coordinates) && element.properties.coordinates.length > 0) {
                    const coords = element.properties.coordinates;
                    
                    console.log(`🔷 Rendering polygon with ${coords.length} coordinates:`, coords);
                    
                    // Convert coordinates to pixels and flatten for Konva.Line
                    const pixelPoints = [];
                    
                    coords.forEach(([x, y]) => {
                        const px = Helpers.metersToPixels(x, this.project.pixelsPerMeter);
                        const py = Helpers.metersToPixels(y, this.project.pixelsPerMeter);
                        pixelPoints.push(px);
                        pixelPoints.push(py);
                    });
                    
                    console.log(`✅ Converted to ${pixelPoints.length / 2} pixel points:`, pixelPoints);

                    // Create polygon using Konva.Line (which supports closed paths)
                    shapeObj = new Konva.Line({
                        points: pixelPoints,
                        fill: element.color,
                        stroke: '#6366f1',
                        strokeWidth: 2,
                        lineJoin: 'round',
                        opacity: element.opacity,
                        closed: true,
                        scale: { x: 1, y: 1 },
                        offsetX: 0,
                        offsetY: 0
                    });
                } else {
                    console.warn('⚠️ Polygon has no valid coordinates, rendering as rectangle');
                    console.warn('element.properties:', element.properties);
                    console.warn('coordinates:', element.properties?.coordinates);
                    // Fallback to rectangle if coordinates not available
                    shapeObj = new Konva.Rect({
                        width: width,
                        height: height,
                        fill: element.color,
                        stroke: '#6366f1',
                        strokeWidth: 2,
                        opacity: element.opacity,
                        cornerRadius: 4,
                        offsetX: width / 2,
                        offsetY: height / 2
                    });
                }
                break;

            case CONSTANTS.ELEMENT_SHAPES.CIRCLE:
                shapeObj = new Konva.Circle({
                    radius: Math.min(width, height) / 2,
                    fill: element.color,
                    stroke: '#6366f1',
                    strokeWidth: 2,
                    opacity: element.opacity,
                    offsetX: Math.min(width, height) / 2,
                    offsetY: Math.min(width, height) / 2
                });
                break;

            case CONSTANTS.ELEMENT_SHAPES.ELLIPSE:
                shapeObj = new Konva.Ellipse({
                    radiusX: width / 2,
                    radiusY: height / 2,
                    fill: element.color,
                    stroke: '#6366f1',
                    strokeWidth: 2,
                    opacity: element.opacity,
                    offsetX: width / 2,
                    offsetY: height / 2
                });
                break;

            case CONSTANTS.ELEMENT_SHAPES.TRIANGLE:
                shapeObj = new Konva.Polygon({
                    points: [0, -height/2, width/2, height/2, -width/2, height/2],
                    fill: element.color,
                    stroke: '#6366f1',
                    strokeWidth: 2,
                    opacity: element.opacity,
                    closed: true,
                    offsetX: 0,
                    offsetY: 0
                });
                break;

            case CONSTANTS.ELEMENT_SHAPES.DIAMOND:
                shapeObj = new Konva.Polygon({
                    points: [0, -height/2, width/2, 0, 0, height/2, -width/2, 0],
                    fill: element.color,
                    stroke: '#6366f1',
                    strokeWidth: 2,
                    opacity: element.opacity,
                    closed: true,
                    offsetX: 0,
                    offsetY: 0
                });
                break;

            case CONSTANTS.ELEMENT_SHAPES.HEXAGON:
                const angles = [];
                for (let i = 0; i < 6; i++) {
                    angles.push(Math.cos((i * 60 - 90) * Math.PI / 180) * width / 2);
                    angles.push(Math.sin((i * 60 - 90) * Math.PI / 180) * height / 2);
                }
                shapeObj = new Konva.Polygon({
                    points: angles,
                    fill: element.color,
                    stroke: '#6366f1',
                    strokeWidth: 2,
                    opacity: element.opacity,
                    closed: true,
                    offsetX: 0,
                    offsetY: 0
                });
                break;

            case CONSTANTS.ELEMENT_SHAPES.RECTANGLE:
            default:
                shapeObj = new Konva.Rect({
                    width: width,
                    height: height,
                    fill: element.color,
                    stroke: '#6366f1',
                    strokeWidth: 2,
                    opacity: element.opacity,
                    cornerRadius: 4,
                    offsetX: width / 2,
                    offsetY: height / 2
                });
                break;
        }

        // Rotation is handled by innerGroup in addElement(), not here
        return shapeObj;
    }

    /**
     * Add element to canvas
     */
    addElement(element) {
        if (!this.project) return null;

        // Skip polygon land_plot elements — they are drawn by drawLand()
        if (element.shape === 'polygon' && element.type === 'land_plot') {
            console.log('🔷 Skipping polygon land_plot in addElement — drawn by drawLand()');
            return null;
        }

        const x = Helpers.metersToPixels(element.x, this.project.pixelsPerMeter);
        const y = Helpers.metersToPixels(element.y, this.project.pixelsPerMeter);
        const width = Helpers.metersToPixels(element.width, this.project.pixelsPerMeter);
        const height = Helpers.metersToPixels(element.height, this.project.pixelsPerMeter);

        // Polygon elements (from geoportal) should be locked by default
        const isDraggable = !element.locked && element.shape !== 'polygon';

        const shape = new Konva.Group({
            x: x,
            y: y,
            draggable: isDraggable,
            name: 'element',
            offsetX: 0,
            offsetY: 0
        });

        // Create shape based on element.shape property
        const shapeObj = this.createShapeGroup(element, width, height);

        // Create inner group that rotates together (shape, label, emojis)
        const innerGroup = new Konva.Group({
            x: 0,
            y: 0,
            rotation: element.rotation
        });

        // Remove rotation from shapeObj since innerGroup handles it
        innerGroup.add(shapeObj);

        // Add inner group to outer shape
        shape.add(innerGroup);

        // For polygon shapes, keep them simple (no labels to avoid cluttering)
        const isPolygon = element.shape === 'polygon';

        if (!isPolygon) {
            // Label - centered on shape
            const label = new Konva.Text({
                text: element.name,
                fontSize: 12,
                fill: Helpers.getContrastingTextColor(element.color),
                align: 'center',
                verticalAlign: 'middle',
                width: width,
                height: height,
                x: 0,
                y: 0
            });
            label.offsetX(label.width() / 2);
            label.offsetY(label.height() / 2);

            innerGroup.add(label);

            // Emoji icon on element (80% of smaller dimension, repeated for strips)
            const defaults = CONSTANTS.ELEMENT_DEFAULTS[element.type];
            const emojiChar = defaults?.icon;
            if (emojiChar) {
                const minDim = Math.min(width, height);
                const maxDim = Math.max(width, height);
                const emojiSize = Math.max(8, minDim * 0.6);
                const aspectRatio = maxDim / minDim;
                const isStrip = aspectRatio > 3;

                if (isStrip) {
                    // Repeat emojis along the long axis
                    const isHorizontal = width > height;
                    const spacing = emojiSize * 1.1;
                    const count = Math.max(1, Math.floor(maxDim / spacing));
                    const totalLen = (count - 1) * spacing;
                    const startOffset = -totalLen / 2;

                    for (let i = 0; i < count; i++) {
                        const offset = startOffset + i * spacing;
                        const emojiText = new Konva.Text({
                            text: emojiChar,
                            fontSize: emojiSize,
                            x: isHorizontal ? offset : 0,
                            y: isHorizontal ? 0 : offset,
                            listening: false,
                            hitStrokeWidth: 0
                        });
                        emojiText.offsetX(emojiText.width() / 2);
                        emojiText.offsetY(emojiText.height() / 2);
                        innerGroup.add(emojiText);
                    }
                } else {
                    // Single centered emoji
                    const emojiText = new Konva.Text({
                        text: emojiChar,
                        fontSize: emojiSize,
                        x: 0,
                        y: 0,
                        listening: false,
                        hitStrokeWidth: 0
                    });
                    emojiText.offsetX(emojiText.width() / 2);
                    emojiText.offsetY(emojiText.height() / 2);
                    innerGroup.add(emojiText);
                }
            }

            // Dimension labels on each side
            const wLabel = `${Helpers.round(element.width, 1)}m`;
            const hLabel = `${Helpers.round(element.height, 1)}m`;
            const dimFontSize = 10;
            const dimOffset = 12;

            // Top side (width)
            const topDim = new Konva.Text({
                text: wLabel,
                fontSize: dimFontSize,
                fill: '#fbbf24',
                fontStyle: 'bold',
                align: 'center',
                x: 0,
                y: -height / 2 - dimOffset,
                rotation: element.rotation,
                listening: false
            });
            topDim.offsetX(topDim.width() / 2);
            shape.add(topDim);

            // Bottom side (width)
            const bottomDim = new Konva.Text({
                text: wLabel,
                fontSize: dimFontSize,
                fill: '#fbbf24',
                fontStyle: 'bold',
                align: 'center',
                x: 0,
                y: height / 2 + 3,
                rotation: element.rotation,
                listening: false
            });
            bottomDim.offsetX(bottomDim.width() / 2);
            shape.add(bottomDim);

            // Left side (height)
            const leftDim = new Konva.Text({
                text: hLabel,
                fontSize: dimFontSize,
                fill: '#fbbf24',
                fontStyle: 'bold',
                align: 'center',
                x: -width / 2 - dimOffset,
                y: 0,
                rotation: element.rotation - 90,
                listening: false
            });
            leftDim.offsetX(leftDim.width() / 2);
            leftDim.offsetY(leftDim.height() / 2);
            shape.add(leftDim);

            // Right side (height)
            const rightDim = new Konva.Text({
                text: hLabel,
                fontSize: dimFontSize,
                fill: '#fbbf24',
                fontStyle: 'bold',
                align: 'center',
                x: width / 2 + dimOffset,
                y: 0,
                rotation: element.rotation - 90,
                listening: false
            });
            rightDim.offsetX(rightDim.width() / 2);
            rightDim.offsetY(rightDim.height() / 2);
            shape.add(rightDim);
        } else {
            // For polygon, add a simple label at the top
            const label = new Konva.Text({
                text: element.name,
                fontSize: 11,
                fill: '#f1f5f9',
                align: 'center',
                y: -height / 2 - 20,
                x: 0
            });
            label.offsetX(label.width() / 2);
            shape.add(label);
        }

        // Store reference
        shape.elementId = element.id;
        shape.shapeObj = shapeObj; // Store shape object for later modification
        shape.innerGroup = innerGroup; // Store inner group for rotation
        this.elementsShapes.set(element.id, shape);

        // Event listeners
        shape.on('click', (e) => {
            e.cancelBubble = true;
            this.selectElement(element.id);
        });

        shape.on('mouseover', () => {
            this.hoveredElement = element.id;
            document.body.style.cursor = 'move';
            shapeObj.stroke('#fbbf24');
            shapeObj.strokeWidth(3);
            this.elementsLayer.draw();
        });

        shape.on('mouseout', () => {
            if (this.selectedElement !== element.id) {
                this.hoveredElement = null;
                document.body.style.cursor = 'default';
                shapeObj.stroke('#6366f1');
                shapeObj.strokeWidth(2);
                this.elementsLayer.draw();
            }
        });

        shape.on('dragmove', () => {
            const newX = Helpers.pixelsToMeters(shape.x(), this.project.pixelsPerMeter);
            const newY = Helpers.pixelsToMeters(shape.y(), this.project.pixelsPerMeter);
            element.updateProperty('x', newX);
            element.updateProperty('y', newY);

            document.dispatchEvent(new CustomEvent('elementMoved', {
                detail: { elementId: element.id, x: newX, y: newY }
            }));
        });

        shape.on('dragend', () => {
            // Snap to grid
            if (true) { // Enable snapping
                const snappedX = Helpers.snapToGrid(shape.x(), this.project.gridSize, this.project.pixelsPerMeter);
                const snappedY = Helpers.snapToGrid(shape.y(), this.project.gridSize, this.project.pixelsPerMeter);

                shape.to({
                    x: snappedX,
                    y: snappedY,
                    duration: 0.1
                });

                const newX = Helpers.pixelsToMeters(snappedX, this.project.pixelsPerMeter);
                const newY = Helpers.pixelsToMeters(snappedY, this.project.pixelsPerMeter);
                element.updateProperty('x', newX);
                element.updateProperty('y', newY);
            }

            document.dispatchEvent(new CustomEvent('elementDropped', {
                detail: { elementId: element.id }
            }));
        });

        this.elementsLayer.add(shape);
        this.elementsLayer.draw();

        return shape;
    }

    /**
     * Update element on canvas
     */
    updateElement(elementId, updates) {
        const element = this.project.getElement(elementId);
        if (!element) return;

        const shape = this.elementsShapes.get(elementId);
        if (!shape) return;

        const shapeObj = shape.shapeObj; // Get the actual shape object (Circle, Rect, Polygon, etc)
        const label = shape.findOne('Text');

        if (updates.hasOwnProperty('color')) {
            element.updateProperty('color', updates.color);
            if (shapeObj) {
                shapeObj.fill(element.color);
            }
            if (label) {
                label.fill(Helpers.getContrastingTextColor(element.color));
            }
        }

        if (updates.hasOwnProperty('name')) {
            element.updateProperty('name', updates.name);
            if (label) {
                label.text(element.name);
            }
        }

        if (updates.hasOwnProperty('width') || updates.hasOwnProperty('height')) {
            if (updates.hasOwnProperty('width')) {
                element.updateProperty('width', updates.width);
            }
            if (updates.hasOwnProperty('height')) {
                element.updateProperty('height', updates.height);
            }

            this.removeElement(elementId);
            this.addElement(element);
            this.selectElement(elementId);
            return;
        }

        if (updates.hasOwnProperty('rotation')) {
            element.updateProperty('rotation', updates.rotation);
            const innerGroup = shape.innerGroup;
            if (innerGroup) {
                innerGroup.rotation(element.rotation);
            }
        }

        if (updates.hasOwnProperty('locked')) {
            element.locked = updates.locked;
            shape.draggable(!element.locked);
        }

        if (updates.hasOwnProperty('visible')) {
            element.visible = updates.visible;
            shape.visible(element.visible);
        }

        if (updates.hasOwnProperty('opacity')) {
            element.updateProperty('opacity', updates.opacity);
            if (shapeObj) {
                shapeObj.opacity(element.opacity);
            }
        }

        if (updates.hasOwnProperty('shape')) {
            element.updateProperty('shape', updates.shape);
            // Rebuild the shape when shape type changes
            this.removeElement(elementId);
            this.addElement(element);
            this.selectElement(elementId);
            return;
        }

        this.elementsLayer.draw();
    }

    /**
     * Remove element from canvas
     */
    removeElement(elementId) {
        const shape = this.elementsShapes.get(elementId);
        if (shape) {
            shape.destroy();
            this.elementsShapes.delete(elementId);
            this.elementsLayer.draw();
        }
    }

    /**
     * Select element
     */
    selectElement(elementId) {
        this.deselectElement();
        this.selectedElement = elementId;

        const shape = this.elementsShapes.get(elementId);
        if (shape && shape.shapeObj) {
            shape.shapeObj.stroke('#fbbf24');
            shape.shapeObj.strokeWidth(3);
            this.elementsLayer.draw();
        }

        document.dispatchEvent(new CustomEvent('elementSelected', {
            detail: { elementId: elementId }
        }));
    }

    /**
     * Deselect element
     */
    deselectElement() {
        if (this.selectedElement) {
            const shape = this.elementsShapes.get(this.selectedElement);
            if (shape && shape.shapeObj) {
                shape.shapeObj.stroke('#6366f1');
                shape.shapeObj.strokeWidth(2);
                this.elementsLayer.draw();
            }
        }
        this.selectedElement = null;
    }

    /**
     * Render all elements
     */
    renderAllElements() {
        if (!this.project) return;
        // First clear all existing shapes from canvas
        this.elementsLayer.destroyChildren();
        this.elementsShapes.clear();
        // Then add all elements
        this.project.getAllElements().forEach(element => {
            this.addElement(element);
        });
    }

    /**
     * Handle zoom
     */
    handleZoom(e) {
        const oldScale = this.stage.scaleX();
        const pointer = this.stage.getPointerPosition();

        let direction = e.evt.deltaY > 0 ? -1 : 1;
        let newScale = oldScale * Math.pow(1.05, direction);

        newScale = Helpers.clamp(newScale, CONSTANTS.MIN_ZOOM, CONSTANTS.MAX_ZOOM);

        const mousePointTo = {
            x: (pointer.x - this.stage.x()) / oldScale,
            y: (pointer.y - this.stage.y()) / oldScale,
        };

        this.stage.scale({ x: newScale, y: newScale });

        this.stage.position({
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        });
        this.stage.batchDraw();

        document.dispatchEvent(new CustomEvent('zoomChanged', {
            detail: { scale: newScale }
        }));
    }

    /**
     * Fit view to project
     */
    fitView() {
        if (!this.project) return;

        const bounds = this.project.getBounds();
        const padding = 50;
        
        // Calculate scale to fit project in current viewport
        const scaleX = (this.width - padding * 2) / bounds.width;
        const scaleY = (this.height - padding * 2) / bounds.height;
        const scale = Math.min(scaleX, scaleY, CONSTANTS.MAX_ZOOM);
        
        // Ensure we don't go below MIN_ZOOM
        const finalScale = Math.max(scale, CONSTANTS.MIN_ZOOM);

        this.stage.scale({ x: finalScale, y: finalScale });
        
        // Center the view
        const scaledWidth = bounds.width * finalScale;
        const scaledHeight = bounds.height * finalScale;
        const offsetX = (this.width - scaledWidth) / 2;
        const offsetY = (this.height - scaledHeight) / 2;
        
        this.stage.position({
            x: offsetX,
            y: offsetY
        });
        this.stage.batchDraw();
    }

    /**
     * Reset view
     */
    resetView() {
        this.stage.scale({ x: 1, y: 1 });
        this.stage.position({ x: 0, y: 0 });
        this.stage.batchDraw();
    }

    /**
     * Get canvas as PNG
     */
    exportPNG() {
        return this.stage.toDataURL({ mimeType: 'image/png' });
    }

    /**
     * Handle resize
     */
    handleResize() {
        const container = this.stage.container();
        this.width = container.offsetWidth;
        this.height = container.offsetHeight;
        this.stage.width(this.width);
        this.stage.height(this.height);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Mouse move for coordinates display
        this.stage.on('mousemove', () => {
            const pos = this.stage.getPointerPosition();
            if (pos) {
                const stageX = (pos.x - this.stage.x()) / this.stage.scaleX();
                const stageY = (pos.y - this.stage.y()) / this.stage.scaleY();
                const ppm = this.project?.pixelsPerMeter || CONSTANTS.DEFAULT_PIXELS_PER_METER;
                const x = Helpers.pixelsToMeters(stageX, ppm);
                const y = Helpers.pixelsToMeters(stageY, ppm);

                document.dispatchEvent(new CustomEvent('cursorMoved', {
                    detail: { x: x, y: y, scale: this.stage.scaleX() }
                }));
            }
        });

        // Pan enabled via stage.draggable: true
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && this.selectedElement) {
                document.dispatchEvent(new CustomEvent('deleteElement', {
                    detail: { elementId: this.selectedElement }
                }));
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                document.dispatchEvent(new CustomEvent('undo'));
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                document.dispatchEvent(new CustomEvent('redo'));
            }

            // Zoom shortcuts
            if ((e.ctrlKey || e.metaKey) && e.key === '+') {
                e.preventDefault();
                this.handleZoom({ evt: { deltaY: -1 } });
            }

            if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                this.handleZoom({ evt: { deltaY: 1 } });
            }
        });
    }

    /**
     * Clear canvas
     */
    clear() {
        this.elementsShapes.clear();
        this.elementsLayer.destroyChildren();
        this.gridLayer.destroyChildren();
        this.elementsLayer.draw();
        this.gridLayer.draw();
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasManager;
}
