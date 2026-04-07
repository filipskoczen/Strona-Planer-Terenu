/* ============================================
   MAP OVERLAY MANAGER
   Compass rose (proportional to plot size)
   ============================================ */

class MapOverlayManager {
    constructor(canvasManager, projectManager) {
        this.canvasManager = canvasManager;
        this.projectManager = projectManager;
        this.compassGroup = null;
        this.showCompass = true;

        this.drawCompass();
    }

    // ---- Compass Rose (proportional, on the side) ----

    drawCompass() {
        if (this.compassGroup) {
            this.compassGroup.destroy();
            this.compassGroup = null;
        }

        if (!this.showCompass || !this.canvasManager.project) return;

        const project = this.canvasManager.project;
        const ppm = project.pixelsPerMeter;

        // Determine plot dimensions and position for compass placement
        const polygonElement = project.elements.find(
            el => el.shape === 'polygon' && el.properties && el.properties.coordinates && el.properties.coordinates.length >= 3
        );

        let plotRight, plotTop, plotHeight;

        if (polygonElement) {
            const coords = polygonElement.properties.coordinates;
            const ex = Helpers.metersToPixels(polygonElement.x, ppm);
            const ey = Helpers.metersToPixels(polygonElement.y, ppm);

            const absPoints = coords.map(([mx, my]) => [ex + mx * ppm, ey + my * ppm]);
            const xs = absPoints.map(p => p[0]);
            const ys = absPoints.map(p => p[1]);

            plotRight = Math.max(...xs);
            plotTop = Math.min(...ys);
            plotHeight = Math.max(...ys) - plotTop;
        } else {
            plotRight = project.landWidth * ppm;
            plotTop = 0;
            plotHeight = project.landHeight * ppm;
        }

        // Compass size = 8% of plot height, min 25px max 60px
        const compassSize = Math.max(25, Math.min(60, plotHeight * 0.08));
        const margin = compassSize * 0.6;

        this.compassGroup = new Konva.Group({
            x: plotRight + margin + compassSize,
            y: plotTop + margin + compassSize,
            listening: false
        });

        // Circle outline
        const circle = new Konva.Circle({
            x: 0, y: 0,
            radius: compassSize + 4,
            stroke: '#475569',
            strokeWidth: 1,
            fill: 'rgba(15, 23, 42, 0.7)',
            listening: false
        });

        // Cross hair (E-W line)
        const hLine = new Konva.Line({
            points: [-compassSize, 0, compassSize, 0],
            stroke: '#475569',
            strokeWidth: 1,
            listening: false
        });

        // North arrow
        const northArrow = new Konva.Line({
            points: [0, compassSize, 0, -compassSize],
            stroke: '#ef4444',
            strokeWidth: 2,
            listening: false
        });

        // Arrow head
        const headSize = compassSize * 0.22;
        const arrowHead = new Konva.Line({
            points: [-headSize, -compassSize + headSize * 1.5, 0, -compassSize, headSize, -compassSize + headSize * 1.5],
            fill: '#ef4444',
            stroke: '#ef4444',
            strokeWidth: 1.5,
            closed: true,
            listening: false
        });

        const fontSize = Math.max(9, compassSize * 0.35);
        const smallFontSize = Math.max(8, compassSize * 0.28);

        // N label
        const nLabel = new Konva.Text({
            x: -fontSize * 0.35,
            y: -compassSize - fontSize - 4,
            text: 'N',
            fontSize: fontSize,
            fontStyle: 'bold',
            fill: '#ef4444',
            listening: false
        });

        // S label
        const sLabel = new Konva.Text({
            x: -smallFontSize * 0.3,
            y: compassSize + 4,
            text: 'S',
            fontSize: smallFontSize,
            fill: '#94a3b8',
            listening: false
        });

        // E label
        const eLabel = new Konva.Text({
            x: compassSize + 4,
            y: -smallFontSize * 0.4,
            text: 'E',
            fontSize: smallFontSize,
            fill: '#94a3b8',
            listening: false
        });

        // W label
        const wLabel = new Konva.Text({
            x: -compassSize - smallFontSize - 2,
            y: -smallFontSize * 0.4,
            text: 'W',
            fontSize: smallFontSize,
            fill: '#94a3b8',
            listening: false
        });

        this.compassGroup.add(circle);
        this.compassGroup.add(hLine);
        this.compassGroup.add(northArrow);
        this.compassGroup.add(arrowHead);
        this.compassGroup.add(nLabel);
        this.compassGroup.add(sLabel);
        this.compassGroup.add(eLabel);
        this.compassGroup.add(wLabel);

        this.canvasManager.layer.add(this.compassGroup);
        this.canvasManager.layer.draw();
    }

    toggleCompass() {
        this.showCompass = !this.showCompass;
        if (this.showCompass) {
            this.drawCompass();
        } else if (this.compassGroup) {
            this.compassGroup.destroy();
            this.compassGroup = null;
            this.canvasManager.layer.draw();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapOverlayManager;
}
