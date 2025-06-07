/**
 * Interactive Whiteboard for Grid Creation
 * Responsive design with touch support for all devices
 * Version 1.0 - Multi-device grid creation interface
 */

class InteractiveWhiteboard {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Touch and mouse support
        this.touchSupported = 'ontouchstart' in window;
        this.isDrawing = false;
        this.isDragging = false;
        this.isPanning = false;
        
        // Grid creation state
        this.whiteboardMode = false;
        this.selectedTool = 'pen';
        this.strokeColor = '#2196F3';
        this.strokeWidth = 3;
        this.fillColor = 'transparent';
        
        // Drawing history for undo/redo
        this.drawingHistory = [];
        this.historyIndex = -1;
        this.maxHistorySize = 20;
        
        // Current drawing path
        this.currentPath = [];
        this.currentShape = null;
        
        // Component palette
        this.componentPalette = {
            generator: { icon: '🏭', color: '#4CAF50', size: 40 },
            substation: { icon: '🏢', color: '#FF9800', size: 35 },
            load: { icon: '🏠', color: '#2196F3', size: 30 },
            transmission: { icon: '⚡', color: '#9C27B0', size: 25 },
            transformer: { icon: '🔄', color: '#F44336', size: 30 }
        };
        
        // Transform state
        this.transform = {
            scale: 1,
            translateX: 0,
            translateY: 0,
            rotation: 0
        };
        
        // Gesture handling
        this.lastTouchDistance = 0;
        this.lastTouchCenter = { x: 0, y: 0 };
        this.touches = [];
        
        // Grid settings
        this.showGrid = true;
        this.gridSize = 20;
        this.snapToGrid = true;
        
        this.init();
    }

    init() {
        this.setupWhiteboardInterface();
        this.setupEventListeners();
        this.setupComponentPalette();
        this.saveToHistory();
    }

    setupWhiteboardInterface() {
        // Create whiteboard toggle button
        const whiteboardToggle = document.createElement('button');
        whiteboardToggle.id = 'whiteboard-toggle';
        whiteboardToggle.className = 'whiteboard-toggle';
        whiteboardToggle.innerHTML = '<i class="fas fa-draw-polygon"></i> Whiteboard Mode';
        whiteboardToggle.addEventListener('click', () => this.toggleWhiteboardMode());
        
        // Add to header
        const header = document.querySelector('.header');
        if (header) {
            header.appendChild(whiteboardToggle);
        }

        // Create whiteboard toolbar
        this.createWhiteboardToolbar();
    }

    createWhiteboardToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'whiteboard-toolbar';
        toolbar.className = 'whiteboard-toolbar';
        toolbar.style.display = 'none';
        
        toolbar.innerHTML = `
            <div class="whiteboard-section">
                <h3>Drawing Tools</h3>
                <div class="tool-group">
                    <button class="whiteboard-tool active" data-tool="pen" title="Pen Tool">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="whiteboard-tool" data-tool="line" title="Line Tool">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="whiteboard-tool" data-tool="rectangle" title="Rectangle">
                        <i class="fas fa-square"></i>
                    </button>
                    <button class="whiteboard-tool" data-tool="circle" title="Circle">
                        <i class="fas fa-circle"></i>
                    </button>
                    <button class="whiteboard-tool" data-tool="arrow" title="Arrow">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                    <button class="whiteboard-tool" data-tool="text" title="Text">
                        <i class="fas fa-font"></i>
                    </button>
                </div>
            </div>
            
            <div class="whiteboard-section">
                <h3>Components</h3>
                <div class="component-palette" id="component-palette">
                    <!-- Component buttons will be dynamically added -->
                </div>
            </div>
            
            <div class="whiteboard-section">
                <h3>Styling</h3>
                <div class="style-controls">
                    <label>Color:</label>
                    <input type="color" id="stroke-color" value="#2196F3">
                    <label>Width:</label>
                    <input type="range" id="stroke-width" min="1" max="10" value="3">
                    <span id="width-display">3px</span>
                </div>
            </div>
            
            <div class="whiteboard-section">
                <h3>Actions</h3>
                <div class="action-controls">
                    <button id="undo-btn" title="Undo">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button id="redo-btn" title="Redo">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button id="clear-btn" title="Clear All">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button id="save-whiteboard" title="Save Design">
                        <i class="fas fa-save"></i>
                    </button>
                    <button id="load-whiteboard" title="Load Design">
                        <i class="fas fa-folder-open"></i>
                    </button>
                </div>
            </div>
            
            <div class="whiteboard-section">
                <h3>Grid Settings</h3>
                <div class="grid-controls">
                    <label>
                        <input type="checkbox" id="show-grid" checked> Show Grid
                    </label>
                    <label>
                        <input type="checkbox" id="snap-to-grid" checked> Snap to Grid
                    </label>
                    <label>Grid Size:</label>
                    <input type="range" id="grid-size" min="10" max="50" value="20">
                    <span id="grid-size-display">20px</span>
                </div>
            </div>
        `;
        
        // Add toolbar to the main content area
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.insertBefore(toolbar, mainContent.firstChild);
        }
        
        this.setupWhiteboardControls();
    }

    setupWhiteboardControls() {
        // Tool selection
        document.querySelectorAll('.whiteboard-tool').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.whiteboard-tool').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedTool = btn.dataset.tool;
            });
        });

        // Style controls
        const colorInput = document.getElementById('stroke-color');
        const widthInput = document.getElementById('stroke-width');
        const widthDisplay = document.getElementById('width-display');

        if (colorInput) {
            colorInput.addEventListener('change', (e) => {
                this.strokeColor = e.target.value;
            });
        }

        if (widthInput) {
            widthInput.addEventListener('input', (e) => {
                this.strokeWidth = parseInt(e.target.value);
                if (widthDisplay) {
                    widthDisplay.textContent = `${this.strokeWidth}px`;
                }
            });
        }

        // Action controls
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        const clearBtn = document.getElementById('clear-btn');
        const saveBtn = document.getElementById('save-whiteboard');
        const loadBtn = document.getElementById('load-whiteboard');

        if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
        if (redoBtn) redoBtn.addEventListener('click', () => this.redo());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearWhiteboard());
        if (saveBtn) saveBtn.addEventListener('click', () => this.saveWhiteboard());
        if (loadBtn) loadBtn.addEventListener('click', () => this.loadWhiteboard());

        // Grid controls
        const showGridInput = document.getElementById('show-grid');
        const snapToGridInput = document.getElementById('snap-to-grid');
        const gridSizeInput = document.getElementById('grid-size');
        const gridSizeDisplay = document.getElementById('grid-size-display');

        if (showGridInput) {
            showGridInput.addEventListener('change', (e) => {
                this.showGrid = e.target.checked;
                this.redraw();
            });
        }

        if (snapToGridInput) {
            snapToGridInput.addEventListener('change', (e) => {
                this.snapToGrid = e.target.checked;
            });
        }

        if (gridSizeInput) {
            gridSizeInput.addEventListener('input', (e) => {
                this.gridSize = parseInt(e.target.value);
                if (gridSizeDisplay) {
                    gridSizeDisplay.textContent = `${this.gridSize}px`;
                }
                this.redraw();
            });
        }
    }

    setupComponentPalette() {
        const palette = document.getElementById('component-palette');
        if (!palette) return;

        Object.entries(this.componentPalette).forEach(([type, config]) => {
            const btn = document.createElement('button');
            btn.className = 'component-btn';
            btn.dataset.component = type;
            btn.title = type.charAt(0).toUpperCase() + type.slice(1);
            btn.innerHTML = `
                <span class="component-icon">${config.icon}</span>
                <span class="component-name">${type}</span>
            `;
            btn.addEventListener('click', () => {
                this.selectedTool = 'component';
                this.selectedComponent = type;
                document.querySelectorAll('.whiteboard-tool').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.component-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
            palette.appendChild(btn);
        });
    }

    setupEventListeners() {
        // Resize handling
        window.addEventListener('resize', () => this.handleResize());

        if (this.touchSupported) {
            // Touch events
            this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
            this.canvas.addEventListener('touchcancel', (e) => this.handleTouchEnd(e), { passive: false });
        }

        // Mouse events (for desktop and as fallback)
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    toggleWhiteboardMode() {
        this.whiteboardMode = !this.whiteboardMode;
        const toolbar = document.getElementById('whiteboard-toolbar');
        const toggle = document.getElementById('whiteboard-toggle');
        const originalToolbar = document.querySelector('.toolbar');

        if (this.whiteboardMode) {
            if (toolbar) toolbar.style.display = 'block';
            if (toggle) {
                toggle.classList.add('active');
                toggle.innerHTML = '<i class="fas fa-times"></i> Exit Whiteboard';
            }
            if (originalToolbar) originalToolbar.style.display = 'none';
            this.canvas.style.cursor = 'crosshair';
        } else {
            if (toolbar) toolbar.style.display = 'none';
            if (toggle) {
                toggle.classList.remove('active');
                toggle.innerHTML = '<i class="fas fa-draw-polygon"></i> Whiteboard Mode';
            }
            if (originalToolbar) originalToolbar.style.display = 'block';
            this.canvas.style.cursor = 'default';
        }
    }

    // Touch event handlers
    handleTouchStart(e) {
        e.preventDefault();
        if (!this.whiteboardMode) return;

        this.touches = Array.from(e.touches);
        
        if (e.touches.length === 1) {
            // Single touch - drawing
            const touch = e.touches[0];
            const point = this.getTouchPoint(touch);
            this.startDrawing(point);
        } else if (e.touches.length === 2) {
            // Two finger - pan/zoom
            this.handleTwoFingerStart(e.touches);
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.whiteboardMode) return;

        if (e.touches.length === 1 && this.isDrawing) {
            // Single touch - continue drawing
            const touch = e.touches[0];
            const point = this.getTouchPoint(touch);
            this.continueDrawing(point);
        } else if (e.touches.length === 2) {
            // Two finger - pan/zoom
            this.handleTwoFingerMove(e.touches);
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.whiteboardMode) return;

        if (this.isDrawing) {
            this.endDrawing();
        }
        
        this.touches = [];
        this.lastTouchDistance = 0;
    }

    handleTwoFingerStart(touches) {
        const touch1 = touches[0];
        const touch2 = touches[1];
        
        this.lastTouchDistance = this.getTouchDistance(touch1, touch2);
        this.lastTouchCenter = this.getTouchCenter(touch1, touch2);
        this.isPanning = true;
    }

    handleTwoFingerMove(touches) {
        const touch1 = touches[0];
        const touch2 = touches[1];
        
        const currentDistance = this.getTouchDistance(touch1, touch2);
        const currentCenter = this.getTouchCenter(touch1, touch2);
        
        // Zoom
        if (this.lastTouchDistance > 0) {
            const zoomFactor = currentDistance / this.lastTouchDistance;
            this.transform.scale *= zoomFactor;
            this.transform.scale = Math.max(0.1, Math.min(5, this.transform.scale));
        }
        
        // Pan
        if (this.isPanning) {
            const deltaX = currentCenter.x - this.lastTouchCenter.x;
            const deltaY = currentCenter.y - this.lastTouchCenter.y;
            
            this.transform.translateX += deltaX;
            this.transform.translateY += deltaY;
        }
        
        this.lastTouchDistance = currentDistance;
        this.lastTouchCenter = currentCenter;
        
        this.redraw();
    }

    getTouchDistance(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getTouchCenter(touch1, touch2) {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    }

    getTouchPoint(touch) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }

    // Mouse event handlers
    handleMouseDown(e) {
        if (!this.whiteboardMode) return;

        const point = this.getMousePoint(e);
        
        if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
            // Middle mouse or Ctrl+click for panning
            this.isPanning = true;
            this.lastMousePoint = point;
        } else if (e.button === 0) {
            // Left click for drawing
            this.startDrawing(point);
        }
    }

    handleMouseMove(e) {
        if (!this.whiteboardMode) return;

        const point = this.getMousePoint(e);
        
        if (this.isPanning) {
            const deltaX = point.x - this.lastMousePoint.x;
            const deltaY = point.y - this.lastMousePoint.y;
            
            this.transform.translateX += deltaX;
            this.transform.translateY += deltaY;
            
            this.lastMousePoint = point;
            this.redraw();
        } else if (this.isDrawing) {
            this.continueDrawing(point);
        }
    }

    handleMouseUp(e) {
        if (!this.whiteboardMode) return;

        if (this.isPanning) {
            this.isPanning = false;
            this.canvas.style.cursor = 'crosshair';
        } else if (this.isDrawing) {
            this.endDrawing();
        }
    }

    handleWheel(e) {
        if (!this.whiteboardMode) return;
        e.preventDefault();

        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.transform.scale *= zoomFactor;
        this.transform.scale = Math.max(0.1, Math.min(5, this.transform.scale));
        
        this.redraw();
    }

    getMousePoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    // Drawing methods
    startDrawing(point) {
        this.isDrawing = true;
        this.currentPath = [this.snapPoint(point)];
        
        if (this.selectedTool === 'component') {
            this.placeComponent(point);
            this.isDrawing = false;
        }
    }

    continueDrawing(point) {
        if (!this.isDrawing) return;

        const snappedPoint = this.snapPoint(point);
        this.currentPath.push(snappedPoint);
        
        // Real-time preview
        this.redraw();
        this.drawCurrentPath();
    }

    endDrawing() {
        if (!this.isDrawing || this.currentPath.length === 0) return;

        // Create the final drawing object
        const drawing = {
            type: this.selectedTool,
            path: [...this.currentPath],
            color: this.strokeColor,
            width: this.strokeWidth,
            fill: this.fillColor,
            timestamp: Date.now()
        };

        // Add to history
        this.addToHistory(drawing);
        
        this.isDrawing = false;
        this.currentPath = [];
        this.redraw();
    }

    placeComponent(point) {
        const snappedPoint = this.snapPoint(point);
        const component = {
            type: 'component',
            componentType: this.selectedComponent,
            position: snappedPoint,
            config: this.componentPalette[this.selectedComponent],
            timestamp: Date.now()
        };

        this.addToHistory(component);
        this.redraw();
    }

    snapPoint(point) {
        if (!this.snapToGrid) return point;

        return {
            x: Math.round(point.x / this.gridSize) * this.gridSize,
            y: Math.round(point.y / this.gridSize) * this.gridSize
        };
    }

    // Drawing rendering
    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.applyTransform();
        
        if (this.showGrid) {
            this.drawGrid();
        }
        
        // Draw all saved drawings
        this.drawingHistory.slice(0, this.historyIndex + 1).forEach(item => {
            if (item.type === 'component') {
                this.drawComponent(item);
            } else {
                this.drawPath(item);
            }
        });
        
        this.ctx.restore();
    }

    applyTransform() {
        this.ctx.translate(this.transform.translateX, this.transform.translateY);
        this.ctx.scale(this.transform.scale, this.transform.scale);
        this.ctx.rotate(this.transform.rotation);
    }

    drawGrid() {
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([]);
        
        const startX = -this.transform.translateX / this.transform.scale;
        const startY = -this.transform.translateY / this.transform.scale;
        const endX = startX + this.canvas.width / this.transform.scale;
        const endY = startY + this.canvas.height / this.transform.scale;
        
        // Vertical lines
        for (let x = Math.floor(startX / this.gridSize) * this.gridSize; x <= endX; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = Math.floor(startY / this.gridSize) * this.gridSize; y <= endY; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
    }

    drawCurrentPath() {
        if (this.currentPath.length === 0) return;

        this.ctx.save();
        this.applyTransform();
        
        const drawingObj = {
            type: this.selectedTool,
            path: this.currentPath,
            color: this.strokeColor,
            width: this.strokeWidth,
            fill: this.fillColor
        };
        
        this.drawPath(drawingObj);
        this.ctx.restore();
    }

    drawPath(drawing) {
        if (drawing.path.length === 0) return;

        this.ctx.strokeStyle = drawing.color;
        this.ctx.lineWidth = drawing.width;
        this.ctx.fillStyle = drawing.fill;
        this.ctx.setLineDash([]);
        
        this.ctx.beginPath();
        
        switch (drawing.type) {
            case 'pen':
                this.drawFreehand(drawing.path);
                break;
            case 'line':
                this.drawLine(drawing.path);
                break;
            case 'rectangle':
                this.drawRectangle(drawing.path);
                break;
            case 'circle':
                this.drawCircle(drawing.path);
                break;
            case 'arrow':
                this.drawArrow(drawing.path);
                break;
        }
        
        this.ctx.stroke();
        if (drawing.fill !== 'transparent') {
            this.ctx.fill();
        }
    }

    drawFreehand(path) {
        if (path.length < 2) return;
        
        this.ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            this.ctx.lineTo(path[i].x, path[i].y);
        }
    }

    drawLine(path) {
        if (path.length < 2) return;
        
        const start = path[0];
        const end = path[path.length - 1];
        
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
    }

    drawRectangle(path) {
        if (path.length < 2) return;
        
        const start = path[0];
        const end = path[path.length - 1];
        
        const width = end.x - start.x;
        const height = end.y - start.y;
        
        this.ctx.rect(start.x, start.y, width, height);
    }

    drawCircle(path) {
        if (path.length < 2) return;
        
        const start = path[0];
        const end = path[path.length - 1];
        
        const radius = Math.sqrt(
            Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        );
        
        this.ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
    }

    drawArrow(path) {
        if (path.length < 2) return;
        
        const start = path[0];
        const end = path[path.length - 1];
        
        // Draw line
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        
        // Draw arrowhead
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;
        
        this.ctx.moveTo(end.x, end.y);
        this.ctx.lineTo(
            end.x - arrowLength * Math.cos(angle - arrowAngle),
            end.y - arrowLength * Math.sin(angle - arrowAngle)
        );
        
        this.ctx.moveTo(end.x, end.y);
        this.ctx.lineTo(
            end.x - arrowLength * Math.cos(angle + arrowAngle),
            end.y - arrowLength * Math.sin(angle + arrowAngle)
        );
    }

    drawComponent(component) {
        const pos = component.position;
        const config = component.config;
        
        this.ctx.save();
        
        // Draw component background
        this.ctx.fillStyle = config.color;
        this.ctx.beginPath();
        this.ctx.arc(pos.x, pos.y, config.size / 2, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Draw component icon/text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${config.size / 2}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(config.icon, pos.x, pos.y);
        
        this.ctx.restore();
    }

    // History management
    addToHistory(item) {
        // Remove any redo history
        this.drawingHistory = this.drawingHistory.slice(0, this.historyIndex + 1);
        
        // Add new item
        this.drawingHistory.push(item);
        this.historyIndex++;
        
        // Limit history size
        if (this.drawingHistory.length > this.maxHistorySize) {
            this.drawingHistory.shift();
            this.historyIndex--;
        }
    }

    saveToHistory() {
        // Save current state as a checkpoint
        this.addToHistory({
            type: 'checkpoint',
            timestamp: Date.now()
        });
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.redraw();
        }
    }

    redo() {
        if (this.historyIndex < this.drawingHistory.length - 1) {
            this.historyIndex++;
            this.redraw();
        }
    }

    clearWhiteboard() {
        if (confirm('Are you sure you want to clear the whiteboard?')) {
            this.drawingHistory = [];
            this.historyIndex = -1;
            this.saveToHistory();
            this.redraw();
        }
    }

    // Save/Load functionality
    saveWhiteboard() {
        const data = {
            history: this.drawingHistory,
            settings: {
                gridSize: this.gridSize,
                showGrid: this.showGrid,
                snapToGrid: this.snapToGrid
            },
            timestamp: Date.now()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `grid-design-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    loadWhiteboard() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (data.history && Array.isArray(data.history)) {
                        this.drawingHistory = data.history;
                        this.historyIndex = data.history.length - 1;
                    }
                    
                    if (data.settings) {
                        this.gridSize = data.settings.gridSize || this.gridSize;
                        this.showGrid = data.settings.showGrid !== undefined ? data.settings.showGrid : this.showGrid;
                        this.snapToGrid = data.settings.snapToGrid !== undefined ? data.settings.snapToGrid : this.snapToGrid;
                        
                        // Update UI
                        const gridSizeInput = document.getElementById('grid-size');
                        const showGridInput = document.getElementById('show-grid');
                        const snapToGridInput = document.getElementById('snap-to-grid');
                        
                        if (gridSizeInput) gridSizeInput.value = this.gridSize;
                        if (showGridInput) showGridInput.checked = this.showGrid;
                        if (snapToGridInput) snapToGridInput.checked = this.snapToGrid;
                    }
                    
                    this.redraw();
                } catch (error) {
                    alert('Error loading file: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    // Keyboard shortcuts
    handleKeyDown(e) {
        if (!this.whiteboardMode) return;

        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 's':
                    e.preventDefault();
                    this.saveWhiteboard();
                    break;
                case 'o':
                    e.preventDefault();
                    this.loadWhiteboard();
                    break;
            }
        }
        
        // Tool shortcuts
        switch (e.key) {
            case '1': this.selectTool('pen'); break;
            case '2': this.selectTool('line'); break;
            case '3': this.selectTool('rectangle'); break;
            case '4': this.selectTool('circle'); break;
            case '5': this.selectTool('arrow'); break;
            case '6': this.selectTool('text'); break;
            case 'Escape':
                if (this.whiteboardMode) {
                    this.toggleWhiteboardMode();
                }
                break;
        }
    }

    selectTool(tool) {
        this.selectedTool = tool;
        document.querySelectorAll('.whiteboard-tool').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        document.querySelectorAll('.component-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    handleResize() {
        // Update canvas size while preserving content
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.redraw();
    }

    // Export whiteboard to grid components
    exportToGrid() {
        const gridComponents = [];
        
        this.drawingHistory.forEach(item => {
            if (item.type === 'component') {
                gridComponents.push({
                    type: item.componentType,
                    x: item.position.x,
                    y: item.position.y,
                    properties: item.config
                });
            }
        });
        
        return gridComponents;
    }

    // Import grid components to whiteboard
    importFromGrid(components) {
        components.forEach(comp => {
            const component = {
                type: 'component',
                componentType: comp.type,
                position: { x: comp.x, y: comp.y },
                config: this.componentPalette[comp.type] || this.componentPalette.generator,
                timestamp: Date.now()
            };
            
            this.addToHistory(component);
        });
        
        this.redraw();
    }
}

// Export for use in other modules
window.InteractiveWhiteboard = InteractiveWhiteboard;
