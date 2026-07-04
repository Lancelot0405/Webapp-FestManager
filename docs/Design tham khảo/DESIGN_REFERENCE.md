# DESIGN_REFERENCE.md — AnkerGames UI Reference Spec

> Mục đích: File chuẩn để Claude Code so sánh giao diện project với thiết kế tham chiếu (ankergames.net).
> Stack gốc: Laravel + Livewire + Alpine.js + Tailwind CSS + Swiper.js.
> Theme: class-based — class `dark` toggle trên `<html>`.

## Core
- Font: Inter (fallback Inter-fallback, sans-serif), global.
- Dark mode: Tailwind `darkMode: 'class'`.
- Accent: biến `--primary-color`, đổi theo theme.

## Accent (đổi theo theme)
| Token | Light | Dark |
|---|---|---|
| `--primary-color` | `#2563eb` (blue-600) | `#2aa9e0` (cyan-blue) |

## Surface & Text
| Vai trò | Light | Dark |
|---|---|---|
| Nền body | `#f8fafc` (gray-50) | `#020817` (gray-950) |
| Header | `bg-gray-50` | `bg-gray-950` (xl: `/80`) + `backdrop-blur-lg` |

## Layout
- Header: sticky top-0 z-40, cao 64px, backdrop-blur-lg.
- Progress bar: `fixed top-0 w-full h-0.5 bg-gray-200 dark:bg-gray-800`.
- Container: ≈1225px, căn giữa (max-w-7xl + padding).
- Back-to-top: `fixed right-4 bottom-20 rounded-full bg-[#2aa9e0]`.

## Components
- Hero: `aspect-1920/800 min-h-[380px] lg:min-h-[480px] rounded-xl`. Tiêu đề 36px/700.
- Primary btn: `px-5 py-2.5 lg:px-6 lg:py-3 rounded-lg font-medium duration-300 hover:-translate-y-0.5 hover:shadow-lg`. Radius 8px.
- Version badge: `px-3 py-1.5 bg-green-500 rounded-md text-sm font-semibold`.
- Poster card: `aspect-[2/3] rounded-lg overflow-hidden duration-300`, 220×330, grid 5 cột, hover scale.
- Social pill: `social-btn` — pill nhiều màu + glow (Discord tím, Reddit cam, Nebulo tím, Donations xanh lá).
- Section heading: 18px/600.

## Motion
- Transition 300ms; primary btn hover lift + shadow theo accent.

## Checklist
- [ ] Font Inter · [ ] Dark class-based · [ ] Accent 2563eb/2aa9e0
- [ ] Nền gray-50/gray-950 · [ ] Header sticky 64px blur · [ ] Container max-w-7xl
- [ ] Card aspect-[2/3] rounded-lg hover scale · [ ] Btn rounded-lg lift · [ ] duration-300
