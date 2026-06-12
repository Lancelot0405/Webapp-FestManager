import { supabase } from '../../lib/supabase';
import { adminApi } from '../../lib/adminApi';
import { toISODate, fromISODate } from '../../lib/dateHelpers';
import type { Database } from '../../types/database.types';
import type { StaffMember, Contract, RegistrationRequest } from '../../types';

type StaffWithRelationsRow = Database['public']['Tables']['staff_members']['Row'] & {
  contracts: Database['public']['Tables']['contracts']['Row'][] | null;
  users: { role: string | null } | null;
};

export async function fetchStaff(): Promise<StaffMember[]> {
  const { data, error } = await supabase
    .from('staff_members')
    .select('*, contracts(*), users!left(role)');

  if (error || !data || data.length === 0) {
    if (error) console.error('[api/staff] fetchStaff error:', error.message);
    return [];
  }

  return (data as StaffWithRelationsRow[])
    .filter((row) => row.users?.role !== 'admin')
    .map((row): StaffMember => ({
      id: row.id,
      userId: row.user_id ?? undefined,
      name: row.name ?? '',
      dob: row.dob ?? '',
      city: row.city ?? '',
      phone: row.phone ?? undefined,
      staffType: row.staff_type === 'part-time' ? 'part-time' : 'permanent',
      contracts: (row.contracts ?? []).map((c) => ({
        id: c.id,
        date: fromISODate(c.date ?? ''),
        url: c.url ?? '',
        fileName: c.file_name ?? undefined,
        festivalId: c.festival_id ?? undefined,
      })),
      carteVitale: row.carte_vitale_url
        ? { url: row.carte_vitale_url, fileName: row.carte_vitale_name ?? '', uploadedAt: row.carte_vitale_uploaded_at ?? '' }
        : undefined,
      titreSejour: row.titre_sejour_url
        ? { url: row.titre_sejour_url, fileName: row.titre_sejour_name ?? '', uploadedAt: row.titre_sejour_uploaded_at ?? '' }
        : undefined,
      carteVitaleNumber: row.carte_vitale_number ?? undefined,
      titreSejeurNumber: row.titre_sejour_number ?? undefined,
    }));
}

export async function createStaff(staff: Omit<StaffMember, 'id' | 'contracts'>, userId?: string): Promise<void> {
  const { error } = await supabase.from('staff_members').insert({
    name: staff.name,
    dob: staff.dob,
    city: staff.city,
    staff_type: staff.staffType,
    user_id: userId ?? null,
  });
  if (error) throw error;
}

export async function updateStaff(staff: StaffMember): Promise<void> {
  const { error } = await supabase.from('staff_members').update({
    name:                    staff.name,
    dob:                     staff.dob,
    city:                    staff.city,
    phone:                   staff.phone ?? null,
    staff_type:              staff.staffType,
    carte_vitale_url:        staff.carteVitale?.url        ?? null,
    carte_vitale_name:       staff.carteVitale?.fileName   ?? null,
    carte_vitale_uploaded_at:staff.carteVitale?.uploadedAt ?? null,
    carte_vitale_number:     staff.carteVitaleNumber       ?? null,
    titre_sejour_url:        staff.titreSejour?.url        ?? null,
    titre_sejour_name:       staff.titreSejour?.fileName   ?? null,
    titre_sejour_uploaded_at:staff.titreSejour?.uploadedAt ?? null,
    titre_sejour_number:     staff.titreSejeurNumber       ?? null,
  }).eq('id', staff.id);
  if (error) throw error;
}

export async function deleteStaff(staffId: number): Promise<void> {
  const { data: member } = await supabase.from('staff_members').select('user_id').eq('id', staffId).single();
  const { error } = await supabase.from('staff_members').delete().eq('id', staffId);
  if (error) throw error;
  if (member?.user_id) {
    const { error: deleteUserError } = await adminApi.deleteUser({ userId: member.user_id });
    if (deleteUserError) throw new Error(deleteUserError);
  }
}

export async function addContract(staffId: number, contract: Omit<Contract, 'id'>): Promise<void> {
  const { error } = await supabase.from('contracts').insert({
    staff_id: staffId,
    date: toISODate(contract.date),
    url: contract.url,
    file_name: contract.fileName,
    festival_id: contract.festivalId ?? null,
  });
  if (error) throw error;
}

export async function fetchPendingRegistrations(): Promise<RegistrationRequest[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, status, created_at')
    .eq('role', 'manager')
    .eq('status', 'pending');

  if (error || !data) return [];

  type UserPendingRow = Pick<Database['public']['Tables']['users']['Row'], 'id' | 'name' | 'role' | 'status' | 'created_at'>;

  return (data as UserPendingRow[]).map((row): RegistrationRequest => ({
    id: row.id,
    userId: row.id,
    username: '',
    displayName: row.name ?? '',
    requestedRole: 'manager',
    status: 'pending',
    createdAt: row.created_at ?? '',
  }));
}

export async function approveRegistration(userId: string): Promise<void> {
  const { error } = await supabase.from('users').update({ status: 'active' }).eq('id', userId);
  if (error) throw error;
}

export async function rejectRegistration(userId: string): Promise<void> {
  const { error } = await adminApi.deleteUser({ userId });
  if (error) throw new Error(error);
  const { error: deleteProfileError } = await supabase.from('users').delete().eq('id', userId);
  if (deleteProfileError) throw deleteProfileError;
}
