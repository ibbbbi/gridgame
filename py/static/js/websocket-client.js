/**
 * WebSocket Real-time Data Handler for European Power Grid Builder v2.0
 * Provides bidirectional real-time communication with the grid simulation backend
 */

class GridWebSocketClient {
    constructor(url = 'ws://localhost:8765') {
        this.url = url;
        this.websocket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // Start with 1 second
        this.callbacks = new Map();
        this.heartbeatInterval = null;
        
        // Event callbacks
        this.onConnectionChange = null;
        this.onRealtimeUpdate = null;
        this.onSimulationStatus = null;
        this.onN1Results = null;
        this.onError = null;
    }
    
    /**
     * Connect to the WebSocket server
     */
    async connect() {
        try {
            console.log(`Connecting to WebSocket at ${this.url}...`);
            
            this.websocket = new WebSocket(this.url);
            
            this.websocket.onopen = (event) => {
                console.log('WebSocket connected successfully');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
                
                // Start heartbeat
                this.startHeartbeat();
                
                // Notify connection change
                if (this.onConnectionChange) {
                    this.onConnectionChange(true);
                }
                
                // Request initial status
                this.requestStatus();
            };
            
            this.websocket.onmessage = (event) => {
                this.handleMessage(event.data);
            };
            
            this.websocket.onclose = (event) => {
                console.log('WebSocket connection closed', event.code, event.reason);
                this.isConnected = false;
                this.stopHeartbeat();
                
                if (this.onConnectionChange) {
                    this.onConnectionChange(false);
                }
                
                // Auto-reconnect unless explicitly closed
                if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.scheduleReconnect();
                }
            };
            
            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                
                if (this.onError) {
                    this.onError(error);
                }
            };
            
        } catch (error) {
            console.error('Failed to connect to WebSocket:', error);
            this.scheduleReconnect();
        }
    }
    
    /**
     * Disconnect from the WebSocket server
     */
    disconnect() {
        if (this.websocket) {
            this.websocket.close(1000, 'Client disconnect');
            this.websocket = null;
        }
        this.stopHeartbeat();
        this.isConnected = false;
    }
    
    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        console.log(`Reconnection attempt ${this.reconnectAttempts} in ${this.reconnectDelay}ms`);
        
        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
        
        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }
    
    /**
     * Start heartbeat ping
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.isConnected) {
                this.send({
                    type: 'ping',
                    timestamp: Date.now()
                });
            }
        }, 30000); // 30 seconds
    }
    
    /**
     * Stop heartbeat ping
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    
    /**
     * Send message to server
     */
    send(data) {
        if (!this.isConnected || !this.websocket) {
            console.warn('Cannot send message: WebSocket not connected');
            return false;
        }
        
        try {
            this.websocket.send(JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to send WebSocket message:', error);
            return false;
        }
    }
    
    /**
     * Handle incoming messages
     */
    handleMessage(rawData) {
        try {
            const data = JSON.parse(rawData);
            const messageType = data.type;
            
            switch (messageType) {
                case 'initial_status':
                    console.log('Received initial status:', data.data);
                    if (this.onRealtimeUpdate) {
                        this.onRealtimeUpdate(data.data);
                    }
                    break;
                    
                case 'realtime_update':
                    if (this.onRealtimeUpdate) {
                        this.onRealtimeUpdate(data.data);
                    }
                    break;
                    
                case 'simulation_status':
                    console.log('Simulation status:', data.data);
                    if (this.onSimulationStatus) {
                        this.onSimulationStatus(data.data);
                    }
                    break;
                    
                case 'n1_results':
                    console.log('N-1 analysis results:', data.data);
                    if (this.onN1Results) {
                        this.onN1Results(data.data);
                    }
                    break;
                    
                case 'status_response':
                    if (this.onRealtimeUpdate) {
                        this.onRealtimeUpdate(data.data);
                    }
                    break;
                    
                case 'pong':
                    // Handle heartbeat response
                    break;
                    
                default:
                    console.warn('Unknown message type:', messageType);
            }
            
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }
    
    /**
     * Request current grid status
     */
    requestStatus() {
        return this.send({
            type: 'request_status',
            timestamp: Date.now()
        });
    }
    
    /**
     * Start European grid simulation
     */
    startSimulation() {
        return this.send({
            type: 'start_simulation',
            timestamp: Date.now()
        });
    }
    
    /**
     * Stop European grid simulation
     */
    stopSimulation() {
        return this.send({
            type: 'stop_simulation',
            timestamp: Date.now()
        });
    }
    
    /**
     * Request N-1 contingency analysis
     */
    requestN1Analysis() {
        return this.send({
            type: 'n1_analysis',
            timestamp: Date.now()
        });
    }
    
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            url: this.url
        };
    }
}

/**
 * WebSocket integration for PowerGridApp
 */
class WebSocketIntegration {
    constructor(powerGridApp) {
        this.app = powerGridApp;
        this.wsClient = new GridWebSocketClient();
        this.fallbackToHTTP = true;
        this.httpFallbackActive = false;
        
        this.setupWebSocketCallbacks();
    }
    
    /**
     * Setup WebSocket event callbacks
     */
    setupWebSocketCallbacks() {
        this.wsClient.onConnectionChange = (connected) => {
            this.updateConnectionStatus(connected);
            
            if (!connected && this.fallbackToHTTP) {
                this.activateHTTPFallback();
            } else if (connected && this.httpFallbackActive) {
                this.deactivateHTTPFallback();
            }
        };
        
        this.wsClient.onRealtimeUpdate = (data) => {
            this.app.updateRealTimeDataFromWebSocket(data);
        };
        
        this.wsClient.onSimulationStatus = (data) => {
            this.app.updateSimulationStatus(data);
        };
        
        this.wsClient.onN1Results = (data) => {
            this.app.showContingencyResults(data);
        };
        
        this.wsClient.onError = (error) => {
            console.error('WebSocket error in integration:', error);
            this.app.showMessage('WebSocket connection error', 'warning');
        };
    }
    
    /**
     * Initialize WebSocket connection
     */
    async initialize() {
        try {
            await this.wsClient.connect();
        } catch (error) {
            console.error('Failed to initialize WebSocket:', error);
            this.activateHTTPFallback();
        }
    }
    
    /**
     * Update connection status display
     */
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('websocket-status');
        if (statusElement) {
            statusElement.textContent = connected ? 'Connected' : 'Disconnected';
            statusElement.className = connected ? 'status-success' : 'status-error';
        }
        
        // Show connection notification
        const message = connected ? 'Real-time connection established' : 'Real-time connection lost';
        const type = connected ? 'success' : 'warning';
        this.app.showMessage(message, type);
    }
    
    /**
     * Activate HTTP polling fallback
     */
    activateHTTPFallback() {
        if (this.httpFallbackActive) return;
        
        console.log('Activating HTTP fallback mode');
        this.httpFallbackActive = true;
        
        // Use existing HTTP polling method
        this.httpInterval = setInterval(() => {
            if (this.app.europeanMode && this.app.simulationRunning) {
                this.app.updateRealTimeData();
            }
        }, 1000); // Slower updates via HTTP
        
        this.app.showMessage('Using HTTP fallback for real-time updates', 'info');
    }
    
    /**
     * Deactivate HTTP polling fallback
     */
    deactivateHTTPFallback() {
        if (!this.httpFallbackActive) return;
        
        console.log('Deactivating HTTP fallback mode');
        this.httpFallbackActive = false;
        
        if (this.httpInterval) {
            clearInterval(this.httpInterval);
            this.httpInterval = null;
        }
        
        this.app.showMessage('Real-time WebSocket updates restored', 'success');
    }
    
    /**
     * Start simulation via WebSocket
     */
    startSimulation() {
        if (this.wsClient.isConnected) {
            return this.wsClient.startSimulation();
        } else {
            // Fallback to HTTP
            return this.app.startEuropeanSimulationHTTP();
        }
    }
    
    /**
     * Stop simulation via WebSocket
     */
    stopSimulation() {
        if (this.wsClient.isConnected) {
            return this.wsClient.stopSimulation();
        } else {
            // Fallback to HTTP
            return this.app.stopEuropeanSimulationHTTP();
        }
    }
    
    /**
     * Request N-1 analysis via WebSocket
     */
    requestN1Analysis() {
        if (this.wsClient.isConnected) {
            return this.wsClient.requestN1Analysis();
        } else {
            // Fallback to HTTP
            return this.app.runContingencyAnalysisHTTP();
        }
    }
    
    /**
     * Cleanup WebSocket connection
     */
    cleanup() {
        this.wsClient.disconnect();
        this.deactivateHTTPFallback();
    }
}

// Export for use in main app
window.GridWebSocketClient = GridWebSocketClient;
window.WebSocketIntegration = WebSocketIntegration;
