import { useParams, useNavigate } from 'react-router-dom';
import { CalendarX } from 'lucide-react';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import EventDetailContent from './EventDetailContent';
import EmptyState from '@/components/shared/EmptyState';

export default function EventDetail() {
  const { eventId: eventIdParam } = useParams<{ eventId: string }>();
  const navigate   = useNavigate();
  const { data: events = [] } = useEventsQuery();

  const eventId = Number(eventIdParam);
  const event   = events.find(e => e.id === eventId);

  if (!event) {
    return (
      <EmptyState
        icon={<CalendarX size={26} />}
        title="Không tìm thấy sự kiện"
        action={{ label: 'Quay lại', onClick: () => navigate(-1) }}
      />
    );
  }

  return <EventDetailContent event={event} onClose={() => navigate(-1)} variant="page" />;
}
