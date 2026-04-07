/* ============================================
   SECURITY - SANITIZER
   ============================================ */

const Sanitizer = {
    /**
     * Sanitize string input - prevent XSS
     */
    sanitizeString(str) {
        if (typeof str !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Sanitize HTML - remove dangerous tags and attributes
     */
    sanitizeHTML(html) {
        const div = document.createElement('div');
        div.innerHTML = html;

        // Remove script tags and event handlers
        const scripts = div.querySelectorAll('script');
        scripts.forEach(script => script.remove());

        // Remove all attributes that could be dangerous
        const allElements = div.querySelectorAll('*');
        allElements.forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
                if (attr.name === 'src' && !attr.value.startsWith('data:')) {
                    el.removeAttribute(attr.name);
                }
            });
        });

        return div.innerHTML;
    },

    /**
     * Sanitize object for storage
     */
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }

        const sanitized = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                
                if (typeof value === 'string') {
                    sanitized[key] = this.sanitizeString(value);
                } else if (typeof value === 'number' || typeof value === 'boolean') {
                    sanitized[key] = value;
                } else if (typeof value === 'object') {
                    sanitized[key] = this.sanitizeObject(value);
                }
            }
        }
        return sanitized;
    },

    /**
     * Validate color format
     */
    isValidColor(color) {
        const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
        return hexRegex.test(color) || rgbRegex.test(color);
    },

    /**
     * Sanitize color - validate and return safe color
     */
    sanitizeColor(color, defaultColor = '#1e293b') {
        if (typeof color !== 'string') {
            return defaultColor;
        }
        
        const trimmed = color.trim();
        return this.isValidColor(trimmed) ? trimmed : defaultColor;
    },

    /**
     * Validate number is safe
     */
    isValidNumber(value, min = -Infinity, max = Infinity) {
        const num = Number(value);
        return !isNaN(num) && isFinite(num) && num >= min && num <= max;
    },

    /**
     * Validate element type
     */
    isValidElementType(type) {
        // Allow built-in types and custom elements (registered dynamically in ELEMENT_DEFAULTS)
        return Object.values(CONSTANTS.ELEMENT_TYPES).includes(type) || (type && type.startsWith('custom_') && CONSTANTS.ELEMENT_DEFAULTS[type]);
    },

    /**
     * Escape JSON string
     */
    escapeJSON(str) {
        return str.replace(/\\/g, '\\\\')
                  .replace(/"/g, '\\"')
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '\\r')
                  .replace(/\t/g, '\\t');
    },

    /**
     * Safe JSON parse
     */
    safeJSONParse(jsonString, fallback = null) {
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.error('Invalid JSON:', e);
            return fallback;
        }
    }
};

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sanitizer;
}
