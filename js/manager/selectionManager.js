/* ============================================
   SELECTION & DRAWING TOOLS MANAGER
   Copy/Paste, Multi-select, Align, Z-order, Flip
   ============================================ */

class SelectionManager {
    constructor(canvasManager, projectManager, uiManager) {
        this.canvasManager = canvasManager;
        this.projectManager = projectManager;
        this.uiManager = uiManager;
        this.selectedElements = new Set();
        this.clipboard = [];
        this.isLassoMode = false;
        this.lassoRect = null;
        this.lassoStartPos = null;

        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

            // Ctrl+C - Copy
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                e.preventDefault();
                this.copySelected();
            }
            // Ctrl+V - Paste
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                e.preventDefault();
                this.paste();
            }
            // Ctrl+D - Duplicate
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.duplicateSelected();
            }
            // Ctrl+A - Select All
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                this.selectAll();
            }
            // Arrow keys - nudge
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                const step = e.shiftKey ? 1 : 0.5;
                let dx = 0, dy = 0;
                if (e.key === 'ArrowUp') dy = -step;
                if (e.key === 'ArrowDown') dy = step;
                if (e.key === 'ArrowLeft') dx = -step;
                if (e.key === 'ArrowRight') dx = step;
                this.nudgeSelected(dx, dy);
            }
            // Delete/Backspace - delete selected
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.selectedElements.size > 1) {
                    e.preventDefault();
                    this.deleteSelected();
                }
            }
            // Escape - deselect all
            if (e.key === 'Escape') {
                this.deselectAll();
            }
        });
    }

    // ---- Selection ----

    getSelectedIds() {
        return [...this.selectedElements];
    }

    selectElement(elementId, addToSelection = false) {
        if (!addToSelection) {
            this.deselectAll();
        }
        this.selectedElements.add(elementId);
        this.highlightSelected();
    }

    deselectAll() {
        this.selectedElements.clear();
        this.canvasManager.deselectElement();
        this.highlightSelected();
    }

    selectAll() {
        const elements = this.projectManager.getAllElements();
        elements.forEach(el => {
            if (el.type !== 'land_plot') {
                this.selectedElements.add(el.id);
            }
        });
        this.highlightSelected();
        this.uiManager.showMessage(`Zaznaczono ${this.selectedElements.size} elementów`, 'info');
    }

    highlightSelected() {
        // Reset all elements
        this.canvasManager.elementsShapes.forEach((shape, id) => {
            if (shape.shapeObj) {
                if (this.selectedElements.has(id)) {
                    shape.shapeObj.stroke('#fbbf24');
                    shape.shapeObj.strokeWidth(3);
                } else {
                    shape.shapeObj.stroke('#6366f1');
                    shape.shapeObj.strokeWidth(2);
                }
            }
        });
        this.canvasManager.elementsLayer.draw();
        this.updateSelectionToolbar();
    }

    updateSelectionToolbar() {
        const toolbar = document.getElementById('selectionToolbar');
        if (!toolbar) return;
        if (this.selectedElements.size > 1) {
            toolbar.classList.remove('hidden');
            const countEl = document.getElementById('selectionCount');
            if (countEl) countEl.textContent = this.selectedElements.size;
        } else {
            toolbar.classList.add('hidden');
        }
    }

    // ---- Lasso Selection ----

    enableLassoMode() {
        this.isLassoMode = true;
        const stage = this.canvasManager.stage;
        stage.draggable(false);
        document.getElementById('canvasContainer')?.classList.add('lasso-mode');

        const layer = this.canvasManager.layer;

        const onMouseDown = (e) => {
            if (!this.isLassoMode) return;
            const pos = stage.getPointerPosition();
            this.lassoStartPos = {
                x: (pos.x - stage.x()) / stage.scaleX(),
                y: (pos.y - stage.y()) / stage.scaleY()
            };
            this.lassoRect = new Konva.Rect({
                x: this.lassoStartPos.x,
                y: this.lassoStartPos.y,
                width: 0,
                height: 0,
                stroke: '#fbbf24',
                strokeWidth: 1,
                dash: [5, 5],
                fill: 'rgba(251, 191, 36, 0.1)',
                listening: false
            });
            layer.add(this.lassoRect);
        };

        const onMouseMove = (e) => {
            if (!this.lassoRect || !this.lassoStartPos) return;
            const pos = stage.getPointerPosition();
            const current = {
                x: (pos.x - stage.x()) / stage.scaleX(),
                y: (pos.y - stage.y()) / stage.scaleY()
            };
            const x = Math.min(this.lassoStartPos.x, current.x);
            const y = Math.min(this.lassoStartPos.y, current.y);
            const w = Math.abs(current.x - this.lassoStartPos.x);
            const h = Math.abs(current.y - this.lassoStartPos.y);
            this.lassoRect.setAttrs({ x, y, width: w, height: h });
            layer.draw();
        };

        const onMouseUp = () => {
            if (!this.lassoRect) return;
            const rect = {
                x: this.lassoRect.x(),
                y: this.lassoRect.y(),
                w: this.lassoRect.width(),
                h: this.lassoRect.height()
            };
            this.lassoRect.destroy();
            this.lassoRect = null;
            this.lassoStartPos = null;
            layer.draw();

            // Find elements within lasso rectangle
            const ppm = this.canvasManager.project?.pixelsPerMeter || 30;
            this.deselectAll();
            const elements = this.projectManager.getAllElements();
            elements.forEach(el => {
                if (el.type === 'land_plot') return;
                const ex = Helpers.metersToPixels(el.x, ppm);
                const ey = Helpers.metersToPixels(el.y, ppm);
                if (ex >= rect.x && ex <= rect.x + rect.w &&
                    ey >= rect.y && ey <= rect.y + rect.h) {
                    this.selectedElements.add(el.id);
                }
            });
            this.highlightSelected();
            this.disableLassoMode();
            if (this.selectedElements.size > 0) {
                this.uiManager.showMessage(`Zaznaczono ${this.selectedElements.size} elementów`, 'info');
            }
        };

        stage.on('mousedown.lasso', onMouseDown);
        stage.on('mousemove.lasso', onMouseMove);
        stage.on('mouseup.lasso', onMouseUp);
    }

    disableLassoMode() {
        this.isLassoMode = false;
        const stage = this.canvasManager.stage;
        stage.draggable(true);
        stage.off('mousedown.lasso');
        stage.off('mousemove.lasso');
        stage.off('mouseup.lasso');
        document.getElementById('canvasContainer')?.classList.remove('lasso-mode');
        if (this.lassoRect) {
            this.lassoRect.destroy();
            this.lassoRect = null;
        }
    }

    // ---- Copy / Paste / Duplicate ----

    copySelected() {
        const ids = this.selectedElements.size > 0 
            ? [...this.selectedElements] 
            : (this.canvasManager.selectedElement ? [this.canvasManager.selectedElement] : []);
        if (ids.length === 0) return;

        this.clipboard = ids.map(id => {
            const el = this.projectManager.getElement(id);
            return el ? el.toJSON() : null;
        }).filter(Boolean);

        this.uiManager.showMessage(`Skopiowano ${this.clipboard.length} elementów`, 'info');
    }

    paste() {
        if (this.clipboard.length === 0) return;
        this.deselectAll();
        this.clipboard.forEach(data => {
            const el = Element.fromJSON(data);
            el.id = Helpers.generateId();
            el.x += 2;
            el.y += 2;
            el.name = el.name + ' (kopia)';
            this.projectManager.project.addElement(el);
            this.canvasManager.addElement(el);
            this.selectedElements.add(el.id);
            this.uiManager.addToHistory('addElement', { elementId: el.id, element: el.toJSON() });
        });
        this.highlightSelected();
        this.uiManager.updateLayersList();
        this.uiManager.showMessage(`Wklejono ${this.clipboard.length} elementów`, 'success');
    }

    duplicateSelected() {
        const ids = this.selectedElements.size > 0 
            ? [...this.selectedElements] 
            : (this.canvasManager.selectedElement ? [this.canvasManager.selectedElement] : []);
        if (ids.length === 0) return;

        this.deselectAll();
        ids.forEach(id => {
            const cloned = this.projectManager.cloneElement(id);
            if (cloned) {
                this.selectedElements.add(cloned.id);
                this.uiManager.addToHistory('addElement', { elementId: cloned.id, element: cloned.toJSON() });
            }
        });
        this.highlightSelected();
        this.uiManager.updateLayersList();
        this.uiManager.showMessage(`Zduplikowano ${ids.length} elementów`, 'success');
    }

    // ---- Nudge ----

    nudgeSelected(dx, dy) {
        const ids = this.selectedElements.size > 0 
            ? [...this.selectedElements] 
            : (this.canvasManager.selectedElement ? [this.canvasManager.selectedElement] : []);
        ids.forEach(id => {
            const el = this.projectManager.getElement(id);
            if (el && !el.locked) {
                this.projectManager.updateElement(id, { x: el.x + dx, y: el.y + dy });
            }
        });
    }

    // ---- Delete Selected ----

    deleteSelected() {
        if (this.selectedElements.size === 0) return;
        if (!confirm(`Usunąć ${this.selectedElements.size} elementów?`)) return;
        [...this.selectedElements].forEach(id => {
            const el = this.projectManager.getElement(id);
            if (el) {
                this.uiManager.addToHistory('deleteElement', { elementId: id, element: el.toJSON() });
                this.projectManager.removeElement(id);
            }
        });
        this.selectedElements.clear();
        this.uiManager.updateLayersList();
        this.updateSelectionToolbar();
    }

    // ---- Alignment ----

    alignSelected(alignment) {
        const ids = [...this.selectedElements];
        if (ids.length < 2) return;

        const elements = ids.map(id => this.projectManager.getElement(id)).filter(Boolean);
        
        let target;
        switch (alignment) {
            case 'left':
                target = Math.min(...elements.map(e => e.x - e.width / 2));
                elements.forEach(e => this.projectManager.updateElement(e.id, { x: target + e.width / 2 }));
                break;
            case 'right':
                target = Math.max(...elements.map(e => e.x + e.width / 2));
                elements.forEach(e => this.projectManager.updateElement(e.id, { x: target - e.width / 2 }));
                break;
            case 'top':
                target = Math.min(...elements.map(e => e.y - e.height / 2));
                elements.forEach(e => this.projectManager.updateElement(e.id, { y: target + e.height / 2 }));
                break;
            case 'bottom':
                target = Math.max(...elements.map(e => e.y + e.height / 2));
                elements.forEach(e => this.projectManager.updateElement(e.id, { y: target - e.height / 2 }));
                break;
            case 'centerH':
                target = elements.reduce((sum, e) => sum + e.x, 0) / elements.length;
                elements.forEach(e => this.projectManager.updateElement(e.id, { x: target }));
                break;
            case 'centerV':
                target = elements.reduce((sum, e) => sum + e.y, 0) / elements.length;
                elements.forEach(e => this.projectManager.updateElement(e.id, { y: target }));
                break;
            case 'distributeH':
                elements.sort((a, b) => a.x - b.x);
                if (elements.length >= 3) {
                    const startX = elements[0].x;
                    const endX = elements[elements.length - 1].x;
                    const step = (endX - startX) / (elements.length - 1);
                    elements.forEach((e, i) => this.projectManager.updateElement(e.id, { x: startX + step * i }));
                }
                break;
            case 'distributeV':
                elements.sort((a, b) => a.y - b.y);
                if (elements.length >= 3) {
                    const startY = elements[0].y;
                    const endY = elements[elements.length - 1].y;
                    const step = (endY - startY) / (elements.length - 1);
                    elements.forEach((e, i) => this.projectManager.updateElement(e.id, { y: startY + step * i }));
                }
                break;
        }
        this.uiManager.showMessage(`Wyrównano elementy`, 'success');
    }

    // ---- Z-Order ----

    bringToFront() {
        const project = this.projectManager.project;
        if (!project) return;
        const ids = [...this.selectedElements];
        if (ids.length === 0 && this.canvasManager.selectedElement) ids.push(this.canvasManager.selectedElement);
        ids.forEach(id => {
            const idx = project.elements.findIndex(e => e.id === id);
            if (idx !== -1) {
                const [el] = project.elements.splice(idx, 1);
                project.elements.push(el);
            }
        });
        this.canvasManager.renderAllElements();
        this.highlightSelected();
    }

    sendToBack() {
        const project = this.projectManager.project;
        if (!project) return;
        const ids = [...this.selectedElements];
        if (ids.length === 0 && this.canvasManager.selectedElement) ids.push(this.canvasManager.selectedElement);
        ids.forEach(id => {
            const idx = project.elements.findIndex(e => e.id === id);
            if (idx !== -1) {
                const [el] = project.elements.splice(idx, 1);
                project.elements.unshift(el);
            }
        });
        this.canvasManager.renderAllElements();
        this.highlightSelected();
    }

    // ---- Flip ----

    flipSelected(axis) {
        const ids = this.selectedElements.size > 0 
            ? [...this.selectedElements] 
            : (this.canvasManager.selectedElement ? [this.canvasManager.selectedElement] : []);
        if (ids.length === 0) return;

        // For flip, we swap width/height for individual elements or mirror positions for group
        if (ids.length === 1) {
            const el = this.projectManager.getElement(ids[0]);
            if (el) {
                if (axis === 'x') {
                    this.projectManager.updateElement(el.id, { rotation: (360 - el.rotation) % 360 });
                } else {
                    this.projectManager.updateElement(el.id, { rotation: (180 - el.rotation + 360) % 360 });
                }
            }
        } else {
            const elements = ids.map(id => this.projectManager.getElement(id)).filter(Boolean);
            const centerX = elements.reduce((s, e) => s + e.x, 0) / elements.length;
            const centerY = elements.reduce((s, e) => s + e.y, 0) / elements.length;
            elements.forEach(el => {
                if (axis === 'x') {
                    this.projectManager.updateElement(el.id, { x: 2 * centerX - el.x });
                } else {
                    this.projectManager.updateElement(el.id, { y: 2 * centerY - el.y });
                }
            });
        }
        this.uiManager.showMessage(`Odbito ${axis === 'x' ? 'poziomo' : 'pionowo'}`, 'success');
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SelectionManager;
}
