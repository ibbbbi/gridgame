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
        
        // European game mode
        this.europeanMode = false;
        this.simulationRunning = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.resizeCanvas();
        this.loadGameData();
        this.draw();
        
        // Update game status every second
        setInterval(() => this.updateGameStatus(), 1000);
        
        // Initialize European mode controls
        this.setupEuropeanModeControls();
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
    }

    setupEuropeanModeControls() {
        // Game mode toggle
        document.getElementById('classic-mode').addEventListener('click', () => {
            this.switchToClassicMode();
        });
        
        document.getElementById('european-mode').addEventListener('click', () => {
            this.switchToEuropeanMode();
        });
        
        // European simulation controls
        document.getElementById('start-simulation').addEventListener('click', () => {
            this.startEuropeanSimulation();
        });
        
        document.getElementById('stop-simulation').addEventListener('click', () => {
            this.stopEuropeanSimulation();
        });
        
        document.getElementById('view-compliance').addEventListener('click', () => {
            this.showComplianceReport();
        });
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
    
    async updateEuropeanStatus() {
        if (!this.europeanMode) return;
        
        try {
            const response = await fetch('/api/european/status');
            const data = await response.json();
            
            // Update frequency display
            document.getElementById('frequency').textContent = data.frequency.toFixed(3);
            
            // Update frequency deviation with color coding
            const freqDeviationElement = document.getElementById('freq-deviation');
            const deviation = data.frequency_deviation_mhz;
            freqDeviationElement.textContent = `${deviation >= 0 ? '+' : ''}${deviation.toFixed(1)} mHz`;
            
            // Update system state with color coding
            const systemStateElement = document.getElementById('system-state');
            systemStateElement.textContent = data.system_state.toUpperCase();
            systemStateElement.className = `status-${data.system_state}`;
            
            // Update other status fields
            document.getElementById('generation').textContent = Math.round(data.generation_capacity);
            document.getElementById('load').textContent = Math.round(data.load_demand);
            document.getElementById('fcr').textContent = Math.round(data.fcr_available);
            document.getElementById('fcr-available').textContent = `${Math.round(data.fcr_available)} MW`;
            document.getElementById('frr-available').textContent = `${Math.round(data.frr_available)} MW`;
            document.getElementById('compliance-score').textContent = `${data.compliance_score.toFixed(1)}%`;
            document.getElementById('reliability-score').textContent = `${data.reliability_score.toFixed(1)}%`;
            document.getElementById('budget').textContent = Math.round(data.budget);
            
        } catch (error) {
            console.error('Failed to update European status:', error);
        }
    }
    
    async loadEuropeanStandards() {
        try {
            const response = await fetch('/api/european/standards');
            const data = await response.json();
            console.log('European Standards loaded:', data);
        } catch (error) {
            console.error('Failed to load European standards:', error);
        }
    }
    
    async startEuropeanSimulation() {
        try {
            const response = await fetch('/api/european/start_simulation', {
                method: 'POST'
            });
            const data = await response.json();
            
            if (data.success) {
                this.simulationRunning = true;
                document.getElementById('start-simulation').style.display = 'none';
                document.getElementById('stop-simulation').style.display = 'inline-block';
                console.log('European simulation started');
                
                // Start updating European status more frequently
                this.europeanStatusInterval = setInterval(() => {
                    this.updateEuropeanStatus();
                }, 1000);
            }
        } catch (error) {
            console.error('Failed to start simulation:', error);
        }
    }
    
    async stopEuropeanSimulation() {
        try {
            const response = await fetch('/api/european/stop_simulation', {
                method: 'POST'
            });
            const data = await response.json();
            
            if (data.success) {
                this.simulationRunning = false;
                document.getElementById('start-simulation').style.display = 'inline-block';
                document.getElementById('stop-simulation').style.display = 'none';
                console.log('European simulation stopped');
                
                if (this.europeanStatusInterval) {
                    clearInterval(this.europeanStatusInterval);
                }
            }
        } catch (error) {
            console.error('Failed to stop simulation:', error);
        }
    }
    
    async showComplianceReport() {
        try {
            const response = await fetch('/api/european/compliance');
            const data = await response.json();
            
            // Show compliance report in a modal or alert
            alert(data.summary);
            
        } catch (error) {
            console.error('Failed to get compliance report:', error);
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
        const midX = (fromComponent.position.x + toComponent.position.x) / 2;
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
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PowerGridApp();
});
