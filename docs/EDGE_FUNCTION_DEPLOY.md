# Hướng dẫn deploy Edge Function `admin`

> Mục tiêu: đưa service-role key về phía server (Edge Function), **gỡ hoàn toàn
> khỏi frontend**. Sau khi làm xong các bước dưới, app vẫn đủ tính năng admin
> (tạo NV, đặt mật khẩu, xóa user) mà không còn lộ key.
>
> Làm **một lần**. Mất khoảng 5 phút.

---

## 0. Vì sao cần bước này?

Trước đây frontend dùng `VITE_SUPABASE_SERVICE_ROLE_KEY` → key bị nhúng vào
bundle JS công khai, ai cũng đọc được và bỏ qua toàn bộ RLS. Code đã được sửa
để mọi thao tác admin đi qua Edge Function `admin` (file
`supabase/functions/admin/index.ts`). Việc còn lại của bạn là **deploy** nó.

---

## 1. Cài & đăng nhập Supabase CLI (nếu chưa có)

```bash
# Cài CLI (macOS)
brew install supabase/tap/supabase
# hoặc npm:  npm install -g supabase

# Đăng nhập (mở trình duyệt lấy token)
supabase login
```

## 2. Liên kết project

Lấy `project-ref` ở Dashboard → Project Settings → General (dạng `abcd1234...`).

```bash
cd Webapp-FestManager
supabase link --project-ref <project-ref-của-bạn>
```

## 3. Deploy function

```bash
supabase functions deploy admin --no-verify-jwt
```

- `--no-verify-jwt` là **bắt buộc**: action `register` (tự đăng ký) là công khai,
  nên không thể bắt buộc JWT ở cổng. Các action còn lại (`create-staff`,
  `set-password`, `delete-user`, `get-user-email`) **tự kiểm tra quyền admin
  bên trong function** nên vẫn an toàn.

> **Không cần set secret.** Supabase tự cấp `SUPABASE_URL` và
> `SUPABASE_SERVICE_ROLE_KEY` cho mọi Edge Function. Function đọc trực tiếp
> từ `Deno.env`.

## 4. Gỡ service key khỏi frontend env

Sau khi function chạy được:

1. **Vercel** → Project → Settings → Environment Variables → **xóa**
   `VITE_SUPABASE_SERVICE_ROLE_KEY`.
2. File `.env` local: xóa dòng `VITE_SUPABASE_SERVICE_ROLE_KEY` (nếu còn).
3. Redeploy frontend (Vercel tự build lại khi push, hoặc bấm Redeploy).

> Code không còn tham chiếu biến này nữa, nên kể cả còn sót trong env cũng
> KHÔNG bị nhúng vào bundle. Nhưng nên xóa cho sạch.

## 5. Kiểm thử (quan trọng — sau khi deploy)

Lần lượt thử trên app:

- [ ] **Đăng ký** tài khoản nhân viên mới → đăng nhập được ngay.
- [ ] **Đăng ký** tài khoản quản lý → hiện "chờ admin duyệt".
- [ ] Admin **duyệt / từ chối** đăng ký quản lý.
- [ ] Admin **thêm nhân viên** kèm tài khoản đăng nhập.
- [ ] Admin **đổi mật khẩu** cho một nhân viên (tab Hồ sơ).
- [ ] Admin **xóa nhân viên** có tài khoản → username đó tạo lại được.
- [ ] Hồ sơ nhân viên hiển thị đúng **tên đăng nhập / role / bộ phận**.

Nếu một bước lỗi, xem log:
```bash
supabase functions logs admin
```

---

## Bảo mật của function

- `register`: công khai, nhưng **ép role chỉ là `staff`/`manager`** (không bao
  giờ tạo được admin), manager luôn ở trạng thái `pending` chờ duyệt — đúng
  như hành vi đăng ký mở hiện tại.
- `create-staff`, `set-password`, `delete-user`, `get-user-email`: bắt buộc
  người gọi **đang đăng nhập và có `role = 'admin'`** (kiểm tra qua JWT + bảng
  `users`), nếu không trả về 403.

## Cập nhật function về sau

Sửa `supabase/functions/admin/index.ts` rồi chạy lại:
```bash
supabase functions deploy admin --no-verify-jwt
```
