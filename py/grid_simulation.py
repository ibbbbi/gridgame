# grid_simulation.py

class GridComponent:
    def __init__(self, name, capacity, cost):
        self.name = name
        self.capacity = capacity
        self.cost = cost

class TransmissionLine:
    def __init__(self, line_type, capacity, cost_per_km):
        self.line_type = line_type
        self.capacity = capacity
        self.cost_per_km = cost_per_km

class GridSimulation:
    def __init__(self):
        self.components = []
        self.lines = []
        self.budget = 100000
        self.score = 0
        self.game_stats = {
            "components_added": 0,
            "lines_added": 0,
            "total_spent": 0,
            "efficiency_rating": 0.0
        }

    def add_component(self, component):
        if self.budget >= component.cost:
            self.components.append(component)
            self.budget -= component.cost
            self.game_stats["components_added"] += 1
            self.game_stats["total_spent"] += component.cost
            self._calculate_score()
            print(f"✅ Added {component.name}. Remaining budget: ${self.budget:,}")
        else:
            print(f"❌ Insufficient budget to add {component.name}. Need ${component.cost:,}, have ${self.budget:,}")

    def add_line(self, line, distance):
        cost = line.cost_per_km * distance
        if self.budget >= cost:
            self.lines.append({'line': line, 'distance': distance, 'cost': cost})
            self.budget -= cost
            self.game_stats["lines_added"] += 1
            self.game_stats["total_spent"] += cost
            self._calculate_score()
            print(f"✅ Added {line.line_type} line ({distance} km). Cost: ${cost:,}, Remaining budget: ${self.budget:,}")
        else:
            print(f"❌ Insufficient budget to add {line.line_type} line. Need ${cost:,}, have ${self.budget:,}")

    def _calculate_score(self):
        """Calculate game score based on grid efficiency and cost-effectiveness"""
        if not self.components:
            self.score = 0
            return
        
        total_capacity = sum(c.capacity for c in self.components)
        total_spent = self.game_stats["total_spent"]
        
        # Base score from capacity
        capacity_score = total_capacity * 10
        
        # Efficiency bonus (capacity per dollar spent)
        if total_spent > 0:
            efficiency = total_capacity / (total_spent / 1000)  # Per $1000 spent
            efficiency_bonus = efficiency * 50
        else:
            efficiency_bonus = 0
        
        # Diversity bonus (different types of components)
        component_types = set(c.name for c in self.components)
        diversity_bonus = len(component_types) * 100
        
        # Budget conservation bonus
        budget_bonus = (self.budget / 100000) * 500  # Bonus for remaining budget
        
        self.score = int(capacity_score + efficiency_bonus + diversity_bonus + budget_bonus)
        self.game_stats["efficiency_rating"] = efficiency if total_spent > 0 else 0.0

    def simulate(self):
        """Run the grid simulation and display results"""
        print("\n" + "="*60)
        print("⚡ POWER GRID SIMULATION RESULTS")
        print("="*60)
        
        if not self.components:
            print("❌ No components in the grid! Add some components first.")
            return
        
        # Calculate totals
        total_generation = sum(c.capacity for c in self.components if 'plant' in c.name.lower() or 'generator' in c.name.lower())
        total_transmission = sum(c.capacity for c in self.components if 'substation' in c.name.lower())
        total_load = sum(c.capacity for c in self.components if any(x in c.name.lower() for x in ['load', 'residential', 'commercial', 'industrial']))
        total_capacity = sum(c.capacity for c in self.components)
        
        # Calculate line capacity
        total_line_capacity = sum(line_data['line'].capacity for line_data in self.lines)
        total_line_distance = sum(line_data['distance'] for line_data in self.lines)
        
        # Display component breakdown
        print(f"🏭 Total Generation Capacity: {total_generation} MW")
        print(f"🔌 Total Transmission Capacity: {total_transmission} MW")
        print(f"🏘️  Total Load Centers: {total_load} MW")
        print(f"📊 Total Grid Capacity: {total_capacity} MW")
        print(f"⚡ Total Line Capacity: {total_line_capacity} MW")
        print(f"📏 Total Line Distance: {total_line_distance:.1f} km")
        
        # Calculate grid health
        if total_load > 0:
            supply_demand_ratio = total_generation / total_load
            if supply_demand_ratio >= 1.2:
                grid_status = "🟢 EXCELLENT (Adequate Reserve)"
            elif supply_demand_ratio >= 1.0:
                grid_status = "🟡 GOOD (Minimal Reserve)"
            elif supply_demand_ratio >= 0.8:
                grid_status = "🟠 WARNING (Potential Shortage)"
            else:
                grid_status = "🔴 CRITICAL (Supply Shortage)"
        else:
            grid_status = "⚪ NO LOAD CENTERS"
        
        print(f"\n🎯 Grid Status: {grid_status}")
        
        # Financial summary
        print(f"\n💰 Financial Summary:")
        print(f"   Initial Budget: $100,000")
        print(f"   Total Spent: ${self.game_stats['total_spent']:,}")
        print(f"   Remaining Budget: ${self.budget:,}")
        print(f"   Budget Utilization: {((100000 - self.budget) / 100000 * 100):.1f}%")
        
        # Game statistics
        print(f"\n📈 Game Statistics:")
        print(f"   Components Added: {self.game_stats['components_added']}")
        print(f"   Lines Added: {self.game_stats['lines_added']}")
        print(f"   Efficiency Rating: {self.game_stats['efficiency_rating']:.2f} MW/$1000")
        print(f"   Final Score: {self.score:,} points")
        
        # Performance evaluation
        if self.score >= 5000:
            performance = "🏆 OUTSTANDING POWER ENGINEER!"
        elif self.score >= 3000:
            performance = "🥈 EXCELLENT GRID BUILDER!"
        elif self.score >= 1500:
            performance = "🥉 GOOD SYSTEM OPERATOR!"
        elif self.score >= 500:
            performance = "📚 APPRENTICE ENGINEER"
        else:
            performance = "🔧 TRAINEE OPERATOR"
        
        print(f"\n🎖️  Performance: {performance}")
        print("="*60)

    def save_game_state(self, filename="grid_save.json"):
        """Save current game state to file"""
        import json
        game_state = {
            "budget": self.budget,
            "score": self.score,
            "components": [{"name": c.name, "capacity": c.capacity, "cost": c.cost} for c in self.components],
            "lines": [{"type": l['line'].line_type, "capacity": l['line'].capacity, 
                      "distance": l['distance'], "cost": l['cost']} for l in self.lines],
            "stats": self.game_stats
        }
        
        try:
            with open(filename, 'w') as f:
                json.dump(game_state, f, indent=2)
            print(f"💾 Game saved to {filename}")
        except Exception as e:
            print(f"❌ Error saving game: {e}")

    # ...existing code...
