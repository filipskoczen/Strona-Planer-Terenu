/* ============================================
   SNAP MANAGER
   Smart snapping to elements + visual guidelines
   ============================================ */

class SnapManager {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.enabled = true;
        this.snapThreshold = 8; // pixels
        this.guideLayer = null;
        this.guidelines = [];

        this.initLayer();
        this._hookDragEvents();
    }

    initLayer() {
        this.guideLayer = new Konva.Layer({ name: 'guideLayer', listening: false });
        this.canvasManager.stage.add(this.guideLayer);
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) this.clearGuides();
        return this.enabled;
    }

    setThreshold(px) {
        this.snapThreshold = px;
    }

    // ---- Hook into element drag events ----

    _hookDragEvents() {
        // Called after canvasManager adds an element's shape
        const origAdd = this.canvasManager.addElement.bind(this.canvasManager);
        const self = this;

        this.canvasManager.addElement = function(element) {
            const shape = origAdd(element);
            if (shape && shape.draggable()) {
                shape.on('dragmove.snap', () => self._onDragMove(shape, element));
                shape.on('dragend.snap', () => self.clearGuides());
            }
            return shape;
        };
    }

    _onDragMove(shape, element) {
        if (!this.enabled) return;

        this.clearGuides();

        const stage = this.canvasManager.stage;
        const ppm = this.canvasManager.project?.pixelsPerMeter || 30;

        // Get current shape bounds
        const box = this._getShapeBounds(shape, element, ppm);
        if (!box) return;

        // Get all other element bounds
        const others = this._getAllOtherBounds(element.id, ppm);

        let snapX = null;
        let snapY = null;
        const guides = [];

        // Check snap against each other element
        for (const other of others) {
            // Horizontal guides (x-axis alignment)
            const hSnaps = [
                { a: box.left, b: other.left, type: 'left-left' },
                { a: box.left, b: other.right, type: 'left-right' },
                { a: box.right, b: other.left, type: 'right-left' },
                { a: box.right, b: other.right, type: 'right-right' },
                { a: box.cx, b: other.cx, type: 'center-center-h' }
            ];
            for (const s of hSnaps) {
                const diff = Math.abs(s.a - s.b);
                if (diff < this.snapThreshold / stage.scaleX()) {
                    if (snapX === null || diff < Math.abs(snapX.diff)) {
                        snapX = { diff: s.b - s.a, guide: s.b, type: s.type };
                    }
                }
            }

            // Vertical guides (y-axis alignment)
            const vSnaps = [
                { a: box.top, b: other.top, type: 'top-top' },
                { a: box.top, b: other.bottom, type: 'top-bottom' },
                { a: box.bottom, b: other.top, type: 'bottom-top' },
                { a: box.bottom, b: other.bottom, type: 'bottom-bottom' },
                { a: box.cy, b: other.cy, type: 'center-center-v' }
            ];
            for (const s of vSnaps) {
                const diff = Math.abs(s.a - s.b);
                if (diff < this.snapThreshold / stage.scaleY()) {
                    if (snapY === null || diff < Math.abs(snapY.diff)) {
                        snapY = { diff: s.b - s.a, guide: s.b, type: s.type };
                    }
                }
            }
        }

        // Apply snap
        if (snapX) {
            shape.x(shape.x() + snapX.diff);
            this._drawVerticalGuide(snapX.guide);
        }
        if (snapY) {
            shape.y(shape.y() + snapY.diff);
            this._drawHorizontalGuide(snapY.guide);
        }
    }

    _getShapeBounds(shape, element, ppm) {
        const w = element.width * ppm;
        const h = element.height * ppm;
        const x = shape.x();
        const y = shape.y();
        return {
            left: x - w / 2,
            right: x + w / 2,
            top: y - h / 2,
            bottom: y + h / 2,
            cx: x,
            cy: y,
            width: w,
            height: h
        };
    }

    _getAllOtherBounds(excludeId, ppm) {
        const bounds = [];
        if (!this.canvasManager.project) return bounds;

        this.canvasManager.project.getAllElements().forEach(el => {
            if (el.id === excludeId) return;
            const w = el.width * ppm;
            const h = el.height * ppm;
            const x = el.x * ppm;
            const y = el.y * ppm;
            bounds.push({
                left: x - w / 2,
                right: x + w / 2,
                top: y - h / 2,
                bottom: y + h / 2,
                cx: x,
                cy: y
            });
        });

        return bounds;
    }

    // ---- Visual guides ----

    _drawVerticalGuide(x) {
        const stage = this.canvasManager.stage;
        const visibleTop = -stage.y() / stage.scaleY();
        const visibleBottom = visibleTop + stage.height() / stage.scaleY();

        const line = new Konva.Line({
            points: [x, visibleTop - 1000, x, visibleBottom + 1000],
            stroke: '#3b82f6',
            strokeWidth: 1 / stage.scaleX(),
            dash: [6 / stage.scaleX(), 4 / stage.scaleX()],
            name: 'snapGuide',
            listening: false
        });
        this.guideLayer.add(line);
        this.guidelines.push(line);
        this.guideLayer.batchDraw();
    }

    _drawHorizontalGuide(y) {
        const stage = this.canvasManager.stage;
        const visibleLeft = -stage.x() / stage.scaleX();
        const visibleRight = visibleLeft + stage.width() / stage.scaleX();

        const line = new Konva.Line({
            points: [visibleLeft - 1000, y, visibleRight + 1000, y],
            stroke: '#3b82f6',
            strokeWidth: 1 / stage.scaleY(),
            dash: [6 / stage.scaleY(), 4 / stage.scaleY()],
            name: 'snapGuide',
            listening: false
        });
        this.guideLayer.add(line);
        this.guidelines.push(line);
        this.guideLayer.batchDraw();
    }

    clearGuides() {
        this.guidelines.forEach(g => g.destroy());
        this.guidelines = [];
        this.guideLayer.batchDraw();
    }
}
