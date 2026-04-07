/* ============================================
   EXPORT MANAGER
   PDF, SVG, DXF export with scale, legend,
   element table, scale bar
   ============================================ */

class ExportManager {
    constructor(canvasManager, projectManager) {
        this.canvasManager = canvasManager;
        this.projectManager = projectManager;
    }

    // ---- PDF Export ----

    async exportPDF() {
        const project = this.projectManager.getProject();
        if (!project) return;

        // Load jsPDF dynamically if not loaded
        if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
            await this.loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js');
        }

        const { jsPDF } = window.jspdf || window;
        const doc = new jsPDF({
            orientation: project.landWidth > project.landHeight ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - 2 * margin;
        const contentHeight = pageHeight - 2 * margin - 60; // Leave room for header/footer/legend

        // ---- Title Block ----
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(`Plan Zagospodarowania: ${project.name}`, margin, margin + 5);

        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.text(`Data: ${new Date().toLocaleDateString('pl-PL')}`, margin, margin + 12);
        doc.text(`Wymiary działki: ${Helpers.round(project.landWidth, 1)}m × ${Helpers.round(project.landHeight, 1)}m`, margin, margin + 17);
        doc.text(`Siatka: ${project.gridSize}m`, pageWidth - margin - 30, margin + 12);

        // ---- Drawing Frame ----
        const drawAreaY = margin + 22;
        doc.setDrawColor(100);
        doc.setLineWidth(0.5);
        doc.rect(margin, drawAreaY, contentWidth, contentHeight);

        // ---- Canvas Image ----
        try {
            const dataUrl = this.canvasManager.stage.toDataURL({
                mimeType: 'image/png',
                pixelRatio: 2
            });

            const scaleX = contentWidth / (project.landWidth * project.pixelsPerMeter);
            const scaleY = contentHeight / (project.landHeight * project.pixelsPerMeter);
            const scale = Math.min(scaleX, scaleY) * 0.9;

            const imgWidth = contentWidth;
            const imgHeight = contentHeight;
            doc.addImage(dataUrl, 'PNG', margin, drawAreaY, imgWidth, imgHeight);
        } catch (err) {
            console.error('Error adding canvas image to PDF:', err);
        }

        // ---- Scale Bar ----
        const scaleBarY = drawAreaY + contentHeight + 5;
        this.drawScaleBar(doc, margin, scaleBarY, contentWidth, project);

        // ---- Legend ----
        const legendY = scaleBarY + 10;
        this.drawLegend(doc, margin, legendY, contentWidth, project);

        // ---- Element Table (page 2 if needed) ----
        const elements = project.elements.filter(e => e.type !== 'land_plot');
        if (elements.length > 0) {
            doc.addPage();
            this.drawElementTable(doc, margin, margin + 5, elements);
        }

        // ---- Coverage Statistics (on table page) ----
        if (window.measurementManager) {
            const coverage = window.measurementManager.calculateCoverage();
            if (coverage) {
                const y = doc.lastAutoTable?.finalY || (margin + 40 + elements.length * 8);
                this.drawCoverageStats(doc, margin, Math.min(y + 10, pageHeight - 50), coverage);
            }
        }

        // Save
        const filename = `plan-${project.name.replace(/[^a-zA-Z0-9ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, '_')}-${Date.now()}.pdf`;
        doc.save(filename);
    }

    drawScaleBar(doc, x, y, maxWidth, project) {
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');

        // Calculate scale
        const ppm = project.pixelsPerMeter;
        const mmPerMeter = (maxWidth / project.landWidth);
        
        // Find a nice round number for scale bar
        let scaleLength = 5; // meters
        if (project.landWidth > 100) scaleLength = 20;
        else if (project.landWidth > 50) scaleLength = 10;
        
        const barWidthMm = scaleLength * mmPerMeter;
        const barHeight = 3;

        // Draw bar segments
        for (let i = 0; i < 5; i++) {
            const segWidth = barWidthMm / 5;
            doc.setFillColor(i % 2 === 0 ? 0 : 255);
            doc.rect(x + i * segWidth, y, segWidth, barHeight, 'FD');
        }

        doc.text('0', x, y + barHeight + 3);
        doc.text(`${scaleLength}m`, x + barWidthMm - 5, y + barHeight + 3);
        doc.text(`Skala: 1:${Math.round(project.landWidth / (maxWidth / 1000))}`, x + barWidthMm + 10, y + barHeight);
    }

    drawLegend(doc, x, y, maxWidth, project) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('LEGENDA:', x, y);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(7);

        const elements = project.elements.filter(e => e.type !== 'land_plot');
        const uniqueTypes = [...new Set(elements.map(e => e.type))];
        
        let col = 0;
        const colWidth = maxWidth / 4;
        let row = 0;

        uniqueTypes.forEach((type, i) => {
            const defaults = CONSTANTS.ELEMENT_DEFAULTS[type];
            if (!defaults) return;

            const lx = x + col * colWidth;
            const ly = y + 5 + row * 5;

            // Color swatch
            const hex = defaults.color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            doc.setFillColor(r, g, b);
            doc.rect(lx, ly - 2.5, 4, 3, 'F');

            doc.text(`${defaults.icon || ''} ${type}`, lx + 6, ly);

            col++;
            if (col >= 4) { col = 0; row++; }
        });
    }

    drawElementTable(doc, x, y, elements) {
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('TABELA ELEMENTÓW', x, y);

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');

        const headers = ['Lp.', 'Nazwa', 'Typ', 'Szer. (m)', 'Dł. (m)', 'Poz. X', 'Poz. Y', 'Obrót'];
        const colWidths = [8, 40, 25, 18, 18, 18, 18, 15];
        let currentY = y + 8;

        // Header row
        doc.setFillColor(100, 116, 139);
        doc.setTextColor(255);
        doc.setFont(undefined, 'bold');
        let cx = x;
        headers.forEach((h, i) => {
            doc.rect(cx, currentY - 3, colWidths[i], 6, 'F');
            doc.text(h, cx + 1, currentY + 1);
            cx += colWidths[i];
        });

        currentY += 6;
        doc.setTextColor(0);
        doc.setFont(undefined, 'normal');

        elements.forEach((el, idx) => {
            if (currentY > doc.internal.pageSize.getHeight() - 20) {
                doc.addPage();
                currentY = 15;
            }
            
            cx = x;
            const row = [
                String(idx + 1),
                el.name.substring(0, 25),
                el.type,
                String(Helpers.round(el.width, 1)),
                String(Helpers.round(el.height, 1)),
                String(Helpers.round(el.x, 1)),
                String(Helpers.round(el.y, 1)),
                `${Helpers.round(el.rotation, 0)}°`
            ];

            if (idx % 2 === 0) {
                doc.setFillColor(241, 245, 249);
                doc.rect(x, currentY - 3, colWidths.reduce((a, b) => a + b, 0), 5, 'F');
            }

            row.forEach((cell, i) => {
                doc.text(cell, cx + 1, currentY);
                cx += colWidths[i];
            });
            currentY += 5;
        });

        doc.lastAutoTable = { finalY: currentY };
    }

    drawCoverageStats(doc, x, y, coverage) {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('STATYSTYKI ZABUDOWY:', x, y);
        
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        const lines = [
            `Powierzchnia działki: ${coverage.landArea} m²`,
            `Zabudowa: ${coverage.buildingArea} m² (${coverage.buildingCoverage}%) ${coverage.isBuildingCoverageOk ? '✓' : '⚠ PRZEKROCZONO MAX 30%'}`,
            `Pow. biologicznie czynna: ${coverage.biologicalSurface}% ${coverage.isBiologicalSurfaceOk ? '✓' : '⚠ PONIŻEJ MIN 25%'}`,
            `Zieleń: ${coverage.greenArea} m²`,
            `Utwardzenia: ${coverage.hardscapeArea} m²`,
            `Infrastruktura: ${coverage.infraArea} m²`,
            `Wolna pow.: ${coverage.freeArea} m²`
        ];

        lines.forEach((line, i) => {
            const color = line.includes('⚠') ? [239, 68, 68] : [0, 0, 0];
            doc.setTextColor(...color);
            doc.text(line, x, y + 6 + i * 5);
        });
        doc.setTextColor(0);
    }

    // ---- SVG Export ----

    exportSVG() {
        const project = this.projectManager.getProject();
        if (!project) return;

        const ppm = project.pixelsPerMeter;
        const w = project.landWidth * ppm;
        const h = project.landHeight * ppm;

        let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        svg += `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n`;
        svg += `<title>${project.name}</title>\n`;
        svg += `<desc>Plan zagospodarowania terenu</desc>\n`;

        // Background
        svg += `<rect x="0" y="0" width="${w}" height="${h}" fill="${project.landColor}" stroke="#6366f1" stroke-width="2"/>\n`;

        // Grid
        const gridPx = project.gridSize * ppm;
        svg += `<g id="grid" opacity="0.15" stroke="#334155" stroke-width="0.5">\n`;
        for (let x = 0; x <= w; x += gridPx) svg += `  <line x1="${x}" y1="0" x2="${x}" y2="${h}"/>\n`;
        for (let y = 0; y <= h; y += gridPx) svg += `  <line x1="0" y1="${y}" x2="${w}" y2="${y}"/>\n`;
        svg += `</g>\n`;

        // Elements
        svg += `<g id="elements">\n`;
        project.elements.forEach(el => {
            if (el.type === 'land_plot' && el.shape === 'polygon') return;
            const ex = el.x * ppm;
            const ey = el.y * ppm;
            const ew = el.width * ppm;
            const eh = el.height * ppm;
            svg += `  <g transform="translate(${ex},${ey}) rotate(${el.rotation})">\n`;
            svg += `    <rect x="${-ew/2}" y="${-eh/2}" width="${ew}" height="${eh}" fill="${el.color}" opacity="${el.opacity}" stroke="#6366f1" stroke-width="1" rx="2"/>\n`;
            svg += `    <text x="0" y="3" text-anchor="middle" fill="white" font-size="10" font-family="sans-serif">${el.name}</text>\n`;
            svg += `  </g>\n`;
        });
        svg += `</g>\n`;

        // Scale bar
        svg += `<g id="scalebar" transform="translate(10,${h-20})">\n`;
        const scaleM = project.landWidth > 50 ? 10 : 5;
        const sbw = scaleM * ppm;
        svg += `  <rect x="0" y="0" width="${sbw}" height="4" fill="#000" stroke="#fff" stroke-width="0.5"/>\n`;
        svg += `  <text x="0" y="-3" font-size="10" fill="#fff">0</text>\n`;
        svg += `  <text x="${sbw}" y="-3" font-size="10" fill="#fff" text-anchor="end">${scaleM}m</text>\n`;
        svg += `</g>\n`;

        svg += `</svg>`;

        Helpers.downloadFile(svg, `plan-${project.name}-${Date.now()}.svg`, 'image/svg+xml');
    }

    // ---- High-res PNG ----

    exportHighResPNG(pixelRatio = 3) {
        const dataUrl = this.canvasManager.stage.toDataURL({
            mimeType: 'image/png',
            pixelRatio: pixelRatio
        });
        const project = this.projectManager.getProject();
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `plan-${project.name}-HiRes-${Date.now()}.png`;
        link.click();
    }

    // ---- Helper ----

    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExportManager;
}
