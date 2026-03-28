import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Booking } from '@/lib/database.types'
import { toast } from 'sonner'

export function useBookings(serviceDate?: string) {
  return useQuery({
    queryKey: ['bookings', serviceDate],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          passenger:passengers(id, first_name, last_name, phone, needs_wheelchair, needs_driver_assist, high_priority_medical, category),
          pickup_stop:stops!pickup_stop_id(id, name_sr, settlement),
          dropoff_stop:stops!dropoff_stop_id(id, name_sr, settlement),
          driver:drivers(id, first_name, last_name),
          vehicle:vehicles(id, plate_number, vehicle_type)
        `)
        .order('pickup_time')

      if (serviceDate) {
        query = query
          .gte('pickup_time', `${serviceDate}T00:00:00`)
          .lte('pickup_time', `${serviceDate}T23:59:59`)
      }

      const { data, error } = await query
      if (error) throw error
      return data
    },
    staleTime: 15_000,
  })
}

export function useBookingMutation() {
  const queryClient = useQueryClient()

  const createBooking = useMutation({
    mutationFn: async (payload: Partial<Booking>) => {
      const { data, error } = await supabase.functions.invoke('booking-create', {
        body: payload,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Rezervacija kreirana')
    },
    onError: () => toast.error('Greška pri kreiranju rezervacije'),
  })

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const { data, error } = await supabase.functions.invoke('booking-transition', {
        body: { bookingId: id, toStatus: status, reason },
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      toast.success('Status ažuriran')
    },
    onError: () => toast.error('Greška pri promeni statusa'),
  })

  return { createBooking, updateStatus }
}
