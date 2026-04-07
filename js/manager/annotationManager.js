/* ============================================
   ANNOTATION MANAGER
   Free text fields, arrows with callouts, notes
   ============================================ */

class AnnotationManager {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.annotationLayer = null;
        this.annotations = [];
        this.selectedAnnotation = null;
        this.mode = null; // 'text' | 'arrow' | 'note'
        this.defaultFontSize = 14;
        this.defaultColor = '#ffffff';
        this.arrowColor = '#ef4444';

        this.initLayer();
    }

    initLayer() {
        this.annotationLayer = new Konva.Layer({ name: 'annotationLayer' });
        this.canvasManager.stage.add(this.annotationLayer);
    }

    // ---- Mode management ----

    enableTextMode() {
        this.disableAllModes();
        this.mode = 'text';
        this.canvasManager.stage.draggable(false);
        document.getElementById('canvasContainer')?.classList.add('annotation-mode');
        this._bindTextMode();
        this._showIndicator('📝 Kliknij, aby dodać tekst');
    }

    enableArrowMode() {
        this.disableAllModes();
        this.mode = 'arrow';
        this.canvasManager.stage.draggable(false);
        document.getElementById('canvasContainer')?.classList.add('annotation-mode');
        this._bindArrowMode();
        this._showIndicator('➡️ Kliknij początek i koniec strzałki');
    }

    enableNoteMode() {
        this.disableAllModes();
        this.mode = 'note';
        this.canvasManager.stage.draggable(false);
        document.getElementById('canvasContainer')?.classList.add('annotation-mode');
        this._bindNoteMode();
        this._showIndicator('📌 Kliknij, aby dodać notatkę');
    }

    disableAllModes() {
        this.mode = null;
        const stage = this.canvasManager.stage;
        stage.off('click.text click.arrow click.arrow2 click.note mousemove.arrow');
        stage.draggable(true);
        document.getElementById('canvasContainer')?.classList.remove('annotation-mode');
        this._removeIndicator();
    }

    // ---- Text annotations ----

    _bindTextMode() {
        const stage = this.canvasManager.stage;
        stage.on('click.text', (e) => {
            if (e.evt.button !== 0) return;
            const pos = this._getStagePos(e);
            this._promptText('Wpisz tekst:', '', (text) => {
                if (!text) return;
                this._addTextAnnotation(pos.x, pos.y, text);
            });
        });
    }

    _addTextAnnotation(x, y, text, fontSize, color) {
        const annotation = {
            id: 'ann_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: 'text',
            x, y, text,
            fontSize: fontSize || this.defaultFontSize,
            color: color || this.defaultColor,
            rotation: 0,
            locked: false
        };

        const konvaText = new Konva.Text({
            x: x, y: y,
            text: text,
            fontSize: annotation.fontSize,
            fill: annotation.color,
            fontFamily: 'Arial, sans-serif',
            draggable: true,
            name: 'annotation',
            rotation: annotation.rotation
        });
        konvaText.setAttr('annotationId', annotation.id);

        this._attachEvents(konvaText, annotation);
        this.annotationLayer.add(konvaText);
        this.annotations.push(annotation);
        this.annotationLayer.batchDraw();
        return annotation;
    }

    // ---- Arrow annotations ----

    _bindArrowMode() {
        const stage = this.canvasManager.stage;
        let startPos = null;
        let preview = null;

        stage.on('click.arrow', (e) => {
            if (e.evt.button !== 0) return;
            const pos = this._getStagePos(e);

            if (!startPos) {
                startPos = pos;
                return;
            }

            // Second click — create arrow with optional label
            const endPos = pos;
            if (preview) { preview.destroy(); preview = null; }

            this._promptText('Opis strzałki (opcjonalny):', '', (label) => {
                this._addArrowAnnotation(startPos.x, startPos.y, endPos.x, endPos.y, label || '');
            });
            startPos = null;
        });

        stage.on('mousemove.arrow', (e) => {
            if (!startPos) return;
            const pos = this._getStagePos(e);
            if (preview) preview.destroy();
            preview = new Konva.Arrow({
                points: [startPos.x, startPos.y, pos.x, pos.y],
                stroke: this.arrowColor,
                fill: this.arrowColor,
                strokeWidth: 2,
                pointerLength: 10,
                pointerWidth: 8,
                opacity: 0.5,
                dash: [5, 5],
                name: 'preview'
            });
            this.annotationLayer.add(preview);
            this.annotationLayer.batchDraw();
        });
    }

    _addArrowAnnotation(x1, y1, x2, y2, label, color) {
        const annotation = {
            id: 'ann_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: 'arrow',
            x1, y1, x2, y2,
            label: label || '',
            color: color || this.arrowColor,
            strokeWidth: 2,
            locked: false
        };

        const group = new Konva.Group({ draggable: true, name: 'annotation' });
        group.setAttr('annotationId', annotation.id);

        const arrow = new Konva.Arrow({
            points: [x1, y1, x2, y2],
            stroke: annotation.color,
            fill: annotation.color,
            strokeWidth: annotation.strokeWidth,
            pointerLength: 12,
            pointerWidth: 10,
            lineCap: 'round',
            lineJoin: 'round'
        });
        group.add(arrow);

        if (label) {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            // Callout background
            const calloutText = new Konva.Text({
                text: label,
                fontSize: 12,
                fill: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                padding: 6,
                x: midX,
                y: midY - 20
            });
            const calloutBg = new Konva.Rect({
                x: midX - 4,
                y: midY - 24,
                width: calloutText.width() + 12,
                height: calloutText.height() + 8,
                fill: '#1e293b',
                stroke: annotation.color,
                strokeWidth: 1,
                cornerRadius: 4,
                opacity: 0.9
            });
            // Leader line to arrow midpoint
            const leader = new Konva.Line({
                points: [midX + calloutBg.width() / 2, midY, midX, midY],
                stroke: annotation.color,
                strokeWidth: 1,
                opacity: 0.6
            });
            group.add(leader);
            group.add(calloutBg);
            group.add(calloutText);
        }

        this._attachGroupEvents(group, annotation);
        this.annotationLayer.add(group);
        this.annotations.push(annotation);
        this.annotationLayer.batchDraw();
        return annotation;
    }

    // ---- Note (sticky note) annotations ----

    _bindNoteMode() {
        const stage = this.canvasManager.stage;
        stage.on('click.note', (e) => {
            if (e.evt.button !== 0) return;
            const pos = this._getStagePos(e);
            this._promptText('Treść notatki:', '', (text) => {
                if (!text) return;
                this._addNoteAnnotation(pos.x, pos.y, text);
            });
        });
    }

    _addNoteAnnotation(x, y, text, noteColor) {
        const color = noteColor || '#fbbf24';
        const annotation = {
            id: 'ann_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: 'note',
            x, y, text,
            color: color,
            width: 150,
            locked: false
        };

        const group = new Konva.Group({ x, y, draggable: true, name: 'annotation' });
        group.setAttr('annotationId', annotation.id);

        // Pin icon
        const pin = new Konva.Text({
            text: '📌',
            fontSize: 16,
            x: 2, y: -18,
            listening: false
        });

        // Note background
        const noteText = new Konva.Text({
            text: text,
            fontSize: 11,
            fill: '#1e293b',
            fontFamily: 'Arial, sans-serif',
            width: 140,
            padding: 8,
            x: 0, y: 0,
            wrap: 'word'
        });
        const bg = new Konva.Rect({
            x: 0, y: 0,
            width: 150,
            height: Math.max(40, noteText.height() + 8),
            fill: color,
            stroke: '#d97706',
            strokeWidth: 1,
            cornerRadius: 4,
            shadowColor: '#000',
            shadowBlur: 6,
            shadowOpacity: 0.3,
            shadowOffsetY: 2
        });

        group.add(bg);
        group.add(noteText);
        group.add(pin);

        this._attachGroupEvents(group, annotation);
        this.annotationLayer.add(group);
        this.annotations.push(annotation);
        this.annotationLayer.batchDraw();
        return annotation;
    }

    // ---- Events ----

    _attachEvents(konvaNode, annotation) {
        konvaNode.on('click', (e) => {
            e.cancelBubble = true;
            this.selectAnnotation(annotation.id);
        });
        konvaNode.on('dblclick', (e) => {
            e.cancelBubble = true;
            if (annotation.type === 'text') {
                this._promptText('Edytuj tekst:', annotation.text, (newText) => {
                    if (newText !== null) {
                        annotation.text = newText;
                        konvaNode.text(newText);
                        this.annotationLayer.batchDraw();
                    }
                });
            }
        });
        konvaNode.on('dragend', () => {
            annotation.x = konvaNode.x();
            annotation.y = konvaNode.y();
        });
    }

    _attachGroupEvents(group, annotation) {
        group.on('click', (e) => {
            e.cancelBubble = true;
            this.selectAnnotation(annotation.id);
        });
        group.on('dblclick', (e) => {
            e.cancelBubble = true;
            if (annotation.type === 'note') {
                this._promptText('Edytuj notatkę:', annotation.text, (newText) => {
                    if (newText !== null) {
                        annotation.text = newText;
                        const textNode = group.findOne('Text');
                        if (textNode && textNode.text() !== '📌') textNode.text(newText);
                        this.annotationLayer.batchDraw();
                    }
                });
            }
        });
        group.on('dragend', () => {
            if (annotation.type === 'note') {
                annotation.x = group.x();
                annotation.y = group.y();
            }
        });
    }

    // ---- Selection ----

    selectAnnotation(id) {
        this.deselectAnnotation();
        this.selectedAnnotation = id;
        const node = this._getNodeById(id);
        if (node) {
            // Add selection border
            const rect = node.getClientRect({ relativeTo: this.annotationLayer });
            const selRect = new Konva.Rect({
                x: rect.x - 3,
                y: rect.y - 3,
                width: rect.width + 6,
                height: rect.height + 6,
                stroke: '#3b82f6',
                strokeWidth: 2,
                dash: [4, 3],
                name: 'annotationSelection',
                listening: false
            });
            this.annotationLayer.add(selRect);
            this.annotationLayer.batchDraw();
        }
        this._showAnnotationProperties(id);
    }

    deselectAnnotation() {
        this.selectedAnnotation = null;
        this.annotationLayer.find('.annotationSelection').forEach(s => s.destroy());
        this.annotationLayer.batchDraw();
    }

    deleteAnnotation(id) {
        const node = this._getNodeById(id);
        if (node) node.destroy();
        this.annotations = this.annotations.filter(a => a.id !== id);
        if (this.selectedAnnotation === id) this.selectedAnnotation = null;
        this.annotationLayer.find('.annotationSelection').forEach(s => s.destroy());
        this.annotationLayer.batchDraw();
    }

    deleteSelectedAnnotation() {
        if (this.selectedAnnotation) this.deleteAnnotation(this.selectedAnnotation);
    }

    // ---- Properties panel ----

    _showAnnotationProperties(id) {
        const ann = this.annotations.find(a => a.id === id);
        if (!ann) return;
        const content = document.getElementById('propertiesContent');
        if (!content) return;

        const typeLabel = ann.type === 'text' ? 'Tekst' : ann.type === 'arrow' ? 'Strzałka' : 'Notatka';
        let html = `<div class="property-section"><h4>📝 ${typeLabel}</h4>`;

        if (ann.type === 'text' || ann.type === 'note') {
            html += `<div class="form-field">
                <label>Treść</label>
                <textarea rows="3" style="width:100%;resize:vertical;font-family:inherit;font-size:12px;padding:6px;border:1px solid var(--border);border-radius:4px;background:var(--bg-secondary);color:var(--text-primary);"
                    onchange="window.annotationManager?._updateText('${ann.id}',this.value)">${ann.text}</textarea>
            </div>`;
        }
        if (ann.type === 'arrow' && ann.label) {
            html += `<div class="form-field">
                <label>Opis</label>
                <input type="text" value="${ann.label}" style="width:100%"
                    onchange="window.annotationManager?._updateLabel('${ann.id}',this.value)">
            </div>`;
        }
        html += `<div class="form-field">
            <label>Kolor</label>
            <input type="color" value="${ann.color}"
                onchange="window.annotationManager?._updateColor('${ann.id}',this.value)">
        </div>`;
        if (ann.type === 'text') {
            html += `<div class="form-field">
                <label>Rozmiar czcionki</label>
                <input type="range" min="8" max="72" value="${ann.fontSize}"
                    oninput="window.annotationManager?._updateFontSize('${ann.id}',+this.value)">
            </div>`;
        }
        html += `<button class="btn btn-danger btn-block" onclick="window.annotationManager?.deleteAnnotation('${ann.id}')">
            🗑️ Usuń
        </button></div>`;
        content.innerHTML = html;
    }

    _updateText(id, text) {
        const ann = this.annotations.find(a => a.id === id);
        if (!ann) return;
        ann.text = text;
        const node = this._getNodeById(id);
        if (!node) return;
        if (ann.type === 'text') {
            node.text(text);
        } else if (ann.type === 'note') {
            const texts = node.find('Text');
            const noteText = texts.find(t => t.text() !== '📌');
            if (noteText) noteText.text(text);
        }
        this.annotationLayer.batchDraw();
    }

    _updateLabel(id, label) {
        const ann = this.annotations.find(a => a.id === id);
        if (ann) ann.label = label;
    }

    _updateColor(id, color) {
        const ann = this.annotations.find(a => a.id === id);
        if (!ann) return;
        ann.color = color;
        const node = this._getNodeById(id);
        if (!node) return;
        if (ann.type === 'text') {
            node.fill(color);
        } else if (ann.type === 'arrow') {
            const arrowShape = node.findOne('Arrow');
            if (arrowShape) { arrowShape.stroke(color); arrowShape.fill(color); }
        } else if (ann.type === 'note') {
            const bg = node.findOne('Rect');
            if (bg) bg.fill(color);
        }
        this.annotationLayer.batchDraw();
    }

    _updateFontSize(id, size) {
        const ann = this.annotations.find(a => a.id === id);
        if (!ann) return;
        ann.fontSize = size;
        const node = this._getNodeById(id);
        if (node && ann.type === 'text') {
            node.fontSize(size);
            this.annotationLayer.batchDraw();
        }
    }

    // ---- Helpers ----

    _getStagePos(e) {
        const stage = this.canvasManager.stage;
        const pos = stage.getPointerPosition();
        return {
            x: (pos.x - stage.x()) / stage.scaleX(),
            y: (pos.y - stage.y()) / stage.scaleY()
        };
    }

    _getNodeById(id) {
        return this.annotationLayer.find('.annotation').find(n => n.getAttr('annotationId') === id);
    }

    _promptText(question, defaultVal, callback) {
        const result = prompt(question, defaultVal || '');
        callback(result);
    }

    _showIndicator(text) {
        this._removeIndicator();
        const div = document.createElement('div');
        div.id = 'annotationModeIndicator';
        div.className = 'drawing-mode-indicator';
        div.textContent = text;
        document.getElementById('canvasContainer')?.appendChild(div);
    }

    _removeIndicator() {
        document.getElementById('annotationModeIndicator')?.remove();
    }

    // ---- Serialization ----

    getSerializableData() {
        return this.annotations.map(a => ({ ...a }));
    }

    loadAnnotations(data) {
        // Clear all
        this.annotationLayer.find('.annotation').forEach(n => n.destroy());
        this.annotations = [];
        this.selectedAnnotation = null;

        if (!Array.isArray(data)) return;
        data.forEach(a => {
            switch (a.type) {
                case 'text':
                    this._addTextAnnotation(a.x, a.y, a.text, a.fontSize, a.color);
                    break;
                case 'arrow':
                    this._addArrowAnnotation(a.x1, a.y1, a.x2, a.y2, a.label, a.color);
                    break;
                case 'note':
                    this._addNoteAnnotation(a.x, a.y, a.text, a.color);
                    break;
            }
        });
        this.annotationLayer.batchDraw();
    }
}
