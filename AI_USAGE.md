# AI Usage Declaration Log

| Date | Tool Name | Module / File Affected | Purpose | Changes / Verification Done | Verified By |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-09-24 | Claude / Gemini | Initial Setup | Khởi tạo cấu trúc dự án | Kiểm tra khớp đặc tả đề bài | Team Lead |
| 2026-09-24 | Claude / Gemini | `src/document_processing/pdf_reader.py` | Viết module đọc PDF với PyMuPDF, trích xuất text theo trang | Review docstring, tên biến, exception handling theo Rules | Thành viên 1 |
| 2026-09-24 | Claude / Gemini | `src/document_processing/chunker.py` | Viết module chunking tách text theo heading/section | Kiểm tra regex pattern, logic flush chunk cuối, giới hạn MAX_CHUNK_CHARS | Thành viên 1 |
| 2026-09-24 | Claude / Gemini | `src/document_processing/docx_reader.py` | Viết module đọc DOCX với python-docx | Kiểm tra style-based heading detection, page break counting | Thành viên 1 |
| 2026-09-24 | Claude / Gemini | `src/document_validation/validator.py` | Viết module validation kiểm tra file trước khi xử lý | Kiểm tra 3 loại exception, size bounds, extension whitelist | Thành viên 1 |
| 2026-09-24 | Claude / Gemini | `tests/test_document_processing.py` | Viết 13 test case cho validator và chunker | Chạy pytest, kiểm tra coverage các edge case | Thành viên 1 |
