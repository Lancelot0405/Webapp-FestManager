// =============================================================================
// FESTMANAGER — DATE HELPERS
// src/lib/dateHelpers.ts
//
// DB lưu ISO (YYYY-MM-DD), giao diện hiển thị DD-MM-YYYY.
// Hàm thuần, tách khỏi db.ts để không kéo theo Supabase client khi test.
// =============================================================================

export function toISODate(ddmmyyyy: string): string {
  if (!ddmmyyyy) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(ddmmyyyy)) return ddmmyyyy.slice(0, 10); // already ISO
  const [dd, mm, yyyy] = ddmmyyyy.split('-');
  return `${yyyy}-${mm}-${dd}`;
}

export function fromISODate(iso: string): string {
  if (!iso) return '';
  if (/^\d{2}-\d{2}-\d{4}$/.test(iso)) return iso; // already DD-MM-YYYY
  const part = iso.slice(0, 10); // strip time if present
  const [yyyy, mm, dd] = part.split('-');
  return `${dd}-${mm}-${yyyy}`;
}
