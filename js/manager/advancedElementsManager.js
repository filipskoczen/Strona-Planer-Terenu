/* ============================================
   ADVANCED ELEMENTS MANAGER
   Custom elements, textures/patterns,
   Image import as underlay
   ============================================ */

class AdvancedElementsManager {
    constructor(canvasManager, projectManager, uiManager) {
        this.canvasManager = canvasManager;
        this.projectManager = projectManager;
        this.uiManager = uiManager;
        this.customElements = JSON.parse(localStorage.getItem('landPlanner_customElements') || '[]');
        this.imageUnderlays = [];
        this.underlayLayer = null;

        this.initUnderlayLayer();
    }

    initUnderlayLayer() {
        this.underlayLayer = new Konva.Layer();
        const stage = this.canvasManager.stage;
        // Add after mapLayer (if exists), before gridLayer
        const gridLayer = this.canvasManager.gridLayer;
        stage.add(this.underlayLayer);
        // Move it just above the bottom
        this.underlayLayer.moveToBottom();
        this.underlayLayer.moveUp(); // above map layer if exists
    }

    // ---- Custom Elements ----

    showCreateCustomElementDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'modal';
        dialog.id = 'customElementModal';
        dialog.innerHTML = `
            <div class="modal-content modal-content--small">
                <div class="modal-header">
                    <h2>➕ Nowy typ elementu</h2>
                    <button class="modal-close" onclick="document.getElementById('customElementModal').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-field">
                        <label>Nazwa elementu</label>
                        <input type="text" id="customElName" placeholder="np. Altana ogrodowa" maxlength="30">
                    </div>
                    <div class="form-row">
                        <div class="form-field">
                            <label>Szerokość (m)</label>
                            <input type="number" id="customElWidth" value="3" min="0.5" max="100" step="0.5">
                        </div>
                        <div class="form-field">
                            <label>Długość (m)</label>
                            <input type="number" id="customElHeight" value="3" min="0.5" max="100" step="0.5">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-field">
                            <label>Kolor</label>
                            <input type="color" id="customElColor" value="#8b5cf6">
                        </div>
                        <div class="form-field">
                            <label>Ikona (emoji)</label>
                            <input type="text" id="customElIcon" value="📦" maxlength="2" style="font-size:20px;width:50px;text-align:center;">
                        </div>
                    </div>
                    <div class="form-field">
                        <label>Kategoria</label>
                        <select id="customElCategory">
                            <option value="buildings">Budynki</option>
                            <option value="vegetation">Ogród i Roślinność</option>
                            <option value="water">Woda i Ścieżki</option>
                            <option value="other" selected>Inne</option>
                        </select>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="document.getElementById('customElementModal').remove()">Anuluj</button>
                    <button class="btn btn-primary" id="confirmCustomElement">Dodaj element</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);

        document.getElementById('confirmCustomElement').addEventListener('click', () => {
            this.createCustomElement();
            dialog.remove();
        });
    }

    createCustomElement() {
        const name = document.getElementById('customElName')?.value?.trim();
        if (!name) return;

        const typeKey = 'custom_' + name.toLowerCase().replace(/[^a-zą-ż0-9]/gi, '_');
        
        const customEl = {
            type: typeKey,
            name: name,
            width: parseFloat(document.getElementById('customElWidth')?.value) || 3,
            height: parseFloat(document.getElementById('customElHeight')?.value) || 3,
            color: document.getElementById('customElColor')?.value || '#8b5cf6',
            icon: document.getElementById('customElIcon')?.value || '📦',
            category: document.getElementById('customElCategory')?.value || 'other'
        };

        // Register in CONSTANTS
        CONSTANTS.ELEMENT_DEFAULTS[typeKey] = {
            width: customEl.width,
            height: customEl.height,
            color: customEl.color,
            icon: customEl.icon
        };

        // Store persistently
        this.customElements.push(customEl);
        localStorage.setItem('landPlanner_customElements', JSON.stringify(this.customElements));

        // Add button to sidebar
        this.addCustomElementButton(customEl);

        this.uiManager.showMessage(`Dodano element: ${name}`, 'success');
    }

    addCustomElementButton(customEl) {
        const categoryMap = {
            'buildings': 0,
            'vegetation': 1,
            'water': 2,
            'other': 3
        };

        const groups = document.querySelectorAll('.element-group .element-grid');
        const groupIndex = categoryMap[customEl.category] ?? 3;
        const grid = groups[groupIndex];
        if (!grid) return;

        const btn = document.createElement('button');
        btn.className = 'element-btn element-btn--custom';
        btn.dataset.element = customEl.type;
        btn.draggable = true;
        btn.title = customEl.name;
        btn.innerHTML = `<span class="icon">${customEl.icon}</span> ${customEl.name}`;

        btn.addEventListener('click', () => {
            this.uiManager.startElementCreation(customEl.type);
        });

        btn.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'copy';
            e.dataTransfer.setData('elementType', customEl.type);
        });

        grid.appendChild(btn);
    }

    loadSavedCustomElements() {
        this.customElements.forEach(el => {
            CONSTANTS.ELEMENT_DEFAULTS[el.type] = {
                width: el.width,
                height: el.height,
                color: el.color,
                icon: el.icon
            };
            this.addCustomElementButton(el);
        });
    }

    // ---- Image Underlay (Plan Import) ----

    importImageAsUnderlay() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            this.loadImageUnderlay(file);
        });
        input.click();
    }

    loadImageUnderlay(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const project = this.projectManager.getProject();
                if (!project) return;

                const ppm = project.pixelsPerMeter;
                const landW = project.landWidth * ppm;
                const landH = project.landHeight * ppm;

                // Scale image to fit land area
                const scaleX = landW / img.width;
                const scaleY = landH / img.height;
                const scale = Math.min(scaleX, scaleY);

                const konvaImg = new Konva.Image({
                    image: img,
                    x: 0,
                    y: 0,
                    width: img.width * scale,
                    height: img.height * scale,
                    opacity: 0.4,
                    draggable: true,
                    listening: true,
                    name: 'image-underlay'
                });

                this.underlayLayer.add(konvaImg);
                this.underlayLayer.draw();
                this.imageUnderlays.push(konvaImg);

                this.uiManager.showMessage('Obraz dodany jako podkład', 'success');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    setUnderlayOpacity(opacity) {
        this.imageUnderlays.forEach(img => {
            img.opacity(opacity);
        });
        this.underlayLayer.draw();
    }

    removeAllUnderlays() {
        this.underlayLayer.destroyChildren();
        this.underlayLayer.draw();
        this.imageUnderlays = [];
    }

    // ---- Texture Patterns ----

    getTexturePatterns() {
        return {
            grass: { name: 'Trawa', color1: '#22c55e', color2: '#16a34a', pattern: 'dots' },
            gravel: { name: 'Żwir', color1: '#a8a29e', color2: '#78716c', pattern: 'dots' },
            pavement: { name: 'Bruk', color1: '#94a3b8', color2: '#64748b', pattern: 'grid' },
            wood: { name: 'Drewno', color1: '#a16207', color2: '#854d0e', pattern: 'lines' },
            water: { name: 'Woda', color1: '#38bdf8', color2: '#0284c7', pattern: 'waves' },
            earth: { name: 'Ziemia', color1: '#92400e', color2: '#78350f', pattern: 'dots' }
        };
    }

    applyTextureToElement(elementId, textureName) {
        const textures = this.getTexturePatterns();
        const texture = textures[textureName];
        if (!texture) return;

        const element = this.projectManager.getElement(elementId);
        if (!element) return;

        // Store texture info on element
        element.properties = element.properties || {};
        element.properties.texture = textureName;

        // Apply base color
        this.projectManager.updateElement(elementId, { color: texture.color1 });

        // Create pattern overlay on canvas
        const shape = this.canvasManager.elementsShapes.get(elementId);
        if (shape) {
            const ppm = this.canvasManager.project.pixelsPerMeter;
            const w = element.width * ppm;
            const h = element.height * ppm;

            // Draw texture pattern using sceneFunc
            const patternShape = this.createPatternShape(texture, w, h);
            if (patternShape) {
                shape.add(patternShape);
                this.canvasManager.elementsLayer.draw();
            }
        }
    }

    createPatternShape(texture, w, h) {
        const shape = new Konva.Shape({
            x: -w / 2,
            y: -h / 2,
            width: w,
            height: h,
            listening: false,
            sceneFunc: (ctx, shape) => {
                ctx.beginPath();
                ctx.rect(0, 0, w, h);
                ctx.clip();

                ctx.globalAlpha = 0.3;

                switch (texture.pattern) {
                    case 'dots':
                        ctx.fillStyle = texture.color2;
                        for (let x = 0; x < w; x += 8) {
                            for (let y = 0; y < h; y += 8) {
                                ctx.beginPath();
                                ctx.arc(x + Math.random() * 3, y + Math.random() * 3, 1.5, 0, Math.PI * 2);
                                ctx.fill();
                            }
                        }
                        break;
                    case 'grid':
                        ctx.strokeStyle = texture.color2;
                        ctx.lineWidth = 0.5;
                        for (let x = 0; x < w; x += 6) {
                            ctx.beginPath();
                            ctx.moveTo(x, 0); ctx.lineTo(x, h);
                            ctx.stroke();
                        }
                        for (let y = 0; y < h; y += 6) {
                            ctx.beginPath();
                            ctx.moveTo(0, y); ctx.lineTo(w, y);
                            ctx.stroke();
                        }
                        break;
                    case 'lines':
                        ctx.strokeStyle = texture.color2;
                        ctx.lineWidth = 1;
                        for (let y = 0; y < h; y += 4) {
                            ctx.beginPath();
                            ctx.moveTo(0, y); ctx.lineTo(w, y);
                            ctx.stroke();
                        }
                        break;
                    case 'waves':
                        ctx.strokeStyle = texture.color2;
                        ctx.lineWidth = 1;
                        for (let y = 0; y < h; y += 8) {
                            ctx.beginPath();
                            for (let x = 0; x < w; x += 2) {
                                ctx.lineTo(x, y + Math.sin(x * 0.3) * 3);
                            }
                            ctx.stroke();
                        }
                        break;
                }
            }
        });
        return shape;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedElementsManager;
}
