/**
 * Power Grid Builder - Web Interface JavaScript
 * Interactive canvas-based grid building application
 */

class PowerGridApp {
    constructor() {
        this.canvas = document.getElementById('grid-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentTool = null;
        this.components = [];
        this.lines = [];
        this.nodes = [];
        this.selectedComponent = null;
        this.selectedLine = null;
        this.connectionStart = null;
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.resizeCanvas();
        this.loadGameData();
        this.draw();
        
        // Update game status every second
        setInterval(() => this.updateGameStatus(), 1000);
    }

    setupEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.selectTool(tool);
            });
        });

        // Action buttons
        document.getElementById('simulate-btn').addEventListener('click', () => this.runSimulation());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('redo-btn').addEventListener('click', () => this.redo());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());

        // View controls
        document.getElementById('zoom-in-btn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out-btn').addEventListener('click', () => this.zoomOut());
        document.getElementById('center-btn').addEventListener('click', () => this.centerView());

        // Canvas events
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));

        // Modal events
        document.getElementById('close-modal').addEventListener('click', () => this.hideModal());
        document.getElementById('cancel-config').addEventListener('click', () => this.hideModal());
        document.getElementById('confirm-config').addEventListener('click', () => this.confirmConfiguration());

        // Results panel
        document.getElementById('close-results').addEventListener('click', () => this.hideResults());

        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initialize U/Q Control and Blackstart panels
        this.setupUQControlPanel();
        this.setupBlackstartPanel();
    }

    selectTool(tool) {
        // Deselect all tools
        document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        
        if (this.currentTool === tool) {
            this.currentTool = null;
            this.canvas.style.cursor = 'default';
        } else {
            this.currentTool = tool;
            
            // Only try to add active class if tool is not null
            if (tool) {
                const toolElement = document.querySelector(`[data-tool="${tool}"]`);
                if (toolElement) {
                    toolElement.classList.add('active');
                }
            }
            
            if (['transmission-line', 'distribution-line', 'hvdc-line'].includes(tool)) {
                this.canvas.style.cursor = 'crosshair';
            } else {
                this.canvas.style.cursor = tool ? 'copy' : 'default';
            }
        }
        
        this.connectionStart = null;
        this.draw();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.draw();
    }

    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - this.panX) / this.zoom,
            y: (e.clientY - rect.top - this.panY) / this.zoom
        };
    }

    handleCanvasClick(e) {
        const coords = this.getCanvasCoordinates(e);
        
        if (!this.currentTool) {
            // Selection mode
            this.selectComponentAt(coords);
            return;
        }

        if (['generator', 'substation', 'load'].includes(this.currentTool)) {
            this.showConfigModal(this.currentTool, coords);
        } else if (this.currentTool === 'node') {
            this.placeNode(coords);
        } else if (['transmission-line', 'distribution-line', 'hvdc-line'].includes(this.currentTool)) {
            this.handleLineConnection(coords);
        }
    }

    handleMouseMove(e) {
        const coords = this.getCanvasCoordinates(e);
        document.getElementById('coordinates').textContent = `x: ${Math.round(coords.x)}, y: ${Math.round(coords.y)}`;
    }

    handleWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(3, this.zoom * zoomFactor));
        
        // Zoom towards mouse position
        this.panX -= (mouseX - this.panX) * (newZoom / this.zoom - 1);
        this.panY -= (mouseY - this.panY) * (newZoom / this.zoom - 1);
        
        this.zoom = newZoom;
        this.draw();
    }

    zoomIn() {
        this.zoom = Math.min(3, this.zoom * 1.2);
        this.draw();
    }

    zoomOut() {
        this.zoom = Math.max(0.1, this.zoom * 0.8);
        this.draw();
    }

    centerView() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.draw();
    }

    selectComponentAt(coords) {
        this.selectedComponent = null;
        this.selectedLine = null;
        
        // Check components
        for (const comp of this.components) {
            if (this.isPointInComponent(coords, comp)) {
                this.selectedComponent = comp;
                break;
            }
        }
        
        // Check nodes
        for (const node of this.nodes) {
            if (this.isPointInNode(coords, node)) {
                this.selectedComponent = node;
                break;
            }
        }
        
        this.draw();
    }

    isPointInComponent(point, component) {
        const size = 20;
        return Math.abs(point.x - component.position.x) < size && 
               Math.abs(point.y - component.position.y) < size;
    }

    isPointInNode(point, node) {
        const size = 10;
        return Math.abs(point.x - node.position.x) < size && 
               Math.abs(point.y - node.position.y) < size;
    }

    showConfigModal(componentType, position) {
        const modal = document.getElementById('config-modal');
        const titleElement = document.getElementById('modal-title');
        const capacityInput = document.getElementById('capacity-input');
        const voltageSelect = document.getElementById('voltage-select');
        const rangeElement = document.getElementById('capacity-range');
        
        // Store position for later use
        this.pendingComponent = { type: componentType, position };
        
        // Configure modal based on component type
        const configs = {
            'generator': { title: 'Configure Generator', range: '50-150 MW', defaultCapacity: 100, voltages: [220, 400] },
            'substation': { title: 'Configure Substation', range: '200 MW (Fixed)', defaultCapacity: 200, voltages: [110, 220] },
            'load': { title: 'Configure Load Center', range: '20-100 MW', defaultCapacity: 50, voltages: [10, 20, 50] }
        };
        
        const config = configs[componentType];
        titleElement.textContent = config.title;
        rangeElement.textContent = config.range;
        capacityInput.value = config.defaultCapacity;
        
        // Set voltage options
        voltageSelect.innerHTML = '';
        config.voltages.forEach(voltage => {
            const option = document.createElement('option');
            option.value = voltage;
            option.textContent = `${voltage} kV`;
            voltageSelect.appendChild(option);
        });
        
        modal.classList.add('show');
    }

    hideModal() {
        document.getElementById('config-modal').classList.remove('show');
        this.pendingComponent = null;
    }

    async confirmConfiguration() {
        if (!this.pendingComponent) return;
        
        const capacity = parseInt(document.getElementById('capacity-input').value);
        const voltage = parseInt(document.getElementById('voltage-select').value);
        
        try {
            const response = await fetch('/api/game/place-component', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: this.pendingComponent.type,
                    x: this.pendingComponent.position.x,
                    y: this.pendingComponent.position.y,
                    capacity: capacity,
                    voltage: voltage
                })
            });
            
            const result = await response.json();
            this.showMessage(result.message, result.success ? 'success' : 'error');
            
            if (result.success) {
                this.loadGameData();
                this.updateGameStatus(); // Immediately update budget and stats
            }
        } catch (error) {
            this.showMessage('Error placing component: ' + error.message, 'error');
        }
        
        this.hideModal();
    }

    async placeNode(position) {
        try {
            const response = await fetch('/api/game/place-node', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    x: position.x,
                    y: position.y,
                    voltage: 110
                })
            });
            
            const result = await response.json();
            this.showMessage(result.message, result.success ? 'success' : 'error');
            
            if (result.success) {
                this.loadGameData();
                this.updateGameStatus(); // Immediately update budget and stats
            }
        } catch (error) {
            this.showMessage('Error placing node: ' + error.message, 'error');
        }
    }

    handleLineConnection(coords) {
        if (!this.connectionStart) {
            // First click - select start component
            const startComponent = this.findComponentAt(coords);
            if (startComponent) {
                this.connectionStart = startComponent;
                this.showMessage(`Selected ${startComponent.type || 'node'} as start point. Click another component to connect.`, 'info');
            } else {
                this.showMessage('Click on a component or node to start the connection.', 'warning');
            }
        } else {
            // Second click - complete connection
            const endComponent = this.findComponentAt(coords);
            if (endComponent && endComponent.id !== this.connectionStart.id) {
                this.createLine(this.connectionStart, endComponent);
                this.connectionStart = null;
            } else {
                this.showMessage('Click on a different component or node to complete the connection.', 'warning');
            }
        }
        this.draw();
    }

    findComponentAt(coords) {
        // Check components
        for (const comp of this.components) {
            if (this.isPointInComponent(coords, comp)) {
                return comp;
            }
        }
        
        // Check nodes
        for (const node of this.nodes) {
            if (this.isPointInNode(coords, node)) {
                return node;
            }
        }
        
        return null;
    }

    async createLine(startComponent, endComponent) {
        try {
            const response = await fetch('/api/game/place-line', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: this.currentTool,
                    from: startComponent.id,
                    to: endComponent.id
                })
            });
            
            const result = await response.json();
            this.showMessage(result.message, result.success ? 'success' : 'error');
            
            if (result.success) {
                this.loadGameData();
                this.updateGameStatus(); // Immediately update budget and stats
            }
        } catch (error) {
            this.showMessage('Error creating line: ' + error.message, 'error');
        }
    }

    async loadGameData() {
        try {
            const [componentsResponse, linesResponse, nodesResponse] = await Promise.all([
                fetch('/api/game/components'),
                fetch('/api/game/lines'),
                fetch('/api/game/nodes')
            ]);
            
            this.components = await componentsResponse.json();
            this.lines = await linesResponse.json();
            this.nodes = await nodesResponse.json();
            
            this.draw();
        } catch (error) {
            console.error('Error loading game data:', error);
        }
    }

    async updateGameStatus() {
        try {
            const response = await fetch('/api/game/status');
            const status = await response.json();
            
            // Store previous budget for comparison
            const previousBudget = this.currentBudget || status.budget;
            this.currentBudget = status.budget;
            
            // Update budget with animation if it changed
            const budgetElement = document.getElementById('budget');
            if (previousBudget !== status.budget) {
                budgetElement.classList.add('budget-updated');
                setTimeout(() => budgetElement.classList.remove('budget-updated'), 1000);
            }
            
            budgetElement.textContent = status.budget.toLocaleString();
            document.getElementById('generation').textContent = Math.round(status.totalGeneration);
            document.getElementById('load').textContent = Math.round(status.totalLoad);
            document.getElementById('efficiency').textContent = Math.round(status.efficiency);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply zoom and pan transformations
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Draw grid
        this.drawGrid();
        
        // Draw lines first (so they appear behind components)
        this.drawLines();
        
        // Draw components
        this.drawComponents();
        
        // Draw nodes
        this.drawNodes();
        
        // Draw connection preview
        this.drawConnectionPreview();
        
        this.ctx.restore();
    }

    drawGrid() {
        const gridSize = 50;
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 0.5;
        
        const startX = -this.panX / this.zoom;
        const startY = -this.panY / this.zoom;
        const endX = startX + this.canvas.width / this.zoom;
        const endY = startY + this.canvas.height / this.zoom;
        
        // Vertical lines
        for (let x = Math.floor(startX / gridSize) * gridSize; x <= endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = Math.floor(startY / gridSize) * gridSize; y <= endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
    }

    drawComponents() {
        this.components.forEach(component => {
            this.drawComponent(component);
        });
    }

    drawComponent(component) {
        const x = component.position.x;
        const y = component.position.y;
        const size = 20;
        
        // Component colors
        const colors = {
            'generator': '#3498db',
            'substation': '#e67e22',
            'load': '#e74c3c'
        };
        
        // Draw component shape
        this.ctx.fillStyle = colors[component.type] || '#95a5a6';
        this.ctx.strokeStyle = this.selectedComponent && this.selectedComponent.id === component.id ? '#f39c12' : '#2c3e50';
        this.ctx.lineWidth = this.selectedComponent && this.selectedComponent.id === component.id ? 3 : 1;
        
        if (component.type === 'generator') {
            // Draw generator as triangle
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - size);
            this.ctx.lineTo(x - size, y + size);
            this.ctx.lineTo(x + size, y + size);
            this.ctx.closePath();
        } else if (component.type === 'substation') {
            // Draw substation as diamond
            this.ctx.beginPath();
            this.ctx.moveTo(x, y - size);
            this.ctx.lineTo(x + size, y);
            this.ctx.lineTo(x, y + size);
            this.ctx.lineTo(x - size, y);
            this.ctx.closePath();
        } else {
            // Draw load as square
            this.ctx.fillRect(x - size, y - size, size * 2, size * 2);
            this.ctx.strokeRect(x - size, y - size, size * 2, size * 2);
        }
        
        if (component.type !== 'load') {
            this.ctx.fill();
        }
        this.ctx.stroke();
        
        // Draw component label
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${Math.round(component.capacity)}MW`, x, y + size + 15);
        this.ctx.fillText(`${component.voltage}kV`, x, y + size + 28);
    }

    drawNodes() {
        this.nodes.forEach(node => {
            if (node.isVisible) {
                this.drawNode(node);
            }
        });
    }

    drawNode(node) {
        const x = node.position.x;
        const y = node.position.y;
        const radius = 8;
        
        this.ctx.fillStyle = '#34495e';
        this.ctx.strokeStyle = this.selectedComponent && this.selectedComponent.id === node.id ? '#f39c12' : '#2c3e50';
        this.ctx.lineWidth = this.selectedComponent && this.selectedComponent.id === node.id ? 3 : 1;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Draw voltage label
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${node.voltage}kV`, x, y + 20);
    }

    drawLines() {
        this.lines.forEach(line => {
            this.drawLine(line);
        });
    }

    drawLine(line) {
        const fromComponent = this.findComponentById(line.from);
        const toComponent = this.findComponentById(line.to);
        
        if (!fromComponent || !toComponent) return;
        
        const lineStyles = {
            'transmission-line': { color: '#2980b9', width: 3, pattern: [] },
            'distribution-line': { color: '#27ae60', width: 2, pattern: [] },
            'hvdc-line': { color: '#8e44ad', width: 4, pattern: [10, 5] }
        };
        
        const style = lineStyles[line.type] || lineStyles['transmission-line'];
        
        this.ctx.strokeStyle = style.color;
        this.ctx.lineWidth = style.width;
        this.ctx.setLineDash(style.pattern);
        
        this.ctx.beginPath();
        this.ctx.moveTo(fromComponent.position.x, fromComponent.position.y);
        this.ctx.lineTo(toComponent.position.x, toComponent.position.y);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        
        // Draw line label
        const midX = (fromComponent.position.x + toComponent.position.y) / 2;
        const midY = (fromComponent.position.y + toComponent.position.y) / 2;
        
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${line.capacity}MW`, midX, midY - 5);
    }

    drawConnectionPreview() {
        if (this.connectionStart && this.currentTool && 
            ['transmission-line', 'distribution-line', 'hvdc-line'].includes(this.currentTool)) {
            
            this.ctx.strokeStyle = '#f39c12';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.connectionStart.position.x, this.connectionStart.position.y);
            // Would need mouse position here - simplified for now
            this.ctx.stroke();
            
            this.ctx.setLineDash([]);
        }
    }

    findComponentById(id) {
        return this.components.find(c => c.id === id) || this.nodes.find(n => n.id === id);
    }

    async runSimulation() {
        try {
            const response = await fetch('/api/game/simulate', { method: 'POST' });
            const result = await response.json();
            
            this.showSimulationResults(result);
        } catch (error) {
            this.showMessage('Error running simulation: ' + error.message, 'error');
        }
    }

    showSimulationResults(result) {
        const panel = document.getElementById('results-panel');
        const content = document.getElementById('results-content');
        
        let html = '<div class="result-section">';
        html += '<h4>System Performance</h4>';
        html += '<div class="metric-grid">';
        
        html += `<div class="metric-item">
            <div class="metric-label">Load Served</div>
            <div class="metric-value ${result.success ? 'success' : 'error'}">${Math.round(result.loadServed)} MW</div>
        </div>`;
        
        html += `<div class="metric-item">
            <div class="metric-label">Efficiency</div>
            <div class="metric-value ${result.efficiency > 80 ? 'success' : result.efficiency > 60 ? 'warning' : 'error'}">${Math.round(result.efficiency)}%</div>
        </div>`;
        
        html += `<div class="metric-item">
            <div class="metric-label">Reliability</div>
            <div class="metric-value ${result.reliability > 0.9 ? 'success' : result.reliability > 0.7 ? 'warning' : 'error'}">${Math.round(result.reliability * 100)}%</div>
        </div>`;
        
        html += `<div class="metric-item">
            <div class="metric-label">Total Losses</div>
            <div class="metric-value">${Math.round(result.totalLosses)} MW</div>
        </div>`;
        
        html += '</div></div>';
        
        if (result.errors && result.errors.length > 0) {
            html += '<div class="result-section">';
            html += '<h4>Errors</h4>';
            html += '<ul class="error-list">';
            result.errors.forEach(error => {
                html += `<li>${error}</li>`;
            });
            html += '</ul></div>';
        }
        
        if (result.warnings && result.warnings.length > 0) {
            html += '<div class="result-section">';
            html += '<h4>Warnings</h4>';
            html += '<ul class="warning-list">';
            result.warnings.forEach(warning => {
                html += `<li>${warning}</li>`;
            });
            html += '</ul></div>';
        }
        
        content.innerHTML = html;
        panel.classList.add('open');
    }

    hideResults() {
        document.getElementById('results-panel').classList.remove('open');
    }

    async undo() {
        try {
            const response = await fetch('/api/game/undo', { method: 'POST' });
            const result = await response.json();
            this.showMessage(result.message, result.success ? 'success' : 'warning');
            if (result.success) {
                this.loadGameData();
                this.updateGameStatus(); // Immediately update budget and stats
            }
        } catch (error) {
            this.showMessage('Error undoing action: ' + error.message, 'error');
        }
    }

    async redo() {
        try {
            const response = await fetch('/api/game/redo', { method: 'POST' });
            const result = await response.json();
            this.showMessage(result.message, result.success ? 'success' : 'warning');
            if (result.success) {
                this.loadGameData();
                this.updateGameStatus(); // Immediately update budget and stats
            }
        } catch (error) {
            this.showMessage('Error redoing action: ' + error.message, 'error');
        }
    }

    async resetGame() {
        if (confirm('Are you sure you want to reset the game? This will clear all components and lines.')) {
            try {
                const response = await fetch('/api/game/reset', { method: 'POST' });
                const result = await response.json();
                this.showMessage(result.message, result.success ? 'success' : 'error');
                if (result.success) {
                    this.loadGameData();
                    this.updateGameStatus(); // Immediately update budget and stats
                    this.selectTool(null);
                }
            } catch (error) {
                this.showMessage('Error resetting game: ' + error.message, 'error');
            }
        }
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('status-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `status-message ${type}`;
        messageDiv.textContent = message;
        
        container.appendChild(messageDiv);
        
        // Remove message after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
    
    // U/Q Control Methods
    async setupUQControlPanel() {
        // Target voltage slider
        const targetVoltageSlider = document.getElementById('target-voltage');
        const targetVoltageValue = document.getElementById('target-voltage-value');
        
        if (targetVoltageSlider && targetVoltageValue) {
            targetVoltageSlider.addEventListener('input', (e) => {
                targetVoltageValue.textContent = `${parseFloat(e.target.value).toFixed(2)} pu`;
            });
        }
        
        // Voltage control mode selection
        const voltageControlMode = document.getElementById('voltage-control-mode');
        if (voltageControlMode) {
            voltageControlMode.addEventListener('change', (e) => {
                this.updateVoltageControlMode(e.target.value);
            });
        }
        
        // U/Q Control buttons
        const optimizeVoltageBtn = document.getElementById('optimize-voltage');
        if (optimizeVoltageBtn) {
            optimizeVoltageBtn.addEventListener('click', () => this.optimizeVoltageControl());
        }
        
        const resetAVRBtn = document.getElementById('reset-avr');
        if (resetAVRBtn) {
            resetAVRBtn.addEventListener('click', () => this.resetAVR());
        }
        
        const voltageSensitivityBtn = document.getElementById('voltage-sensitivity');
        if (voltageSensitivityBtn) {
            voltageSensitivityBtn.addEventListener('click', () => this.performVoltageSensitivityAnalysis());
        }
    }
    
    async updateVoltageControlMode(mode) {
        try {
            const response = await fetch('/api/european/uq-control/mode', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({mode: mode})
            });
            const result = await response.json();
            this.showMessage(`Voltage control mode set to: ${mode}`, 'success');
        } catch (error) {
            this.showMessage('Error updating voltage control mode: ' + error.message, 'error');
        }
    }
    
    async optimizeVoltageControl() {
        try {
            const targetVoltage = parseFloat(document.getElementById('target-voltage').value);
            
            const response = await fetch('/api/european/uq-control/optimize', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({targetVoltage: targetVoltage})
            });
            const result = await response.json();
            
            if (result.success) {
                this.updateUQControlDisplay(result.data);
                this.showMessage('Voltage control optimization completed', 'success');
            } else {
                this.showMessage('U/Q Control optimization failed: ' + result.message, 'error');
            }
        } catch (error) {
            this.showMessage('Error optimizing voltage control: ' + error.message, 'error');
        }
    }
    
    async resetAVR() {
        try {
            const response = await fetch('/api/european/uq-control/reset-avr', {
                method: 'POST'
            });
            const result = await response.json();
            this.showMessage('AVR reset successfully', 'success');
            this.updateUQControlDisplay(result.data);
        } catch (error) {
            this.showMessage('Error resetting AVR: ' + error.message, 'error');
        }
    }
    
    async performVoltageSensitivityAnalysis() {
        try {
            const response = await fetch('/api/european/uq-control/sensitivity');
            const result = await response.json();
            
            if (result.success) {
                this.displayVoltageSensitivityResults(result.data);
            } else {
                this.showMessage('Voltage sensitivity analysis failed: ' + result.message, 'error');
            }
        } catch (error) {
            this.showMessage('Error performing voltage sensitivity analysis: ' + error.message, 'error');
        }
    }
    
    updateUQControlDisplay(data) {
        // Update voltage deviation
        const voltageDeviation = document.getElementById('voltage-deviation');
        if (voltageDeviation && data.voltageDeviation !== undefined) {
            const deviation = data.voltageDeviation;
            voltageDeviation.textContent = `${deviation >= 0 ? '+' : ''}${deviation.toFixed(3)} pu`;
            voltageDeviation.className = Math.abs(deviation) > 0.05 ? 'status-warning' : 'status-normal';
        }
        
        // Update reactive power
        const reactivePower = document.getElementById('reactive-power');
        if (reactivePower && data.reactivePower !== undefined) {
            reactivePower.textContent = `${data.reactivePower.toFixed(1)} MVAr`;
        }
        
        // Update AVR output
        const avrOutput = document.getElementById('avr-output');
        if (avrOutput && data.avrOutput !== undefined) {
            avrOutput.textContent = `${data.avrOutput.toFixed(2)} pu`;
        }
        
        // Update excitation status
        const excitationStatus = document.getElementById('excitation-status');
        if (excitationStatus && data.excitationStatus) {
            excitationStatus.textContent = data.excitationStatus;
            excitationStatus.className = data.excitationStatus === 'NORMAL' ? 'status-normal' : 'status-warning';
        }
        
        // Update bus voltages
        if (data.busVoltages) {
            Object.keys(data.busVoltages).forEach((busId, index) => {
                const busVoltageElement = document.getElementById(`bus${index + 1}-voltage`);
                if (busVoltageElement) {
                    const voltage = data.busVoltages[busId];
                    busVoltageElement.textContent = `${voltage.toFixed(3)} pu`;
                    
                    // Color code based on European voltage standards
                    if (voltage < 0.90 || voltage > 1.05) {
                        busVoltageElement.className = 'voltage-violation';
                    } else if (voltage < 0.95 || voltage > 1.02) {
                        busVoltageElement.className = 'voltage-warning';
                    } else {
                        busVoltageElement.className = 'voltage-normal';
                    }
                }
            });
        }
    }
    
    displayVoltageSensitivityResults(data) {
        // Create a modal or panel to display sensitivity matrix results
        const sensitivityModal = document.createElement('div');
        sensitivityModal.className = 'modal';
        sensitivityModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Voltage Sensitivity Analysis (dV/dQ)</h3>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="sensitivity-matrix">
                        ${this.renderSensitivityMatrix(data.sensitivityMatrix)}
                    </div>
                    <div class="sensitivity-analysis">
                        <h4>Analysis Results:</h4>
                        <p>Most sensitive bus: ${data.mostSensitiveBus}</p>
                        <p>Maximum sensitivity: ${data.maxSensitivity.toFixed(4)} pu/MVAr</p>
                        <p>Voltage control effectiveness: ${data.controlEffectiveness}</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(sensitivityModal);
        sensitivityModal.style.display = 'block';
        
        // Close modal functionality
        const closeBtn = sensitivityModal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(sensitivityModal);
        });
    }
    
    // Blackstart Control Methods
    async setupBlackstartPanel() {
        // Blackstart control buttons
        const assessBlackstartBtn = document.getElementById('assess-blackstart');
        if (assessBlackstartBtn) {
            assessBlackstartBtn.addEventListener('click', () => this.assessBlackstartCapability());
        }
        
        const generateSequenceBtn = document.getElementById('generate-sequence');
        if (generateSequenceBtn) {
            generateSequenceBtn.addEventListener('click', () => this.generateRestorationSequence());
        }
        
        const simulateBlackstartBtn = document.getElementById('simulate-blackstart');
        if (simulateBlackstartBtn) {
            simulateBlackstartBtn.addEventListener('click', () => this.simulateBlackstartProcedure());
        }
        
        const blackstartTrainingBtn = document.getElementById('blackstart-training');
        if (blackstartTrainingBtn) {
            blackstartTrainingBtn.addEventListener('click', () => this.startBlackstartTraining());
        }
    }
    
    async assessBlackstartCapability() {
        try {
            const response = await fetch('/api/european/blackstart/assess');
            const result = await response.json();
            
            if (result.success) {
                this.updateBlackstartDisplay(result.data);
                this.showMessage('Blackstart capability assessment completed', 'success');
            } else {
                this.showMessage('Blackstart assessment failed: ' + result.message, 'error');
            }
        } catch (error) {
            this.showMessage('Error assessing blackstart capability: ' + error.message, 'error');
        }
    }
    
    async generateRestorationSequence() {
        try {
            const response = await fetch('/api/european/blackstart/sequence', {
                method: 'POST'
            });
            const result = await response.json();
            
            if (result.success) {
                this.displayRestorationSequence(result.data.sequence);
                this.updateBlackstartControls(true);
                this.showMessage('Restoration sequence generated successfully', 'success');
            } else {
                this.showMessage('Failed to generate restoration sequence: ' + result.message, 'error');
            }
        } catch (error) {
            this.showMessage('Error generating restoration sequence: ' + error.message, 'error');
        }
    }
    
    async simulateBlackstartProcedure() {
        try {
            const response = await fetch('/api/european/blackstart/simulate', {
                method: 'POST'
            });
            const result = await response.json();
            
            if (result.success) {
                this.startBlackstartSimulation(result.data);
                this.showMessage('Blackstart simulation started', 'success');
            } else {
                this.showMessage('Blackstart simulation failed: ' + result.message, 'error');
            }
        } catch (error) {
            this.showMessage('Error starting blackstart simulation: ' + error.message, 'error');
        }
    }
    
    startBlackstartTraining() {
        this.showMessage('Blackstart training scenario activated', 'info');
        // Simulate a blackout scenario
        this.simulateBlackoutScenario();
    }
    
    updateBlackstartDisplay(data) {
        // Update blackstart capability percentage
        const blackstartCapability = document.getElementById('blackstart-capability');
        if (blackstartCapability && data.capability !== undefined) {
            const capability = data.capability * 100;
            blackstartCapability.textContent = `${capability.toFixed(1)}% of demand`;
            
            // Color code based on European standards (≥10% required)
            if (capability >= 10) {
                blackstartCapability.className = 'status-normal';
            } else {
                blackstartCapability.className = 'status-error';
            }
        }
        
        // Update compliance status
        const blackstartCompliance = document.getElementById('blackstart-compliance');
        if (blackstartCompliance && data.compliant !== undefined) {
            blackstartCompliance.textContent = data.compliant ? 'COMPLIANT' : 'NON-COMPLIANT';
            blackstartCompliance.className = data.compliant ? 'status-normal' : 'status-error';
        }
        
        // Update blackstart units count
        const blackstartUnitsCount = document.getElementById('blackstart-units-count');
        if (blackstartUnitsCount && data.unitsCount !== undefined) {
            blackstartUnitsCount.textContent = `${data.unitsCount} units`;
        }
    }
    
    displayRestorationSequence(sequence) {
        const sequenceList = document.getElementById('restoration-sequence-list');
        if (!sequenceList) return;
        
        sequenceList.innerHTML = '';
        
        if (!sequence || sequence.length === 0) {
            sequenceList.innerHTML = '<div class="sequence-item disabled"><i class="fas fa-exclamation-triangle"></i><span>No restoration sequence available</span></div>';
            return;
        }
        
        sequence.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = 'sequence-item';
            stepElement.innerHTML = `
                <div class="step-number">${index + 1}</div>
                <div class="step-content">
                    <div class="step-time">T+${step.time_minutes} min</div>
                    <div class="step-description">${step.description}</div>
                    <div class="step-phase">Phase ${step.phase}</div>
                </div>
                <div class="step-status" data-step="${index}">
                    <i class="fas fa-clock"></i>
                </div>
            `;
            sequenceList.appendChild(stepElement);
        });
    }
    
    updateBlackstartControls(sequenceAvailable) {
        const generateSequenceBtn = document.getElementById('generate-sequence');
        const simulateBlackstartBtn = document.getElementById('simulate-blackstart');
        
        if (generateSequenceBtn && simulateBlackstartBtn) {
            generateSequenceBtn.disabled = false;
            simulateBlackstartBtn.disabled = !sequenceAvailable;
        }
    }
    
    startBlackstartSimulation(data) {
        const progressBar = document.getElementById('restoration-progress');
        const phaseElements = document.querySelectorAll('.phase');
        
        let currentProgress = 0;
        const totalSteps = data.sequence ? data.sequence.length : 10;
        const progressIncrement = 100 / totalSteps;
        
        // Simulate restoration progress
        const progressInterval = setInterval(() => {
            currentProgress += progressIncrement;
            
            if (progressBar) {
                progressBar.style.width = `${Math.min(currentProgress, 100)}%`;
            }
            
            // Update phase indicators
            const currentPhase = Math.ceil(currentProgress / 33.33);
            phaseElements.forEach((phase, index) => {
                if (index < currentPhase) {
                    phase.classList.add('completed');
                } else if (index === currentPhase - 1) {
                    phase.classList.add('active');
                }
            });
            
            if (currentProgress >= 100) {
                clearInterval(progressInterval);
                this.showMessage('Blackstart simulation completed successfully', 'success');
            }
        }, 500);
    }
    
    simulateBlackoutScenario() {
        // Temporarily disable all components to simulate blackout
        this.showMessage('⚡ SYSTEM BLACKOUT - Initiating blackstart procedure...', 'error');
        
        // Reset the grid to simulate blackout
        setTimeout(() => {
            this.showMessage('🔧 Blackstart units online - Beginning restoration sequence', 'warning');
        }, 2000);
        
        setTimeout(() => {
            this.showMessage('⚡ System restoration in progress...', 'info');
        }, 4000);
        
        setTimeout(() => {
            this.showMessage('✅ System restoration completed - Training scenario finished', 'success');
        }, 8000);
    }
    
    renderSensitivityMatrix(matrix) {
        if (!matrix || !matrix.length) {
            return '<p>No sensitivity data available</p>';
        }
        
        let html = '<table class="sensitivity-table"><thead><tr><th>Bus</th>';
        
        // Header row
        for (let j = 0; j < matrix[0].length; j++) {
            html += `<th>Q${j + 1}</th>`;
        }
        html += '</tr></thead><tbody>';
        
        // Data rows
        for (let i = 0; i < matrix.length; i++) {
            html += `<tr><td>V${i + 1}</td>`;
            for (let j = 0; j < matrix[i].length; j++) {
                const value = matrix[i][j];
                const cellClass = Math.abs(value) > 0.1 ? 'high-sensitivity' : 'low-sensitivity';
                html += `<td class="${cellClass}">${value.toFixed(4)}</td>`;
            }
            html += '</tr>';
        }
        
        html += '</tbody></table>';
        return html;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PowerGridApp();
});
