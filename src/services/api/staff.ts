import { supabase } from '../../lib/supabase';
import { toISODate } from '../../lib/db';
import { adminApi } from '../../lib/adminApi';
import type { StaffMember } from '../../types';

export async function apiCreateStaff(staff: StaffMember, userId?: string): Promise<void> {
  const { error } = await supabase.from('staff_members').insert({
    name: staff.name,
    dob: staff.dob,
    city: staff.city,
    staff_type: staff.staffType,
    user_id: userId ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function apiUpdateStaff(staff: StaffMember): Promise<void> {
  const { error } = await supabase.from('staff_members').update({
    name:                     staff.name,
    dob:                      staff.dob,
    city:                     staff.city,
    phone:                    staff.phone ?? null,
    staff_type:               staff.staffType,
    carte_vitale_url:         staff.carteVitale?.url         ?? null,
    carte_vitale_name:        staff.carteVitale?.fileName    ?? null,
    carte_vitale_uploaded_at: staff.carteVitale?.uploadedAt  ?? null,
    carte_vitale_number:      staff.carteVitaleNumber        ?? null,
    titre_sejour_url:         staff.titreSejour?.url         ?? null,
    titre_sejour_name:        staff.titreSejour?.fileName    ?? null,
    titre_sejour_uploaded_at: staff.titreSejour?.uploadedAt  ?? null,
    titre_sejour_number:      staff.titreSejeurNumber        ?? null,
  }).eq('id', staff.id);
  if (error) throw new Error(error.message);
}

export async function apiDeleteStaff(staffId: number): Promise<void> {
  const { data: member } = await supabase
    .from('staff_members').select('user_id').eq('id', staffId).single();
  const { error } = await supabase.from('staff_members').delete().eq('id', staffId);
  if (error) throw new Error(error.message);
  if (member?.user_id) {
    await adminApi.deleteUser({ userId: member.user_id });
  }
}

export async function apiAddContract(
  staffId: number,
  contract: StaffMember['contracts'][0],
): Promise<void> {
  const { error } = await supabase.from('contracts').insert({
    staff_id: staffId,
    date: toISODate(contract.date),
    url: contract.url,
    file_name: contract.fileName,
    festival_id: contract.festivalId ?? null,
  });
  if (error) throw new Error(error.message);
}
