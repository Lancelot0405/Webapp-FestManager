import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database.types';
import type { Client } from '../../types';

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*');
  if (error || !data) return [];

  type ClientRow = Database['public']['Tables']['clients']['Row'];

  return (data as ClientRow[]).map((row): Client => ({
    id: row.id,
    name: row.name ?? '',
    contactName: row.contact_name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    city: row.city ?? '',
    notes: row.notes ?? '',
    eventIds: row.event_ids ?? [],
  }));
}

export async function addClient(client: Omit<Client, 'id'>): Promise<void> {
  const { error } = await supabase.from('clients').insert({
    name: client.name,
    contact_name: client.contactName,
    phone: client.phone,
    email: client.email,
    city: client.city,
    notes: client.notes,
    event_ids: client.eventIds,
  });
  if (error) throw error;
}

export async function updateClient(client: Client): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({
      name: client.name,
      contact_name: client.contactName,
      phone: client.phone,
      email: client.email,
      city: client.city,
      notes: client.notes,
      event_ids: client.eventIds,
    })
    .eq('id', client.id);
  if (error) throw error;
}

export async function deleteClient(clientId: number): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  if (error) throw error;
}
