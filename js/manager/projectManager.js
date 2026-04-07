/* ============================================
   PROJECT MANAGER
   ============================================ */

class ProjectManager {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.project = null;
    }

    /**
     * Create new project
     */
    createProject(name, landWidth, landHeight, gridSize, landColor = '#1e293b') {
        this.project = new Project(name, landWidth, landHeight, gridSize, landColor);
        this.canvasManager.setProject(this.project);
        document.dispatchEvent(new CustomEvent('projectCreated', {
            detail: { project: this.project }
        }));
        return this.project;
    }

    /**
     * Load project
     */
    loadProject(project) {
        this.project = project;
        this.canvasManager.setProject(this.project);
        document.dispatchEvent(new CustomEvent('projectLoaded', {
            detail: { project: this.project }
        }));
        return this.project;
    }

    /**
     * Get current project
     */
    getProject() {
        return this.project;
    }

    /**
     * Add element to project
     */
    addElement(elementType, x = 0, y = 0, options = {}) {
        if (!this.project) {
            console.error('No active project');
            return null;
        }

        const element = ElementFactory.createElement(elementType, x, y, options);
        this.project.addElement(element);
        this.canvasManager.addElement(element);

        document.dispatchEvent(new CustomEvent('elementAdded', {
            detail: { element: element }
        }));

        return element;
    }

    /**
     * Remove element from project
     */
    removeElement(elementId) {
        if (!this.project) return false;

        const element = this.project.getElement(elementId);
        if (!element) return false;

        this.project.removeElement(elementId);
        this.canvasManager.removeElement(elementId);

        document.dispatchEvent(new CustomEvent('elementRemoved', {
            detail: { elementId: elementId }
        }));

        return true;
    }

    /**
     * Update element
     */
    updateElement(elementId, updates) {
        if (!this.project) return null;

        const element = this.project.updateElement(elementId, updates);
        if (element) {
            this.canvasManager.updateElement(elementId, updates);
            document.dispatchEvent(new CustomEvent('elementUpdated', {
                detail: { elementId: elementId, updates: updates }
            }));
        }
        return element;
    }

    /**
     * Get element
     */
    getElement(elementId) {
        if (!this.project) return null;
        return this.project.getElement(elementId);
    }

    /**
     * Get all elements
     */
    getAllElements() {
        if (!this.project) return [];
        return this.project.getAllElements();
    }

    /**
     * Get visible elements
     */
    getVisibleElements() {
        if (!this.project) return [];
        return this.project.getVisibleElements();
    }

    /**
     * Clone element
     */
    cloneElement(elementId) {
        if (!this.project) return null;

        const element = this.project.getElement(elementId);
        if (!element) return null;

        const cloned = element.clone();
        cloned.x += 2; // Offset cloned element
        cloned.y += 2;

        this.project.addElement(cloned);
        this.canvasManager.addElement(cloned);

        document.dispatchEvent(new CustomEvent('elementCloned', {
            detail: { original: elementId, clone: cloned }
        }));

        return cloned;
    }

    /**
     * Get project info
     */
    getProjectInfo() {
        if (!this.project) return null;

        return {
            id: this.project.id,
            name: this.project.name,
            landWidth: this.project.landWidth,
            landHeight: this.project.landHeight,
            gridSize: this.project.gridSize,
            elementCount: this.project.elements.length,
            created: new Date(this.project.created).toLocaleString('pl-PL'),
            modified: new Date(this.project.modified).toLocaleString('pl-PL')
        };
    }

    /**
     * Export project to JSON
     */
    exportToJSON() {
        if (!this.project) return null;
        return JSON.stringify(this.project.toJSON());
    }

    /**
     * Import project from JSON
     */
    importFromJSON(jsonString) {
        try {
            const data = Sanitizer.safeJSONParse(jsonString);
            if (!data) {
                throw new Error('Invalid JSON data');
            }

            const project = Project.fromJSON(data);
            this.loadProject(project);
            return project;
        } catch (error) {
            console.error('Error importing project:', error);
            throw error;
        }
    }

    /**
     * Clear project
     */
    clearProject() {
        if (this.project) {
            this.project.clearElements();
            this.canvasManager.renderAllElements();
        }
    }

    /**
     * Get layer info for element
     */
    getElementLayer(elementId) {
        const element = this.getElement(elementId);
        if (!element) return null;

        const allElements = this.getAllElements();
        const index = allElements.findIndex(el => el.id === elementId);

        return {
            elementId: elementId,
            name: element.name,
            type: element.type,
            layerIndex: index,
            totalLayers: allElements.length,
            icon: CONSTANTS.ELEMENT_DEFAULTS[element.type]?.icon || '📦'
        };
    }

    /**
     * Move layer up
     */
    moveLayerUp(elementId) {
        if (!this.project) return false;

        const index = this.project.elements.findIndex(el => el.id === elementId);
        if (index === -1 || index === this.project.elements.length - 1) return false;

        const temp = this.project.elements[index];
        this.project.elements[index] = this.project.elements[index + 1];
        this.project.elements[index + 1] = temp;

        this.canvasManager.renderAllElements();
        return true;
    }

    /**
     * Move layer down
     */
    moveLayerDown(elementId) {
        if (!this.project) return false;

        const index = this.project.elements.findIndex(el => el.id === elementId);
        if (index === -1 || index === 0) return false;

        const temp = this.project.elements[index];
        this.project.elements[index] = this.project.elements[index - 1];
        this.project.elements[index - 1] = temp;

        this.canvasManager.renderAllElements();
        return true;
    }

    /**
     * Get statistics
     */
    getStatistics() {
        if (!this.project) return null;
        return this.project.getStatistics();
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectManager;
}
