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

    def add_component(self, component):
        if self.budget >= component.cost:
            self.components.append(component)
            self.budget -= component.cost
            print(f"Added {component.name}. Remaining budget: ${self.budget}")
        else:
            print("Insufficient budget to add this component.")

    def add_line(self, line, distance):
        cost = line.cost_per_km * distance
        if self.budget >= cost:
            self.lines.append(line)
            self.budget -= cost
            print(f"Added {line.line_type} line ({distance} km). Remaining budget: ${self.budget}")
        else:
            print("Insufficient budget to add this line.")

    def simulate(self):
        total_capacity = sum(c.capacity for c in self.components)
        print(f"Total grid capacity: {total_capacity} MW")

if __name__ == "__main__":
    sim = GridSimulation()

    # Example usage
    generator = GridComponent("Generator", 150, 10000)
    substation = GridComponent("Substation", 200, 5000)
    load = GridComponent("Load Center", 100, 0)

    sim.add_component(generator)
    sim.add_component(substation)
    sim.add_component(load)

    transmission_line = TransmissionLine("Transmission", 300, 2000)
    sim.add_line(transmission_line, 10)

    sim.simulate()
