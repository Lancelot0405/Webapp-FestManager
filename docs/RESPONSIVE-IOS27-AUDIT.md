# Kế hoạch tối ưu Responsive & PWA (iOS 27 / Android)

> Mobile-first PWA. Build sạch trước mỗi commit. **Bắt buộc test iPhone thật ở chế độ PWA standalone**,
> không tin DevTools (theo CLAUDE.md).

## Bối cảnh
Chủ dự án nâng lên **iOS 27** và thấy **status bar + header bị lệch/che** khi cài & dùng app PWA.
Đây là phần tiếp nối câu chuyện safe-area trong CLAUDE.md (Phương án A → C). Cần rà soát toàn bộ
responsive cho iOS/Android, sửa các điểm safe-area còn hardcode, và thử lại edge-to-edge trên iOS 27.

## iOS 27 — sự thật liên quan (WWDC 6/2026)
- **Liquid Glass tinh chỉnh:** slider trong↔tint, viền tối + specular sáng hơn, khuếch tán nền tốt hơn.
- **App icon dựng lại lớp Liquid Glass** → icon PWA trên home screen trông khác (cần kiểm icon maskable).
- Không có thay đổi phá vỡ chính thức cho safe-area PWA, nhưng status bar nay là Liquid Glass → lớp phủ
  status bar trên app khác trước; cách `env(safe-area-inset-top)` trả giá trị ở chế độ không-cover thay đổi
  → **nguyên nhân header lệch/che**.

## Nguyên nhân gốc (đã xác định trong code)
Trong [Layout.tsx:98-102](src/components/layout/Layout.tsx#L98), padding-top header = `calc(env(safe-area-inset-top) + 2.75rem)`.
Số `2.75rem` là offset cứng giả định iOS chừa sẵn status bar (Phương án A). iOS 27 đổi giá trị `env()`
ở chế độ này → cộng dồn sai → lệch/che. Cần bỏ số ma thuật, dùng safe-area thật + có sàn (floor).

---

## Phase 1 — Sửa nền tảng safe-area (iOS 27)  ✅ (code xong; chờ test iPhone iOS 27 thật)
File: [index.html](index.html), [src/index.css](src/index.css), [Layout.tsx](src/components/layout/Layout.tsx)

> Đã làm: `viewport-fit=cover` + `status-bar-style=black-translucent` (index.html);
> sàn `.pt-safe` ở `@media (display-mode: standalone)` = `max(env(...), 59px)` (index.css);
> bỏ magic `2.75rem`/`1.25rem` — Layout đo chiều cao TopBar bằng ResizeObserver → `--tbh`,
> main `pt-[var(--tbh)]` (mobile) / `pt-safe` (detail) / `md:pt-5` (desktop). Build sạch.

- **Chuyển sang Phương án C (edge-to-edge có sàn an toàn):**
  - `index.html:5` thêm `viewport-fit=cover`.
  - `index.html:9` đổi `apple-mobile-web-app-status-bar-style` → `black-translucent` (hoặc giữ `default`, quyết khi test).
  - `src/index.css` thêm sàn cho `.pt-safe` ở standalone để chống bug cold-start `env()=0`:
    ```css
    @media (display-mode: standalone) {
      .pt-safe { padding-top: max(env(safe-area-inset-top), 59px); }
    }
    ```
- **Bỏ số ma thuật `2.75rem`/`1.25rem`** trong Layout: header/main dùng `pt-safe` (hoặc `var(--sat)`) thuần,
  cho TopBar tự đo chiều cao thay vì offset cứng.
- ⚠️ Test iPhone iOS 27 thật: **gỡ hẳn icon → mở Safari → Add to Home Screen** mới áp meta mới (CLAUDE.md).

## Phase 2 — Sửa các điểm safe-area còn hardcode  ✅
> Đã làm: FAB `bottom-32` → `bottom-[calc(env(safe-area-inset-bottom)+8rem)]` + `right-[calc(env(safe-area-inset-right)+1rem)]`
> (md:bottom-8 md:right-8); thêm `.pl-safe`/`.pr-safe` = `max(env(...),1rem)` (index.css); main dùng
> `pl/pr-[max(<gutter>,env(...))]` theo breakpoint (chống đè px); Sidebar `+ max-h-dvh pt/pl-[env(...)]`;
> Popover TopBar `max-h` trừ thêm safe-area top+bottom. Build sạch.
- **FAB `bottom-32` cứng** ([Layout.tsx:129](src/components/layout/Layout.tsx#L129)) → `bottom-[calc(env(safe-area-inset-bottom)+8rem)]` (mobile) để không bị home indicator che.
- **Thêm `.pl-safe` / `.pr-safe`** trong [src/index.css](src/index.css) cho landscape / Dynamic Island; áp vào container chính khi cần.
- **Sidebar `h-screen`** ([Sidebar.tsx](src/components/layout/Sidebar.tsx)) → thêm `pt-safe`, cân nhắc `max-h-dvh`.
- **Popover `max-h-[calc(100dvh-80px)]`** ([TopBar.tsx:97](src/components/layout/TopBar.tsx#L97)) → cộng thêm safe-area inset.

## Phase 3 — Rà responsive toàn app  ✅
- `Layout.tsx:84` `h-screen` → `h-dvh`; `Sidebar.tsx:100` `h-screen max-h-dvh` → `h-dvh` — fix iOS Safari URL bar gap.
- `grid-cols-2` cứng còn sót: HR list đã đưa vào HR-REDESIGN; các grid khác (Dashboard stats, Finance summary) là layout 2 cột hợp lệ.
- Breakpoint `md:` (768px) CSS + `useIsDesktop(1024)` JS không conflict: Sidebar hiện ở 768px, JS hook chỉ dùng 1024px cho Inventory Drawer/Modal.
- Sidebar tablet/iPad landscape: đã có `pl-[env(safe-area-inset-left)]` từ Phase 2 — không tràn notch.

## Phase 4 — Android & polish  🟠
- **theme-color theo dark/light:** thêm 2 thẻ `meta theme-color` với `media="(prefers-color-scheme: dark|light)"` để status bar Android khớp nền.
- Kiểm `manifest.json`: cân nhắc `display_override: ["standalone"]`; xác nhận icon maskable hiển thị đúng trên Android.
- Kiểm icon PWA trên iOS 27 (lớp Liquid Glass) — chỉnh `apple-touch-icon` nếu cần.

---

## Tái dùng / tham chiếu
- Biến safe-area đã có: `--sat/--sar/--sab/--sal` ([src/index.css:80-84](src/index.css#L80)).
- `useIsDesktop(1024)` — `src/hooks/useIsDesktop.ts`.
- Lịch sử Phương án A/B/C: mục "iOS standalone" trong CLAUDE.md.

## Kiểm thử (bắt buộc)
1. `npm run build` sạch.
2. **iPhone iOS 27 thật, PWA standalone:** gỡ icon cũ → Add to Home Screen lại → kiểm header/status bar
   không lệch/che ở cold-start, portrait + sau khi xoay ngang, có/không bàn phím.
3. Android (Chrome PWA): status bar màu khớp dark/light, bottom nav/FAB không bị che.
4. iPad landscape: Sidebar + nội dung không dính notch.
5. So sánh trước/sau cả light & dark mode.
> Vì meta iOS chỉ áp lúc Add to Home Screen, mỗi lần đổi meta phải cài lại icon mới thấy hiệu lực.
