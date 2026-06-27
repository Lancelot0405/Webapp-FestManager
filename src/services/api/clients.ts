import { supabase } from '../../lib/supabase';
import { adminApi } from '../../lib/adminApi';
import type { Client, RegistrationRequest } from '../../types';

export async function apiAddClient(client: Client): Promise<void> {
  const { error } = await supabase.from('clients').insert({
    name: client.name,
    contact_name: client.contactName,
    phone: client.phone,
    email: client.email,
    city: client.city,
    notes: client.notes,
    event_ids: client.eventIds,
  });
  if (error) throw new Error(error.message);
}

export async function apiUpdateClient(client: Client): Promise<void> {
  const { error } = await supabase.from('clients').update({
    name: client.name,
    contact_name: client.contactName,
    phone: client.phone,
    email: client.email,
    city: client.city,
    notes: client.notes,
    event_ids: client.eventIds,
  }).eq('id', client.id);
  if (error) throw new Error(error.message);
}

export async function apiDeleteClient(clientId: number): Promise<void> {
  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  if (error) throw new Error(error.message);
}

export async function apiApproveRegistration(userId: string): Promise<void> {
  const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', userId);
  if (error) throw new Error(error.message);
}

export async function apiRejectRegistration(userId: string): Promise<void> {
  await adminApi.deleteUser({ userId });
  await supabase.from('users').delete().eq('id', userId);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbRow = Record<string, any>;

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*');
  if (error || !data) return [];
  return data.map((row: DbRow): Client => ({
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

export async function fetchPendingRegistrations(): Promise<RegistrationRequest[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, status, created_at')
    .eq('role', 'manager')
    .eq('status', 'pending');
  if (error || !data) return [];
  return data.map((row: DbRow): RegistrationRequest => ({
    id: row.id,
    userId: row.id,
    username: '',
    displayName: row.name ?? '',
    requestedRole: 'manager',
    status: 'pending',
    createdAt: row.created_at ?? '',
  }));
}
