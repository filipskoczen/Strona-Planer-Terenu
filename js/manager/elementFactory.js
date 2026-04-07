/* ============================================
   ELEMENT FACTORY
   ============================================ */

class ElementFactory {
    /**
     * Create element by type
     */
    static createElement(type, x = 0, y = 0, options = {}) {
        if (!Sanitizer.isValidElementType(type)) {
            throw new Error(`Invalid element type: ${type}`);
        }

        const defaults = CONSTANTS.ELEMENT_DEFAULTS[type];
        if (!defaults) {
            throw new Error(`No defaults found for element type: ${type}`);
        }

        const width = options.width || defaults.width;
        const height = options.height || defaults.height;
        const color = options.color || defaults.color;

        return new Element(type, x, y, width, height, {
            color: color,
            name: options.name || this.generateElementName(type),
            rotation: options.rotation || 0,
            opacity: options.opacity !== undefined ? options.opacity : 1,
            locked: options.locked || false,
            visible: options.visible !== undefined ? options.visible : true,
            shape: options.shape || CONSTANTS.ELEMENT_SHAPES.RECTANGLE,
            properties: options.properties || {}
        });
    }

    /**
     * Generate element name
     */
    static generateElementName(type) {
        const names = {
            house: 'Dom',
            garage: 'Garaż',
            garden: 'Ogród',
            tree: 'Drzewo',
            flower: 'Rabata',
            pond: 'Jeziorko',
            path: 'Ścieżka',
            driveway: 'Podjazd',
            fence: 'Ogrodzenie',
            bench: 'Ławka',
            light: 'Oświetlenie'
        };

        const baseName = names[type] || type;
        const timestamp = Date.now().toString().slice(-3);
        return `${baseName} #${timestamp}`;
    }

    /**
     * Create rectangle element (house, garage, etc.)
     */
    static createRectangle(type, x, y, width, height, color) {
        return this.createElement(type, x, y, { width, height, color });
    }

    /**
     * Create circle element (tree, light, bench)
     */
    static createCircle(type, x, y, radius, color) {
        return this.createElement(type, x, y, {
            width: radius * 2,
            height: radius * 2,
            color
        });
    }

    /**
     * Create line element (fence, path, driveway)
     */
    static createLine(type, x, y, length, width, color) {
        return this.createElement(type, x, y, {
            width: width,
            height: length,
            color
        });
    }

    /**
     * Get element templates
     */
    static getTemplates() {
        return {
            house: {
                name: 'Dom',
                icon: '🏠',
                description: 'Główny budynek mieszkalny',
                defaults: {
                    width: 10,
                    height: 12,
                    color: '#ef4444'
                }
            },
            garage: {
                name: 'Garaż',
                icon: '🛠️',
                description: 'Garaż dla pojazdów',
                defaults: {
                    width: 6,
                    height: 7,
                    color: '#f97316'
                }
            },
            garden: {
                name: 'Ogród',
                icon: '🌾',
                description: 'Obszar ogrodniczy',
                defaults: {
                    width: 8,
                    height: 8,
                    color: '#10b981'
                }
            },
            tree: {
                name: 'Drzewo',
                icon: '🌲',
                description: 'Pojedyncze drzewo',
                defaults: {
                    width: 2,
                    height: 2,
                    color: '#059669'
                }
            },
            flower: {
                name: 'Rabata',
                icon: '🌸',
                description: 'Rabata kwiatów',
                defaults: {
                    width: 4,
                    height: 4,
                    color: '#ec4899'
                }
            },
            pond: {
                name: 'Jeziorko',
                icon: '💧',
                description: 'Zbiornik wodny',
                defaults: {
                    width: 6,
                    height: 6,
                    color: '#0ea5e9'
                }
            },
            path: {
                name: 'Ścieżka',
                icon: '🚶',
                description: 'Ścieżka spacerowa',
                defaults: {
                    width: 2,
                    height: 10,
                    color: '#78716c'
                }
            },
            driveway: {
                name: 'Podjazd',
                icon: '🚗',
                description: 'Podjazd dla samochodów',
                defaults: {
                    width: 4,
                    height: 15,
                    color: '#64748b'
                }
            },
            fence: {
                name: 'Ogrodzenie',
                icon: '🔒',
                description: 'Ogrodzenie terenu',
                defaults: {
                    width: 0.3,
                    height: 20,
                    color: '#7c3aed'
                }
            },
            bench: {
                name: 'Ławka',
                icon: '🪑',
                description: 'Ławka do siedzenia',
                defaults: {
                    width: 1.5,
                    height: 1.5,
                    color: '#a16207'
                }
            },
            light: {
                name: 'Oświetlenie',
                icon: '💡',
                description: 'Lampa/oświetlenie',
                defaults: {
                    width: 0.5,
                    height: 0.5,
                    color: '#fbbf24'
                }
            }
        };
    }

    /**
     * Get default color for element type
     */
    static getDefaultColor(type) {
        const defaults = CONSTANTS.ELEMENT_DEFAULTS[type];
        return defaults ? defaults.color : '#6366f1';
    }

    /**
     * Create element from drag event
     */
    static createFromDragEvent(type, x, y) {
        const defaults = CONSTANTS.ELEMENT_DEFAULTS[type];
        if (!defaults) return null;

        // Convert to meters if needed
        const xMeters = x > 50 ? Helpers.pixelsToMeters(x) : x;
        const yMeters = y > 50 ? Helpers.pixelsToMeters(y) : y;

        return this.createElement(type, xMeters, yMeters);
    }

    /**
     * Validate element data
     */
    static validateElement(elementData) {
        const errors = [];

        if (!elementData.type || !Sanitizer.isValidElementType(elementData.type)) {
            errors.push('Invalid or missing element type');
        }

        if (!Sanitizer.isValidNumber(elementData.x, -1000, 10000)) {
            errors.push('Invalid x coordinate');
        }

        if (!Sanitizer.isValidNumber(elementData.y, -1000, 10000)) {
            errors.push('Invalid y coordinate');
        }

        if (!Sanitizer.isValidNumber(elementData.width, CONSTANTS.MIN_ELEMENT_SIZE, CONSTANTS.MAX_ELEMENT_SIZE)) {
            errors.push(`Width must be between ${CONSTANTS.MIN_ELEMENT_SIZE} and ${CONSTANTS.MAX_ELEMENT_SIZE}`);
        }

        if (!Sanitizer.isValidNumber(elementData.height, CONSTANTS.MIN_ELEMENT_SIZE, CONSTANTS.MAX_ELEMENT_SIZE)) {
            errors.push(`Height must be between ${CONSTANTS.MIN_ELEMENT_SIZE} and ${CONSTANTS.MAX_ELEMENT_SIZE}`);
        }

        if (elementData.color && !Sanitizer.isValidColor(elementData.color)) {
            errors.push('Invalid color format');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElementFactory;
}
