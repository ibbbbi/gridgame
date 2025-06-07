/**
 * Performance Monitoring and Analytics Dashboard
 * European Power Grid Builder v2.0 - Advanced Metrics and Insights
 */

class GridPerformanceMonitor {
    constructor(powerGridApp) {
        this.app = powerGridApp;
        this.metrics = {
            frequency: [],
            voltage: [],
            powerFlow: [],
            compliance: [],
            events: [],
            efficiency: [],
            reliability: []
        };
        
        this.charts = {};
        this.dashboardVisible = false;
        this.updateInterval = null;
        this.maxDataPoints = 1000;
        
        this.initializeDashboard();
        this.initializeCharts();
    }
    
    /**
     * Initialize the performance dashboard UI
     */
    initializeDashboard() {
        // Create dashboard container
        const dashboardHTML = `
            <div id="performance-dashboard" class="performance-dashboard hidden">
                <div class="dashboard-header">
                    <h2><i class="fas fa-chart-line"></i> Grid Performance Analytics</h2>
                    <div class="dashboard-controls">
                        <button id="export-analytics" class="btn btn-primary">
                            <i class="fas fa-download"></i> Export Data
                        </button>
                        <button id="reset-analytics" class="btn btn-secondary">
                            <i class="fas fa-refresh"></i> Reset
                        </button>
                        <button id="close-dashboard" class="btn btn-danger">
                            <i class="fas fa-times"></i> Close
                        </button>
                    </div>
                </div>
                
                <div class="dashboard-content">
                    <!-- Key Performance Indicators -->
                    <div class="kpi-section">
                        <div class="kpi-card">
                            <div class="kpi-title">System Frequency</div>
                            <div class="kpi-value" id="kpi-frequency">50.000 Hz</div>
                            <div class="kpi-status" id="kpi-frequency-status">Normal</div>
                        </div>
                        
                        <div class="kpi-card">
                            <div class="kpi-title">Compliance Score</div>
                            <div class="kpi-value" id="kpi-compliance">100%</div>
                            <div class="kpi-trend" id="kpi-compliance-trend">→</div>
                        </div>
                        
                        <div class="kpi-card">
                            <div class="kpi-title">Grid Reliability</div>
                            <div class="kpi-value" id="kpi-reliability">99.9%</div>
                            <div class="kpi-trend" id="kpi-reliability-trend">↑</div>
                        </div>
                        
                        <div class="kpi-card">
                            <div class="kpi-title">System Efficiency</div>
                            <div class="kpi-value" id="kpi-efficiency">95%</div>
                            <div class="kpi-trend" id="kpi-efficiency-trend">↑</div>
                        </div>
                    </div>
                    
                    <!-- Charts Section -->
                    <div class="charts-section">
                        <div class="chart-container">
                            <h3>Frequency Deviation (Last 5 Minutes)</h3>
                            <canvas id="frequency-chart" width="400" height="200"></canvas>
                        </div>
                        
                        <div class="chart-container">
                            <h3>Compliance Score Trend</h3>
                            <canvas id="compliance-chart" width="400" height="200"></canvas>
                        </div>
                        
                        <div class="chart-container">
                            <h3>Power Generation vs Load</h3>
                            <canvas id="power-balance-chart" width="400" height="200"></canvas>
                        </div>
                        
                        <div class="chart-container">
                            <h3>Reserve Activation</h3>
                            <canvas id="reserve-chart" width="400" height="200"></canvas>
                        </div>
                    </div>
                    
                    <!-- Event Log -->
                    <div class="events-section">
                        <h3>Recent System Events</h3>
                        <div id="event-log" class="event-log"></div>
                    </div>
                    
                    <!-- Performance Statistics -->
                    <div class="stats-section">
                        <h3>Performance Statistics</h3>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <span class="stat-label">Average Frequency:</span>
                                <span class="stat-value" id="avg-frequency">50.000 Hz</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Max Frequency Deviation:</span>
                                <span class="stat-value" id="max-freq-deviation">0.0 mHz</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Total Events:</span>
                                <span class="stat-value" id="total-events">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">FCR Activations:</span>
                                <span class="stat-value" id="fcr-activations">0</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Average Load:</span>
                                <span class="stat-value" id="avg-load">0 MW</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Peak Generation:</span>
                                <span class="stat-value" id="peak-generation">0 MW</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add dashboard to DOM
        document.body.insertAdjacentHTML('beforeend', dashboardHTML);
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    /**
     * Initialize Chart.js charts
     */
    initializeCharts() {
        // Frequency Chart
        const freqCtx = document.getElementById('frequency-chart').getContext('2d');
        this.charts.frequency = new Chart(freqCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Frequency (Hz)',
                    data: [],
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                }, {
                    label: 'Target (50.0 Hz)',
                    data: [],
                    borderColor: '#2ecc71',
                    borderDash: [5, 5],
                    borderWidth: 1,
                    pointRadius: 0
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
                    x: {
                        type: 'time',
                        time: {
                            unit: 'second'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
        
        // Compliance Chart
        const complianceCtx = document.getElementById('compliance-chart').getContext('2d');
        this.charts.compliance = new Chart(complianceCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'SO GL Compliance (%)',
                    data: [],
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
        
        // Power Balance Chart
        const powerCtx = document.getElementById('power-balance-chart').getContext('2d');
        this.charts.powerBalance = new Chart(powerCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Generation (MW)',
                    data: [],
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    borderWidth: 2
                }, {
                    label: 'Load (MW)',
                    data: [],
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
        
        // Reserve Chart
        const reserveCtx = document.getElementById('reserve-chart').getContext('2d');
        this.charts.reserve = new Chart(reserveCtx, {
            type: 'bar',
            data: {
                labels: ['FCR Available', 'FCR Active', 'FRR Available', 'FRR Active'],
                datasets: [{
                    label: 'Reserve (MW)',
                    data: [0, 0, 0, 0],
                    backgroundColor: [
                        'rgba(52, 152, 219, 0.7)',
                        'rgba(52, 152, 219, 1)',
                        'rgba(155, 89, 182, 0.7)',
                        'rgba(155, 89, 182, 1)'
                    ],
                    borderColor: [
                        '#3498db',
                        '#3498db',
                        '#9b59b6',
                        '#9b59b6'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    /**
     * Setup event listeners for dashboard
     */
    setupEventListeners() {
        document.getElementById('close-dashboard').addEventListener('click', () => {
            this.hideDashboard();
        });
        
        document.getElementById('export-analytics').addEventListener('click', () => {
            this.exportAnalyticsData();
        });
        
        document.getElementById('reset-analytics').addEventListener('click', () => {
            this.resetAnalytics();
        });
    }
    
    /**
     * Show the performance dashboard
     */
    showDashboard() {
        document.getElementById('performance-dashboard').classList.remove('hidden');
        this.dashboardVisible = true;
        
        // Start real-time updates
        this.startUpdates();
    }
    
    /**
     * Hide the performance dashboard
     */
    hideDashboard() {
        document.getElementById('performance-dashboard').classList.add('hidden');
        this.dashboardVisible = false;
        
        // Stop updates
        this.stopUpdates();
    }
    
    /**
     * Start real-time metric updates
     */
    startUpdates() {
        if (this.updateInterval) return;
        
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
            this.updateCharts();
            this.updateKPIs();
            this.updateStatistics();
        }, 1000);
    }
    
    /**
     * Stop real-time updates
     */
    stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    /**
     * Update performance metrics
     */
    updateMetrics() {
        if (!this.app.europeanMode) return;
        
        const timestamp = new Date();
        
        // Get current grid status
        fetch('/api/european/realtime')
            .then(response => response.json())
            .then(data => {
                // Store frequency data
                this.metrics.frequency.push({
                    timestamp,
                    value: data.frequency || 50.0,
                    deviation: data.frequency_deviation_mhz || 0
                });
                
                // Store compliance data
                this.metrics.compliance.push({
                    timestamp,
                    value: data.compliance_score || 100
                });
                
                // Store power data
                this.metrics.powerFlow.push({
                    timestamp,
                    generation: data.generation_capacity || 0,
                    load: data.load_demand || 0
                });
                
                // Store events
                if (data.active_events) {
                    data.active_events.forEach(event => {
                        if (!this.metrics.events.find(e => e.id === event.id)) {
                            this.metrics.events.push({
                                ...event,
                                timestamp
                            });
                        }
                    });
                }
                
                // Limit data points
                this.limitDataPoints();
            })
            .catch(error => console.warn('Failed to update metrics:', error));
    }
    
    /**
     * Update Chart.js charts with latest data
     */
    updateCharts() {
        // Update frequency chart
        if (this.metrics.frequency.length > 0) {
            const freqData = this.metrics.frequency.slice(-300); // Last 5 minutes
            this.charts.frequency.data.labels = freqData.map(d => d.timestamp);
            this.charts.frequency.data.datasets[0].data = freqData.map(d => d.value);
            this.charts.frequency.data.datasets[1].data = freqData.map(() => 50.0);
            this.charts.frequency.update('none');
        }
        
        // Update compliance chart
        if (this.metrics.compliance.length > 0) {
            const compData = this.metrics.compliance.slice(-100);
            this.charts.compliance.data.labels = compData.map(d => d.timestamp.toLocaleTimeString());
            this.charts.compliance.data.datasets[0].data = compData.map(d => d.value);
            this.charts.compliance.update('none');
        }
        
        // Update power balance chart
        if (this.metrics.powerFlow.length > 0) {
            const powerData = this.metrics.powerFlow.slice(-60);
            this.charts.powerBalance.data.labels = powerData.map(d => d.timestamp.toLocaleTimeString());
            this.charts.powerBalance.data.datasets[0].data = powerData.map(d => d.generation);
            this.charts.powerBalance.data.datasets[1].data = powerData.map(d => d.load);
            this.charts.powerBalance.update('none');
        }
    }
    
    /**
     * Update KPI displays
     */
    updateKPIs() {
        if (this.metrics.frequency.length > 0) {
            const latest = this.metrics.frequency[this.metrics.frequency.length - 1];
            document.getElementById('kpi-frequency').textContent = latest.value.toFixed(3) + ' Hz';
            
            // Frequency status
            const deviation = Math.abs(latest.deviation);
            let status = 'Normal';
            if (deviation > 100) status = 'Critical';
            else if (deviation > 50) status = 'Alert';
            
            document.getElementById('kpi-frequency-status').textContent = status;
            document.getElementById('kpi-frequency-status').className = `kpi-status status-${status.toLowerCase()}`;
        }
        
        if (this.metrics.compliance.length > 0) {
            const latest = this.metrics.compliance[this.metrics.compliance.length - 1];
            document.getElementById('kpi-compliance').textContent = latest.value.toFixed(1) + '%';
            
            // Compliance trend
            if (this.metrics.compliance.length > 1) {
                const previous = this.metrics.compliance[this.metrics.compliance.length - 2];
                const trend = latest.value > previous.value ? '↑' : 
                             latest.value < previous.value ? '↓' : '→';
                document.getElementById('kpi-compliance-trend').textContent = trend;
            }
        }
    }
    
    /**
     * Update statistics panel
     */
    updateStatistics() {
        if (this.metrics.frequency.length > 0) {
            const frequencies = this.metrics.frequency.map(f => f.value);
            const avgFreq = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
            document.getElementById('avg-frequency').textContent = avgFreq.toFixed(3) + ' Hz';
            
            const deviations = this.metrics.frequency.map(f => Math.abs(f.deviation));
            const maxDev = Math.max(...deviations);
            document.getElementById('max-freq-deviation').textContent = maxDev.toFixed(1) + ' mHz';
        }
        
        document.getElementById('total-events').textContent = this.metrics.events.length;
        
        if (this.metrics.powerFlow.length > 0) {
            const loads = this.metrics.powerFlow.map(p => p.load);
            const avgLoad = loads.reduce((a, b) => a + b, 0) / loads.length;
            document.getElementById('avg-load').textContent = Math.round(avgLoad) + ' MW';
            
            const generations = this.metrics.powerFlow.map(p => p.generation);
            const peakGen = Math.max(...generations);
            document.getElementById('peak-generation').textContent = Math.round(peakGen) + ' MW';
        }
    }
    
    /**
     * Export analytics data
     */
    exportAnalyticsData() {
        const analyticsData = {
            exportTime: new Date().toISOString(),
            metrics: this.metrics,
            summary: this.generateSummaryStats()
        };
        
        const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `grid-analytics-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Generate summary statistics
     */
    generateSummaryStats() {
        const summary = {
            sessionDuration: 0,
            averageFrequency: 0,
            maxFrequencyDeviation: 0,
            averageCompliance: 0,
            totalEvents: this.metrics.events.length,
            eventTypes: {}
        };
        
        if (this.metrics.frequency.length > 0) {
            const frequencies = this.metrics.frequency.map(f => f.value);
            summary.averageFrequency = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
            
            const deviations = this.metrics.frequency.map(f => Math.abs(f.deviation));
            summary.maxFrequencyDeviation = Math.max(...deviations);
            
            const firstTime = this.metrics.frequency[0].timestamp;
            const lastTime = this.metrics.frequency[this.metrics.frequency.length - 1].timestamp;
            summary.sessionDuration = (lastTime - firstTime) / 1000; // seconds
        }
        
        if (this.metrics.compliance.length > 0) {
            const compliance = this.metrics.compliance.map(c => c.value);
            summary.averageCompliance = compliance.reduce((a, b) => a + b, 0) / compliance.length;
        }
        
        // Event type distribution
        this.metrics.events.forEach(event => {
            summary.eventTypes[event.type] = (summary.eventTypes[event.type] || 0) + 1;
        });
        
        return summary;
    }
    
    /**
     * Reset all analytics data
     */
    resetAnalytics() {
        if (confirm('Are you sure you want to reset all analytics data?')) {
            this.metrics = {
                frequency: [],
                voltage: [],
                powerFlow: [],
                compliance: [],
                events: [],
                efficiency: [],
                reliability: []
            };
            
            // Clear charts
            Object.values(this.charts).forEach(chart => {
                chart.data.labels = [];
                chart.data.datasets.forEach(dataset => {
                    dataset.data = [];
                });
                chart.update();
            });
            
            console.log('Analytics data reset');
        }
    }
    
    /**
     * Limit data points to prevent memory issues
     */
    limitDataPoints() {
        Object.keys(this.metrics).forEach(key => {
            if (this.metrics[key].length > this.maxDataPoints) {
                this.metrics[key] = this.metrics[key].slice(-this.maxDataPoints);
            }
        });
    }
    
    /**
     * Toggle dashboard visibility
     */
    toggleDashboard() {
        if (this.dashboardVisible) {
            this.hideDashboard();
        } else {
            this.showDashboard();
        }
    }
}

// Export for use in main application
window.GridPerformanceMonitor = GridPerformanceMonitor;
