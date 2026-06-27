# Hướng dẫn viết Wiki cho AI (Wiki Instructions)

Wiki này tuân thủ định dạng **Karpathy-pattern LLM Wiki**, giúp các AI Agent dễ dàng đọc và hiểu cấu trúc dự án của bạn mà không tốn nhiều token xử lý.

## ✍️ Quy tắc viết Wiki trong Obsidian

### 1. Sử dụng Wikilinks liên kết chéo
*   Thay vì dùng link markdown thường như `[Trang chủ](index.md)`, hãy luôn sử dụng định dạng Wikilink kép: `[[Tên-Trang]]` hoặc `[[Tên-Trang|Tên hiển thị]]`.
*   *Ví dụ*: `Chúng ta sử dụng [[stack-overview]] để nắm vững công nghệ dự án.`

### 2. Phân cấp thư mục
*   Tất cả tài liệu wiki viết bằng markdown phải nằm trong thư mục gốc của Vault hoặc trong thư mục `docs/wiki/`.
*   Tài liệu nguồn thô (ảnh, tài liệu đặc tả API bằng PDF, sơ đồ Miro xuất ra hình ảnh...) hãy đặt vào thư mục `docs/wiki/raw/`.

### 3. Cập nhật `index.md` và `log.md`
*   Khi bạn tạo một trang Wiki mới (ví dụ: `api-standards.md`), hãy thêm nó vào danh sách mục lục tại [[index]].
*   Khi bạn cập nhật một tính năng lớn hoặc thay đổi cơ sở dữ liệu, hãy ghi chú ngắn gọn lại tại [[log]].

---

AI sẽ sử dụng Skill `/understand-knowledge` để phân tích các file markdown và chạy một dashboard giao diện đồ thị 3D trực quan, giúp bạn nhìn thấy toàn bộ kết nối giữa các khái niệm trong dự án của mình.

## 🔄 Cập nhật sơ đồ Codebase tự động
Khi codebase của bạn có sự thay đổi lớn (thêm/bớt file hoặc thay đổi export), bạn có thể chạy script python sau để tự động tạo lại các file tóm tắt codebase trong Obsidian:
```bash
python3 docs/wiki/generate_codebase_wiki.py
```
Script này quét thư mục `src/`, trích xuất các hàm/biến được `export` và ghi đè các file tóm tắt tương ứng trong `docs/wiki/codebase/`.

