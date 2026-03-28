import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select(`*, vehicle:vehicles(id, plate_number, vehicle_type, has_wheelchair_access)`)
        .eq('is_active', true)
        .order('last_name')
      if (error) throw error
      return data
    },
  })
}
