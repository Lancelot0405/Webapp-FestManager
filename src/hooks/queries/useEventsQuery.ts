import { useQuery } from '@tanstack/react-query';
import { fetchEvents } from '../../services/api/events';

export function useEventsQuery() {
  return useQuery({
    queryKey: ['events'],
    queryFn: fetchEvents,
  });
}
