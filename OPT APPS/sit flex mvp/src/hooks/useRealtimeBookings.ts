import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useRealtimeBookings(serviceDate?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel('bookings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['bookings', serviceDate] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [serviceDate, queryClient])
}
