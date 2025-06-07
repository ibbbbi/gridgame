#!/usr/bin/env python3
"""
WebSocket Handler for European Power Grid Builder v2.0
Provides real-time bidirectional communication for grid monitoring
"""

import asyncio
import json
import logging
from typing import Set, Dict, Any
from datetime import datetime
import websockets
from websockets.server import WebSocketServerProtocol
from european_grid_game import EuropeanGridGame

class GridWebSocketHandler:
    """WebSocket handler for real-time grid data streaming"""
    
    def __init__(self, european_game: EuropeanGridGame):
        self.european_game = european_game
        self.connected_clients: Set[WebSocketServerProtocol] = set()
        self.is_broadcasting = False
        self.logger = logging.getLogger(__name__)
        
    async def register_client(self, websocket: WebSocketServerProtocol):
        """Register a new WebSocket client"""
        self.connected_clients.add(websocket)
        self.logger.info(f"Client connected. Total clients: {len(self.connected_clients)}")
        
        # Send initial grid status
        await self.send_to_client(websocket, {
            'type': 'initial_status',
            'data': self.european_game.get_game_status(),
            'timestamp': datetime.now().isoformat()
        })
        
    async def unregister_client(self, websocket: WebSocketServerProtocol):
        """Unregister a WebSocket client"""
        self.connected_clients.discard(websocket)
        self.logger.info(f"Client disconnected. Total clients: {len(self.connected_clients)}")
        
    async def send_to_client(self, websocket: WebSocketServerProtocol, data: Dict[str, Any]):
        """Send data to a specific client"""
        try:
            await websocket.send(json.dumps(data))
        except websockets.exceptions.ConnectionClosed:
            await self.unregister_client(websocket)
        except Exception as e:
            self.logger.error(f"Error sending to client: {e}")
            
    async def broadcast_to_all(self, data: Dict[str, Any]):
        """Broadcast data to all connected clients"""
        if not self.connected_clients:
            return
            
        # Create list to avoid modifying set during iteration
        clients_to_remove = []
        
        for websocket in self.connected_clients.copy():
            try:
                await websocket.send(json.dumps(data))
            except websockets.exceptions.ConnectionClosed:
                clients_to_remove.append(websocket)
            except Exception as e:
                self.logger.error(f"Error broadcasting to client: {e}")
                clients_to_remove.append(websocket)
                
        # Remove disconnected clients
        for client in clients_to_remove:
            await self.unregister_client(client)
            
    async def start_real_time_broadcast(self):
        """Start broadcasting real-time grid data"""
        self.is_broadcasting = True
        self.logger.info("Started real-time broadcasting")
        
        while self.is_broadcasting:
            try:
                # Get current grid status
                status = self.european_game.get_game_status()
                
                # Add real-time data
                realtime_data = {
                    'type': 'realtime_update',
                    'data': {
                        'frequency': status['frequency'],
                        'frequency_deviation_mhz': (status['frequency'] - 50.0) * 1000,
                        'system_state': status.get('system_state', 'normal'),
                        'fcr_available': status.get('fcr_available', 0),
                        'frr_available': status.get('frr_available', 0),
                        'fcr_activation': status.get('fcr_activation', 0),
                        'frr_activation': status.get('frr_activation', 0),
                        'compliance_score': status.get('compliance_score', 100),
                        'active_events': status.get('active_events', []),
                        'voltage_violations': status.get('voltage_violations', 0),
                        'thermal_violations': status.get('thermal_violations', 0),
                        'generation_capacity': status.get('generation_capacity', 0),
                        'load_demand': status.get('load_demand', 0),
                        'budget': status.get('budget', 500000)
                    },
                    'timestamp': datetime.now().isoformat()
                }
                
                await self.broadcast_to_all(realtime_data)
                await asyncio.sleep(0.1)  # 100ms updates
                
            except Exception as e:
                self.logger.error(f"Error in real-time broadcast: {e}")
                await asyncio.sleep(1)  # Fallback delay
                
    async def stop_real_time_broadcast(self):
        """Stop broadcasting real-time grid data"""
        self.is_broadcasting = False
        self.logger.info("Stopped real-time broadcasting")
        
    async def handle_client_message(self, websocket: WebSocketServerProtocol, message: str):
        """Handle incoming messages from clients"""
        try:
            data = json.loads(message)
            message_type = data.get('type')
            
            if message_type == 'request_status':
                # Send current status
                status = self.european_game.get_game_status()
                await self.send_to_client(websocket, {
                    'type': 'status_response',
                    'data': status,
                    'timestamp': datetime.now().isoformat()
                })
                
            elif message_type == 'start_simulation':
                # Start European simulation
                success = self.european_game.start_simulation()
                await self.send_to_client(websocket, {
                    'type': 'simulation_status',
                    'data': {'running': success, 'message': 'Simulation started' if success else 'Failed to start'},
                    'timestamp': datetime.now().isoformat()
                })
                
                if success and not self.is_broadcasting:
                    asyncio.create_task(self.start_real_time_broadcast())
                    
            elif message_type == 'stop_simulation':
                # Stop European simulation
                self.european_game.stop_simulation()
                await self.stop_real_time_broadcast()
                await self.send_to_client(websocket, {
                    'type': 'simulation_status',
                    'data': {'running': False, 'message': 'Simulation stopped'},
                    'timestamp': datetime.now().isoformat()
                })
                
            elif message_type == 'n1_analysis':
                # Run N-1 contingency analysis
                results = self.european_game.run_n1_analysis()
                await self.send_to_client(websocket, {
                    'type': 'n1_results',
                    'data': results,
                    'timestamp': datetime.now().isoformat()
                })
                
            else:
                self.logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            self.logger.error("Invalid JSON received from client")
        except Exception as e:
            self.logger.error(f"Error handling client message: {e}")
            
    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle new WebSocket client connection"""
        await self.register_client(websocket)
        
        try:
            async for message in websocket:
                await self.handle_client_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister_client(websocket)


async def start_websocket_server(european_game: EuropeanGridGame, host='localhost', port=8765):
    """Start the WebSocket server"""
    handler = GridWebSocketHandler(european_game)
    
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    logger.info(f"Starting WebSocket server on {host}:{port}")
    
    async with websockets.serve(
        handler.handle_client, 
        host, 
        port,
        ping_interval=20,
        ping_timeout=10,
        close_timeout=10
    ):
        logger.info("WebSocket server started successfully")
        await asyncio.Future()  # Run forever


if __name__ == "__main__":
    # Example usage
    from european_grid_game import EuropeanGridGame
    
    game = EuropeanGridGame()
    asyncio.run(start_websocket_server(game))
