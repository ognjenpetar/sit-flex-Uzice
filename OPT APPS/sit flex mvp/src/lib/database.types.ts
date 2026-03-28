// Auto-generated tipovi iz Supabase CLI.
// Regenerisati komandom: supabase gen types typescript --project-id <ref> > src/lib/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'admin' | 'dispatcher' | 'driver'
export type Settlement = 'kacer' | 'tara' | 'uzice_center' | 'other'
export type PassengerCategory = 'standard' | 'elderly' | 'youth' | 'caregiver' | 'low_income'
export type VehicleType = 'sedan' | 'van' | 'minibus' | 'accessible'
export type StopType = 'micro_terminal' | 'bus_connection' | 'health_center' | 'school' | 'market' | 'admin_building' | 'other'
export type BookingStatus = 'pending' | 'confirmed' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
export type TripPurpose = 'healthcare' | 'education' | 'work' | 'shopping' | 'admin_services' | 'social' | 'other'
export type RouteType = 'kacer' | 'tara' | 'mixed'
export type OverrideReason = 'passenger_request' | 'operational_necessity' | 'vehicle_substitution' | 'tariff_correction' | 'accessibility_requirement' | 'other'
export type WhatsappEventType = 'trip_assigned' | 'trip_starting' | 'trip_cancelled'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string
          role: UserRole
          phone: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      stops: {
        Row: {
          id: string
          name_sr: string
          name_en: string | null
          settlement: Settlement
          lat: number
          lng: number
          geog: unknown | null
          stop_type: StopType
          is_active: boolean
          gradient_warning: boolean
          gradient_pct: number | null
          connection_line: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['stops']['Row'], 'id' | 'geog' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['stops']['Insert']>
      }
      passengers: {
        Row: {
          id: string
          first_name: string
          last_name: string
          phone: string
          address_text: string | null
          settlement: Settlement
          category: PassengerCategory
          needs_wheelchair: boolean
          needs_driver_assist: boolean
          high_priority_medical: boolean
          notes: string | null
          is_active: boolean
          no_show_count_30d: number
          last_no_show_at: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['passengers']['Row'], 'id' | 'created_at' | 'updated_at' | 'no_show_count_30d'>
        Update: Partial<Database['public']['Tables']['passengers']['Insert']>
      }
      bookings: {
        Row: {
          id: string
          booking_number: string | null
          service_day_id: string
          passenger_id: string
          pickup_stop_id: string
          dropoff_stop_id: string
          driver_id: string | null
          vehicle_id: string | null
          trip_group_id: string | null
          pickup_time: string
          dropoff_time_estimated: string | null
          actual_pickup_time: string | null
          actual_dropoff_time: string | null
          trip_started_at: string | null
          trip_purpose: TripPurpose
          notes: string | null
          status: BookingStatus
          tariff_code: string
          tariff_rsd_per_km: number
          distance_km: number
          duration_min_estimated: number | null
          fare_rsd_calculated: number
          subsidy_rsd: number
          subsidy_reason: string | null
          fare_rsd_passenger: number
          fare_rsd_operator: number
          fare_overridden: boolean
          fare_override_reason: OverrideReason | null
          assignment_overridden: boolean
          assignment_override_reason: OverrideReason | null
          connection_line_id: string | null
          satisfaction_score: number | null
          satisfaction_rated_at: string | null
          satisfaction_token: string | null
          created_by: string
          cancelled_by: string | null
          cancelled_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['bookings']['Row'], 'id' | 'booking_number' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['bookings']['Insert']>
      }
      drivers: {
        Row: {
          id: string
          profile_id: string | null
          first_name: string
          last_name: string
          phone: string
          license_number: string | null
          vehicle_id: string | null
          is_available: boolean
          is_active: boolean
          whatsapp_phone: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['drivers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['drivers']['Insert']>
      }
      vehicles: {
        Row: {
          id: string
          plate_number: string
          vehicle_type: VehicleType
          capacity_passengers: number
          has_wheelchair_access: boolean
          has_child_seat: boolean
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['vehicles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>
      }
      service_days: {
        Row: {
          id: string
          date: string
          is_closed: boolean
          closed_reason: string | null
          total_bookings: number
          total_completed: number
          total_km_served: number
          total_revenue_rsd: number
          notes: string | null
          created_at: string
          closed_by: string | null
        }
        Insert: Omit<Database['public']['Tables']['service_days']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['service_days']['Insert']>
      }
      stop_distances: {
        Row: {
          id: string
          from_stop_id: string
          to_stop_id: string
          distance_km: number
          duration_min: number | null
          source: string
          notes: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['stop_distances']['Row'], 'id' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['stop_distances']['Insert']>
      }
      setting_versions: {
        Row: {
          id: string
          effective_from: string
          effective_to: string | null
          created_by: string | null
          config: Json
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['setting_versions']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['setting_versions']['Insert']>
      }
      trip_groups: {
        Row: {
          id: string
          service_day_id: string
          driver_id: string | null
          vehicle_id: string | null
          route_type: RouteType
          departure_time: string | null
          status: string
          total_passengers: number
          estimated_km: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['trip_groups']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['trip_groups']['Insert']>
      }
      callback_requests: {
        Row: {
          id: string
          name: string
          phone: string
          notes: string | null
          status: string
          handled_by: string | null
          handled_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['callback_requests']['Row'], 'id' | 'created_at' | 'status'>
        Update: Partial<Database['public']['Tables']['callback_requests']['Insert']>
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          entity_type: string
          entity_id: string | null
          old_value: Json | null
          new_value: Json | null
          override_reason: OverrideReason | null
          ip_address: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
    Functions: {
      calculate_fare: {
        Args: {
          p_pickup_stop_id: string
          p_dropoff_stop_id: string
          p_tariff_code?: string
        }
        Returns: {
          distance_km: number
          duration_min: number
          tariff_rsd_per_km: number
          tariff_label: string
          fare_rsd_calculated: number
        }[]
      }
      validate_status_transition: {
        Args: { p_from: BookingStatus; p_to: BookingStatus }
        Returns: boolean
      }
      get_current_role: { Args: Record<never, never>; Returns: UserRole }
      get_current_driver_id: { Args: Record<never, never>; Returns: string }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Stop = Database['public']['Tables']['stops']['Row']
export type Passenger = Database['public']['Tables']['passengers']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type Driver = Database['public']['Tables']['drivers']['Row']
export type Vehicle = Database['public']['Tables']['vehicles']['Row']
export type ServiceDay = Database['public']['Tables']['service_days']['Row']
export type StopDistance = Database['public']['Tables']['stop_distances']['Row']
export type TripGroup = Database['public']['Tables']['trip_groups']['Row']
export type SettingVersion = Database['public']['Tables']['setting_versions']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type CallbackRequest = Database['public']['Tables']['callback_requests']['Row']
