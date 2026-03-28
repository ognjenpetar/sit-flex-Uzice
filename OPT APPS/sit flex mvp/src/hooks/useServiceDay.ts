import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

export function useServiceDay(date?: Date) {
  const dateStr = format(date ?? new Date(), 'yyyy-MM-dd')

  return useQuery({
    queryKey: ['service-day', dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_days')
        .select('*')
        .eq('date', dateStr)
        .single()
      if (error && error.code !== 'PGRST116') throw error
      return data
    },
  })
}
