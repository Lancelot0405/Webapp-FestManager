import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryKeys';
import { fetchEvents } from '../../lib/db';

export function useEventsQuery() {
  return useQuery({
    queryKey: queryKeys.events,
    queryFn: fetchEvents,
  });
}
