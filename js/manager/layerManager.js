/* ============================================
   LAYER MANAGER
   User-named layers, drag & drop ordering
   ============================================ */

class LayerManager {
    constructor(canvasManager, uiManager) {
        this.canvasManager = canvasManager;
        this.uiManager = uiManager;
        this.userLayers = []; // { id, name, visible, opacity, locked, elementIds }
        this.nextLayerId = 1;
        this.dragState = null;
    }

    /**
     * Create a new user layer
     */
    createLayer(name) {
        const layer = {
            id: 'layer_' + (this.nextLayerId++),
            name: name || `Warstwa ${this.nextLayerId - 1}`,
            visible: true,
            opacity: 1,
            locked: false,
            elementIds: [],
            color: this._getLayerColor(this.nextLayerId - 2)
        };
        this.userLayers.push(layer);
        this.renderLayersPanel();
        return layer;
    }

    /**
     * Delete a user layer (elements move to default)
     */
    deleteLayer(layerId) {
        const idx = this.userLayers.findIndex(l => l.id === layerId);
        if (idx === -1) return;
        // Remove layer assignment from elements
        const layer = this.userLayers[idx];
        layer.elementIds.forEach(elId => {
            const el = this.canvasManager.project?.getElement(elId);
            if (el?.properties) delete el.properties.layerId;
        });
        this.userLayers.splice(idx, 1);
        this.renderLayersPanel();
        this.canvasManager.renderAllElements();
    }

    /**
     * Rename layer
     */
    renameLayer(layerId, newName) {
        const layer = this.userLayers.find(l => l.id === layerId);
        if (layer) {
            layer.name = newName;
            this.renderLayersPanel();
        }
    }

    /**
     * Assign element to layer
     */
    assignToLayer(elementId, layerId) {
        // Remove from current layer
        this.userLayers.forEach(l => {
            l.elementIds = l.elementIds.filter(id => id !== elementId);
        });
        // Add to new layer
        const layer = this.userLayers.find(l => l.id === layerId);
        if (layer) {
            layer.elementIds.push(elementId);
            const el = this.canvasManager.project?.getElement(elementId);
            if (el) {
                el.properties = el.properties || {};
                el.properties.layerId = layerId;
            }
        }
        this.renderLayersPanel();
    }

    /**
     * Toggle layer visibility
     */
    toggleVisibility(layerId) {
        const layer = this.userLayers.find(l => l.id === layerId);
        if (!layer) return;
        layer.visible = !layer.visible;

        layer.elementIds.forEach(elId => {
            const shape = this.canvasManager.elementsShapes.get(elId);
            if (shape) shape.visible(layer.visible);
        });
        this.canvasManager.elementsLayer.batchDraw();
        this.renderLayersPanel();
    }

    /**
     * Toggle layer lock
     */
    toggleLock(layerId) {
        const layer = this.userLayers.find(l => l.id === layerId);
        if (!layer) return;
        layer.locked = !layer.locked;

        layer.elementIds.forEach(elId => {
            const shape = this.canvasManager.elementsShapes.get(elId);
            if (shape) shape.draggable(!layer.locked);
            const el = this.canvasManager.project?.getElement(elId);
            if (el) el.locked = layer.locked;
        });
        this.renderLayersPanel();
    }

    /**
     * Set layer opacity
     */
    setOpacity(layerId, opacity) {
        const layer = this.userLayers.find(l => l.id === layerId);
        if (!layer) return;
        layer.opacity = opacity;

        layer.elementIds.forEach(elId => {
            const shape = this.canvasManager.elementsShapes.get(elId);
            if (shape) shape.opacity(opacity);
        });
        this.canvasManager.elementsLayer.batchDraw();
    }

    /**
     * Move layer up/down in order
     */
    moveLayer(layerId, direction) {
        const idx = this.userLayers.findIndex(l => l.id === layerId);
        if (idx === -1) return;
        const newIdx = idx + direction;
        if (newIdx < 0 || newIdx >= this.userLayers.length) return;
        const [removed] = this.userLayers.splice(idx, 1);
        this.userLayers.splice(newIdx, 0, removed);
        this.renderLayersPanel();
        // Re-order elements on canvas according to layer order
        this._reorderElements();
    }

    _reorderElements() {
        // Reorder elements in canvas according to layer order
        const orderedIds = [];
        this.userLayers.forEach(layer => {
            layer.elementIds.forEach(id => orderedIds.push(id));
        });
        // Move shapes to correct z-order
        orderedIds.forEach(id => {
            const shape = this.canvasManager.elementsShapes.get(id);
            if (shape) shape.moveToTop();
        });
        this.canvasManager.elementsLayer.batchDraw();
    }

    /**
     * Get layer for an element
     */
    getLayerForElement(elementId) {
        return this.userLayers.find(l => l.elementIds.includes(elementId));
    }

    /**
     * Render layers panel in sidebar
     */
    renderLayersPanel() {
        const container = document.getElementById('userLayersList');
        if (!container) return;

        if (this.userLayers.length === 0) {
            container.innerHTML = '<div class="empty-state-small">Brak warstw. Kliknij "+" aby dodać.</div>';
            return;
        }

        let html = '';
        this.userLayers.forEach((layer, idx) => {
            const visIcon = layer.visible ? '👁️' : '👁️‍🗨️';
            const lockIcon = layer.locked ? '🔒' : '🔓';
            const elemCount = layer.elementIds.length;

            html += `
            <div class="user-layer-item ${this.dragState?.dragId === layer.id ? 'dragging' : ''}" 
                 draggable="true"
                 data-layer-id="${layer.id}"
                 data-layer-idx="${idx}">
                <div class="layer-color-dot" style="background:${layer.color}"></div>
                <span class="layer-name" ondblclick="window.layerManager?._promptRename('${layer.id}')">${layer.name}</span>
                <span class="layer-count">(${elemCount})</span>
                <div class="layer-actions">
                    <button class="layer-action-btn" onclick="window.layerManager?.toggleVisibility('${layer.id}')" title="Widoczność">${visIcon}</button>
                    <button class="layer-action-btn" onclick="window.layerManager?.toggleLock('${layer.id}')" title="Blokada">${lockIcon}</button>
                    <button class="layer-action-btn" onclick="window.layerManager?.moveLayer('${layer.id}',-1)" title="W górę">▲</button>
                    <button class="layer-action-btn" onclick="window.layerManager?.moveLayer('${layer.id}',1)" title="W dół">▼</button>
                    <button class="layer-action-btn layer-action-delete" onclick="window.layerManager?.deleteLayer('${layer.id}')" title="Usuń">✕</button>
                </div>
            </div>`;
        });

        container.innerHTML = html;

        // Setup drag & drop
        this._setupDragDrop(container);
    }

    _setupDragDrop(container) {
        const items = container.querySelectorAll('.user-layer-item');
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                this.dragState = { dragId: item.dataset.layerId };
                e.dataTransfer.effectAllowed = 'move';
                item.classList.add('dragging');
            });
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                this.dragState = null;
            });
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                item.classList.add('drag-over');
            });
            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over');
            });
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over');
                if (!this.dragState) return;
                const fromId = this.dragState.dragId;
                const toId = item.dataset.layerId;
                if (fromId === toId) return;

                const fromIdx = this.userLayers.findIndex(l => l.id === fromId);
                const toIdx = this.userLayers.findIndex(l => l.id === toId);
                if (fromIdx === -1 || toIdx === -1) return;

                const [moved] = this.userLayers.splice(fromIdx, 1);
                this.userLayers.splice(toIdx, 0, moved);
                this.renderLayersPanel();
                this._reorderElements();
            });
        });
    }

    _promptRename(layerId) {
        const layer = this.userLayers.find(l => l.id === layerId);
        if (!layer) return;
        const newName = prompt('Nowa nazwa warstwy:', layer.name);
        if (newName) this.renameLayer(layerId, newName);
    }

    _getLayerColor(index) {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
        return colors[index % colors.length];
    }

    // ---- Serialization ----

    getSerializableData() {
        return {
            userLayers: this.userLayers.map(l => ({ ...l })),
            nextLayerId: this.nextLayerId
        };
    }

    loadData(data) {
        if (!data) return;
        this.userLayers = (data.userLayers || []).map(l => ({ ...l }));
        this.nextLayerId = data.nextLayerId || 1;
        this.renderLayersPanel();
    }
}
