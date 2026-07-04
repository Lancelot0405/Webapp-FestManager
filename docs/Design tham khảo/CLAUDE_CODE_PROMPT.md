# Prompt cho Claude Code

Đọc file DESIGN_REFERENCE.md và theme-tokens.css trong repo này.
So sánh giao diện hiện tại của project với spec đó theo TỪNG mục.
Với mỗi token/component, báo cáo dạng bảng: [Mục] | [Giá trị của tôi] | [Giá trị reference] | [✅/⚠️/❌] | [Cách sửa].

Ưu tiên kiểm tra:
1. Font Inter global.
2. Dark mode class-based (class `dark` trên <html>).
3. Accent: #2563eb (light) / #2aa9e0 (dark) — dark PHẢI sáng hơn.
4. Nền gray-50 (light) / gray-950 (dark).
5. Header sticky cao 64px + backdrop-blur-lg.
6. Container max-w-7xl căn giữa.
7. Poster card aspect-[2/3], rounded-lg, hover scale, grid 5 cột.
8. Primary button rounded-lg, hover lift (-translate-y-0.5) + shadow theo accent.
9. Transition duration 300ms.

Sau đó đề xuất diff cụ thể (class Tailwind) để project khớp reference.
Không copy markup/asset gốc — chỉ áp dụng design tokens.
