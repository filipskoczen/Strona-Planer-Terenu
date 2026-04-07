/* ============================================
   HISTORY MANAGER (Undo/Redo)
   ============================================ */

class HistoryManager {
    constructor() {
        this.history = [];
        this.currentIndex = -1;
        this.maxStates = CONSTANTS.MAX_HISTORY_STATES;
    }

    /**
     * Add state to history
     */
    addState(action, data) {
        // Remove all redo states when adding new state
        this.history = this.history.slice(0, this.currentIndex + 1);

        this.history.push({
            action: action,
            data: Helpers.deepClone(data),
            timestamp: Date.now()
        });

        // Limit history size
        if (this.history.length > this.maxStates) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }

        document.dispatchEvent(new CustomEvent('historyChanged', {
            detail: {
                canUndo: this.canUndo(),
                canRedo: this.canRedo()
            }
        }));
    }

    /**
     * Undo
     */
    undo() {
        if (!this.canUndo()) return null;

        this.currentIndex--;
        const previousState = this.history[this.currentIndex];

        document.dispatchEvent(new CustomEvent('historyChanged', {
            detail: {
                canUndo: this.canUndo(),
                canRedo: this.canRedo()
            }
        }));

        return previousState;
    }

    /**
     * Redo
     */
    redo() {
        if (!this.canRedo()) return null;

        this.currentIndex++;
        const nextState = this.history[this.currentIndex];

        document.dispatchEvent(new CustomEvent('historyChanged', {
            detail: {
                canUndo: this.canUndo(),
                canRedo: this.canRedo()
            }
        }));

        return nextState;
    }

    /**
     * Can undo
     */
    canUndo() {
        return this.currentIndex > 0;
    }

    /**
     * Can redo
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Get current state
     */
    getCurrentState() {
        if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
            return this.history[this.currentIndex];
        }
        return null;
    }

    /**
     * Clear history
     */
    clear() {
        this.history = [];
        this.currentIndex = -1;

        document.dispatchEvent(new CustomEvent('historyChanged', {
            detail: {
                canUndo: false,
                canRedo: false
            }
        }));
    }

    /**
     * Get history length
     */
    getLength() {
        return this.history.length;
    }

    /**
     * Get history info
     */
    getInfo() {
        return {
            totalStates: this.history.length,
            currentIndex: this.currentIndex,
            currentAction: this.getCurrentState()?.action || 'None',
            canUndo: this.canUndo(),
            canRedo: this.canRedo()
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryManager;
}
