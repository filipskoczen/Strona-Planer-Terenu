/* ============================================
   VIEW 3D MANAGER
   Isometric / pseudo-3D preview of the plan
   ============================================ */

class View3dManager {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.isOpen = false;
        this.canvas3d = null;
        this.ctx = null;
        this.rotationY = 45; // degrees
        this.tiltX = 30; // degrees
        this.zoom3d = 1;
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };

        // Height multiplier for 3D extrusion
        this.heightMap = {
            house: 8, garage: 3.5, shed: 2.5, porch: 3,
            gazebo: 3, greenhouse: 2.5, carport: 2.8,
            tree: 6, fruit_tree: 4,
            fence: 1.8, hedge: 1.5,
            light: 3, swing: 2.5
        };
        this.defaultHeight = 0.3;
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (this.isOpen) return;
        this.isOpen = true;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'view3dOverlay';
        overlay.className = 'view3d-overlay';
        overlay.innerHTML = `
            <div class="view3d-container">
                <div class="view3d-header">
                    <h3>🏗️ Widok 3D (izometryczny)</h3>
                    <div class="view3d-controls">
                        <label>Obrót: <input type="range" id="view3dRotation" min="0" max="360" value="${this.rotationY}"></label>
                        <label>Pochylenie: <input type="range" id="view3dTilt" min="10" max="80" value="${this.tiltX}"></label>
                        <label>Zoom: <input type="range" id="view3dZoom" min="0.3" max="3" step="0.1" value="${this.zoom3d}"></label>
                    </div>
                    <button class="view3d-close" onclick="window.view3dManager?.close()">✕</button>
                </div>
                <canvas id="view3dCanvas" class="view3d-canvas"></canvas>
                <div class="view3d-hint">Przeciągnij myszą aby obrócić widok</div>
            </div>
        `;
        document.body.appendChild(overlay);

        this.canvas3d = document.getElementById('view3dCanvas');
        this.ctx = this.canvas3d.getContext('2d');

        // Size canvas
        const container = this.canvas3d.parentElement;
        this.canvas3d.width = container.clientWidth - 40;
        this.canvas3d.height = container.clientHeight - 120;

        // Bind controls
        document.getElementById('view3dRotation')?.addEventListener('input', (e) => {
            this.rotationY = +e.target.value;
            this.render();
        });
        document.getElementById('view3dTilt')?.addEventListener('input', (e) => {
            this.tiltX = +e.target.value;
            this.render();
        });
        document.getElementById('view3dZoom')?.addEventListener('input', (e) => {
            this.zoom3d = +e.target.value;
            this.render();
        });

        // Mouse drag rotation
        this.canvas3d.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouse = { x: e.clientX, y: e.clientY };
        });
        this.canvas3d.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.lastMouse.x;
            const dy = e.clientY - this.lastMouse.y;
            this.rotationY = (this.rotationY + dx * 0.5) % 360;
            this.tiltX = Math.max(10, Math.min(80, this.tiltX + dy * 0.3));
            this.lastMouse = { x: e.clientX, y: e.clientY };
            document.getElementById('view3dRotation').value = this.rotationY;
            document.getElementById('view3dTilt').value = this.tiltX;
            this.render();
        });
        this.canvas3d.addEventListener('mouseup', () => { this.isDragging = false; });
        this.canvas3d.addEventListener('mouseleave', () => { this.isDragging = false; });

        // ESC close
        this._escHandler = (e) => { if (e.key === 'Escape') this.close(); };
        document.addEventListener('keydown', this._escHandler);

        this.render();
    }

    close() {
        this.isOpen = false;
        document.getElementById('view3dOverlay')?.remove();
        if (this._escHandler) {
            document.removeEventListener('keydown', this._escHandler);
        }
    }

    render() {
        if (!this.ctx || !this.canvas3d) return;
        const ctx = this.ctx;
        const w = this.canvas3d.width;
        const h = this.canvas3d.height;
        const project = this.canvasManager.project;
        if (!project) return;

        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = '#0c1222';
        ctx.fillRect(0, 0, w, h);

        const rad = this.rotationY * Math.PI / 180;
        const tilt = this.tiltX * Math.PI / 180;
        const cosR = Math.cos(rad);
        const sinR = Math.sin(rad);
        const cosT = Math.cos(tilt);
        const sinT = Math.sin(tilt);
        const zoom = this.zoom3d;

        const cx = w / 2;
        const cy = h / 2 + 50;
        const ppm = project.pixelsPerMeter || 30;
        const scale = (Math.min(w, h) / Math.max(project.width, project.height)) * 0.35 * zoom;

        // Project 3D point to 2D isometric
        const project3d = (x3d, y3d, z3d) => {
            // Center coordinates
            const px = x3d - project.width / 2;
            const py = y3d - project.height / 2;

            // Rotate around Y axis
            const rx = px * cosR - py * sinR;
            const ry = px * sinR + py * cosR;

            // Apply tilt
            const screenX = cx + rx * scale;
            const screenY = cy + ry * cosT * scale - z3d * sinT * scale;

            return { x: screenX, y: screenY };
        };

        // Draw ground plane
        const ground = [
            project3d(0, 0, 0),
            project3d(project.width, 0, 0),
            project3d(project.width, project.height, 0),
            project3d(0, project.height, 0)
        ];
        ctx.beginPath();
        ctx.moveTo(ground[0].x, ground[0].y);
        ground.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fillStyle = '#1a5c2a';
        ctx.fill();
        ctx.strokeStyle = '#2d8a4e';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw grid on ground
        ctx.strokeStyle = 'rgba(45, 138, 78, 0.3)';
        ctx.lineWidth = 0.5;
        const gridStep = project.gridSize || 1;
        for (let gx = 0; gx <= project.width; gx += gridStep) {
            const a = project3d(gx, 0, 0);
            const b = project3d(gx, project.height, 0);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
        for (let gy = 0; gy <= project.height; gy += gridStep) {
            const a = project3d(0, gy, 0);
            const b = project3d(project.width, gy, 0);
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }

        // Collect and sort elements by depth
        const elements = project.getAllElements().filter(e => e.type !== 'land_plot');
        const sorted = elements.map(el => {
            const centerX = el.x;
            const centerY = el.y;
            // Depth for sorting (further elements drawn first)
            const depth = centerX * sinR + centerY * cosR;
            return { el, depth };
        }).sort((a, b) => a.depth - b.depth);

        // Draw elements as 3D boxes
        sorted.forEach(({ el }) => {
            const elH = this.heightMap[el.type] || this.defaultHeight;
            const x1 = el.x - el.width / 2;
            const y1 = el.y - el.height / 2;
            const x2 = el.x + el.width / 2;
            const y2 = el.y + el.height / 2;

            // Bottom face corners
            const b0 = project3d(x1, y1, 0);
            const b1 = project3d(x2, y1, 0);
            const b2 = project3d(x2, y2, 0);
            const b3 = project3d(x1, y2, 0);

            // Top face corners
            const t0 = project3d(x1, y1, elH);
            const t1 = project3d(x2, y1, elH);
            const t2 = project3d(x2, y2, elH);
            const t3 = project3d(x1, y2, elH);

            const color = el.color || '#6366f1';
            const darkColor = this._darkenColor(color, 0.7);
            const lightColor = this._lightenColor(color, 1.2);

            // Draw front face (visible depending on rotation)
            ctx.beginPath();
            ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y);
            ctx.lineTo(t2.x, t2.y); ctx.lineTo(t1.x, t1.y);
            ctx.closePath();
            ctx.fillStyle = darkColor;
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Draw side face
            ctx.beginPath();
            ctx.moveTo(b2.x, b2.y); ctx.lineTo(b3.x, b3.y);
            ctx.lineTo(t3.x, t3.y); ctx.lineTo(t2.x, t2.y);
            ctx.closePath();
            ctx.fillStyle = this._darkenColor(color, 0.5);
            ctx.fill();
            ctx.stroke();

            // Draw top face
            ctx.beginPath();
            ctx.moveTo(t0.x, t0.y); ctx.lineTo(t1.x, t1.y);
            ctx.lineTo(t2.x, t2.y); ctx.lineTo(t3.x, t3.y);
            ctx.closePath();
            ctx.fillStyle = lightColor;
            ctx.fill();
            ctx.stroke();

            // Draw element name on top
            const labelPos = project3d(el.x, el.y, elH + 0.3);
            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.max(8, 11 * zoom)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(el.name, labelPos.x, labelPos.y);
        });

        // Draw shadow gradient for depth
        const gradient = ctx.createLinearGradient(0, h - 30, 0, h);
        gradient.addColorStop(0, 'rgba(12, 18, 34, 0)');
        gradient.addColorStop(1, 'rgba(12, 18, 34, 0.8)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, h - 30, w, 30);
    }

    _darkenColor(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)})`;
    }

    _lightenColor(hex, factor) {
        const r = Math.min(255, parseInt(hex.slice(1, 3), 16) * factor);
        const g = Math.min(255, parseInt(hex.slice(3, 5), 16) * factor);
        const b = Math.min(255, parseInt(hex.slice(5, 7), 16) * factor);
        return `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
    }
}
