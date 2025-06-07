/**
 * Advanced Grid Visualization Engine for European Power Grid Builder v2.0
 * Enhanced graphics, animations, and interactive elements
 */

class AdvancedGridRenderer {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.ctx = context;
        this.animationQueue = [];
        this.particleSystems = [];
        this.heatmapData = new Map();
        this.gridFlow = new Map();
        this.lastFrameTime = 0;
        
        // Visual effects settings
        this.settings = {
            showFlowAnimation: true,
            showHeatmap: true,
            showParticles: true,
            showVoltageOverlay: false,
            showFrequencyRipples: true,
            animationSpeed: 1.0,
            qualityLevel: 'high' // low, medium, high
        };
        
        // Color schemes
        this.colorSchemes = {
            frequency: {
                normal: '#00ff00',
                warning: '#ffff00',
                critical: '#ff0000'
            },
            voltage: {
                high: '#ff6b6b',
                normal: '#4ecdc4',
                low: '#45b7d1'
            },
            power: {
                generation: '#2ecc71',
                transmission: '#3498db',
                load: '#e74c3c'
            }
        };
        
        this.initializeRenderer();
    }
    
    initializeRenderer() {
        // Setup canvas for high-DPI displays
        const devicePixelRatio = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * devicePixelRatio;
        this.canvas.height = rect.height * devicePixelRatio;
        
        this.ctx.scale(devicePixelRatio, devicePixelRatio);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Enable smooth rendering
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }
    
    /**
     * Enhanced component rendering with 3D effects
     */
    renderComponent(component, realTimeData = null) {
        const { x, y, type } = component;
        
        // Save context for transformations
        this.ctx.save();
        
        // Apply glow effect for active components
        if (realTimeData && realTimeData.active) {
            this.addGlowEffect(x, y, component.config?.capacity || 100);
        }
        
        // Render based on component type
        switch (type) {
            case 'nuclear':
                this.renderNuclearPlant(component, realTimeData);
                break;
            case 'coal':
                this.renderCoalPlant(component, realTimeData);
                break;
            case 'gas':
                this.renderGasPlant(component, realTimeData);
                break;
            case 'hydro':
                this.renderHydroPlant(component, realTimeData);
                break;
            case 'wind':
                this.renderWindFarm(component, realTimeData);
                break;
            case 'solar':
                this.renderSolarFarm(component, realTimeData);
                break;
            case 'substation':
                this.renderSubstation(component, realTimeData);
                break;
            default:
                this.renderGenericComponent(component, realTimeData);
        }
        
        // Add status indicators
        this.renderComponentStatus(component, realTimeData);
        
        // Add capacity badge
        this.renderCapacityBadge(component);
        
        this.ctx.restore();
    }
    
    /**
     * Render nuclear power plant with realistic graphics
     */
    renderNuclearPlant(component, realTimeData) {
        const { x, y } = component;
        const size = 40;
        const capacity = component.config?.capacity || 1400;
        const output = realTimeData?.output || 0;
        const outputRatio = capacity > 0 ? output / capacity : 0;
        
        // Main reactor building
        this.ctx.fillStyle = this.interpolateColor('#e8e8e8', '#ffff99', outputRatio);
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;
        
        // Reactor dome
        this.ctx.beginPath();
        this.ctx.arc(x, y - 5, size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // Cooling towers
        for (let i = 0; i < 2; i++) {
            const towerX = x + (i === 0 ? -25 : 25);
            const towerY = y + 10;
            
            this.ctx.fillStyle = '#d0d0d0';
            this.ctx.beginPath();
            this.ctx.ellipse(towerX, towerY, 8, 20, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.stroke();
            
            // Steam effects
            if (outputRatio > 0.1) {
                this.renderSteamEffect(towerX, towerY - 20, outputRatio);
            }
        }
        
        // Nuclear symbol
        this.ctx.fillStyle = '#ff6b00';
        this.ctx.font = 'bold 16px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('☢', x, y + 5);
    }
    
    /**
     * Render wind farm with animated turbines
     */
    renderWindFarm(component, realTimeData) {
        const { x, y } = component;
        const capacity = component.config?.capacity || 200;
        const output = realTimeData?.output || 0;
        const windSpeed = realTimeData?.windSpeed || 5; // m/s
        const outputRatio = capacity > 0 ? output / capacity : 0;
        
        // Number of turbines based on capacity
        const turbineCount = Math.ceil(capacity / 50);
        const spacing = 25;
        const startX = x - (turbineCount - 1) * spacing / 2;
        
        for (let i = 0; i < turbineCount; i++) {
            const turbineX = startX + i * spacing;
            const turbineY = y;
            
            this.renderWindTurbine(turbineX, turbineY, windSpeed, outputRatio);
        }
    }
    
    /**
     * Render individual wind turbine with rotation
     */
    renderWindTurbine(x, y, windSpeed, outputRatio) {
        const time = Date.now() * 0.001;
        const rotationSpeed = windSpeed * outputRatio * 2;
        
        // Tower
        this.ctx.strokeStyle = '#888';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 20);
        this.ctx.lineTo(x, y - 15);
        this.ctx.stroke();
        
        // Nacelle
        this.ctx.fillStyle = '#ccc';
        this.ctx.fillRect(x - 3, y - 18, 6, 8);
        
        // Rotating blades
        this.ctx.save();
        this.ctx.translate(x, y - 15);
        this.ctx.rotate(time * rotationSpeed);
        
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        
        for (let blade = 0; blade < 3; blade++) {
            this.ctx.save();
            this.ctx.rotate(blade * Math.PI * 2 / 3);
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(0, -12);
            this.ctx.stroke();
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    /**
     * Render transmission lines with power flow animation
     */
    renderTransmissionLine(line, realTimeData = null) {
        const { start, end, voltage, type } = line;
        const powerFlow = realTimeData?.powerFlow || 0;
        const capacity = line.capacity || 1000;
        const loading = Math.abs(powerFlow) / capacity;
        
        // Line color based on loading
        let lineColor = '#4a90e2';
        if (loading > 0.9) lineColor = '#e74c3c';
        else if (loading > 0.7) lineColor = '#f39c12';
        
        // Line width based on voltage level
        let lineWidth = 2;
        if (voltage >= 400) lineWidth = 4;
        else if (voltage >= 220) lineWidth = 3;
        
        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = lineWidth;
        this.ctx.lineCap = 'round';
        
        // Draw main line
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.stroke();
        
        // Add power flow animation
        if (this.settings.showFlowAnimation && Math.abs(powerFlow) > 10) {
            this.renderPowerFlowAnimation(start, end, powerFlow, capacity);
        }
        
        // Add voltage level indicator
        this.renderVoltageIndicator(line);
        
        // Add loading percentage
        if (loading > 0.5) {
            this.renderLoadingIndicator(line, loading);
        }
    }
    
    /**
     * Render power flow animation along transmission lines
     */
    renderPowerFlowAnimation(start, end, powerFlow, capacity) {
        const time = Date.now() * 0.002;
        const flowDirection = powerFlow > 0 ? 1 : -1;
        const flowMagnitude = Math.abs(powerFlow) / capacity;
        
        // Calculate line properties
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const unitX = dx / length;
        const unitY = dy / length;
        
        // Animate flow particles
        const particleCount = Math.ceil(flowMagnitude * 5);
        const particleSpacing = length / particleCount;
        
        this.ctx.fillStyle = powerFlow > 0 ? '#00ff00' : '#ff0000';
        
        for (let i = 0; i < particleCount; i++) {
            const progress = ((time * 50 * flowDirection + i * particleSpacing) % length) / length;
            
            if (progress < 0) continue;
            if (progress > 1) continue;
            
            const particleX = start.x + progress * dx;
            const particleY = start.y + progress * dy;
            
            this.ctx.beginPath();
            this.ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * Render frequency ripples across the grid
     */
    renderFrequencyRipples(centerX, centerY, frequency, timestamp) {
        if (!this.settings.showFrequencyRipples) return;
        
        const deviation = Math.abs(frequency - 50.0);
        if (deviation < 0.01) return; // No ripples for stable frequency
        
        const time = (Date.now() - timestamp) * 0.001;
        const rippleRadius = time * 100; // Propagation speed
        const maxRadius = 200;
        
        if (rippleRadius > maxRadius) return;
        
        // Color based on frequency deviation
        let rippleColor = '#00ff00';
        if (deviation > 0.1) rippleColor = '#ff0000';
        else if (deviation > 0.05) rippleColor = '#ffff00';
        
        this.ctx.strokeStyle = rippleColor;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = Math.max(0, 1 - rippleRadius / maxRadius);
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * Render system state overlay
     */
    renderSystemStateOverlay(systemState, complianceScore) {
        // Background overlay based on system state
        let overlayColor = 'rgba(0, 255, 0, 0.05)'; // Normal
        if (systemState === 'alert') overlayColor = 'rgba(255, 255, 0, 0.05)';
        else if (systemState === 'emergency') overlayColor = 'rgba(255, 0, 0, 0.1)';
        
        this.ctx.fillStyle = overlayColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Compliance score indicator
        const scoreX = this.canvas.width - 150;
        const scoreY = 30;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(scoreX - 10, scoreY - 20, 140, 30);
        
        this.ctx.fillStyle = complianceScore > 90 ? '#00ff00' : 
                           complianceScore > 70 ? '#ffff00' : '#ff0000';
        this.ctx.font = 'bold 14px sans-serif';
        this.ctx.fillText(`Compliance: ${complianceScore.toFixed(1)}%`, scoreX, scoreY);
    }
    
    /**
     * Add glow effect around active components
     */
    addGlowEffect(x, y, intensity) {
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, 30);
        gradient.addColorStop(0, `rgba(255, 255, 0, ${intensity / 500})`);
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 30, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * Render steam effect for thermal plants
     */
    renderSteamEffect(x, y, intensity) {
        const time = Date.now() * 0.001;
        const particleCount = Math.ceil(intensity * 10);
        
        this.ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.5})`;
        
        for (let i = 0; i < particleCount; i++) {
            const offset = (time + i) * 50;
            const particleY = y - (offset % 50);
            const particleX = x + Math.sin(time + i) * 5;
            
            if (particleY < y - 50) continue;
            
            this.ctx.beginPath();
            this.ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * Interpolate between two colors
     */
    interpolateColor(color1, color2, factor) {
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        const r = Math.round(c1.r + (c2.r - c1.r) * factor);
        const g = Math.round(c1.g + (c2.g - c1.g) * factor);
        const b = Math.round(c1.b + (c2.b - c1.b) * factor);
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * Convert hex color to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    /**
     * Update visualization settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }
    
    /**
     * Clear canvas and render grid background
     */
    clearAndRenderBackground() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Grid background
        this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 20;
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
}

// Export for use in main application
window.AdvancedGridRenderer = AdvancedGridRenderer;
