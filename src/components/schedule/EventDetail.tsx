import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { useEventsQuery } from '../../hooks/queries/useEventsQuery';
import EventDetailContent from './EventDetailContent';

export default function EventDetail() {
  const { eventId: eventIdParam } = useParams<{ eventId: string }>();
  const navigate   = useNavigate();
  const { data: events = [] } = useEventsQuery();

  const eventId = Number(eventIdParam);
  const event   = events.find(e => e.id === eventId);

  if (!event) {
    return (
      <div className="text-center py-20 text-muted">
        <p>Không tìm thấy sự kiện</p>
        <Button variant="ghost" onPress={() => navigate(-1)} className="mt-4 h-auto min-w-0 p-0 text-accent text-sm">Quay lại</Button>
      </div>
    );
  }

  return <EventDetailContent event={event} onClose={() => navigate(-1)} variant="page" />;
}
