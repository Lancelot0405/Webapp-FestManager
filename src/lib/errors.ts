// =============================================================================
// FESTMANAGER — ERROR HELPERS
// src/lib/errors.ts
// =============================================================================

/**
 * Lấy message an toàn từ một lỗi `unknown` trong khối catch.
 * Thay cho `catch (err: any)` + `err?.message` (không an toàn kiểu).
 */
export function getErrorMessage(err: unknown, fallback = 'Đã xảy ra lỗi.'): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}
