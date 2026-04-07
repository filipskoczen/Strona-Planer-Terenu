/* ============================================
   HELPER FUNCTIONS
   ============================================ */

const Helpers = {
    /**
     * Generate unique ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Convert pixels to meters
     */
    pixelsToMeters(pixels, pixelsPerMeter = CONSTANTS.DEFAULT_PIXELS_PER_METER) {
        return pixels / pixelsPerMeter;
    },

    /**
     * Convert meters to pixels
     */
    metersToPixels(meters, pixelsPerMeter = CONSTANTS.DEFAULT_PIXELS_PER_METER) {
        return meters * pixelsPerMeter;
    },

    /**
     * Round to decimal places
     */
    round(value, decimals = 2) {
        return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    },

    /**
     * Calculate distance between two points
     */
    distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    },

    /**
     * Calculate snap position
     */
    snapToGrid(value, gridSize, pixelsPerMeter = CONSTANTS.DEFAULT_PIXELS_PER_METER) {
        const snapPixels = gridSize * pixelsPerMeter;
        return Math.round(value / snapPixels) * snapPixels;
    },

    /**
     * Clamp value between min and max
     */
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    /**
     * Format number with units
     */
    formatWithUnit(value, unit = 'm', decimals = 2) {
        return `${this.round(value, decimals)}${unit}`;
    },

    /**
     * Deep clone object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (obj instanceof Object) {
            const cloned = {};
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    },

    /**
     * Check if element is within bounds
     */
    isWithinBounds(x, y, boundsX, boundsY, boundsW, boundsH) {
        return x >= boundsX && x <= boundsX + boundsW &&
               y >= boundsY && y <= boundsY + boundsH;
    },

    /**
     * Get element center
     */
    getCenter(element) {
        return {
            x: element.x + element.width / 2,
            y: element.y + element.height / 2
        };
    },

    /**
     * Download file
     */
    downloadFile(content, filename, mimeType = 'application/json') {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    /**
     * Debounce function
     */
    debounce(func, delay = 300) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Throttle function
     */
    throttle(func, delay = 300) {
        let lastCall = 0;
        return function (...args) {
            const now = Date.now();
            if (now - lastCall < delay) return;
            lastCall = now;
            return func.apply(this, args);
        };
    },

    /**
     * Is touch device
     */
    isTouchDevice() {
        return (('ontouchstart' in window) ||
                (navigator.maxTouchPoints > 0) ||
                (navigator.msMaxTouchPoints > 0));
    },

    /**
     * Get color brightness
     */
    getBrightness(color) {
        // Convert hex to RGB
        const hex = color.replace(/^#/, '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Calculate brightness
        return (r * 299 + g * 587 + b * 114) / 1000;
    },

    /**
     * Get contrasting text color
     */
    getContrastingTextColor(backgroundColor) {
        const brightness = this.getBrightness(backgroundColor);
        return brightness > 128 ? '#000000' : '#ffffff';
    },

    /**
     * Debounce with leading and trailing
     */
    debounceWithTrailing(func, delay = 300) {
        let timeout;
        return function (...args) {
            const later = () => {
                timeout = null;
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, delay);
        };
    }
};

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Helpers;
}
