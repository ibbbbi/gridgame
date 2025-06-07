# European Power Grid Builder v2.0 - API Reference

This document provides comprehensive API documentation for the enhanced European Power Grid Builder v2.0 web application.

## 🔗 Base URL

```
http://localhost:5000/api
```

## 📊 Classic Mode APIs

### Game Status
**GET** `/game/status`

Returns current game status and metrics.

**Response:**
```json
{
  "budget": 500000,
  "frequency": 50.000,
  "frequency_deviation_mhz": 0.0,
  "system_state": "normal",
  "load_demand": 2000.0,
  "generation_capacity": 2200.0,
  "fcr_available": 150.0,
  "frr_available": 400.0,
  "reliability_score": 98.5,
  "compliance_score": 100.0,
  "efficiency_score": 85.2,
  "components_count": 8,
  "lines_count": 12,
  "time_elapsed": 3600.0
}
```

### Grid Components
**GET** `/game/components`

Returns all grid components with their properties.

**Response:**
```json
[
  {
    "id": "comp_001",
    "type": "nuclear_plant",
    "position": {"x": 100, "y": 200},
    "capacity": 1400,
    "cost": 80000,
    "voltage": 400,
    "isActive": true
  }
]
```

### Power Lines
**GET** `/game/lines`

Returns all transmission lines and their status.

**Response:**
```json
[
  {
    "id": "line_001",
    "type": "transmission_400",
    "from": "comp_001",
    "to": "comp_002",
    "length": 50.0,
    "capacity": 3000,
    "cost": 400000,
    "isActive": true
  }
]
```

### Place Component
**POST** `/game/place-component`

Places a new component on the grid.

**Request:**
```json
{
  "type": "nuclear_plant",
  "x": 150,
  "y": 250
}
```

**Response:**
```json
{
  "success": true,
  "message": "Nuclear Plant placed successfully",
  "component_id": "comp_003",
  "remaining_budget": 420000
}
```

### Place Line
**POST** `/game/place-line`

Creates a new transmission line between components.

**Request:**
```json
{
  "type": "transmission_400",
  "from": "comp_001",
  "to": "comp_002"
}
```

**Response:**
```json
{
  "success": true,
  "message": "400kV Transmission Line placed successfully",
  "line_id": "line_003",
  "length": 75.5,
  "cost": 604000,
  "remaining_budget": 316000
}
```

### Run Simulation
**POST** `/game/simulate`

Executes grid simulation and power flow analysis.

**Response:**
```json
{
  "success": true,
  "loadServed": 1950.0,
  "efficiency": 87.3,
  "reliability": 96.8,
  "powerFlow": {
    "converged": true,
    "iterations": 4,
    "max_mismatch": 0.000001
  },
  "voltages": {
    "comp_001": 1.05,
    "comp_002": 1.02
  },
  "frequency": 50.001,
  "systemStability": "stable",
  "totalLosses": 45.2,
  "n1Analysis": [
    {
      "contingencyLine": "line_001",
      "success": true,
      "overloadedLines": [],
      "voltageViolations": 0,
      "loadShed": 0.0
    }
  ]
}
```

## 🌍 Enhanced European Mode APIs

### Real-time Data
**GET** `/european/realtime`

Returns high-frequency real-time grid data (updated every 100ms).

**Response:**
```json
{
  "frequency": 50.045,
  "frequency_deviation_mhz": 45.0,
  "system_state": "normal",
  "fcr_available": 2850.0,
  "frr_available": 1200.0,
  "fcr_activation": 0.0,
  "frr_activation": 0.0,
  "compliance_score": 98.5,
  "active_events": [
    {
      "id": "event_001",
      "type": "load_increase",
      "magnitude": 200.0,
      "duration": 1800.0,
      "description": "Morning demand ramp",
      "timestamp": "2025-06-07T08:30:00Z"
    }
  ],
  "voltage_violations": 0,
  "thermal_violations": 0,
  "timestamp": 1686124200.0
}
```

### European Components
**GET** `/european/components`

Returns European component specifications with SO GL compliance data.

**Response:**
```json
{
  "nuclear_plant": {
    "cost": 80000,
    "capacity": 1400,
    "fcr": 50,
    "frr": 200,
    "voltage_level": 400,
    "description": "Large nuclear power plant",
    "ramp_rate": 20.0,
    "min_load": 70.0,
    "efficiency": 35.0,
    "co2_emissions": 0.0
  },
  "coal_plant": {
    "cost": 40000,
    "capacity": 800,
    "fcr": 40,
    "frr": 150,
    "voltage_level": 400,
    "description": "Coal-fired power plant",
    "ramp_rate": 50.0,
    "min_load": 40.0,
    "efficiency": 38.0,
    "co2_emissions": 820.0
  }
}
```

### Start European Simulation
**POST** `/european/start-simulation`

Starts real-time European grid simulation with SO GL compliance monitoring.

**Response:**
```json
{
  "success": true,
  "message": "European simulation started",
  "realtime": true,
  "simulation_id": "sim_001",
  "update_frequency": 100,
  "standards": "ENTSO-E SO GL"
}
```

### Stop European Simulation
**POST** `/european/stop-simulation`

Stops the running European grid simulation.

**Response:**
```json
{
  "success": true,
  "message": "European simulation stopped",
  "duration": 3600.0,
  "final_compliance_score": 96.8
}
```

### N-1 Contingency Analysis
**POST** `/european/n1-analysis`

Performs comprehensive N-1 security analysis with parallel processing.

**Response:**
```json
[
  {
    "contingency_id": "line_400kv_001",
    "component_type": "transmission_line",
    "component_id": "line_001",
    "converged": true,
    "max_voltage_violation": 0.0,
    "max_thermal_violation": 85.4,
    "load_shed": 0.0,
    "critical": false
  },
  {
    "contingency_id": "gen_nuclear_001",
    "component_type": "generator",
    "component_id": "comp_001",
    "converged": true,
    "max_voltage_violation": 0.02,
    "max_thermal_violation": 102.1,
    "load_shed": 0.0,
    "critical": true
  }
]
```

### Place European Component
**POST** `/european/place-component`

Places European-standard grid components with SO GL specifications.

**Request:**
```json
{
  "type": "nuclear_plant",
  "x": 200,
  "y": 300,
  "voltage_level": 400,
  "fcr_reserve": 50,
  "frr_reserve": 200
}
```

**Response:**
```json
{
  "success": true,
  "message": "Nuclear Plant placed successfully",
  "component_id": "euro_comp_001",
  "cost": 80000,
  "remaining_budget": 420000,
  "compliance_impact": {
    "fcr_increase": 50.0,
    "frr_increase": 200.0,
    "generation_increase": 1400.0
  }
}
```

### Place European Line
**POST** `/european/place-line`

Creates European-standard transmission lines with proper voltage levels.

**Request:**
```json
{
  "type": "transmission_400",
  "from": "euro_comp_001",
  "to": "euro_comp_002",
  "voltage_level": 400,
  "thermal_limit": 3000
}
```

**Response:**
```json
{
  "success": true,
  "message": "400kV Transmission Line placed successfully",
  "line_id": "euro_line_001",
  "length": 85.2,
  "cost": 681600,
  "remaining_budget": 318400,
  "thermal_capacity": 3000.0,
  "voltage_drop": 0.02
}
```

### Compliance Report
**GET** `/european/compliance-report`

Generates comprehensive SO GL compliance report.

**Response:**
```json
{
  "frequency_control": {
    "fcr_activation_time": "< 30s",
    "frr_activation_time": "< 15min",
    "frequency_violations": 2,
    "worst_frequency_deviation": 85.5
  },
  "voltage_quality": {
    "voltage_violations": 0,
    "worst_voltage": 0.92
  },
  "system_security": {
    "n1_secure": true,
    "thermal_violations": 0,
    "last_n1_analysis": "2025-06-07T10:15:00Z"
  },
  "overall": {
    "compliance_score": 96.8,
    "reliability_score": 98.2,
    "efficiency_score": 87.5
  },
  "timestamp": 1686124200.0
}
```

### System Events
**GET** `/european/system-events`

Returns grid events and disturbances with detailed information.

**Response:**
```json
{
  "active_events": [
    {
      "id": "event_002",
      "name": "Wind Power Drop",
      "type": "generator_trip",
      "magnitude": 300.0,
      "duration": 900.0,
      "probability": 0.1,
      "description": "Wind power output reduction due to weather",
      "start_time": "2025-06-07T09:45:00Z",
      "impact": {
        "frequency_deviation": -15.2,
        "fcr_activation": 45.0,
        "system_state": "normal"
      }
    }
  ],
  "recent_events": [
    {
      "id": "event_001",
      "name": "Morning Load Ramp",
      "type": "load_increase",
      "magnitude": 500.0,
      "completed_at": "2025-06-07T09:30:00Z",
      "duration": 1800.0,
      "impact": {
        "generation_increase": 520.0,
        "frequency_deviation": 8.5,
        "compliance_impact": 0.0
      }
    }
  ],
  "total_events": 25,
  "events_today": 5,
  "critical_events": 0
}
```

## 🔧 Advanced Configuration APIs

### Update Settings
**POST** `/config/update`

Updates game configuration and European standards parameters.

**Request:**
```json
{
  "european_standards": {
    "frequency_nominal": 50.0,
    "frequency_deadband": 0.05,
    "fcr_full_activation": 0.2,
    "frr_activation_time": 900
  },
  "simulation": {
    "real_time": true,
    "update_frequency": 100,
    "compliance_monitoring": true,
    "fortran_acceleration": true
  }
}
```

### Export Data
**GET** `/export/simulation-data`

Exports comprehensive simulation data for analysis.

**Query Parameters:**
- `format`: json, csv, excel
- `include`: components, lines, events, compliance, performance
- `timeframe`: last_hour, last_day, all

**Response:**
```json
{
  "export_id": "export_001",
  "download_url": "/download/export_001.json",
  "size": "2.5 MB",
  "records": 15420,
  "generated_at": "2025-06-07T10:30:00Z"
}
```

## 📈 Performance Monitoring APIs

### System Performance
**GET** `/monitor/performance`

Returns system performance metrics and resource usage.

**Response:**
```json
{
  "cpu_usage": 15.2,
  "memory_usage": 34.5,
  "simulation_fps": 58.3,
  "api_response_time": 12.5,
  "active_connections": 3,
  "uptime": 86400.0,
  "last_update": "2025-06-07T10:30:15Z"
}
```

### Grid Statistics
**GET** `/stats/grid`

Returns comprehensive grid statistics and analysis.

**Response:**
```json
{
  "components": {
    "total": 15,
    "by_type": {
      "nuclear_plant": 2,
      "coal_plant": 3,
      "gas_plant": 4,
      "transmission_400": 8,
      "substation_400": 6
    }
  },
  "capacity": {
    "total_generation": 4200.0,
    "total_load": 3850.0,
    "reserve_margin": 9.1,
    "fcr_total": 285.0,
    "frr_total": 680.0
  },
  "economics": {
    "total_investment": 1250000.0,
    "remaining_budget": 250000.0,
    "cost_per_mw": 297.6,
    "roi_estimate": 8.5
  }
}
```

## 🚨 Error Responses

All APIs return consistent error responses:

```json
{
  "success": false,
  "error": "INVALID_COMPONENT_TYPE",
  "message": "Component type 'invalid_plant' not recognized",
  "code": 400,
  "timestamp": "2025-06-07T10:30:00Z"
}
```

### Common Error Codes
- `400` - Bad Request (invalid parameters)
- `404` - Component/Line not found
- `409` - Conflict (component already exists)
- `422` - Unprocessable Entity (business logic violation)
- `500` - Internal Server Error
- `503` - Service Unavailable (simulation not running)

## 🔐 Rate Limiting

APIs have rate limiting to ensure performance:

- **Real-time endpoints**: 10 requests/second
- **Standard endpoints**: 60 requests/minute
- **Analysis endpoints**: 10 requests/minute
- **Export endpoints**: 5 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1686124260
```

## 📱 WebSocket Support (Future)

Real-time updates will be enhanced with WebSocket support:

```javascript
// Future WebSocket implementation
const ws = new WebSocket('ws://localhost:5000/ws/realtime');

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  // Handle real-time updates
};
```

---

**European Power Grid Builder v2.0 API Reference** - Complete documentation for professional power system simulation APIs.

For implementation examples and tutorials, see the main [README.md](README.md) and [Setup Guide](SETUP_GUIDE.md).
