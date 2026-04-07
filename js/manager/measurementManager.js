/* ============================================
   MEASUREMENT & BUILDING NORMS MANAGER
   Distance measurements, setback lines, 
   coverage %, biological surface, collisions
   ============================================ */

class MeasurementManager {
    constructor(canvasManager, projectManager) {
        this.canvasManager = canvasManager;
        this.projectManager = projectManager;
        this.measureLayer = null;
        this.isMeasuring = false;
        this.measureStart = null;
        this.measureLine = null;
        this.measureLabel = null;
        this.showSetbackLines = false;
        this.showCollisions = false;
        this._perimeterActive = false;
        this._perimeterEscHandler = null;
        
        this.initLayer();
    }

    initLayer() {
        this.measureLayer = new Konva.Layer();
        this.canvasManager.stage.add(this.measureLayer);
    }

    // ---- Distance Measurement Tool ----

    enableMeasureMode() {
        this.isMeasuring = true;
        const stage = this.canvasManager.stage;
        stage.draggable(false);
        document.getElementById('canvasContainer')?.classList.add('measure-mode');

        stage.on('click.measure', (e) => {
            const pos = stage.getPointerPosition();
            const ppm = this.canvasManager.project?.pixelsPerMeter || 30;
            const stageX = (pos.x - stage.x()) / stage.scaleX();
            const stageY = (pos.y - stage.y()) / stage.scaleY();

            if (!this.measureStart) {
                this.measureStart = { x: stageX, y: stageY };

                // Start marker
                const marker = new Konva.Circle({
                    x: stageX, y: stageY,
                    radius: 4, fill: '#ef4444', stroke: '#fff', strokeWidth: 1
                });
                this.measureLayer.add(marker);
                this.measureLayer.draw();
            } else {
                const endX = stageX, endY = stageY;
                const dx = endX - this.measureStart.x;
                const dy = endY - this.measureStart.y;
                const distPx = Math.sqrt(dx * dx + dy * dy);
                const distM = Helpers.pixelsToMeters(distPx, ppm);

                // Draw line
                const line = new Konva.Line({
                    points: [this.measureStart.x, this.measureStart.y, endX, endY],
                    stroke: '#ef4444', strokeWidth: 2, dash: [6, 3]
                });

                // End marker
                const marker = new Konva.Circle({
                    x: endX, y: endY,
                    radius: 4, fill: '#ef4444', stroke: '#fff', strokeWidth: 1
                });

                // Distance label
                const midX = (this.measureStart.x + endX) / 2;
                const midY = (this.measureStart.y + endY) / 2;
                const label = new Konva.Label({ x: midX, y: midY - 12 });
                label.add(new Konva.Tag({ fill: '#1e293b', cornerRadius: 4, pointerDirection: 'down', pointerWidth: 8, pointerHeight: 5 }));
                label.add(new Konva.Text({ text: `${Helpers.round(distM, 2)}m`, fontSize: 13, fontStyle: 'bold', fill: '#fbbf24', padding: 5 }));

                this.measureLayer.add(line);
                this.measureLayer.add(marker);
                this.measureLayer.add(label);
                this.measureLayer.draw();

                this.measureStart = null;
            }
        });

        stage.on('mousemove.measure', () => {
            if (!this.measureStart) return;
            const pos = stage.getPointerPosition();
            const stageX = (pos.x - stage.x()) / stage.scaleX();
            const stageY = (pos.y - stage.y()) / stage.scaleY();
            const ppm = this.canvasManager.project?.pixelsPerMeter || 30;

            if (this.measureLine) this.measureLine.destroy();
            if (this.measureLabel) this.measureLabel.destroy();

            this.measureLine = new Konva.Line({
                points: [this.measureStart.x, this.measureStart.y, stageX, stageY],
                stroke: '#ef4444', strokeWidth: 1.5, dash: [4, 4], opacity: 0.7, listening: false
            });

            const dx = stageX - this.measureStart.x;
            const dy = stageY - this.measureStart.y;
            const distM = Helpers.pixelsToMeters(Math.sqrt(dx * dx + dy * dy), ppm);
            const midX = (this.measureStart.x + stageX) / 2;
            const midY = (this.measureStart.y + stageY) / 2;

            this.measureLabel = new Konva.Text({
                x: midX + 5, y: midY - 15,
                text: `${Helpers.round(distM, 2)}m`,
                fontSize: 12, fill: '#fbbf24', fontStyle: 'bold', listening: false
            });

            this.measureLayer.add(this.measureLine);
            this.measureLayer.add(this.measureLabel);
            this.measureLayer.draw();
        });
    }

    disableMeasureMode() {
        this.isMeasuring = false;
        this.measureStart = null;
        const stage = this.canvasManager.stage;
        stage.off('click.measure');
        stage.off('mousemove.measure');
        stage.draggable(true);
        document.getElementById('canvasContainer')?.classList.remove('measure-mode');
        if (this.measureLine) { this.measureLine.destroy(); this.measureLine = null; }
        if (this.measureLabel) { this.measureLabel.destroy(); this.measureLabel = null; }
    }

    clearMeasurements() {
        this.measureLayer.destroyChildren();
        this.measureLayer.draw();
        this.measureStart = null;
        if (this.measureLine) { this.measureLine = null; }
        if (this.measureLabel) { this.measureLabel = null; }
    }

    // ---- Setback Lines (Linie Zabudowy) ----

    toggleSetbackLines() {
        this.showSetbackLines = !this.showSetbackLines;
        this.drawSetbackLines();
    }

    drawSetbackLines() {
        // Remove old setback lines
        this.measureLayer.find('.setback-line').forEach(n => n.destroy());
        this.measureLayer.find('.setback-label').forEach(n => n.destroy());

        if (!this.showSetbackLines || !this.canvasManager.project) {
            this.measureLayer.draw();
            return;
        }

        const ppm = this.canvasManager.project.pixelsPerMeter;
        const w = Helpers.metersToPixels(this.canvasManager.project.landWidth, ppm);
        const h = Helpers.metersToPixels(this.canvasManager.project.landHeight, ppm);
        
        // Polish building law distances (in pixels)
        const setbacks = [
            { meters: 3, color: '#ef4444', label: '3m (bud. bez okien)' },
            { meters: 4, color: '#f97316', label: '4m (bud. z oknami)' },
        ];

        // If there's a road, add road setback
        if (this.canvasManager.project.roadSide) {
            setbacks.push({ meters: 5, color: '#8b5cf6', label: '5m (od drogi)' });
            setbacks.push({ meters: 6, color: '#6366f1', label: '6m (od drogi pub.)' });
        }

        setbacks.forEach(sb => {
            const offset = Helpers.metersToPixels(sb.meters, ppm);

            // Draw dashed rectangle at setback distance from boundary
            const rect = new Konva.Rect({
                x: offset,
                y: offset,
                width: w - 2 * offset,
                height: h - 2 * offset,
                stroke: sb.color,
                strokeWidth: 1.5,
                dash: [8, 4],
                fill: 'transparent',
                listening: false,
                name: 'setback-line'
            });
            this.measureLayer.add(rect);

            // Label
            const label = new Konva.Text({
                x: offset + 5,
                y: offset - 16,
                text: sb.label,
                fontSize: 11,
                fill: sb.color,
                fontStyle: 'bold',
                listening: false,
                name: 'setback-label'
            });
            this.measureLayer.add(label);
        });

        this.measureLayer.draw();
    }

    // ---- Building Coverage & Biological Surface ----

    calculateCoverage() {
        const project = this.projectManager.getProject();
        if (!project) return null;

        const landArea = project.landWidth * project.landHeight;
        
        // Use polygon area if available
        const polygonEl = project.elements.find(e => e.shape === 'polygon' && e.properties?.area);
        const actualLandArea = polygonEl ? polygonEl.properties.area : landArea;

        let buildingArea = 0;
        let greenArea = 0;
        let hardscapeArea = 0;
        let infraArea = 0;

        project.elements.forEach(el => {
            const area = el.width * el.height;
            if (CONSTANTS.BUILDING_TYPES.includes(el.type)) buildingArea += area;
            else if (CONSTANTS.GREEN_TYPES.includes(el.type)) greenArea += area;
            else if (CONSTANTS.HARDSCAPE_TYPES.includes(el.type)) hardscapeArea += area;
            else if (CONSTANTS.INFRASTRUCTURE_TYPES.includes(el.type)) infraArea += area;
        });

        const buildingCoverage = (buildingArea / actualLandArea) * 100;
        const biologicalSurface = ((actualLandArea - buildingArea - hardscapeArea - infraArea) / actualLandArea) * 100;
        const totalUsed = buildingArea + greenArea + hardscapeArea + infraArea;

        return {
            landArea: Helpers.round(actualLandArea, 0),
            buildingArea: Helpers.round(buildingArea, 1),
            greenArea: Helpers.round(greenArea, 1),
            hardscapeArea: Helpers.round(hardscapeArea, 1),
            infraArea: Helpers.round(infraArea, 1),
            buildingCoverage: Helpers.round(buildingCoverage, 1),
            biologicalSurface: Helpers.round(biologicalSurface, 1),
            totalUsed: Helpers.round(totalUsed, 1),
            freeArea: Helpers.round(actualLandArea - totalUsed, 1),
            // Polish law thresholds
            isBuildingCoverageOk: buildingCoverage <= CONSTANTS.MAX_BUILDING_COVERAGE,
            isBiologicalSurfaceOk: biologicalSurface >= CONSTANTS.MIN_BIOLOGICAL_SURFACE
        };
    }

    // ---- Collision Detection ----

    toggleCollisionCheck() {
        this.showCollisions = !this.showCollisions;
        this.checkCollisions();
    }

    checkCollisions() {
        this.measureLayer.find('.collision-marker').forEach(n => n.destroy());

        if (!this.canvasManager.project) {
            this.measureLayer.draw();
            return { collisions: 0, boundaryWarnings: 0 };
        }

        const elements = this.canvasManager.project.elements.filter(e => e.type !== 'land_plot' && e.shape !== 'polygon');
        const collisions = [];

        for (let i = 0; i < elements.length; i++) {
            for (let j = i + 1; j < elements.length; j++) {
                const a = elements[i], b = elements[j];
                if (this.elementsOverlap(a, b)) {
                    collisions.push([a, b]);
                }
            }
        }

        // Check distance from boundary
        const project = this.canvasManager.project;
        const ppm = project.pixelsPerMeter;
        const boundaryWarnings = [];
        
        elements.forEach(el => {
            if (!CONSTANTS.BUILDING_TYPES.includes(el.type)) return;
            const minX = el.x - el.width / 2;
            const minY = el.y - el.height / 2;
            const maxX = el.x + el.width / 2;
            const maxY = el.y + el.height / 2;

            const distances = [
                { side: 'west', dist: minX },
                { side: 'north', dist: minY },
                { side: 'east', dist: project.landWidth - maxX },
                { side: 'south', dist: project.landHeight - maxY }
            ];

            distances.forEach(d => {
                if (d.dist < CONSTANTS.BUFFER_ZONE_METERS) {
                    boundaryWarnings.push({ element: el, side: d.side, distance: Helpers.round(d.dist, 1) });
                }
            });
        });

        // Get current zoom scale for inverse scaling of markers
        const stage = this.canvasManager.stage;
        const zoom = stage.scaleX() || 1;
        const invScale = 1 / zoom;

        // Draw collision markers
        collisions.forEach(([a, b]) => {
            const ppm = project.pixelsPerMeter;
            const midX = Helpers.metersToPixels((a.x + b.x) / 2, ppm);
            const midY = Helpers.metersToPixels((a.y + b.y) / 2, ppm);

            const warning = new Konva.Text({
                x: midX, y: midY,
                text: '⚠️',
                fontSize: 20,
                scaleX: invScale,
                scaleY: invScale,
                listening: false,
                name: 'collision-marker'
            });
            warning.offsetX(warning.width() / 2);
            warning.offsetY(warning.height() / 2);
            this.measureLayer.add(warning);
        });

        // Draw boundary warnings
        boundaryWarnings.forEach(warn => {
            const px = Helpers.metersToPixels(warn.element.x, ppm);
            const py = Helpers.metersToPixels(warn.element.y, ppm);

            const label = new Konva.Label({
                x: px, y: py - 25 * invScale,
                scaleX: invScale,
                scaleY: invScale,
                name: 'collision-marker'
            });
            label.add(new Konva.Tag({ fill: '#ef4444', cornerRadius: 3 }));
            label.add(new Konva.Text({
                text: `${warn.distance}m od granicy ${warn.side}!`,
                fontSize: 10, fill: '#fff', padding: 3, fontStyle: 'bold'
            }));
            this.measureLayer.add(label);
        });

        this.measureLayer.draw();
        return { collisions: collisions.length, boundaryWarnings: boundaryWarnings.length };
    }

    elementsOverlap(a, b) {
        const aLeft = a.x - a.width / 2;
        const aRight = a.x + a.width / 2;
        const aTop = a.y - a.height / 2;
        const aBottom = a.y + a.height / 2;
        const bLeft = b.x - b.width / 2;
        const bRight = b.x + b.width / 2;
        const bTop = b.y - b.height / 2;
        const bBottom = b.y + b.height / 2;

        return !(aRight < bLeft || aLeft > bRight || aBottom < bTop || aTop > bBottom);
    }

    // ---- Distance Between Two Elements ----

    measureBetweenElements(id1, id2) {
        const a = this.projectManager.getElement(id1);
        const b = this.projectManager.getElement(id2);
        if (!a || !b) return null;

        const dist = Helpers.distance(a.x, a.y, b.x, b.y);
        return Helpers.round(dist, 2);
    }

    // ---- Angle Measurement Tool ----

    enableAngleMode() {
        this.disableMeasureMode();
        const stage = this.canvasManager.stage;
        stage.off('click.angle');
        stage.off('mousemove.angle');
        stage.draggable(false);
        document.getElementById('canvasContainer')?.classList.add('measure-mode');
        
        let points = []; // 3 points: A, vertex, B
        let markers = [];
        let previewLines = [];

        const getPos = () => {
            const pos = stage.getPointerPosition();
            return {
                x: (pos.x - stage.x()) / stage.scaleX(),
                y: (pos.y - stage.y()) / stage.scaleY()
            };
        };

        stage.on('click.angle', (e) => {
            if (e.evt.button !== 0) return;
            const pos = getPos();
            points.push(pos);

            const marker = new Konva.Circle({
                x: pos.x, y: pos.y,
                radius: 5, fill: '#a855f7', stroke: '#fff', strokeWidth: 1,
                name: 'angle-marker'
            });
            this.measureLayer.add(marker);
            markers.push(marker);

            if (points.length === 2) {
                // Draw line A -> vertex
                const line = new Konva.Line({
                    points: [points[0].x, points[0].y, points[1].x, points[1].y],
                    stroke: '#a855f7', strokeWidth: 2, dash: [4, 3]
                });
                this.measureLayer.add(line);
                previewLines.push(line);
            }

            if (points.length === 3) {
                // Draw line vertex -> B
                const line = new Konva.Line({
                    points: [points[1].x, points[1].y, points[2].x, points[2].y],
                    stroke: '#a855f7', strokeWidth: 2, dash: [4, 3]
                });
                this.measureLayer.add(line);

                // Calculate angle at vertex (points[1])
                const v = points[1];
                const a = points[0];
                const b = points[2];
                const angleA = Math.atan2(a.y - v.y, a.x - v.x);
                const angleB = Math.atan2(b.y - v.y, b.x - v.x);
                let angleDeg = Math.abs((angleA - angleB) * 180 / Math.PI);
                if (angleDeg > 180) angleDeg = 360 - angleDeg;

                // Draw arc
                const arcRadius = 20;
                const startAngle = Math.min(angleA, angleB);
                const endAngle = Math.max(angleA, angleB);
                const arc = new Konva.Arc({
                    x: v.x, y: v.y,
                    innerRadius: arcRadius - 1,
                    outerRadius: arcRadius + 1,
                    angle: angleDeg,
                    rotation: startAngle * 180 / Math.PI,
                    fill: 'rgba(168, 85, 247, 0.3)',
                    stroke: '#a855f7',
                    strokeWidth: 1
                });
                this.measureLayer.add(arc);

                // Label
                const labelAngle = (angleA + angleB) / 2;
                const labelX = v.x + Math.cos(labelAngle) * (arcRadius + 15);
                const labelY = v.y + Math.sin(labelAngle) * (arcRadius + 15);
                const label = new Konva.Label({ x: labelX, y: labelY });
                label.add(new Konva.Tag({ fill: '#1e293b', cornerRadius: 4 }));
                label.add(new Konva.Text({
                    text: `${Helpers.round(angleDeg, 1)}°`,
                    fontSize: 13, fontStyle: 'bold', fill: '#a855f7', padding: 5
                }));
                this.measureLayer.add(label);

                this.measureLayer.draw();

                // Reset for next measurement
                points = [];
                markers = [];
                previewLines = [];
                return;
            }

            this.measureLayer.draw();
        });

        stage.on('mousemove.angle', () => {
            if (points.length === 0 || points.length >= 3) return;
            const pos = getPos();
            // Remove old preview
            this.measureLayer.find('.angle-preview').forEach(n => n.destroy());
            const lastPt = points[points.length - 1];
            const preview = new Konva.Line({
                points: [lastPt.x, lastPt.y, pos.x, pos.y],
                stroke: '#a855f7', strokeWidth: 1.5, dash: [4, 4], opacity: 0.5,
                name: 'angle-preview', listening: false
            });
            this.measureLayer.add(preview);
            this.measureLayer.draw();
        });
    }

    disableAngleMode() {
        const stage = this.canvasManager.stage;
        stage.off('click.angle');
        stage.off('mousemove.angle');
        stage.draggable(true);
        document.getElementById('canvasContainer')?.classList.remove('measure-mode');
        this.measureLayer.find('.angle-preview').forEach(n => n.destroy());
        this.measureLayer.find('.angle-marker').forEach(n => n.destroy());
        this.measureLayer.draw();
    }

    // ---- Perimeter / Area of Selection ----

    measurePerimeterArea() {
        // Toggle off if already active
        if (this._perimeterActive) {
            this._cancelPerimeter();
            return;
        }

        const stage = this.canvasManager.stage;
        stage.draggable(false);
        document.getElementById('canvasContainer')?.classList.add('measure-mode');
        this._perimeterActive = true;

        let vertices = [];
        let markers = [];
        let lines = [];
        const ppm = this.canvasManager.project?.pixelsPerMeter || 30;
        const SNAP_RADIUS = 12; // pixels — magnet snap distance
        const AXIS_SNAP = 6;   // pixels — axis alignment snap threshold

        const getRawPos = () => {
            const pos = stage.getPointerPosition();
            if (!pos) return null;
            return {
                x: (pos.x - stage.x()) / stage.scaleX(),
                y: (pos.y - stage.y()) / stage.scaleY()
            };
        };

        // Snap position to existing vertices (magnet) and axis-align
        const snapPos = (raw) => {
            if (!raw) return raw;
            let pos = { x: raw.x, y: raw.y };
            let snappedToFirst = false;

            // 1. Snap to first vertex to close polygon
            if (vertices.length >= 3) {
                const first = vertices[0];
                const dist = Math.hypot(pos.x - first.x, pos.y - first.y);
                if (dist < SNAP_RADIUS) {
                    return { x: first.x, y: first.y, snappedToFirst: true };
                }
            }

            // 2. Snap to any existing vertex (magnet)
            for (let i = 0; i < vertices.length; i++) {
                const v = vertices[i];
                const dist = Math.hypot(pos.x - v.x, pos.y - v.y);
                if (dist < SNAP_RADIUS) {
                    pos = { x: v.x, y: v.y };
                    break;
                }
            }

            // 3. Axis-align: snap to horizontal/vertical of nearby vertices
            for (let i = 0; i < vertices.length; i++) {
                const v = vertices[i];
                if (Math.abs(pos.x - v.x) < AXIS_SNAP) {
                    pos.x = v.x;
                }
                if (Math.abs(pos.y - v.y) < AXIS_SNAP) {
                    pos.y = v.y;
                }
            }

            // 4. Grid snap
            const gridPx = (this.canvasManager.project?.gridSize || 1) * ppm;
            if (gridPx > 0) {
                const gx = Math.round(pos.x / gridPx) * gridPx;
                const gy = Math.round(pos.y / gridPx) * gridPx;
                if (Math.abs(pos.x - gx) < AXIS_SNAP) pos.x = gx;
                if (Math.abs(pos.y - gy) < AXIS_SNAP) pos.y = gy;
            }

            pos.snappedToFirst = snappedToFirst;
            return pos;
        };

        const finishPolygon = () => {
            if (vertices.length < 3) return;

            // Close the polygon
            const first = vertices[0];
            const last = vertices[vertices.length - 1];
            const closeLine = new Konva.Line({
                points: [last.x, last.y, first.x, first.y],
                stroke: '#10b981', strokeWidth: 2, dash: [5, 3]
            });
            this.measureLayer.add(closeLine);

            // Fill polygon
            const flatPoints = vertices.flatMap(v => [v.x, v.y]);
            const poly = new Konva.Line({
                points: flatPoints,
                fill: 'rgba(16, 185, 129, 0.15)',
                closed: true,
                stroke: '#10b981',
                strokeWidth: 1,
                listening: false
            });
            this.measureLayer.add(poly);

            // Calculate perimeter and area in meters
            let perimeter = 0;
            for (let i = 0; i < vertices.length; i++) {
                const a = vertices[i];
                const b = vertices[(i + 1) % vertices.length];
                const dx = Helpers.pixelsToMeters(b.x - a.x, ppm);
                const dy = Helpers.pixelsToMeters(b.y - a.y, ppm);
                perimeter += Math.sqrt(dx * dx + dy * dy);
            }

            // Shoelace formula for area
            let area = 0;
            for (let i = 0; i < vertices.length; i++) {
                const a = vertices[i];
                const b = vertices[(i + 1) % vertices.length];
                const ax = Helpers.pixelsToMeters(a.x, ppm);
                const ay = Helpers.pixelsToMeters(a.y, ppm);
                const bx = Helpers.pixelsToMeters(b.x, ppm);
                const by = Helpers.pixelsToMeters(b.y, ppm);
                area += ax * by - bx * ay;
            }
            area = Math.abs(area) / 2;

            // Label at centroid
            const cx = vertices.reduce((s, v) => s + v.x, 0) / vertices.length;
            const cy = vertices.reduce((s, v) => s + v.y, 0) / vertices.length;

            const label = new Konva.Label({ x: cx, y: cy - 20 });
            label.add(new Konva.Tag({ fill: '#1e293b', cornerRadius: 4, opacity: 0.9 }));
            label.add(new Konva.Text({
                text: `Obwód: ${Helpers.round(perimeter, 2)}m\nPow.: ${Helpers.round(area, 2)}m²`,
                fontSize: 13, fontStyle: 'bold', fill: '#10b981', padding: 6, lineHeight: 1.4
            }));
            this.measureLayer.add(label);
            this.measureLayer.draw();

            this._endPerimeterMode();
        };

        // Skip click right after a dblclick
        let skipNextClick = false;

        stage.on('click.perimeter', (e) => {
            if (e.evt.button !== 0) return;
            if (skipNextClick) { skipNextClick = false; return; }

            const raw = getRawPos();
            const pos = snapPos(raw);
            if (!pos) return;

            // Clicked on first vertex → close polygon
            if (pos.snappedToFirst && vertices.length >= 3) {
                finishPolygon();
                return;
            }

            vertices.push({ x: pos.x, y: pos.y });

            const marker = new Konva.Circle({
                x: pos.x, y: pos.y,
                radius: vertices.length === 1 ? 6 : 4,
                fill: vertices.length === 1 ? '#34d399' : '#10b981',
                stroke: '#fff', strokeWidth: 1.5,
                name: 'perim-marker'
            });
            this.measureLayer.add(marker);
            markers.push(marker);

            if (vertices.length >= 2) {
                const prev = vertices[vertices.length - 2];
                const line = new Konva.Line({
                    points: [prev.x, prev.y, pos.x, pos.y],
                    stroke: '#10b981', strokeWidth: 2, dash: [5, 3],
                    name: 'perim-line'
                });
                this.measureLayer.add(line);
                lines.push(line);
            }
            this.measureLayer.draw();
        });

        stage.on('dblclick.perimeter', () => {
            skipNextClick = true;
            finishPolygon();
        });

        stage.on('mousemove.perimeter', () => {
            if (vertices.length === 0) return;
            const raw = getRawPos();
            const pos = snapPos(raw);
            if (!pos) return;

            // Remove previous previews and snap indicators
            this.measureLayer.find('.perim-preview').forEach(n => n.destroy());
            this.measureLayer.find('.perim-snap-ring').forEach(n => n.destroy());
            this.measureLayer.find('.perim-axis-guide').forEach(n => n.destroy());

            const last = vertices[vertices.length - 1];

            // Preview line from last vertex to cursor
            const preview = new Konva.Line({
                points: [last.x, last.y, pos.x, pos.y],
                stroke: '#10b981', strokeWidth: 1.5, dash: [4, 4], opacity: 0.5,
                name: 'perim-preview', listening: false
            });
            this.measureLayer.add(preview);

            // Preview closing line to first vertex when ≥2 vertices
            if (vertices.length >= 2) {
                const first = vertices[0];
                const closingPreview = new Konva.Line({
                    points: [pos.x, pos.y, first.x, first.y],
                    stroke: '#10b981', strokeWidth: 1, dash: [3, 5], opacity: 0.25,
                    name: 'perim-preview', listening: false
                });
                this.measureLayer.add(closingPreview);
            }

            // Snap-to-first indicator ring
            if (pos.snappedToFirst && vertices.length >= 3) {
                const ring = new Konva.Circle({
                    x: vertices[0].x, y: vertices[0].y,
                    radius: 10, stroke: '#34d399', strokeWidth: 2,
                    fill: 'rgba(52, 211, 153, 0.2)',
                    name: 'perim-snap-ring', listening: false
                });
                this.measureLayer.add(ring);
            }

            // Axis alignment guides
            for (let i = 0; i < vertices.length; i++) {
                const v = vertices[i];
                if (pos.x === v.x && raw.x !== v.x) {
                    const guide = new Konva.Line({
                        points: [v.x, Math.min(v.y, pos.y) - 20, v.x, Math.max(v.y, pos.y) + 20],
                        stroke: '#60a5fa', strokeWidth: 0.5, dash: [3, 3], opacity: 0.6,
                        name: 'perim-axis-guide', listening: false
                    });
                    this.measureLayer.add(guide);
                }
                if (pos.y === v.y && raw.y !== v.y) {
                    const guide = new Konva.Line({
                        points: [Math.min(v.x, pos.x) - 20, v.y, Math.max(v.x, pos.x) + 20, v.y],
                        stroke: '#60a5fa', strokeWidth: 0.5, dash: [3, 3], opacity: 0.6,
                        name: 'perim-axis-guide', listening: false
                    });
                    this.measureLayer.add(guide);
                }
            }

            // Distance label near cursor
            const dx = Helpers.pixelsToMeters(pos.x - last.x, ppm);
            const dy = Helpers.pixelsToMeters(pos.y - last.y, ppm);
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0.05) {
                const midX = (last.x + pos.x) / 2;
                const midY = (last.y + pos.y) / 2;
                const distLabel = new Konva.Text({
                    x: midX + 5, y: midY - 14,
                    text: `${Helpers.round(dist, 2)}m`,
                    fontSize: 11, fill: '#a7f3d0', fontStyle: 'bold',
                    name: 'perim-preview', listening: false
                });
                this.measureLayer.add(distLabel);
            }

            this.measureLayer.draw();
        });

        // Escape key to cancel
        this._perimeterEscHandler = (e) => {
            if (e.key === 'Escape') {
                this._cancelPerimeter();
            }
        };
        document.addEventListener('keydown', this._perimeterEscHandler);
    }

    _endPerimeterMode() {
        const stage = this.canvasManager.stage;
        stage.off('click.perimeter');
        stage.off('dblclick.perimeter');
        stage.off('mousemove.perimeter');
        stage.draggable(true);
        document.getElementById('canvasContainer')?.classList.remove('measure-mode');
        this._perimeterActive = false;
        const btn = document.getElementById('perimeterBtn');
        if (btn) btn.classList.remove('active');
        if (this._perimeterEscHandler) {
            document.removeEventListener('keydown', this._perimeterEscHandler);
            this._perimeterEscHandler = null;
        }
        // Clean preview elements
        this.measureLayer.find('.perim-preview').forEach(n => n.destroy());
        this.measureLayer.find('.perim-snap-ring').forEach(n => n.destroy());
        this.measureLayer.find('.perim-axis-guide').forEach(n => n.destroy());
        this.measureLayer.draw();
    }

    _cancelPerimeter() {
        // Remove all perimeter drawing elements
        this.measureLayer.find('.perim-marker').forEach(n => n.destroy());
        this.measureLayer.find('.perim-line').forEach(n => n.destroy());
        this.measureLayer.find('.perim-preview').forEach(n => n.destroy());
        this.measureLayer.find('.perim-snap-ring').forEach(n => n.destroy());
        this.measureLayer.find('.perim-axis-guide').forEach(n => n.destroy());
        this._endPerimeterMode();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MeasurementManager;
}
