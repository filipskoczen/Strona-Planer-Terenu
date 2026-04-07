/* ============================================
   INFRASTRUCTURE MANAGER
   Underground utilities: water, sewer, gas,
   electric, drainage. Protective zones.
   ============================================ */

class InfrastructureManager {
    constructor(canvasManager, projectManager, uiManager) {
        this.canvasManager = canvasManager;
        this.projectManager = projectManager;
        this.uiManager = uiManager;
        this.infraLayer = null;
        this.showInfrastructure = false;
        this.pipes = []; // stored pipe data
        this.connections = []; // utility connection points

        this.initLayer();
    }

    initLayer() {
        this.infraLayer = new Konva.Layer({ visible: false });
        this.canvasManager.stage.add(this.infraLayer);
        // Position above land, below elements
        const elementsLayer = this.canvasManager.elementsLayer;
        this.infraLayer.moveTo(this.canvasManager.stage);
        this.infraLayer.moveToBottom();
        this.infraLayer.moveUp(); // above map layer
        this.infraLayer.moveUp(); // above underlay layer
        this.infraLayer.moveUp(); // above grid layer
    }

    // ---- Utility Types ----

    static UTILITY_TYPES = {
        water: { name: 'Woda', color: '#3b82f6', dash: [8, 4], width: 3, icon: '💧', protectionZone: 1.5 },
        sewer: { name: 'Kanalizacja', color: '#92400e', dash: [12, 4], width: 3, icon: '🟤', protectionZone: 1.5 },
        gas: { name: 'Gaz', color: '#eab308', dash: [6, 6], width: 2.5, icon: '🟡', protectionZone: 2.0 },
        electric: { name: 'Prąd', color: '#ef4444', dash: [4, 4], width: 2, icon: '⚡', protectionZone: 1.0 },
        telecom: { name: 'Telekomunikacja', color: '#8b5cf6', dash: [3, 3], width: 1.5, icon: '📡', protectionZone: 0.5 },
        drainage: { name: 'Drenaż', color: '#06b6d4', dash: [10, 3, 3, 3], width: 2, icon: '🌊', protectionZone: 1.0 },
        rainwater: { name: 'Deszczówka', color: '#0ea5e9', dash: [5, 5], width: 2, icon: '🌧️', protectionZone: 1.0 }
    };

    // ---- Toggle Visibility ----

    toggleInfrastructure() {
        this.showInfrastructure = !this.showInfrastructure;
        this.infraLayer.visible(this.showInfrastructure);
        this.infraLayer.draw();
        this.canvasManager.stage.draw();
    }

    // ---- Draw Pipe / Line ----

    startDrawPipe(utilityType) {
        const type = InfrastructureManager.UTILITY_TYPES[utilityType];
        if (!type) return;

        const stage = this.canvasManager.stage;
        const ppm = this.canvasManager.project?.pixelsPerMeter || 30;
        
        // Enable infrastructure layer
        this.showInfrastructure = true;
        this.infraLayer.visible(true);

        stage.draggable(false);
        document.getElementById('canvasContainer')?.classList.add('pipe-mode');

        let points = [];
        let previewLine = null;
        let previewDot = null;

        const getStagePos = () => {
            const pos = stage.getPointerPosition();
            return {
                x: (pos.x - stage.x()) / stage.scaleX(),
                y: (pos.y - stage.y()) / stage.scaleY()
            };
        };

        const onClick = () => {
            const pos = getStagePos();
            points.push(pos.x, pos.y);

            // Draw dot at click point
            const dot = new Konva.Circle({
                x: pos.x, y: pos.y,
                radius: 4,
                fill: type.color,
                stroke: '#fff',
                strokeWidth: 1,
                listening: false
            });
            this.infraLayer.add(dot);
            this.infraLayer.draw();
        };

        const onDblClick = () => {
            // Finish pipe
            cleanup();

            if (points.length < 4) return; // Need at least 2 points

            const pipeData = {
                id: Helpers.generateId(),
                type: utilityType,
                points: [...points],
                depth: 1.0 // default depth in meters
            };
            this.pipes.push(pipeData);

            this.drawPipe(pipeData);
            this.uiManager.showMessage(`Dodano: ${type.name} (${points.length / 2} punktów)`, 'success');
        };

        const onMouseMove = () => {
            if (points.length < 2) return;
            const pos = getStagePos();

            if (previewLine) previewLine.destroy();
            if (previewDot) previewDot.destroy();

            previewLine = new Konva.Line({
                points: [...points, pos.x, pos.y],
                stroke: type.color,
                strokeWidth: type.width,
                dash: type.dash,
                opacity: 0.5,
                listening: false
            });
            previewDot = new Konva.Circle({
                x: pos.x, y: pos.y,
                radius: 3, fill: type.color, opacity: 0.5, listening: false
            });

            this.infraLayer.add(previewLine);
            this.infraLayer.add(previewDot);
            this.infraLayer.draw();
        };

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                cleanup();
            }
        };

        const cleanup = () => {
            stage.off('click.pipe');
            stage.off('dblclick.pipe');
            stage.off('mousemove.pipe');
            document.removeEventListener('keydown', onKeyDown);
            stage.draggable(true);
            document.getElementById('canvasContainer')?.classList.remove('pipe-mode');
            if (previewLine) previewLine.destroy();
            if (previewDot) previewDot.destroy();
            this.infraLayer.draw();
        };

        stage.on('click.pipe', onClick);
        stage.on('dblclick.pipe', onDblClick);
        stage.on('mousemove.pipe', onMouseMove);
        document.addEventListener('keydown', onKeyDown);

        this.uiManager.showMessage(`🔧 Rysuj ${type.name}: klikaj punkty, podwójne kliknięcie = zakończ, Esc = anuluj`, 'info');
    }

    drawPipe(pipeData) {
        const type = InfrastructureManager.UTILITY_TYPES[pipeData.type];
        if (!type) return;

        // Main pipe line
        const line = new Konva.Line({
            points: pipeData.points,
            stroke: type.color,
            strokeWidth: type.width,
            dash: type.dash,
            lineCap: 'round',
            lineJoin: 'round',
            listening: false,
            name: `pipe-${pipeData.id}`
        });
        this.infraLayer.add(line);

        // Direction arrows along the pipe
        for (let i = 0; i < pipeData.points.length - 2; i += 2) {
            const x1 = pipeData.points[i];
            const y1 = pipeData.points[i + 1];
            const x2 = pipeData.points[i + 2];
            const y2 = pipeData.points[i + 3];
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

            const arrow = new Konva.Text({
                x: midX,
                y: midY,
                text: '▶',
                fontSize: 8,
                fill: type.color,
                rotation: angle,
                listening: false,
                name: `pipe-${pipeData.id}`
            });
            arrow.offsetX(arrow.width() / 2);
            arrow.offsetY(arrow.height() / 2);
            this.infraLayer.add(arrow);
        }

        // Label at start
        const label = new Konva.Label({
            x: pipeData.points[0],
            y: pipeData.points[1] - 15,
            listening: false,
            name: `pipe-${pipeData.id}`
        });
        label.add(new Konva.Tag({ fill: 'rgba(15,23,42,0.8)', cornerRadius: 3 }));
        label.add(new Konva.Text({
            text: `${type.icon} ${type.name}`,
            fontSize: 10,
            fill: type.color,
            padding: 3,
            fontStyle: 'bold'
        }));
        this.infraLayer.add(label);

        this.infraLayer.draw();
    }

    // ---- Connection Points (Przyłącza) ----

    addConnectionPoint(utilityType, side, positionRatio) {
        const type = InfrastructureManager.UTILITY_TYPES[utilityType];
        if (!type || !this.canvasManager.project) return;

        const ppm = this.canvasManager.project.pixelsPerMeter;
        const w = this.canvasManager.project.landWidth * ppm;
        const h = this.canvasManager.project.landHeight * ppm;

        let x, y;
        switch (side) {
            case 'north': x = w * positionRatio; y = 0; break;
            case 'south': x = w * positionRatio; y = h; break;
            case 'east': x = w; y = h * positionRatio; break;
            case 'west': x = 0; y = h * positionRatio; break;
        }

        const conn = { id: Helpers.generateId(), type: utilityType, side, x, y, positionRatio };
        this.connections.push(conn);

        // Draw connection marker
        const group = new Konva.Group({
            x: x, y: y,
            listening: false,
            name: `connection-${conn.id}`
        });

        // Connection point circle
        const circle = new Konva.Circle({
            radius: 8,
            fill: type.color,
            stroke: '#fff',
            strokeWidth: 2
        });

        // Icon
        const icon = new Konva.Text({
            text: type.icon,
            fontSize: 10,
            offsetX: 5,
            offsetY: 5
        });

        // Label
        const label = new Konva.Text({
            y: 12,
            text: `Przyłącze ${type.name}`,
            fontSize: 9,
            fill: type.color,
            fontStyle: 'bold'
        });
        label.offsetX(label.width() / 2);

        group.add(circle);
        group.add(icon);
        group.add(label);
        this.infraLayer.add(group);

        // Make visible
        this.showInfrastructure = true;
        this.infraLayer.visible(true);
        this.infraLayer.draw();

        this.uiManager.showMessage(`Dodano przyłącze: ${type.name} (${side})`, 'success');
    }

    // ---- Protection Zones ----

    toggleProtectionZones() {
        const existing = this.infraLayer.find('.protection-zone');
        if (existing.length > 0) {
            existing.forEach(n => n.destroy());
            this.infraLayer.draw();
            return;
        }

        const ppm = this.canvasManager.project?.pixelsPerMeter || 30;

        this.pipes.forEach(pipeData => {
            const type = InfrastructureManager.UTILITY_TYPES[pipeData.type];
            if (!type) return;

            const zonePx = type.protectionZone * ppm;

            // Draw zone around pipe using offset lines
            for (let i = 0; i < pipeData.points.length - 2; i += 2) {
                const x1 = pipeData.points[i];
                const y1 = pipeData.points[i + 1];
                const x2 = pipeData.points[i + 2];
                const y2 = pipeData.points[i + 3];
                const dx = x2 - x1;
                const dy = y2 - y1;
                const len = Math.sqrt(dx * dx + dy * dy);
                if (len === 0) continue;

                const nx = -dy / len * zonePx;
                const ny = dx / len * zonePx;

                const zone = new Konva.Line({
                    points: [
                        x1 + nx, y1 + ny,
                        x2 + nx, y2 + ny,
                        x2 - nx, y2 - ny,
                        x1 - nx, y1 - ny
                    ],
                    fill: type.color,
                    opacity: 0.1,
                    stroke: type.color,
                    strokeWidth: 0.5,
                    dash: [3, 3],
                    closed: true,
                    listening: false,
                    name: 'protection-zone'
                });
                this.infraLayer.add(zone);
                zone.moveToBottom();
            }
        });

        this.infraLayer.draw();
    }

    // ---- Pipe removal ----

    removePipe(pipeId) {
        this.pipes = this.pipes.filter(p => p.id !== pipeId);
        this.infraLayer.find(`.pipe-${pipeId}`).forEach(n => n.destroy());
        this.infraLayer.draw();
    }

    clearAll() {
        this.pipes = [];
        this.connections = [];
        this.infraLayer.destroyChildren();
        this.infraLayer.draw();
    }

    // ---- Get pipe list for UI ----

    getPipeList() {
        return this.pipes.map(p => {
            const type = InfrastructureManager.UTILITY_TYPES[p.type];
            return {
                id: p.id,
                name: type?.name || p.type,
                icon: type?.icon || '🔧',
                color: type?.color || '#666',
                points: p.points.length / 2
            };
        });
    }

    getConnectionList() {
        return this.connections.map(c => {
            const type = InfrastructureManager.UTILITY_TYPES[c.type];
            return {
                id: c.id,
                name: type?.name || c.type,
                icon: type?.icon || '🔧',
                side: c.side
            };
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = InfrastructureManager;
}
