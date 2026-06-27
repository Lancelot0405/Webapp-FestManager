# `lib/eventStatus.ts`

**Đường dẫn**: `src/lib/eventStatus.ts`

## 📝 Mô tả
Compute the effective status of an event based on its start/end dates. - > 14 days until start → "Lên kế hoạch" - ≤ 7 days until start → "Sắp tới" - 8–14 days until start → "Lên kế hoạch" - During event (start ≤ today ≤ end) → "Đang diễn ra" - After end → "Đã hoàn thành"

## 📦 Các Exports chính
- `computeEventStatus`

## 🔗 Liên kết liên quan
- [[index|Quay lại trang chủ Second Brain]]
- [[codebase-index|Danh mục Codebase]]
