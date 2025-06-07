! power_flow.f90
! High-performance Fortran module for European power grid calculations
! Optimized numerical algorithms for power flow and frequency control

module power_flow_solver
    implicit none
    integer, parameter :: dp = kind(1.0d0)  ! Double precision
    real(dp), parameter :: PI = 3.141592653589793_dp
    real(dp), parameter :: BASE_FREQUENCY = 50.0_dp  ! European grid frequency
    
contains

    ! Newton-Raphson power flow solver for European grids
    subroutine newton_raphson_powerflow(n_buses, y_matrix, p_sched, q_sched, &
                                      voltage_mag, voltage_ang, max_iter, &
                                      tolerance, converged, iterations)
        implicit none
        
        ! Input parameters
        integer, intent(in) :: n_buses, max_iter
        complex(dp), intent(in) :: y_matrix(n_buses, n_buses)
        real(dp), intent(in) :: p_sched(n_buses), q_sched(n_buses)
        real(dp), intent(in) :: tolerance
        
        ! Input/Output parameters
        real(dp), intent(inout) :: voltage_mag(n_buses), voltage_ang(n_buses)
        
        ! Output parameters
        logical, intent(out) :: converged
        integer, intent(out) :: iterations
        
        ! Local variables
        integer :: i, j, iter
        real(dp) :: delta_p(n_buses), delta_q(n_buses)
        real(dp) :: jacobian(2*n_buses, 2*n_buses)
        real(dp) :: delta_x(2*n_buses), rhs(2*n_buses)
        real(dp) :: p_calc(n_buses), q_calc(n_buses)
        real(dp) :: max_mismatch
        complex(dp) :: voltage(n_buses)
        
        converged = .false.
        iterations = 0
        
        ! Convert voltage to complex form
        do i = 1, n_buses
            voltage(i) = voltage_mag(i) * exp(cmplx(0.0_dp, voltage_ang(i), dp))
        end do
        
        ! Newton-Raphson iterations
        do iter = 1, max_iter
            iterations = iter
            
            ! Calculate power injections
            call calculate_power_injections(n_buses, y_matrix, voltage, p_calc, q_calc)
            
            ! Calculate mismatches
            delta_p = p_sched - p_calc
            delta_q = q_sched - q_calc
            
            ! Check convergence
            max_mismatch = maxval(abs(delta_p))
            max_mismatch = max(max_mismatch, maxval(abs(delta_q)))
            
            if (max_mismatch < tolerance) then
                converged = .true.
                exit
            end if
            
            ! Build Jacobian matrix
            call build_jacobian(n_buses, y_matrix, voltage, jacobian)
            
            ! Prepare right-hand side
            rhs(1:n_buses) = delta_p
            rhs(n_buses+1:2*n_buses) = delta_q
            
            ! Solve linear system using Gaussian elimination
            call gaussian_elimination(2*n_buses, jacobian, rhs, delta_x)
            
            ! Update voltage angles and magnitudes
            do i = 1, n_buses
                voltage_ang(i) = voltage_ang(i) + delta_x(i)
                voltage_mag(i) = voltage_mag(i) + delta_x(n_buses + i)
                voltage(i) = voltage_mag(i) * exp(cmplx(0.0_dp, voltage_ang(i), dp))
            end do
        end do
        
    end subroutine newton_raphson_powerflow

    ! Calculate power injections at each bus
    subroutine calculate_power_injections(n_buses, y_matrix, voltage, p_calc, q_calc)
        implicit none
        integer, intent(in) :: n_buses
        complex(dp), intent(in) :: y_matrix(n_buses, n_buses)
        complex(dp), intent(in) :: voltage(n_buses)
        real(dp), intent(out) :: p_calc(n_buses), q_calc(n_buses)
        
        integer :: i, j
        complex(dp) :: s_calc, i_current
        
        do i = 1, n_buses
            i_current = (0.0_dp, 0.0_dp)
            do j = 1, n_buses
                i_current = i_current + y_matrix(i, j) * voltage(j)
            end do
            s_calc = voltage(i) * conjg(i_current)
            p_calc(i) = real(s_calc)
            q_calc(i) = aimag(s_calc)
        end do
        
    end subroutine calculate_power_injections

    ! Build Jacobian matrix for Newton-Raphson
    subroutine build_jacobian(n_buses, y_matrix, voltage, jacobian)
        implicit none
        integer, intent(in) :: n_buses
        complex(dp), intent(in) :: y_matrix(n_buses, n_buses)
        complex(dp), intent(in) :: voltage(n_buses)
        real(dp), intent(out) :: jacobian(2*n_buses, 2*n_buses)
        
        integer :: i, j
        real(dp) :: g_ij, b_ij, v_i, v_j, theta_i, theta_j, theta_ij
        
        jacobian = 0.0_dp
        
        do i = 1, n_buses
            v_i = abs(voltage(i))
            theta_i = atan2(aimag(voltage(i)), real(voltage(i)))
            
            do j = 1, n_buses
                g_ij = real(y_matrix(i, j))
                b_ij = aimag(y_matrix(i, j))
                v_j = abs(voltage(j))
                theta_j = atan2(aimag(voltage(j)), real(voltage(j)))
                theta_ij = theta_i - theta_j
                
                if (i == j) then
                    ! Diagonal elements
                    jacobian(i, j) = -v_i * v_j * (g_ij * sin(theta_ij) - b_ij * cos(theta_ij))
                    jacobian(i, n_buses + j) = v_j * (g_ij * cos(theta_ij) + b_ij * sin(theta_ij))
                    jacobian(n_buses + i, j) = v_i * v_j * (g_ij * cos(theta_ij) + b_ij * sin(theta_ij))
                    jacobian(n_buses + i, n_buses + j) = v_j * (g_ij * sin(theta_ij) - b_ij * cos(theta_ij))
                else
                    ! Off-diagonal elements
                    jacobian(i, j) = v_i * v_j * (g_ij * sin(theta_ij) - b_ij * cos(theta_ij))
                    jacobian(i, n_buses + j) = v_i * (g_ij * cos(theta_ij) + b_ij * sin(theta_ij))
                    jacobian(n_buses + i, j) = -v_i * v_j * (g_ij * cos(theta_ij) + b_ij * sin(theta_ij))
                    jacobian(n_buses + i, n_buses + j) = v_i * (g_ij * sin(theta_ij) - b_ij * cos(theta_ij))
                end if
            end do
        end do
        
    end subroutine build_jacobian

    ! Gaussian elimination solver
    subroutine gaussian_elimination(n, a_matrix, b_vector, x_vector)
        implicit none
        integer, intent(in) :: n
        real(dp), intent(inout) :: a_matrix(n, n)
        real(dp), intent(inout) :: b_vector(n)
        real(dp), intent(out) :: x_vector(n)
        
        integer :: i, j, k, max_row
        real(dp) :: max_val, factor, temp
        
        ! Forward elimination with partial pivoting
        do k = 1, n-1
            ! Find pivot
            max_val = abs(a_matrix(k, k))
            max_row = k
            do i = k+1, n
                if (abs(a_matrix(i, k)) > max_val) then
                    max_val = abs(a_matrix(i, k))
                    max_row = i
                end if
            end do
            
            ! Swap rows if needed
            if (max_row /= k) then
                do j = k, n
                    temp = a_matrix(k, j)
                    a_matrix(k, j) = a_matrix(max_row, j)
                    a_matrix(max_row, j) = temp
                end do
                temp = b_vector(k)
                b_vector(k) = b_vector(max_row)
                b_vector(max_row) = temp
            end if
            
            ! Eliminate
            do i = k+1, n
                factor = a_matrix(i, k) / a_matrix(k, k)
                do j = k, n
                    a_matrix(i, j) = a_matrix(i, j) - factor * a_matrix(k, j)
                end do
                b_vector(i) = b_vector(i) - factor * b_vector(k)
            end do
        end do
        
        ! Back substitution
        do i = n, 1, -1
            x_vector(i) = b_vector(i)
            do j = i+1, n
                x_vector(i) = x_vector(i) - a_matrix(i, j) * x_vector(j)
            end do
            x_vector(i) = x_vector(i) / a_matrix(i, i)
        end do
        
    end subroutine gaussian_elimination

end module power_flow_solver
