/* ============================================
   DRAWING MANAGER
   Freehand drawing, polylines, Bezier curves
   ============================================ */

class DrawingManager {
    constructor(canvasManager, projectManager) {
        this.canvasManager = canvasManager;
        this.projectManager = projectManager;
        this.drawingLayer = null;
        this.mode = null; // 'freehand' | 'polyline' | 'bezier'
        this.isDrawing = false;
        this.currentPoints = [];
        this.currentLine = null;
        this.previewLine = null;
        this.drawings = [];
        this.selectedDrawing = null;
        this.strokeColor = '#ffffff';
        this.strokeWidth = 2;
        this.fillColor = '';
        this.opacity = 1;
        this.isClosed = false;
        this.smoothing = 0.3; // bezier tension

        this.initLayer();
    }

    initLayer() {
        this.drawingLayer = new Konva.Layer({ name: 'drawingLayer' });
        this.canvasManager.stage.add(this.drawingLayer);
    }

    // ---- Mode management ----

    enableFreehandMode() {
        this.disableAllModes();
        this.mode = 'freehand';
        this.canvasManager.stage.draggable(false);
        document.getElementById('canvasContainer')?.classList.add('drawing-mode');
        this._bindFreehand();
        this._showModeIndicator('✏️ Rysowanie odręczne — kliknij i przeciągnij');
    }

    enablePolylineMode() {
        this.disableAllModes();
        this.mode = 'polyline';
        this.canvasManager.stage.draggable(false);
        document.getElementById('canvasContainer')?.classList.add('drawing-mode');
        this._bindPolyline();
        this._showModeIndicator('📐 Rysowanie linii — klikaj, by dodawać punkty. Podwójne kliknięcie zamyka.');
    }

    enableBezierMode() {
        this.disableAllModes();
        this.mode = 'bezier';
        this.canvasManager.stage.draggable(false);
        document.getElementById('canvasContainer')?.classList.add('drawing-mode');
        this._bindBezier();
        this._showModeIndicator('〰️ Krzywe Béziera — klikaj by dodawać punkty. Podwójne kliknięcie zamyka.');
    }

    disableAllModes() {
        this.mode = null;
        this.isDrawing = false;
        this.currentPoints = [];
        const stage = this.canvasManager.stage;
        stage.off('mousedown.freehand mousemove.freehand mouseup.freehand');
        stage.off('click.polyline dblclick.polyline mousemove.polyline');
        stage.off('click.bezier dblclick.bezier mousemove.bezier');
        stage.off('mousemove.eraser click.eraser');
        stage.draggable(true);
        document.getElementById('canvasContainer')?.classList.remove('drawing-mode');
        document.getElementById('canvasContainer')?.classList.remove('eraser-mode');
        if (this.previewLine) {
            this.previewLine.destroy();
            this.previewLine = null;
        }
        // Clean up leftover markers and in-progress lines
        this.drawingLayer.find('.polyline-marker').forEach(m => m.destroy());
        this.drawingLayer.find('.bezier-marker').forEach(m => m.destroy());
        this.drawingLayer.find('.preview').forEach(m => m.destroy());
        this.drawingLayer.find('.eraser-cursor').forEach(m => m.destroy());
        if (this.currentLine) {
            this.currentLine.destroy();
            this.currentLine = null;
        }
        this._removeModeIndicator();
        this.drawingLayer.batchDraw();
    }

    // ---- Freehand drawing ----

    _bindFreehand() {
        const stage = this.canvasManager.stage;

        stage.on('mousedown.freehand', (e) => {
            if (e.evt.button !== 0) return;
            this.isDrawing = true;
            const pos = this._getStagePos(e);
            this.currentPoints = [pos.x, pos.y];

            this.currentLine = new Konva.Line({
                points: this.currentPoints.slice(),
                stroke: this.strokeColor,
                strokeWidth: this.strokeWidth,
                opacity: this.opacity,
                lineCap: 'round',
                lineJoin: 'round',
                tension: 0.5,
                globalCompositeOperation: 'source-over',
                name: 'drawing'
            });
            this.drawingLayer.add(this.currentLine);
        });

        stage.on('mousemove.freehand', (e) => {
            if (!this.isDrawing || !this.currentLine) return;
            const pos = this._getStagePos(e);
            this.currentPoints.push(pos.x, pos.y);
            this.currentLine.points(this.currentPoints.slice());
            this.drawingLayer.batchDraw();
        });

        stage.on('mouseup.freehand', () => {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            if (this.currentLine && this.currentPoints.length > 4) {
                // Simplify the path
                const simplified = this._simplifyPoints(this.currentPoints, 1.5);
                this.currentLine.points(simplified);
                this._finalizeDrawing(this.currentLine, simplified);
            } else if (this.currentLine) {
                this.currentLine.destroy();
            }
            this.currentLine = null;
            this.currentPoints = [];
            this.drawingLayer.batchDraw();
        });
    }

    // ---- Polyline drawing ----

    _bindPolyline() {
        const stage = this.canvasManager.stage;
        let vertices = [];

        stage.on('click.polyline', (e) => {
            if (e.evt.button !== 0) return;
            const pos = this._getStagePos(e);
            vertices.push(pos.x, pos.y);

            // Draw vertex marker
            const marker = new Konva.Circle({
                x: pos.x, y: pos.y,
                radius: 4,
                fill: this.strokeColor,
                stroke: '#ffffff',
                strokeWidth: 1,
                name: 'polyline-marker'
            });
            this.drawingLayer.add(marker);

            if (vertices.length >= 4) {
                if (this.currentLine) this.currentLine.destroy();
                this.currentLine = new Konva.Line({
                    points: vertices.slice(),
                    stroke: this.strokeColor,
                    strokeWidth: this.strokeWidth,
                    opacity: this.opacity,
                    lineCap: 'round',
                    lineJoin: 'round',
                    name: 'drawing'
                });
                this.drawingLayer.add(this.currentLine);
            }
            this.drawingLayer.batchDraw();
        });

        stage.on('mousemove.polyline', (e) => {
            if (vertices.length < 2) return;
            const pos = this._getStagePos(e);
            if (this.previewLine) this.previewLine.destroy();
            this.previewLine = new Konva.Line({
                points: [...vertices, pos.x, pos.y],
                stroke: this.strokeColor,
                strokeWidth: this.strokeWidth,
                opacity: 0.5,
                dash: [5, 5],
                lineCap: 'round',
                name: 'preview'
            });
            this.drawingLayer.add(this.previewLine);
            this.drawingLayer.batchDraw();
        });

        stage.on('dblclick.polyline', () => {
            if (vertices.length < 4) return;
            // Remove preview and markers
            this.drawingLayer.find('.polyline-marker').forEach(m => m.destroy());
            if (this.previewLine) { this.previewLine.destroy(); this.previewLine = null; }

            if (this.isClosed) {
                vertices.push(vertices[0], vertices[1]); // close the shape
            }

            if (this.currentLine) this.currentLine.destroy();
            const line = new Konva.Line({
                points: vertices.slice(),
                stroke: this.strokeColor,
                strokeWidth: this.strokeWidth,
                opacity: this.opacity,
                fill: this.fillColor || undefined,
                closed: this.isClosed,
                lineCap: 'round',
                lineJoin: 'round',
                name: 'drawing'
            });
            this.drawingLayer.add(line);
            this._finalizeDrawing(line, vertices.slice());

            vertices = [];
            this.currentLine = null;
            this.drawingLayer.batchDraw();
        });
    }

    // ---- Bezier curve drawing ----

    _bindBezier() {
        const stage = this.canvasManager.stage;
        let vertices = [];

        stage.on('click.bezier', (e) => {
            if (e.evt.button !== 0) return;
            const pos = this._getStagePos(e);
            vertices.push(pos.x, pos.y);

            // Draw control point marker
            const marker = new Konva.Circle({
                x: pos.x, y: pos.y,
                radius: 5,
                fill: '#a855f7',
                stroke: '#ffffff',
                strokeWidth: 1,
                name: 'bezier-marker'
            });
            this.drawingLayer.add(marker);

            if (vertices.length >= 4) {
                if (this.currentLine) this.currentLine.destroy();
                this.currentLine = new Konva.Line({
                    points: vertices.slice(),
                    stroke: this.strokeColor,
                    strokeWidth: this.strokeWidth,
                    opacity: this.opacity,
                    tension: this.smoothing,
                    bezier: false,
                    lineCap: 'round',
                    lineJoin: 'round',
                    name: 'drawing'
                });
                this.drawingLayer.add(this.currentLine);
            }
            this.drawingLayer.batchDraw();
        });

        stage.on('mousemove.bezier', (e) => {
            if (vertices.length < 2) return;
            const pos = this._getStagePos(e);
            if (this.previewLine) this.previewLine.destroy();
            this.previewLine = new Konva.Line({
                points: [...vertices, pos.x, pos.y],
                stroke: '#a855f7',
                strokeWidth: this.strokeWidth,
                opacity: 0.4,
                tension: this.smoothing,
                dash: [5, 5],
                lineCap: 'round',
                name: 'preview'
            });
            this.drawingLayer.add(this.previewLine);
            this.drawingLayer.batchDraw();
        });

        stage.on('dblclick.bezier', () => {
            if (vertices.length < 4) return;
            this.drawingLayer.find('.bezier-marker').forEach(m => m.destroy());
            if (this.previewLine) { this.previewLine.destroy(); this.previewLine = null; }

            if (this.currentLine) this.currentLine.destroy();
            const curve = new Konva.Line({
                points: vertices.slice(),
                stroke: this.strokeColor,
                strokeWidth: this.strokeWidth,
                opacity: this.opacity,
                fill: this.fillColor || undefined,
                tension: this.smoothing,
                closed: this.isClosed,
                lineCap: 'round',
                lineJoin: 'round',
                name: 'drawing'
            });
            this.drawingLayer.add(curve);
            this._finalizeDrawing(curve, vertices.slice());

            vertices = [];
            this.currentLine = null;
            this.drawingLayer.batchDraw();
        });
    }

    // ---- Drawing management ----

    _finalizeDrawing(konvaShape, points) {
        const drawing = {
            id: 'draw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: this.mode,
            points: points,
            strokeColor: this.strokeColor,
            strokeWidth: this.strokeWidth,
            fillColor: this.fillColor,
            opacity: this.opacity,
            tension: this.smoothing,
            closed: this.isClosed,
            locked: false
        };
        this.drawings.push(drawing);
        konvaShape.setAttr('drawingId', drawing.id);

        // Make drawing selectable
        konvaShape.on('click', (e) => {
            e.cancelBubble = true;
            this.selectDrawing(drawing.id);
        });
        konvaShape.draggable(true);

        // Track drag
        konvaShape.on('dragend', () => {
            // Update stored points based on new position
            const dx = konvaShape.x();
            const dy = konvaShape.y();
            const pts = drawing.points;
            for (let i = 0; i < pts.length; i += 2) {
                pts[i] += dx;
                pts[i + 1] += dy;
            }
            konvaShape.x(0);
            konvaShape.y(0);
            konvaShape.points(pts);
            this.drawingLayer.batchDraw();
        });
    }

    selectDrawing(drawingId) {
        this.deselectDrawing();
        this.selectedDrawing = drawingId;
        const shape = this._getShapeById(drawingId);
        if (shape) {
            shape.stroke('#3b82f6');
            shape.strokeWidth(this.strokeWidth + 2);
            this.drawingLayer.batchDraw();
        }
        this._showDrawingProperties(drawingId);
    }

    deselectDrawing() {
        if (this.selectedDrawing) {
            const shape = this._getShapeById(this.selectedDrawing);
            const drawing = this.drawings.find(d => d.id === this.selectedDrawing);
            if (shape && drawing) {
                shape.stroke(drawing.strokeColor);
                shape.strokeWidth(drawing.strokeWidth);
            }
            this.selectedDrawing = null;
            this.drawingLayer.batchDraw();
        }
    }

    deleteDrawing(drawingId) {
        const shape = this._getShapeById(drawingId);
        if (shape) shape.destroy();
        this.drawings = this.drawings.filter(d => d.id !== drawingId);
        if (this.selectedDrawing === drawingId) this.selectedDrawing = null;
        this.drawingLayer.batchDraw();
    }

    deleteSelectedDrawing() {
        if (this.selectedDrawing) {
            this.deleteDrawing(this.selectedDrawing);
        }
    }

    clearAllDrawings() {
        this.drawingLayer.find('.drawing').forEach(s => s.destroy());
        this.drawings = [];
        this.selectedDrawing = null;
        this.drawingLayer.batchDraw();
    }

    updateDrawingProperty(drawingId, prop, value) {
        const drawing = this.drawings.find(d => d.id === drawingId);
        const shape = this._getShapeById(drawingId);
        if (!drawing || !shape) return;

        drawing[prop] = value;
        switch (prop) {
            case 'strokeColor': shape.stroke(value); break;
            case 'strokeWidth': shape.strokeWidth(value); break;
            case 'opacity': shape.opacity(value); break;
            case 'tension': shape.tension(value); break;
        }
        this.drawingLayer.batchDraw();
    }

    // ---- Helpers ----

    // ---- Eraser tool ----

    enableEraserMode() {
        this.disableAllModes();
        this.mode = 'eraser';
        this.canvasManager.stage.draggable(false);
        document.getElementById('canvasContainer')?.classList.add('eraser-mode');
        this._bindEraser();
        this._showModeIndicator('🧽 Gąbka — kliknij na rysunek, aby go usunąć');
    }

    _bindEraser() {
        const stage = this.canvasManager.stage;
        let eraserCursor = null;
        const ERASER_RADIUS = 14;

        stage.on('mousemove.eraser', (e) => {
            const pos = this._getStagePos(e);
            if (!eraserCursor) {
                eraserCursor = new Konva.Circle({
                    x: pos.x, y: pos.y,
                    radius: ERASER_RADIUS,
                    stroke: '#f87171',
                    strokeWidth: 2,
                    dash: [4, 3],
                    fill: 'rgba(248, 113, 113, 0.1)',
                    listening: false,
                    name: 'eraser-cursor'
                });
                this.drawingLayer.add(eraserCursor);
            } else {
                eraserCursor.position({ x: pos.x, y: pos.y });
            }

            // Highlight drawings under eraser
            this.drawingLayer.find('.drawing').forEach(shape => {
                const drawingId = shape.getAttr('drawingId');
                const drawing = this.drawings.find(d => d.id === drawingId);
                const pts = shape.points();
                let isNear = false;
                for (let i = 0; i < pts.length; i += 2) {
                    const dx = pts[i] + shape.x() - pos.x;
                    const dy = pts[i + 1] + shape.y() - pos.y;
                    if (Math.sqrt(dx * dx + dy * dy) < ERASER_RADIUS + 10) {
                        isNear = true;
                        break;
                    }
                }
                if (isNear) {
                    shape.stroke('#f87171');
                    shape.opacity(0.5);
                } else if (drawing) {
                    shape.stroke(drawing.strokeColor);
                    shape.opacity(drawing.opacity);
                }
            });

            this.drawingLayer.batchDraw();
        });

        stage.on('click.eraser', (e) => {
            if (e.evt.button !== 0) return;
            const pos = this._getStagePos(e);

            // Find and delete drawings near click
            const toDelete = [];
            this.drawingLayer.find('.drawing').forEach(shape => {
                const pts = shape.points();
                for (let i = 0; i < pts.length; i += 2) {
                    const dx = pts[i] + shape.x() - pos.x;
                    const dy = pts[i + 1] + shape.y() - pos.y;
                    if (Math.sqrt(dx * dx + dy * dy) < ERASER_RADIUS + 10) {
                        toDelete.push(shape.getAttr('drawingId'));
                        break;
                    }
                }
            });

            toDelete.forEach(id => this.deleteDrawing(id));
            if (toDelete.length > 0) {
                this.drawingLayer.batchDraw();
            }
        });
    }

    _getStagePos(e) {
        const stage = this.canvasManager.stage;
        const pos = stage.getPointerPosition();
        return {
            x: (pos.x - stage.x()) / stage.scaleX(),
            y: (pos.y - stage.y()) / stage.scaleY()
        };
    }

    _getShapeById(drawingId) {
        return this.drawingLayer.find('.drawing').find(s => s.getAttr('drawingId') === drawingId);
    }

    _simplifyPoints(points, tolerance) {
        if (points.length <= 6) return points;
        const result = [points[0], points[1]];
        for (let i = 2; i < points.length - 2; i += 2) {
            const dx = points[i] - result[result.length - 2];
            const dy = points[i + 1] - result[result.length - 1];
            if (Math.sqrt(dx * dx + dy * dy) > tolerance) {
                result.push(points[i], points[i + 1]);
            }
        }
        result.push(points[points.length - 2], points[points.length - 1]);
        return result;
    }

    _showModeIndicator(text) {
        this._removeModeIndicator();
        const indicator = document.createElement('div');
        indicator.id = 'drawingModeIndicator';
        indicator.className = 'drawing-mode-indicator';
        indicator.textContent = text;
        document.getElementById('canvasContainer')?.appendChild(indicator);
    }

    _removeModeIndicator() {
        document.getElementById('drawingModeIndicator')?.remove();
    }

    _showDrawingProperties(drawingId) {
        const drawing = this.drawings.find(d => d.id === drawingId);
        if (!drawing) return;
        const content = document.getElementById('propertiesContent');
        if (!content) return;
        const ppm = this.canvasManager.project?.pixelsPerMeter || 30;

        content.innerHTML = `
            <div class="property-section">
                <h4>✏️ Rysunek (${drawing.type === 'freehand' ? 'odręczny' : drawing.type === 'polyline' ? 'linia' : 'krzywa'})</h4>
                <div class="form-field">
                    <label>Kolor linii</label>
                    <input type="color" value="${drawing.strokeColor}" 
                        onchange="window.drawingManager?.updateDrawingProperty('${drawing.id}','strokeColor',this.value)">
                </div>
                <div class="form-field">
                    <label>Grubość linii</label>
                    <input type="range" min="1" max="20" value="${drawing.strokeWidth}" 
                        oninput="window.drawingManager?.updateDrawingProperty('${drawing.id}','strokeWidth',+this.value)">
                </div>
                <div class="form-field">
                    <label>Przezroczystość</label>
                    <input type="range" min="0" max="1" step="0.1" value="${drawing.opacity}" 
                        oninput="window.drawingManager?.updateDrawingProperty('${drawing.id}','opacity',+this.value)">
                </div>
                ${drawing.type === 'bezier' ? `
                <div class="form-field">
                    <label>Wygładzenie</label>
                    <input type="range" min="0" max="1" step="0.05" value="${drawing.tension}" 
                        oninput="window.drawingManager?.updateDrawingProperty('${drawing.id}','tension',+this.value)">
                </div>` : ''}
                <button class="btn btn-danger btn-block" onclick="window.drawingManager?.deleteDrawing('${drawing.id}')">
                    🗑️ Usuń rysunek
                </button>
            </div>`;
    }

    // ---- Serialization ----

    getSerializableData() {
        return this.drawings.map(d => ({ ...d }));
    }

    loadDrawings(data) {
        this.clearAllDrawings();
        if (!Array.isArray(data)) return;
        data.forEach(d => {
            const line = new Konva.Line({
                points: d.points,
                stroke: d.strokeColor || '#ffffff',
                strokeWidth: d.strokeWidth || 2,
                opacity: d.opacity || 1,
                tension: d.tension || 0,
                fill: d.fillColor || undefined,
                closed: d.closed || false,
                lineCap: 'round',
                lineJoin: 'round',
                name: 'drawing',
                draggable: !d.locked
            });
            line.setAttr('drawingId', d.id);
            this.drawingLayer.add(line);
            this.drawings.push({ ...d });

            line.on('click', (e) => {
                e.cancelBubble = true;
                this.selectDrawing(d.id);
            });
            line.on('dragend', () => {
                const drawing = this.drawings.find(dr => dr.id === d.id);
                if (!drawing) return;
                const dx = line.x();
                const dy = line.y();
                for (let i = 0; i < drawing.points.length; i += 2) {
                    drawing.points[i] += dx;
                    drawing.points[i + 1] += dy;
                }
                line.x(0);
                line.y(0);
                line.points(drawing.points);
            });
        });
        this.drawingLayer.batchDraw();
    }

    setStrokeColor(color) { this.strokeColor = color; }
    setStrokeWidth(w) { this.strokeWidth = w; }
    setFillColor(color) { this.fillColor = color; }
    setOpacity(o) { this.opacity = o; }
    setClosed(v) { this.isClosed = v; }
    setSmoothing(v) { this.smoothing = v; }
}
