# Kiến trúc cốt lõi (Core Architecture)

Kiến trúc luồng dữ liệu của **FestManager** đi qua các lớp phân tách rõ ràng để đảm bảo tính dễ bảo trì và khả năng mở rộng.

## 🔄 Luồng dữ liệu (Data Flow)

### 1. Chiều đọc (Read Flow)
Khi một UI Component cần hiển thị dữ liệu:

```
[UI Component]
      └── Gọi custom query hook từ: src/hooks/queries/use*Query.ts
            └── Gọi hàm API từ: src/services/api/*.ts
                  └── Kết nối Supabase Client tại: src/lib/supabase.ts
                        └── Cơ sở dữ liệu Supabase
```

*Ví dụ thực tế*:
1. `Schedule.tsx` hiển thị danh sách sự kiện.
2. Component gọi hook `useEventsQuery()` (sử dụng TanStack Query).
3. Hook này gọi hàm `fetchEvents()` từ `src/services/api/events.ts`.
4. Hàm này thực hiện truy vấn `supabase.from('events').select(...)`.

---

### 2. Chiều ghi/ghi đè (Write/Mutation Flow)
Khi người dùng thực hiện một hành động tạo mới, cập nhật hoặc xóa:

```
[UI Component]
      └── Kích hoạt hook mutation: src/hooks/queries/mutations/use*Mutation.ts
            └── Gọi hàm API tương ứng: src/services/api/*.ts
                  └── Thực hiện query POST/PATCH/DELETE lên Supabase
                        └── Invalidate Cache (xóa cache cũ) thông qua Query Key
```

*Quy tắc invalidation*: Sau khi ghi dữ liệu thành công, mutation hook **bắt buộc** phải gọi `queryClient.invalidateQueries({ queryKey: ... })` để buộc các component đang hiển thị dữ liệu cũ tự động fetch lại bản mới nhất.

---

## 📂 Danh sách Modules API chính

Xem chi tiết cấu hình và hàm API tại các bài viết:
*   [[module-events]]: API xử lý sự kiện, hóa đơn & chi phí.
*   [[module-inventory]]: Quản lý tồn kho và nhật ký nhập xuất kho.
*   [[module-hr]]: Quản lý nhân viên, tài khoản, ca trực và hợp đồng.
*   [[module-clients]]: Quản lý khách hàng và xét duyệt đăng ký của Manager mới.

---
## 🔗 Liên kết xem thêm
*   [[stack-overview]]: Tìm hiểu về các thư viện/công nghệ sử dụng.
*   [[state-management]]: Hiểu về cách quản lý theme và floating action button (FAB).
