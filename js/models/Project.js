/* ============================================
   MODEL: PROJECT
   ============================================ */

class Project {
    constructor(name = 'Nowy projekt', landWidth = 30, landHeight = 40, gridSize = 1, landColor = '#1e293b') {
        this.id = Helpers.generateId();
        this.name = Sanitizer.sanitizeString(name);
        this.landWidth = Helpers.clamp(landWidth, 5, 500);
        this.landHeight = Helpers.clamp(landHeight, 5, 500);
        this.gridSize = Helpers.clamp(gridSize, 0.5, 10);
        this.pixelsPerMeter = CONSTANTS.DEFAULT_PIXELS_PER_METER;
        this.landColor = Sanitizer.sanitizeColor(landColor) || '#1e293b';
        this.roadSide = null; // null, 'north', 'south', 'east', 'west'
        this.elements = [];
        this.created = Date.now();
        this.modified = Date.now();
        this.version = '1.0';
    }

    /**
     * Add element to project
     */
    addElement(element) {
        if (element instanceof Element) {
            this.elements.push(element);
            this.modified = Date.now();
            return element;
        }
        throw new Error('Invalid element type');
    }

    /**
     * Remove element by ID
     */
    removeElement(elementId) {
        const index = this.elements.findIndex(el => el.id === elementId);
        if (index !== -1) {
            this.elements.splice(index, 1);
            this.modified = Date.now();
            return true;
        }
        return false;
    }

    /**
     * Get element by ID
     */
    getElement(elementId) {
        return this.elements.find(el => el.id === elementId);
    }

    /**
     * Update element
     */
    updateElement(elementId, updates) {
        const element = this.getElement(elementId);
        if (element) {
            Object.keys(updates).forEach(key => {
                element.updateProperty(key, updates[key]);
            });
            this.modified = Date.now();
            return element;
        }
        return null;
    }

    /**
     * Get all elements
     */
    getAllElements() {
        return this.elements;
    }

    /**
     * Get elements by type
     */
    getElementsByType(type) {
        return this.elements.filter(el => el.type === type);
    }

    /**
     * Get visible elements
     */
    getVisibleElements() {
        return this.elements.filter(el => el.visible);
    }

    /**
     * Clear all elements
     */
    clearElements() {
        this.elements = [];
        this.modified = Date.now();
    }

    /**
     * Get project bounds
     */
    getBounds() {
        return {
            x: 0,
            y: 0,
            width: Helpers.metersToPixels(this.landWidth, this.pixelsPerMeter),
            height: Helpers.metersToPixels(this.landHeight, this.pixelsPerMeter)
        };
    }

    /**
     * Export to JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            landWidth: this.landWidth,
            landHeight: this.landHeight,
            gridSize: this.gridSize,
            pixelsPerMeter: this.pixelsPerMeter,
            landColor: this.landColor,
            roadSide: this.roadSide,
            elements: this.elements.map(el => el.toJSON()),
            created: this.created,
            modified: this.modified,
            version: this.version
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(data) {
        const project = new Project(
            data.name,
            data.landWidth,
            data.landHeight,
            data.gridSize,
            data.landColor || '#1e293b'
        );
        project.id = data.id;
        project.pixelsPerMeter = data.pixelsPerMeter || CONSTANTS.DEFAULT_PIXELS_PER_METER;
        project.roadSide = data.roadSide || null;
        project.elements = data.elements.map(el => Element.fromJSON(el));
        project.created = data.created;
        project.modified = data.modified;
        project.version = data.version;
        return project;
    }

    /**
     * Get project statistics
     */
    getStatistics() {
        const elementCounts = {};
        const totalArea = this.landWidth * this.landHeight;
        
        this.elements.forEach(el => {
            elementCounts[el.type] = (elementCounts[el.type] || 0) + 1;
        });

        return {
            totalElements: this.elements.length,
            totalArea: totalArea,
            elementCounts: elementCounts,
            modifiedDate: new Date(this.modified).toLocaleString('pl-PL')
        };
    }
}
