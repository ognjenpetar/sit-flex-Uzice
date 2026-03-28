import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useKpiMonthly() {
  return useQuery({
    queryKey: ['kpi-monthly'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mv_kpi_monthly')
        .select('*')
        .order('month', { ascending: false })
        .limit(12)
      if (error) throw error
      return data
    },
    staleTime: 5 * 60_000, // 5 minuta
  })
}
