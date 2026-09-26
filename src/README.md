# SkillSprint AI — Core Source Architecture (`src/`)

Hệ thống xử lý tài liệu kép (Dual-Pipeline Verification System) phục vụ tạo lập và kiểm định lộ trình hội nhập nhân viên tự động.

## Cấu trúc các Module cốt lõi

| Thư mục | Chức năng chính | Thành phần kỹ thuật |
| :--- | :--- | :--- |
| [`document_processing/`](document_processing/) | Xử lý & trích xuất văn bản | PyMuPDF, python-docx, structural chunking |
| [`document_validation/`](document_validation/) | Kiểm định tính toàn vẹn file | Magic bytes, SHA-256 duplicate detection |
| [`genai_pipeline/`](genai_pipeline/) | Luồng AI sinh thông minh (Pipeline 1) | Gemini API, structured output, grounding, quiz generator |
| [`prompt_templates/`](prompt_templates/) | Quản lý phiên bản Prompt | Prompt versioning (`v1.0`, `v1.1`) |
| [`python_validation/`](python_validation/) | Luồng Rule Engine Python (Pipeline 2) | Thuật toán tính Coverage Score nội bộ, kiểm tra tiên quyết |
| [`role_matrix/`](role_matrix/) | Ma trận yêu cầu vai trò (RRM) | Trích xuất yêu cầu bắt buộc và tùy chọn cho các chức danh |
| [`comparison_engine/`](comparison_engine/) | Động cơ đối soát chéo 2 luồng | So khớp từng trường dữ liệu, phân loại Match / Mismatch / Warning |
| [`hallucination_checks/`](hallucination_checks/) | Kiểm tra ảo giác nội dung | Đối soát trích dẫn nguồn gốc với các mảnh tài liệu thật |
| [`contradiction_checks/`](contradiction_checks/) | Phát hiện mâu thuẫn chính sách | Quy tắc thứ tự ưu tiên (Policy v2 > v1, SOP > FAQ) |
| [`security/`](security/) | Bảo mật & Phòng thủ đối kháng | Bộ lọc Prompt Injection EN/VI, phòng vệ adversarial |
| [`schemas/`](schemas/) | Hợp đồng dữ liệu Pydantic | Comparison contracts, request/response models |
| [`database/`](database/) | Quản lý cơ sở dữ liệu | PostgreSQL connection, SQLAlchemy models & seed |

Được duy trì và phát triển bởi **FourAngryBirds Team — TechWiz 7**.
