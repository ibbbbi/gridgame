! uq_control.f90
! High-performance Fortran module for U/Q control (Voltage/Reactive Power Control)
! Implements European grid voltage control standards and optimization

module uq_control
    implicit none
    integer, parameter :: dp = kind(1.0d0)  ! Double precision
    real(dp), parameter :: PI = 3.141592653589793_dp
    real(dp), parameter :: BASE_VOLTAGE = 400.0_dp  ! 400 kV European base
    real(dp), parameter :: MIN_VOLTAGE_PU = 0.90_dp  ! SO GL minimum
    real(dp), parameter :: MAX_VOLTAGE_PU = 1.05_dp  ! SO GL maximum
    
contains

    ! Voltage/Reactive Power control optimizer
    subroutine uq_control_optimizer(n_buses, n_generators, y_matrix, &
                                   voltage_setpoints, reactive_limits_min, &
                                   reactive_limits_max, current_voltages, &
                                   current_reactive, optimal_reactive, &
                                   voltage_violations, converged)
        implicit none
        
        ! Input parameters
        integer, intent(in) :: n_buses, n_generators
        complex(dp), intent(in) :: y_matrix(n_buses, n_buses)
        real(dp), intent(in) :: voltage_setpoints(n_generators)
        real(dp), intent(in) :: reactive_limits_min(n_generators)
        real(dp), intent(in) :: reactive_limits_max(n_generators)
        real(dp), intent(in) :: current_voltages(n_buses)
        real(dp), intent(in) :: current_reactive(n_generators)
        
        ! Output parameters
        real(dp), intent(out) :: optimal_reactive(n_generators)
        integer, intent(out) :: voltage_violations
        logical, intent(out) :: converged
        
        ! Local variables
        integer :: i, j, iter, max_iter
        real(dp) :: voltage_error(n_generators)
        real(dp) :: sensitivity_matrix(n_generators, n_generators)
        real(dp) :: delta_q(n_generators)
        real(dp) :: max_error, tolerance
        real(dp) :: droop_gain, integral_gain
        
        max_iter = 50
        tolerance = 1e-4_dp
        droop_gain = 0.05_dp  ! 5% droop characteristic
        integral_gain = 0.1_dp
        voltage_violations = 0
        converged = .false.
        
        ! Initialize optimal reactive power with current values
        optimal_reactive = current_reactive
        
        ! U/Q control iterations
        do iter = 1, max_iter
            ! Calculate voltage error for each generator bus
            max_error = 0.0_dp
            do i = 1, n_generators
                voltage_error(i) = voltage_setpoints(i) - current_voltages(i)
                max_error = max(max_error, abs(voltage_error(i)))
            end do
            
            ! Check convergence
            if (max_error < tolerance) then
                converged = .true.
                exit
            end if
            
            ! Calculate sensitivity matrix (dV/dQ)
            call calculate_voltage_sensitivity(n_buses, n_generators, y_matrix, &
                                             current_voltages, sensitivity_matrix)
            
            ! Calculate required reactive power adjustment using Newton-Raphson
            call solve_linear_system(n_generators, sensitivity_matrix, &
                                   voltage_error, delta_q)
            
            ! Apply droop control and integral control
            do i = 1, n_generators
                ! Droop control: Q = Q0 - (V - Vset) / droop_gain
                optimal_reactive(i) = optimal_reactive(i) - voltage_error(i) / droop_gain
                
                ! Add integral control for steady-state accuracy
                optimal_reactive(i) = optimal_reactive(i) + integral_gain * delta_q(i)
                
                ! Apply reactive power limits
                if (optimal_reactive(i) < reactive_limits_min(i)) then
                    optimal_reactive(i) = reactive_limits_min(i)
                elseif (optimal_reactive(i) > reactive_limits_max(i)) then
                    optimal_reactive(i) = reactive_limits_max(i)
                end if
            end do
        end do
        
        ! Count voltage violations according to European standards
        do i = 1, n_buses
            if (current_voltages(i) < MIN_VOLTAGE_PU .or. &
                current_voltages(i) > MAX_VOLTAGE_PU) then
                voltage_violations = voltage_violations + 1
            end if
        end do
        
    end subroutine uq_control_optimizer

    ! Calculate voltage sensitivity matrix (dV/dQ)
    subroutine calculate_voltage_sensitivity(n_buses, n_generators, y_matrix, &
                                           voltages, sensitivity_matrix)
        implicit none
        
        integer, intent(in) :: n_buses, n_generators
        complex(dp), intent(in) :: y_matrix(n_buses, n_buses)
        real(dp), intent(in) :: voltages(n_buses)
        real(dp), intent(out) :: sensitivity_matrix(n_generators, n_generators)
        
        ! Local variables
        integer :: i, j
        real(dp) :: delta_q, delta_v
        complex(dp) :: y_element
        real(dp) :: g_ij, b_ij, v_i, v_j
        
        delta_q = 0.01_dp  ! 1% perturbation for numerical differentiation
        
        ! Calculate sensitivity using finite differences
        do i = 1, n_generators
            do j = 1, n_generators
                if (i == j) then
                    ! Self-sensitivity: dV_i/dQ_i
                    y_element = y_matrix(i, i)
                    g_ij = real(y_element)
                    b_ij = aimag(y_element)
                    v_i = voltages(i)
                    
                    ! Simplified sensitivity calculation
                    sensitivity_matrix(i, j) = -b_ij / (v_i * (g_ij**2 + b_ij**2))
                else
                    ! Cross-sensitivity: dV_i/dQ_j
                    y_element = y_matrix(i, j)
                    g_ij = real(y_element)
                    b_ij = aimag(y_element)
                    v_i = voltages(i)
                    v_j = voltages(j)
                    
                    if (abs(y_element) > 1e-8_dp) then
                        sensitivity_matrix(i, j) = -b_ij * v_j / (v_i * (g_ij**2 + b_ij**2))
                    else
                        sensitivity_matrix(i, j) = 0.0_dp
                    end if
                end if
            end do
        end do
        
    end subroutine calculate_voltage_sensitivity

    ! Solve linear system Ax = b using Gaussian elimination
    subroutine solve_linear_system(n, matrix, rhs, solution)
        implicit none
        
        integer, intent(in) :: n
        real(dp), intent(in) :: matrix(n, n)
        real(dp), intent(in) :: rhs(n)
        real(dp), intent(out) :: solution(n)
        
        ! Local variables
        real(dp) :: a(n, n), b(n)
        integer :: i, j, k, pivot_row
        real(dp) :: pivot, factor, max_val
        
        ! Copy input arrays
        a = matrix
        b = rhs
        
        ! Forward elimination with partial pivoting
        do k = 1, n-1
            ! Find pivot
            pivot_row = k
            max_val = abs(a(k, k))
            do i = k+1, n
                if (abs(a(i, k)) > max_val) then
                    max_val = abs(a(i, k))
                    pivot_row = i
                end if
            end do
            
            ! Swap rows if needed
            if (pivot_row /= k) then
                do j = 1, n
                    pivot = a(k, j)
                    a(k, j) = a(pivot_row, j)
                    a(pivot_row, j) = pivot
                end do
                pivot = b(k)
                b(k) = b(pivot_row)
                b(pivot_row) = pivot
            end if
            
            ! Eliminate
            do i = k+1, n
                if (abs(a(k, k)) > 1e-12_dp) then
                    factor = a(i, k) / a(k, k)
                    do j = k+1, n
                        a(i, j) = a(i, j) - factor * a(k, j)
                    end do
                    b(i) = b(i) - factor * b(k)
                end if
            end do
        end do
        
        ! Back substitution
        do i = n, 1, -1
            solution(i) = b(i)
            do j = i+1, n
                solution(i) = solution(i) - a(i, j) * solution(j)
            end do
            if (abs(a(i, i)) > 1e-12_dp) then
                solution(i) = solution(i) / a(i, i)
            else
                solution(i) = 0.0_dp
            end if
        end do
        
    end subroutine solve_linear_system

    ! Automatic Voltage Regulator (AVR) simulation
    subroutine avr_controller(n_generators, voltage_references, measured_voltages, &
                             previous_excitation, time_step, excitation_output, &
                             avr_gain, time_constant)
        implicit none
        
        integer, intent(in) :: n_generators
        real(dp), intent(in) :: voltage_references(n_generators)
        real(dp), intent(in) :: measured_voltages(n_generators)
        real(dp), intent(in) :: previous_excitation(n_generators)
        real(dp), intent(in) :: time_step
        real(dp), intent(in) :: avr_gain, time_constant
        real(dp), intent(out) :: excitation_output(n_generators)
        
        ! Local variables
        integer :: i
        real(dp) :: voltage_error, proportional_term, integral_term
        real(dp) :: alpha  ! Filter coefficient
        
        alpha = time_step / (time_constant + time_step)
        
        do i = 1, n_generators
            voltage_error = voltage_references(i) - measured_voltages(i)
            
            ! PI controller with first-order lag
            proportional_term = avr_gain * voltage_error
            integral_term = previous_excitation(i) * (1.0_dp - alpha)
            
            excitation_output(i) = alpha * proportional_term + integral_term
            
            ! Apply excitation limits (typical values for European generators)
            if (excitation_output(i) > 5.0_dp) then
                excitation_output(i) = 5.0_dp
            elseif (excitation_output(i) < -2.0_dp) then
                excitation_output(i) = -2.0_dp
            end if
        end do
        
    end subroutine avr_controller

end module uq_control
