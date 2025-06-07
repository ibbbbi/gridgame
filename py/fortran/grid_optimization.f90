! grid_optimization.f90
! European grid optimization algorithms for component placement and sizing
! Economic dispatch and optimal power flow for European grids

module grid_optimization
    implicit none
    integer, parameter :: dp = kind(1.0d0)
    
contains

    ! Economic dispatch with European merit order
    subroutine economic_dispatch(n_generators, capacities, marginal_costs, &
                                demand, generation_schedule, total_cost)
        implicit none
        integer, intent(in) :: n_generators
        real(dp), intent(in) :: capacities(n_generators)      ! MW
        real(dp), intent(in) :: marginal_costs(n_generators)  ! €/MWh
        real(dp), intent(in) :: demand                        ! MW
        real(dp), intent(out) :: generation_schedule(n_generators) ! MW
        real(dp), intent(out) :: total_cost                   ! €/h
        
        integer :: i, j, min_index
        real(dp) :: remaining_demand, temp_cost, temp_capacity
        integer :: sorted_indices(n_generators)
        real(dp) :: sorted_costs(n_generators)
        real(dp) :: sorted_capacities(n_generators)
        
        ! Initialize
        generation_schedule = 0.0_dp
        total_cost = 0.0_dp
        remaining_demand = demand
        
        ! Sort generators by marginal cost (merit order)
        do i = 1, n_generators
            sorted_indices(i) = i
            sorted_costs(i) = marginal_costs(i)
            sorted_capacities(i) = capacities(i)
        end do
        
        ! Simple bubble sort for merit order
        do i = 1, n_generators - 1
            do j = i + 1, n_generators
                if (sorted_costs(i) > sorted_costs(j)) then
                    ! Swap costs
                    temp_cost = sorted_costs(i)
                    sorted_costs(i) = sorted_costs(j)
                    sorted_costs(j) = temp_cost
                    
                    ! Swap capacities
                    temp_capacity = sorted_capacities(i)
                    sorted_capacities(i) = sorted_capacities(j)
                    sorted_capacities(j) = temp_capacity
                    
                    ! Swap indices
                    min_index = sorted_indices(i)
                    sorted_indices(i) = sorted_indices(j)
                    sorted_indices(j) = min_index
                end if
            end do
        end do
        
        ! Dispatch generators in merit order
        do i = 1, n_generators
            if (remaining_demand <= 0.0_dp) exit
            
            min_index = sorted_indices(i)
            if (remaining_demand >= sorted_capacities(i)) then
                ! Use full capacity
                generation_schedule(min_index) = sorted_capacities(i)
                total_cost = total_cost + sorted_capacities(i) * sorted_costs(i)
                remaining_demand = remaining_demand - sorted_capacities(i)
            else
                ! Partial dispatch
                generation_schedule(min_index) = remaining_demand
                total_cost = total_cost + remaining_demand * sorted_costs(i)
                remaining_demand = 0.0_dp
            end if
        end do
        
    end subroutine economic_dispatch

    ! Optimal transmission line sizing
    subroutine optimal_line_sizing(n_lines, line_lengths, power_flows, &
                                  base_costs, capacity_costs, optimal_capacities, &
                                  total_investment)
        implicit none
        integer, intent(in) :: n_lines
        real(dp), intent(in) :: line_lengths(n_lines)      ! km
        real(dp), intent(in) :: power_flows(n_lines)       ! MW
        real(dp), intent(in) :: base_costs(n_lines)        ! €/km base cost
        real(dp), intent(in) :: capacity_costs(n_lines)    ! €/km/MW capacity cost
        real(dp), intent(out) :: optimal_capacities(n_lines) ! MW
        real(dp), intent(out) :: total_investment          ! €
        
        integer :: i
        real(dp), parameter :: SAFETY_MARGIN = 1.2_dp  ! 20% margin
        real(dp), parameter :: MIN_CAPACITY = 100.0_dp  ! MW minimum
        
        total_investment = 0.0_dp
        
        do i = 1, n_lines
            ! Size line for peak flow plus safety margin
            optimal_capacities(i) = max(abs(power_flows(i)) * SAFETY_MARGIN, MIN_CAPACITY)
            
            ! Calculate investment cost
            total_investment = total_investment + line_lengths(i) * &
                              (base_costs(i) + capacity_costs(i) * optimal_capacities(i))
        end do
        
    end subroutine optimal_line_sizing

    ! Reserve optimization for SO GL compliance
    subroutine optimize_reserves(n_generators, generator_capacities, fcr_capabilities, &
                               frr_capabilities, required_fcr, required_frr, &
                               fcr_allocation, frr_allocation, reserve_cost)
        implicit none
        integer, intent(in) :: n_generators
        real(dp), intent(in) :: generator_capacities(n_generators)  ! MW
        real(dp), intent(in) :: fcr_capabilities(n_generators)      ! MW FCR capability
        real(dp), intent(in) :: frr_capabilities(n_generators)      ! MW FRR capability
        real(dp), intent(in) :: required_fcr                       ! MW required FCR
        real(dp), intent(in) :: required_frr                       ! MW required FRR
        real(dp), intent(out) :: fcr_allocation(n_generators)       ! MW FCR allocated
        real(dp), intent(out) :: frr_allocation(n_generators)       ! MW FRR allocated
        real(dp), intent(out) :: reserve_cost                      ! €/h
        
        integer :: i
        real(dp) :: total_fcr_available, total_frr_available
        real(dp) :: fcr_factor, frr_factor
        real(dp), parameter :: FCR_COST = 10.0_dp    ! €/MW/h
        real(dp), parameter :: FRR_COST = 5.0_dp     ! €/MW/h
        
        ! Calculate total available reserves
        total_fcr_available = sum(fcr_capabilities)
        total_frr_available = sum(frr_capabilities)
        
        ! Calculate allocation factors
        if (total_fcr_available > 0.0_dp) then
            fcr_factor = min(required_fcr / total_fcr_available, 1.0_dp)
        else
            fcr_factor = 0.0_dp
        end if
        
        if (total_frr_available > 0.0_dp) then
            frr_factor = min(required_frr / total_frr_available, 1.0_dp)
        else
            frr_factor = 0.0_dp
        end if
        
        ! Allocate reserves proportionally
        reserve_cost = 0.0_dp
        do i = 1, n_generators
            fcr_allocation(i) = fcr_capabilities(i) * fcr_factor
            frr_allocation(i) = frr_capabilities(i) * frr_factor
            
            reserve_cost = reserve_cost + fcr_allocation(i) * FCR_COST + &
                          frr_allocation(i) * FRR_COST
        end do
        
    end subroutine optimize_reserves

    ! Grid reliability optimization
    subroutine reliability_optimization(n_components, component_reliabilities, &
                                      redundancy_levels, target_reliability, &
                                      optimal_redundancy, system_reliability)
        implicit none
        integer, intent(in) :: n_components
        real(dp), intent(in) :: component_reliabilities(n_components)  ! 0-1
        integer, intent(in) :: redundancy_levels(n_components)         ! Number of units
        real(dp), intent(in) :: target_reliability                     ! 0-1
        integer, intent(out) :: optimal_redundancy(n_components)
        real(dp), intent(out) :: system_reliability                    ! 0-1
        
        integer :: i, j
        real(dp) :: component_rel, failure_prob
        
        optimal_redundancy = redundancy_levels
        system_reliability = 1.0_dp
        
        ! Calculate system reliability assuming series configuration
        do i = 1, n_components
            component_rel = component_reliabilities(i)
            
            ! For redundant components, calculate reliability with spare units
            if (redundancy_levels(i) > 1) then
                failure_prob = 1.0_dp - component_rel
                component_rel = 1.0_dp - failure_prob ** redundancy_levels(i)
            end if
            
            system_reliability = system_reliability * component_rel
        end do
        
        ! Simple optimization: add redundancy to least reliable components
        do while (system_reliability < target_reliability)
            ! Find component with lowest reliability
            component_rel = 1.0_dp
            j = 1
            do i = 1, n_components
                if (component_reliabilities(i) < component_rel) then
                    component_rel = component_reliabilities(i)
                    j = i
                end if
            end do
            
            ! Add redundancy to that component
            optimal_redundancy(j) = optimal_redundancy(j) + 1
            
            ! Recalculate system reliability
            system_reliability = 1.0_dp
            do i = 1, n_components
                component_rel = component_reliabilities(i)
                if (optimal_redundancy(i) > 1) then
                    failure_prob = 1.0_dp - component_rel
                    component_rel = 1.0_dp - failure_prob ** optimal_redundancy(i)
                end if
                system_reliability = system_reliability * component_rel
            end do
            
            ! Safety exit to prevent infinite loop
            if (maxval(optimal_redundancy) > 10) exit
        end do
        
    end subroutine reliability_optimization

    ! Carbon emission optimization for European green targets
    subroutine carbon_optimization(n_generators, generation_schedule, emission_factors, &
                                 total_emissions, carbon_cost, green_ratio)
        implicit none
        integer, intent(in) :: n_generators
        real(dp), intent(in) :: generation_schedule(n_generators)  ! MW
        real(dp), intent(in) :: emission_factors(n_generators)     ! kg CO2/MWh
        real(dp), intent(out) :: total_emissions                   ! kg CO2/h
        real(dp), intent(out) :: carbon_cost                       ! €/h
        real(dp), intent(out) :: green_ratio                       ! 0-1 renewable ratio
        
        integer :: i
        real(dp) :: total_generation, renewable_generation
        real(dp), parameter :: CARBON_PRICE = 85.0_dp  ! €/tonne CO2 (EU ETS price)
        
        total_emissions = 0.0_dp
        total_generation = 0.0_dp
        renewable_generation = 0.0_dp
        
        do i = 1, n_generators
            total_emissions = total_emissions + &
                             generation_schedule(i) * emission_factors(i)
            total_generation = total_generation + generation_schedule(i)
            
            ! Count renewable generation (zero emissions)
            if (emission_factors(i) < 1.0_dp) then
                renewable_generation = renewable_generation + generation_schedule(i)
            end if
        end do
        
        ! Calculate carbon cost
        carbon_cost = total_emissions * CARBON_PRICE / 1000.0_dp  ! Convert kg to tonnes
        
        ! Calculate green ratio
        if (total_generation > 0.0_dp) then
            green_ratio = renewable_generation / total_generation
        else
            green_ratio = 0.0_dp
        end if
        
    end subroutine carbon_optimization

end module grid_optimization
