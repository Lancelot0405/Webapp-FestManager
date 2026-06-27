# Nhật ký phát triển (Project Logs)

Trang này ghi lại các thay đổi quan trọng trong kiến trúc, cơ sở dữ liệu và các quyết định kỹ thuật của dự án **FestManager**.

## [2026-06-27] Tái cấu trúc cấu trúc dữ liệu và API
- **Thay đổi**:
  - Xóa bỏ file `src/lib/db.ts` (không còn sử dụng cơ chế DB cục bộ cũ).
  - Di chuyển mock data từ `src/data` sang `src/test/fixtures/mockData.ts` để phục vụ riêng cho testing/development mà không lẫn vào code production.
  - Cập nhật các service API trong `src/services/api/` (bao gồm `clients.ts`, `events.ts`, `inventory.ts`, `staff.ts`) để tích hợp trực tiếp với client Supabase chính thức.
  - Cập nhật lại các React Query hooks (`useClientsQuery.ts`, `useEventsQuery.ts`, v.v.) để trỏ đúng sang cấu trúc API mới.
- **Tác động**: Hệ thống chuẩn hóa hoàn toàn theo luồng Supabase API Client thay vì dùng DB helper tạm thời.

---

## [Mẫu ghi nhật ký mới]
```markdown
## [YYYY-MM-DD] Tiêu đề thay đổi
- **Thay đổi**: Mô tả ngắn gọn những gì đã thêm, sửa hoặc xóa.
- **Quyết định kỹ thuật**: Tại sao lại thực hiện thay đổi này.
- **Liên kết liên quan**: [[Tên_Ghi_Chú_Liên_Quan]]
```
