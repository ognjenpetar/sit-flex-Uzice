import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function usePassengerSearch(query: string) {
  return useQuery({
    queryKey: ['passengers-search', query],
    queryFn: async () => {
      if (query.length < 2) return []
      const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(10)
      if (error) throw error
      return data
    },
    enabled: query.length >= 2,
  })
}

export function usePassengers() {
  return useQuery({
    queryKey: ['passengers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('is_active', true)
        .order('last_name')
      if (error) throw error
      return data
    },
  })
}
