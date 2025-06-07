/**
 * European Power Grid Builder - Advanced Web Interface
 * Interactive canvas-based grid building with SO GL compliance
 * Version 2.0 - Enhanced European Standards Implementation
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
        
        // Enhanced European game mode
        this.europeanMode = false;
        this.simulationRunning = false;
        this.realTimeMode = true;
        this.complianceMonitoring = true;
        
        // Advanced features
        this.gridEvents = [];
        this.contingencyAnalysis = false;
        this.fcr_activation = 0;
        this.frr_activation = 0;
        this.systemState = 'normal';
        this.frequencyHistory = [];
        this.complianceScore = 100;
        
        // Performance monitoring
        this.lastUpdateTime = Date.now();
        this.frameRate = 60;
        
        // Enhanced modules (initialized later)
        this.webSocketIntegration = null;
        this.performanceMonitor = null;
        this.advancedRenderer = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.resizeCanvas();
        this.loadGameData();
        this.draw();
        
        // Initialize advanced modules
        this.initializeAdvancedModules();
        
        // Enhanced update intervals
        setInterval(() => this.updateGameStatus(), 1000);
        setInterval(() => this.updateRealTimeData(), 100); // High-frequency updates
        
        // Initialize enhanced European mode controls
        this.setupEuropeanModeControls();
        this.initializeComplianceMonitoring();
        this.startPerformanceMonitoring();
        
        // Auto-save functionality
        setInterval(() => this.autoSave(), 30000);
        
        // Initialize interactive whiteboard
        this.whiteboard = null;
        this.initializeWhiteboard();
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
        
        // Enhanced European simulation controls
        document.getElementById('start-simulation')?.addEventListener('click', () => {
            this.startEuropeanSimulation();
        });
        
        document.getElementById('stop-simulation')?.addEventListener('click', () => {
            this.stopEuropeanSimulation();
        });
        
        document.getElementById('view-compliance')?.addEventListener('click', () => {
            this.showComplianceReport();
        });
        
        // New advanced controls
        document.getElementById('n1-analysis')?.addEventListener('click', () => {
            this.runContingencyAnalysis();
        });
        
        document.getElementById('frequency-chart')?.addEventListener('click', () => {
            this.showFrequencyChart();
        });
        
        document.getElementById('system-events')?.addEventListener('click', () => {
            this.showSystemEvents();
        });
        
        document.getElementById('export-data')?.addEventListener('click', () => {
            this.exportSimulationData();
        });
        
        // Real-time controls
        document.getElementById('real-time-toggle')?.addEventListener('change', (e) => {
            this.realTimeMode = e.target.checked;
        });
        
        document.getElementById('compliance-toggle')?.addEventListener('change', (e) => {
            this.complianceMonitoring = e.target.checked;
        });
    }
    
    switchToEuropeanMode() {
        this.europeanMode = true;
        document.getElementById('classic-mode').classList.remove('active');
        document.getElementById('european-mode').classList.add('active');
        
        // Show European-specific controls
        document.querySelectorAll('.european-controls').forEach(el => {
            el.style.display = 'block';
        });
        
        document.querySelectorAll('.classic-tools').forEach(el => {
            el.style.display = 'none';
        });
        
        document.querySelectorAll('.european-tools').forEach(el => {
            el.style.display = 'block';
        });
        
        // Load European component library
        this.loadEuropeanComponents();
        
        // Enable real-time monitoring
        this.initializeComplianceMonitoring();
        
        console.log('Switched to European SO GL Mode');
    }
    
    switchToClassicMode() {
        this.europeanMode = false;
        this.simulationRunning = false;
        
        document.getElementById('european-mode').classList.remove('active');
        document.getElementById('classic-mode').classList.add('active');
        
        // Hide European-specific controls
        document.querySelectorAll('.european-controls').forEach(el => {
            el.style.display = 'none';
        });
        
        document.querySelectorAll('.european-tools').forEach(el => {
            el.style.display = 'none';
        });
        
        document.querySelectorAll('.classic-tools').forEach(el => {
            el.style.display = 'block';
        });
        
        console.log('Switched to Classic Mode');
    }
    
    loadEuropeanComponents() {
        // Load European-specific component specifications
        fetch('/api/european/components')
            .then(response => response.json())
            .then(components => {
                this.europeanComponents = components;
                this.updateEuropeanToolbar();
            })
            .catch(error => console.error('Failed to load European components:', error));
    }
    
    updateEuropeanToolbar() {
        const toolbar = document.querySelector('.european-tools');
        if (!toolbar || !this.europeanComponents) return;
        
        // Clear existing buttons
        toolbar.innerHTML = '<h3>European SO GL Components</h3>';
        
        Object.entries(this.europeanComponents).forEach(([key, component]) => {
            const button = document.createElement('button');
            button.className = 'tool-btn european-component';
            button.dataset.tool = key;
            button.title = `${component.description} - ${component.capacity} MW - €${component.cost.toLocaleString()}`;
            button.innerHTML = `
                <i class="fas ${this.getComponentIcon(key)}"></i>
                <span>${component.description.split(' ')[0]}</span>
                <small>${component.capacity} MW</small>
            `;
            
            button.addEventListener('click', () => this.selectTool(key));
            toolbar.appendChild(button);
        });
    }
    
    getComponentIcon(componentType) {
        const icons = {
            'nuclear_plant': 'fa-atom',
            'coal_plant': 'fa-industry',
            'gas_plant': 'fa-fire',
            'hydro_plant': 'fa-water',
            'wind_farm': 'fa-wind',
            'solar_farm': 'fa-solar-panel',
            'substation_400': 'fa-plug',
            'substation_220': 'fa-plug',
            'transmission_400': 'fa-grip-lines',
            'transmission_220': 'fa-grip-lines',
            'hvdc_line': 'fa-bolt'
        };
        
        return icons[componentType] || 'fa-cog';
    }
    
    startEuropeanSimulation() {
        if (this.simulationRunning) return;
        
        fetch('/api/european/start-simulation', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.simulationRunning = true;
                    this.updateSimulationControls();
                    console.log('European simulation started');
                } else {
                    alert('Failed to start simulation: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Simulation start failed:', error);
                alert('Failed to start simulation');
            });
    }
    
    stopEuropeanSimulation() {
        if (!this.simulationRunning) return;
        
        fetch('/api/european/stop-simulation', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                this.simulationRunning = false;
                this.updateSimulationControls();
                console.log('European simulation stopped');
            })
            .catch(error => {
                console.error('Simulation stop failed:', error);
            });
    }
    
    updateSimulationControls() {
        const startBtn = document.getElementById('start-simulation');
        const stopBtn = document.getElementById('stop-simulation');
        
        if (startBtn) startBtn.disabled = this.simulationRunning;
        if (stopBtn) stopBtn.disabled = !this.simulationRunning;
    }
    
    runContingencyAnalysis() {
        if (!this.europeanMode) return;
        
        this.contingencyAnalysis = true;
        
        fetch('/api/european/n1-analysis', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                this.showContingencyResults(data);
                this.contingencyAnalysis = false;
            })
            .catch(error => {
                console.error('N-1 analysis failed:', error);
                this.contingencyAnalysis = false;
            });
    }
    
    showContingencyResults(results) {
        const modal = document.getElementById('contingency-modal');
        if (!modal) return;
        
        const tbody = modal.querySelector('tbody');
        tbody.innerHTML = '';
        
        results.forEach(result => {
            const row = document.createElement('tr');
            row.className = result.critical ? 'critical' : 'normal';
            row.innerHTML = `
                <td>${result.contingency_id}</td>
                <td>${result.component_type}</td>
                <td>${result.converged ? 'Yes' : 'No'}</td>
                <td>${result.max_voltage_violation.toFixed(3)}</td>
                <td>${result.max_thermal_violation.toFixed(1)}%</td>
                <td>${Math.round(result.load_shed)} MW</td>
            `;
            tbody.appendChild(row);
        });
        
        modal.style.display = 'block';
    }
    
    showFrequencyChart() {
        if (!this.frequencyHistory.length) {
            alert('No frequency data available');
            return;
        }
        
        // Create frequency chart using Chart.js
        const modal = document.getElementById('frequency-chart-modal');
        if (!modal) return;
        
        const ctx = modal.querySelector('#frequency-chart-canvas');
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.frequencyHistory.map(point => 
                    new Date(point.timestamp).toLocaleTimeString()
                ),
                datasets: [{
                    label: 'Frequency (Hz)',
                    data: this.frequencyHistory.map(point => point.frequency),
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }, {
                    label: 'Deviation (mHz)',
                    data: this.frequencyHistory.map(point => point.deviation),
                    borderColor: 'rgb(255, 99, 132)',
                    yAxisID: 'y1'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: false,
                        min: 49.8,
                        max: 50.2
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                }
            }
        });
        
        modal.style.display = 'block';
    }
    
    exportSimulationData() {
        const data = {
            frequencyHistory: this.frequencyHistory,
            complianceMetrics: this.complianceMetrics,
            gridEvents: this.gridEvents,
            systemState: this.systemState,
            components: this.components,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `european-grid-simulation-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
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

    initializeComplianceMonitoring() {
        this.complianceMetrics = {
            frequencyDeviations: [],
            voltageViolations: 0,
            n1Violations: 0,
            fcrResponse: [],
            frrResponse: [],
            reserveShortfalls: 0
        };
        
        this.europeanStandards = {
            frequency: {
                normal: { min: 49.95, max: 50.05 },
                alert: { min: 49.90, max: 50.10 },
                emergency: { min: 49.80, max: 50.20 }
            },
            voltage: {
                hv400: { min: 0.90, max: 1.05 },
                hv220: { min: 0.90, max: 1.10 },
                hv110: { min: 0.90, max: 1.10 }
            },
            reserves: {
                fcr: 3000, // MW total for Continental Europe
                frr: 1500  // MW per area
            }
        };
    }
    
    startPerformanceMonitoring() {
        this.performanceMonitor = {
            frameCount: 0,
            lastFrameTime: Date.now(),
            averageFrameTime: 16.67, // 60 FPS target
            memoryUsage: 0
        };
    }
    
    initializeAdvancedModules() {
        // Initialize Advanced Renderer
        if (window.AdvancedGridRenderer) {
            this.advancedRenderer = new window.AdvancedGridRenderer(this.canvas, this.ctx);
            console.log('Advanced Grid Renderer initialized');
        }
        
        // Initialize Performance Monitor
        if (window.PerformanceMonitor) {
            this.performanceMonitor = new window.PerformanceMonitor(this);
            console.log('Performance Monitor initialized');
        }
        
        // Initialize WebSocket Integration
        if (window.WebSocketIntegration) {
            this.webSocketIntegration = new window.WebSocketIntegration(this);
            console.log('WebSocket Integration initialized');
        }
    }
    
    updateRealTimeData() {
        if (!this.europeanMode || !this.simulationRunning) return;
        
        // Fetch real-time simulation data
        fetch('/api/european/realtime')
            .then(response => response.json())
            .then(data => {
                this.updateFrequencyMonitoring(data);
                this.updateReserveStatus(data);
                this.updateComplianceScore(data);
                this.updateGridEvents(data);
            })
            .catch(error => console.warn('Real-time update failed:', error));
    }
    
    updateFrequencyMonitoring(data) {
        const frequency = data.frequency || 50.0;
        const deviation = (frequency - 50.0) * 1000; // mHz
        
        this.frequencyHistory.push({
            timestamp: Date.now(),
            frequency: frequency,
            deviation: deviation
        });
        
        // Keep only last 300 points (5 minutes at 1 Hz)
        if (this.frequencyHistory.length > 300) {
            this.frequencyHistory.shift();
        }
        
        // Update frequency display with precision
        document.getElementById('frequency').textContent = frequency.toFixed(3);
        
        // Update system state based on frequency
        this.updateSystemState(deviation);
    }
    
    updateSystemState(deviationMHz) {
        let newState = 'normal';
        
        if (Math.abs(deviationMHz) > 200) {
            newState = 'emergency';
        } else if (Math.abs(deviationMHz) > 100) {
            newState = 'alert';
        }
        
        if (newState !== this.systemState) {
            this.systemState = newState;
            this.updateSystemStateDisplay();
            this.logSystemStateChange(newState);
        }
    }
    
    updateSystemStateDisplay() {
        const indicator = document.getElementById('system-state');
        if (indicator) {
            indicator.textContent = this.systemState.toUpperCase();
            indicator.className = `system-state-${this.systemState}`;
        }
    }
    
    updateReserveStatus(data) {
        this.fcr_activation = data.fcr_activation || 0;
        this.frr_activation = data.frr_activation || 0;
        
        document.getElementById('fcr').textContent = Math.round(data.fcr_available || 0);
        
        // Update reserve indicators
        const fcrIndicator = document.getElementById('fcr-status');
        const frrIndicator = document.getElementById('frr-status');
        
        if (fcrIndicator) {
            fcrIndicator.textContent = `${Math.round(this.fcr_activation)} MW`;
            fcrIndicator.className = this.fcr_activation > 0 ? 'reserve-active' : 'reserve-normal';
        }
        
        if (frrIndicator) {
            frrIndicator.textContent = `${Math.round(this.frr_activation)} MW`;
            frrIndicator.className = this.frr_activation > 0 ? 'reserve-active' : 'reserve-normal';
        }
    }
    
    updateComplianceScore(data) {
        this.complianceScore = data.compliance_score || 100;
        
        const scoreElement = document.getElementById('compliance-score');
        if (scoreElement) {
            scoreElement.textContent = `${Math.round(this.complianceScore)}%`;
            scoreElement.className = this.getComplianceClass(this.complianceScore);
        }
    }
    
    getComplianceClass(score) {
        if (score >= 95) return 'compliance-excellent';
        if (score >= 85) return 'compliance-good';
        if (score >= 70) return 'compliance-warning';
        return 'compliance-critical';
    }
    
    updateGridEvents(data) {
        if (data.active_events) {
            this.gridEvents = data.active_events;
            this.updateEventDisplay();
        }
    }
    
    updateEventDisplay() {
        const eventsList = document.getElementById('active-events');
        if (!eventsList) return;
        
        eventsList.innerHTML = '';
        
        this.gridEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = `grid-event event-${event.type}`;
            eventElement.innerHTML = `
                <div class="event-header">
                    <span class="event-type">${event.type.replace('_', ' ').toUpperCase()}</span>
                    <span class="event-magnitude">${Math.round(event.magnitude)} MW</span>
                </div>
                <div class="event-description">${event.description}</div>
                <div class="event-time">Duration: ${Math.round(event.duration)}s</div>
            `;
            eventsList.appendChild(eventElement);
        });
    }
    
    logSystemStateChange(newState) {
        console.log(`System state changed to: ${newState} at ${new Date().toISOString()}`);
        
        // Add to system log
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'system_state_change',
            message: `System state: ${newState}`,
            severity: newState === 'emergency' ? 'critical' : 
                     newState === 'alert' ? 'warning' : 'info'
        };
        
        this.addToSystemLog(logEntry);
    }
    
    addToSystemLog(entry) {
        const logContainer = document.getElementById('system-log');
        if (!logContainer) return;
        
        const logElement = document.createElement('div');
        logElement.className = `log-entry log-${entry.severity}`;
        logElement.innerHTML = `
            <span class="log-time">${new Date(entry.timestamp).toLocaleTimeString()}</span>
            <span class="log-message">${entry.message}</span>
        `;
        
        logContainer.appendChild(logElement);
        
        // Keep only last 50 entries
        while (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.firstChild);
        }
        
        // Auto-scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    autoSave() {
        if (!this.europeanMode) return;
        
        const gameState = {
            components: this.components,
            lines: this.lines,
            nodes: this.nodes,
            budget: this.budget,
            timestamp: Date.now()
        };
        
        localStorage.setItem('europeanGridGameState', JSON.stringify(gameState));
    }
    
    loadAutoSave() {
        const savedState = localStorage.getItem('europeanGridGameState');
        if (!savedState) return false;
        
        try {
            const gameState = JSON.parse(savedState);
            this.components = gameState.components || [];
            this.lines = gameState.lines || [];
            this.nodes = gameState.nodes || [];
            this.budget = gameState.budget || 500000;
            
            console.log('Auto-save loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load auto-save:', error);
            return false;
        }
    }

    // Interactive Whiteboard Integration
    initializeWhiteboard() {
        try {
            if (typeof InteractiveWhiteboard !== 'undefined') {
                this.whiteboard = new InteractiveWhiteboard('grid-canvas');
                console.log('Interactive Whiteboard initialized successfully');
                
                // Set up integration callbacks
                this.setupWhiteboardIntegration();
            } else {
                console.warn('InteractiveWhiteboard class not available');
            }
        } catch (error) {
            console.error('Failed to initialize Interactive Whiteboard:', error);
        }
    }
    
    setupWhiteboardIntegration() {
        if (!this.whiteboard) return;
        
        // Override canvas resize to work with whiteboard
        const originalResizeCanvas = this.resizeCanvas.bind(this);
        this.resizeCanvas = () => {
            originalResizeCanvas();
            if (this.whiteboard) {
                this.whiteboard.handleResize();
            }
        };
        
        // Add whiteboard export functionality
        this.addWhiteboardExportFeatures();
        
        // Sync whiteboard mode with app state
        this.syncWhiteboardState();
    }
    
    addWhiteboardExportFeatures() {
        // Add export to grid button
        const exportBtn = document.createElement('button');
        exportBtn.id = 'export-whiteboard-to-grid';
        exportBtn.className = 'btn btn-secondary';
        exportBtn.innerHTML = '<i class="fas fa-download"></i> Import from Whiteboard';
        exportBtn.title = 'Import whiteboard design as grid components';
        exportBtn.style.display = 'none';
        
        exportBtn.addEventListener('click', () => this.importFromWhiteboard());
        
        // Add to control panel
        const controlPanel = document.querySelector('.controls');
        if (controlPanel) {
            controlPanel.appendChild(exportBtn);
        }
        
        // Add export current grid to whiteboard button
        const importBtn = document.createElement('button');
        importBtn.id = 'import-grid-to-whiteboard';
        importBtn.className = 'btn btn-secondary';
        importBtn.innerHTML = '<i class="fas fa-upload"></i> Export to Whiteboard';
        importBtn.title = 'Export current grid to whiteboard for editing';
        
        importBtn.addEventListener('click', () => this.exportToWhiteboard());
        
        if (controlPanel) {
            controlPanel.appendChild(importBtn);
        }
        
        // Show/hide buttons based on whiteboard mode
        this.updateWhiteboardButtons();
    }
    
    syncWhiteboardState() {
        // Listen for whiteboard mode changes
        const whiteboardToggle = document.getElementById('whiteboard-toggle');
        if (whiteboardToggle) {
            const originalToggle = this.whiteboard.toggleWhiteboardMode.bind(this.whiteboard);
            this.whiteboard.toggleWhiteboardMode = () => {
                originalToggle();
                this.updateWhiteboardButtons();
                
                // Sync with main app state
                if (this.whiteboard.whiteboardMode) {
                    this.currentTool = null;
                    this.selectTool(null);
                }
            };
        }
    }
    
    updateWhiteboardButtons() {
        const exportBtn = document.getElementById('export-whiteboard-to-grid');
        const importBtn = document.getElementById('import-grid-to-whiteboard');
        
        if (this.whiteboard && this.whiteboard.whiteboardMode) {
            if (exportBtn) exportBtn.style.display = 'inline-block';
            if (importBtn) importBtn.style.display = 'none';
        } else {
            if (exportBtn) exportBtn.style.display = 'none';
            if (importBtn) importBtn.style.display = 'inline-block';
        }
    }
    
    async importFromWhiteboard() {
        if (!this.whiteboard) {
            this.showMessage('Whiteboard not available', 'error');
            return;
        }
        
        try {
            const whiteboardComponents = this.whiteboard.exportToGrid();
            
            if (whiteboardComponents.length === 0) {
                this.showMessage('No components found in whiteboard to import', 'warning');
                return;
            }
            
            // Convert whiteboard components to grid components
            const gridComponents = whiteboardComponents.map(comp => {
                return {
                    type: this.mapWhiteboardToGridType(comp.type),
                    x: Math.round(comp.x),
                    y: Math.round(comp.y),
                    properties: comp.properties || {}
                };
            });
            
            // Add components to the grid
            for (const comp of gridComponents) {
                await this.addComponentFromWhiteboard(comp);
            }
            
            this.showMessage(`Imported ${gridComponents.length} components from whiteboard`, 'success');
            this.loadGameData();
            this.draw();
            
        } catch (error) {
            this.showMessage('Error importing from whiteboard: ' + error.message, 'error');
        }
    }
    
    mapWhiteboardToGridType(whiteboardType) {
        const typeMap = {
            'generator': 'generator',
            'substation': 'substation', 
            'load': 'load',
            'transmission': 'transmission_line',
            'transformer': 'transformer'
        };
        
        return typeMap[whiteboardType] || 'generator';
    }
    
    async addComponentFromWhiteboard(component) {
        try {
            const response = await fetch('/api/components', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: component.type,
                    x: component.x,
                    y: component.y,
                    properties: component.properties
                })
            });
            
            const result = await response.json();
            if (!result.success) {
                console.warn(`Failed to add component: ${result.message}`);
            }
        } catch (error) {
            console.error('Error adding component from whiteboard:', error);
        }
    }
    
    exportToWhiteboard() {
        if (!this.whiteboard) {
            this.showMessage('Whiteboard not available', 'error');
            return;
        }
        
        try {
            // Convert current grid components to whiteboard format
            const whiteboardComponents = this.components.map(comp => {
                return {
                    type: this.mapGridToWhiteboardType(comp.type),
                    x: comp.x,
                    y: comp.y,
                    properties: comp.properties || {}
                };
            });
            
            // Import to whiteboard
            this.whiteboard.importFromGrid(whiteboardComponents);
            
            // Switch to whiteboard mode
            if (!this.whiteboard.whiteboardMode) {
                this.whiteboard.toggleWhiteboardMode();
            }
            
            this.showMessage(`Exported ${whiteboardComponents.length} components to whiteboard`, 'success');
            
        } catch (error) {
            this.showMessage('Error exporting to whiteboard: ' + error.message, 'error');
        }
    }
    
    mapGridToWhiteboardType(gridType) {
        const typeMap = {
            'generator': 'generator',
            'nuclear_plant': 'generator',
            'coal_plant': 'generator',
            'gas_plant': 'generator',
            'hydro_plant': 'generator',
            'wind_farm': 'generator',
            'solar_farm': 'generator',
            'substation': 'substation',
            'load': 'load',
            'industrial_load': 'load',
            'transmission_line': 'transmission',
            'transformer': 'transformer'
        };
        
        return typeMap[gridType] || 'generator';
    }

    // Enhanced mobile touch support for whiteboard integration
    handleMobileWhiteboardInteraction() {
        if (!this.whiteboard || !this.whiteboard.whiteboardMode) return;
        
        // Add mobile-specific gesture handlers
        let lastTap = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 500 && tapLength > 0) {
                // Double tap detected
                e.preventDefault();
                this.handleDoubleTapWhiteboard(e);
            }
            
            lastTap = currentTime;
        });
    }
    
    handleDoubleTapWhiteboard(e) {
        if (!this.whiteboard) return;
        
        // Double tap to center/reset view
        this.whiteboard.transform.translateX = 0;
        this.whiteboard.transform.translateY = 0;
        this.whiteboard.transform.scale = 1;
        this.whiteboard.redraw();
        
        // Show feedback
        this.showTouchFeedback(e.touches[0]);
    }
    
    showTouchFeedback(touch) {
        const feedback = document.createElement('div');
        feedback.className = 'touch-feedback';
        feedback.style.left = touch.clientX + 'px';
        feedback.style.top = touch.clientY + 'px';
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 600);
    }

    // Enhanced whiteboard-specific drawing optimization
    optimizeWhiteboardRendering() {
        if (!this.whiteboard) return;
        
        // Use requestAnimationFrame for smooth drawing
        let animationId;
        const optimizedRedraw = () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            
            animationId = requestAnimationFrame(() => {
                this.whiteboard.redraw();
            });
        };
        
        // Replace whiteboard redraw with optimized version
        this.whiteboard.redraw = optimizedRedraw;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply zoom and pan transformations
        this.ctx.save();
        this.ctx.translate(this.panX, this.panY);
        this.ctx.scale(this.zoom, this.zoom);
        
        // Use advanced renderer if available and in European mode
        if (this.advancedRenderer && this.europeanMode) {
            this.advancedRenderer.render(this.components, this.lines, this.nodes, {
                zoom: this.zoom,
                panX: this.panX,
                panY: this.panY,
                selectedComponent: this.selectedComponent,
                connectionStart: this.connectionStart,
                currentTool: this.currentTool
            });
        } else {
            // Fallback to basic rendering
            this.drawGrid();
            this.drawLines();
            this.drawComponents();
            this.drawNodes();
            this.drawConnectionPreview();
        }
        
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
