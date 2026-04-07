/* ============================================
   GROUP MANAGER
   Element grouping / ungrouping (Ctrl+G / Ctrl+Shift+G)
   ============================================ */

class GroupManager {
    constructor(canvasManager, selectionManager) {
        this.canvasManager = canvasManager;
        this.selectionManager = selectionManager;
        this.groups = new Map(); // groupId -> { elementIds: [], name: '' }
        this.nextGroupId = 1;
    }

    /**
     * Group currently selected elements
     */
    groupSelected() {
        const selectedSet = this.selectionManager?.selectedElements;
        if (!selectedSet || selectedSet.size < 2) {
            window.uiManager?.showMessage('Zaznacz minimum 2 elementy do grupowania', 'warning');
            return null;
        }

        const groupId = 'group_' + (this.nextGroupId++);
        const elementIds = [...selectedSet];
        
        this.groups.set(groupId, {
            elementIds: elementIds,
            name: `Grupa ${this.nextGroupId - 1}`,
            locked: false
        });

        // Mark elements as belonging to group
        elementIds.forEach(id => {
            const el = this.canvasManager.project?.getElement(id);
            if (el) {
                el.properties = el.properties || {};
                el.properties.groupId = groupId;
            }
        });

        window.uiManager?.showMessage(`✅ Zgrupowano ${elementIds.length} elementów`, 'success');
        this._updateLayersPanel();
        return groupId;
    }

    /**
     * Ungroup the group that selected element belongs to
     */
    ungroupSelected() {
        const selectedSet = this.selectionManager?.selectedElements;
        if (!selectedSet || selectedSet.size === 0) return;
        const selected = [...selectedSet];

        const groupsToRemove = new Set();
        selected.forEach(id => {
            const el = this.canvasManager.project?.getElement(id);
            if (el?.properties?.groupId) {
                groupsToRemove.add(el.properties.groupId);
            }
        });

        if (groupsToRemove.size === 0) {
            window.uiManager?.showMessage('Zaznaczone elementy nie są w grupie', 'info');
            return;
        }

        groupsToRemove.forEach(groupId => {
            const group = this.groups.get(groupId);
            if (group) {
                group.elementIds.forEach(elId => {
                    const el = this.canvasManager.project?.getElement(elId);
                    if (el?.properties) {
                        delete el.properties.groupId;
                    }
                });
                this.groups.delete(groupId);
            }
        });

        window.uiManager?.showMessage('✅ Rozgrupowano elementy', 'success');
        this._updateLayersPanel();
    }

    /**
     * Select all elements in same group when one is selected
     */
    selectGroup(elementId) {
        const el = this.canvasManager.project?.getElement(elementId);
        if (!el?.properties?.groupId) return false;

        const group = this.groups.get(el.properties.groupId);
        if (!group) return false;

        // Select all elements in the group
        group.elementIds.forEach(id => {
            if (this.selectionManager?.selectElement) {
                this.selectionManager.selectElement(id, true);
            }
        });
        return true;
    }

    /**
     * Move all grouped elements together
     */
    moveGroup(groupId, dx, dy) {
        const group = this.groups.get(groupId);
        if (!group) return;

        group.elementIds.forEach(elId => {
            const el = this.canvasManager.project?.getElement(elId);
            if (el) {
                el.x += dx;
                el.y += dy;
            }
        });
        this.canvasManager.renderAllElements();
    }

    /**
     * Get group for an element
     */
    getGroupForElement(elementId) {
        const el = this.canvasManager.project?.getElement(elementId);
        if (!el?.properties?.groupId) return null;
        return {
            id: el.properties.groupId,
            ...this.groups.get(el.properties.groupId)
        };
    }

    /**
     * Rename a group
     */
    renameGroup(groupId, newName) {
        const group = this.groups.get(groupId);
        if (group) {
            group.name = newName;
            this._updateLayersPanel();
        }
    }

    _updateLayersPanel() {
        if (window.uiManager?.updateLayersList) {
            window.uiManager.updateLayersList();
        }
    }

    // ---- Serialization ----

    getSerializableData() {
        const data = {};
        this.groups.forEach((val, key) => {
            data[key] = { ...val };
        });
        return { groups: data, nextGroupId: this.nextGroupId };
    }

    loadData(data) {
        this.groups.clear();
        if (data?.groups) {
            Object.entries(data.groups).forEach(([key, val]) => {
                this.groups.set(key, { ...val });
            });
        }
        this.nextGroupId = data?.nextGroupId || 1;
    }
}
