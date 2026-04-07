/* ============================================
   MODEL: ELEMENT
   ============================================ */

class Element {
    constructor(type, x = 0, y = 0, width = 10, height = 10, options = {}) {
        this.id = Helpers.generateId();
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.rotation = options.rotation || 0;
        this.color = options.color || CONSTANTS.ELEMENT_DEFAULTS[type]?.color || '#6366f1';
        this.name = options.name || `${type}-${this.id.substring(0, 5)}`;
        this.opacity = options.opacity !== undefined ? options.opacity : 1;
        this.locked = options.locked || false;
        this.visible = options.visible !== undefined ? options.visible : true;
        this.shape = options.shape || CONSTANTS.ELEMENT_SHAPES.RECTANGLE;
        this.properties = options.properties || {};
        this.created = Date.now();
    }

    /**
     * Update element properties
     */
    updateProperty(property, value) {
        if (this.hasOwnProperty(property)) {
            if (property === 'width' || property === 'height') {
                // Validate size boundaries
                const newValue = Helpers.clamp(value, CONSTANTS.MIN_ELEMENT_SIZE, CONSTANTS.MAX_ELEMENT_SIZE);
                this[property] = newValue;
            } else if (property === 'color') {
                if (Sanitizer.isValidColor(value)) {
                    this[property] = value;
                }
            } else if (property === 'name') {
                this[property] = Sanitizer.sanitizeString(value);
            } else if (property === 'rotation') {
                this[property] = value % 360;
            } else if (property === 'opacity') {
                this[property] = Helpers.clamp(value, 0, 1);
            } else if (property === 'shape') {
                // Validate shape
                const validShapes = Object.values(CONSTANTS.ELEMENT_SHAPES);
                if (validShapes.includes(value)) {
                    this[property] = value;
                }
            } else {
                this[property] = value;
            }
        }
    }

    /**
     * Get all properties
     */
    getProperties() {
        return {
            id: this.id,
            type: this.type,
            x: Helpers.round(this.x, 2),
            y: Helpers.round(this.y, 2),
            width: Helpers.round(this.width, 2),
            height: Helpers.round(this.height, 2),
            rotation: Helpers.round(this.rotation, 2),
            color: this.color,
            name: this.name,
            opacity: Helpers.round(this.opacity, 2),
            shape: this.shape,
            locked: this.locked,
            visible: this.visible,
            properties: this.properties
        };
    }

    /**
     * Clone element
     */
    clone() {
        return new Element(
            this.type,
            this.x,
            this.y,
            this.width,
            this.height,
            {
                rotation: this.rotation,
                color: this.color,
                name: this.name + ' (kopia)',
                opacity: this.opacity,
                shape: this.shape,
                locked: this.locked,
                visible: this.visible,
                properties: Helpers.deepClone(this.properties)
            }
        );
    }

    /**
     * Export to JSON
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            rotation: this.rotation,
            color: this.color,
            name: this.name,
            opacity: this.opacity,
            shape: this.shape,
            locked: this.locked,
            visible: this.visible,
            properties: this.properties
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(data) {
        const element = new Element(
            data.type,
            data.x,
            data.y,
            data.width,
            data.height,
            {
                rotation: data.rotation,
                color: data.color,
                name: data.name,
                opacity: data.opacity,
                shape: data.shape || CONSTANTS.ELEMENT_SHAPES.RECTANGLE,
                locked: data.locked,
                visible: data.visible,
                properties: data.properties
            }
        );
        element.id = data.id;
        element.created = data.created;
        return element;
    }
}
