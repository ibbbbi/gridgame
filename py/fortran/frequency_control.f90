! frequency_control.f90
! European SO GL frequency control algorithms optimized in Fortran
! Implements FCR/FRR calculations according to Continental Europe standards

module frequency_control
    implicit none
    integer, parameter :: dp = kind(1.0d0)
    real(dp), parameter :: NOMINAL_FREQUENCY = 50.0_dp  ! Hz
    real(dp), parameter :: FCR_DEADBAND = 0.01_dp       ! 10 mHz
    real(dp), parameter :: FCR_FULL_ACTIVATION = 0.2_dp  ! 200 mHz
    real(dp), parameter :: EMERGENCY_THRESHOLD = 0.8_dp  ! 800 mHz
    
contains

    ! Calculate frequency response according to SO GL
    subroutine calculate_fcr_response(frequency_deviation, fcr_capacity, &
                                     fcr_response, activation_level)
        implicit none
        real(dp), intent(in) :: frequency_deviation  ! Hz deviation from 50 Hz
        real(dp), intent(in) :: fcr_capacity         ! MW available FCR
        real(dp), intent(out) :: fcr_response        ! MW FCR activation
        real(dp), intent(out) :: activation_level    ! 0-1 activation fraction
        
        real(dp) :: abs_deviation
        
        abs_deviation = abs(frequency_deviation)
        
        ! Apply deadband - no response within ±10 mHz
        if (abs_deviation <= FCR_DEADBAND) then
            fcr_response = 0.0_dp
            activation_level = 0.0_dp
            return
        end if
        
        ! Linear response between deadband and full activation
        if (abs_deviation <= FCR_FULL_ACTIVATION) then
            activation_level = (abs_deviation - FCR_DEADBAND) / (FCR_FULL_ACTIVATION - FCR_DEADBAND)
        else
            activation_level = 1.0_dp  ! Full activation above 200 mHz
        end if
        
        ! Calculate FCR response (opposite sign to deviation)
        fcr_response = -sign(activation_level * fcr_capacity, frequency_deviation)
        
    end subroutine calculate_fcr_response

    ! System state determination according to SO GL
    subroutine determine_system_state(frequency_deviation, n1_secure, system_state)
        implicit none
        real(dp), intent(in) :: frequency_deviation   ! Hz
        logical, intent(in) :: n1_secure              ! N-1 security status
        integer, intent(out) :: system_state          ! 1=normal, 2=alert, 3=emergency
        
        real(dp) :: abs_deviation
        
        abs_deviation = abs(frequency_deviation)
        
        ! Emergency state: frequency deviation > 800 mHz
        if (abs_deviation > EMERGENCY_THRESHOLD) then
            system_state = 3  ! Emergency
            return
        end if
        
        ! Alert state: frequency deviation > 200 mHz or N-1 not secure
        if (abs_deviation > FCR_FULL_ACTIVATION .or. .not. n1_secure) then
            system_state = 2  ! Alert
            return
        end if
        
        ! Normal state
        system_state = 1  ! Normal
        
    end subroutine determine_system_state

    ! Calculate grid inertia response to disturbances
    subroutine calculate_inertia_response(power_imbalance, system_inertia, &
                                        frequency_nadir, rocof)
        implicit none
        real(dp), intent(in) :: power_imbalance    ! MW sudden change
        real(dp), intent(in) :: system_inertia     ! MWs (inertia constant)
        real(dp), intent(out) :: frequency_nadir   ! Hz lowest frequency
        real(dp), intent(out) :: rocof            ! Hz/s rate of change
        
        real(dp), parameter :: FREQUENCY_RESPONSE_CONSTANT = 25000.0_dp  ! MW/Hz for CE
        real(dp) :: time_constant, steady_state_deviation
        
        ! Calculate initial rate of change of frequency (RoCoF)
        rocof = power_imbalance / (2.0_dp * system_inertia * NOMINAL_FREQUENCY)
        
        ! Time constant for frequency response
        time_constant = 2.0_dp * system_inertia / FREQUENCY_RESPONSE_CONSTANT
        
        ! Steady-state frequency deviation
        steady_state_deviation = power_imbalance / FREQUENCY_RESPONSE_CONSTANT
        
        ! Approximate frequency nadir (simplified model)
        frequency_nadir = NOMINAL_FREQUENCY + steady_state_deviation * 0.5_dp
        
    end subroutine calculate_inertia_response

    ! N-1 contingency analysis for multiple scenarios
    subroutine n1_contingency_analysis(n_components, component_capacities, &
                                      total_capacity, max_loss, n1_secure)
        implicit none
        integer, intent(in) :: n_components
        real(dp), intent(in) :: component_capacities(n_components)  ! MW
        real(dp), intent(in) :: total_capacity                      ! MW
        real(dp), intent(out) :: max_loss                          ! MW
        logical, intent(out) :: n1_secure
        
        integer :: i
        real(dp), parameter :: REFERENCE_INCIDENT = 3000.0_dp  ! MW SO GL reference
        real(dp), parameter :: RESERVE_MARGIN = 0.05_dp        ! 5% margin
        
        ! Find maximum single contingency
        max_loss = 0.0_dp
        do i = 1, n_components
            if (component_capacities(i) > max_loss) then
                max_loss = component_capacities(i)
            end if
        end do
        
        ! Check if remaining capacity can handle loss with margin
        n1_secure = (total_capacity - max_loss) >= (max_loss * (1.0_dp + RESERVE_MARGIN))
        
        ! Additional check against SO GL reference incident
        n1_secure = n1_secure .and. (total_capacity >= REFERENCE_INCIDENT * 1.1_dp)
        
    end subroutine n1_contingency_analysis

    ! Voltage stability analysis using P-V curves
    subroutine voltage_stability_analysis(n_buses, load_levels, voltage_magnitudes, &
                                        voltage_margin, stable)
        implicit none
        integer, intent(in) :: n_buses
        real(dp), intent(in) :: load_levels(n_buses)      ! pu
        real(dp), intent(in) :: voltage_magnitudes(n_buses) ! pu
        real(dp), intent(out) :: voltage_margin           ! pu
        logical, intent(out) :: stable
        
        integer :: i
        real(dp), parameter :: VOLTAGE_MIN_CE_110_300 = 0.90_dp  ! SO GL limit
        real(dp), parameter :: VOLTAGE_MAX_CE_110_300 = 1.118_dp
        real(dp), parameter :: VOLTAGE_MIN_CE_300_400 = 0.90_dp
        real(dp), parameter :: VOLTAGE_MAX_CE_300_400 = 1.05_dp
        real(dp) :: min_voltage, max_voltage, margin_low, margin_high
        
        stable = .true.
        min_voltage = minval(voltage_magnitudes)
        max_voltage = maxval(voltage_magnitudes)
        
        ! Check Continental Europe voltage limits
        margin_low = min_voltage - VOLTAGE_MIN_CE_110_300
        margin_high = VOLTAGE_MAX_CE_110_300 - max_voltage
        voltage_margin = min(margin_low, margin_high)
        
        ! System is stable if all voltages are within SO GL limits
        stable = (min_voltage >= VOLTAGE_MIN_CE_110_300) .and. &
                (max_voltage <= VOLTAGE_MAX_CE_110_300)
        
    end subroutine voltage_stability_analysis

    ! Real-time grid frequency simulation with inertia
    subroutine simulate_frequency_dynamics(dt, power_imbalance, system_inertia, &
                                         fcr_capacity, frequency, frequency_rate)
        implicit none
        real(dp), intent(in) :: dt                 ! Time step (s)
        real(dp), intent(in) :: power_imbalance    ! MW
        real(dp), intent(in) :: system_inertia     ! MWs
        real(dp), intent(in) :: fcr_capacity       ! MW
        real(dp), intent(inout) :: frequency       ! Hz
        real(dp), intent(out) :: frequency_rate    ! Hz/s
        
        real(dp) :: frequency_deviation, fcr_response, activation_level
        real(dp) :: net_imbalance
        
        ! Current frequency deviation
        frequency_deviation = frequency - NOMINAL_FREQUENCY
        
        ! Calculate FCR response
        call calculate_fcr_response(frequency_deviation, fcr_capacity, &
                                   fcr_response, activation_level)
        
        ! Net power imbalance after FCR
        net_imbalance = power_imbalance + fcr_response
        
        ! Update frequency using swing equation
        frequency_rate = net_imbalance / (2.0_dp * system_inertia * frequency)
        frequency = frequency + frequency_rate * dt
        
    end subroutine simulate_frequency_dynamics

end module frequency_control
