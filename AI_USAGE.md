# AI Usage Declaration Log — SkillSprint AI
**Dự án:** SkillSprint AI – Dual-Pipeline AI Document Verification System  
**Cuộc thi:** TechWiz 7 – Generative AI Powerplay Track  
**Đội thi:** Four Angry Birds  

> **Tuyên bố minh bạch:** Tài liệu này ghi nhận toàn bộ các hoạt động sử dụng AI hỗ trợ trong quá trình phát triển dự án theo đúng quy chế cuộc thi TechWiz 7. Toàn bộ mã nguồn và tài liệu đều đã qua quy trình rà soát thủ công của các thành viên, refactor tên biến và loại bỏ các thành phần AI boilerplate.

---

## I. NHẬT KÝ CHI TIẾT THEO CÁC PHASES (PHASE 1 – 5)

| Ngày | Công cụ AI | Module / File ảnh hưởng | Mục đích sử dụng | Kiểm thử & Xác minh bởi con người | Người xác nhận |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **2026-09-24** | Claude / Gemini | Khởi tạo cấu trúc dự án & WBS | Tạo khung thư mục ban đầu theo kiến trúc Dual-Pipeline | So sánh với đặc tả đề bài và phân bổ RACI 4 thành viên | Team Lead |
| **2026-09-24** | Claude / Gemini | `src/document_processing/pdf_reader.py` | Viết hàm đọc PDF với PyMuPDF, trích xuất text từng trang | Kiểm tra exception handling, docstring chuẩn, kiểm tra rò rỉ bộ nhớ | Châu Quốc Lâm Phong |
| **2026-09-24** | Claude / Gemini | `src/document_processing/chunker.py` | Viết logic chunking chia text theo heading/section | Kiểm tra regex pattern, logic flush chunk cuối, giới hạn MAX_CHUNK | Châu Quốc Lâm Phong |
| **2026-09-24** | Claude / Gemini | `src/document_processing/docx_reader.py` | Viết hàm đọc file DOCX với python-docx | Kiểm tra style-based heading detection, page break counting | Châu Quốc Lâm Phong |
| **2026-09-24** | Claude / Gemini | `src/document_validation/validator.py` | Viết module kiểm tra định dạng và kích thước file | Kiểm tra 3 loại exception, size bounds, extension whitelist | Châu Quốc Lâm Phong |
| **2026-09-24** | Claude / Gemini | `tests/test_document_processing.py` | Viết bộ unit test cho Ingestion & Chunker | Chạy pytest, kiểm tra các trường hợp biên (file thiếu, rỗng, sai định dạng) | Châu Quốc Lâm Phong |
| **2026-09-25** | Claude / Gemini | `src/genai_pipeline/gemini_client.py` | Viết client gọi Gemini API kèm exponential backoff retry | Bổ sung bắt lỗi `APITimeoutError`, ẩn API key qua `.env`, test retry 3 lần | Châu Quốc Lâm Phong |
| **2026-09-25** | Claude / Gemini | `src/genai_pipeline/response_schemas.py` | Định nghĩa schema Pydantic: `OnboardingPlan`, `Module`, `Task`, `Quiz` | Bắt buộc thuộc tính `source_citation` với `exact_quote` và `page_number` | Châu Quốc Lâm Phong |
| **2026-09-25** | Claude / Gemini | `src/prompt_templates/onboarding_plan_v1.txt` | Soạn prompt template có định dạng JSON schema | Thử nghiệm thủ công trên Google AI Studio, tinh chỉnh cấu trúc đầu ra | Châu Quốc Lâm Phong |
| **2026-09-25** | Claude / Gemini | `src/genai_pipeline/plan_generator.py` | Viết hàm sinh lộ trình onboarding từ chunks | Xử lý lỗi protobuf schema của Gemini bằng `response_mime_type: application/json` | Châu Quốc Lâm Phong |
| **2026-09-25** | Claude / Gemini | `src/genai_pipeline/quiz_generator.py` | Viết hàm sinh câu hỏi trắc nghiệm kiểm chứng | Kiểm tra tính liên kết giữa câu hỏi và trích dẫn gốc trong tài liệu | Châu Quốc Lâm Phong |
| **2026-09-26** | Claude / Gemini | `src/schemas/comparison_contract.py` | Thiết kế contract chung kết quả so sánh 2 pipeline | Thống nhất cấu trúc `ComparisonReport`, `ComparisonItem`, `HallucinationFlag` | Cả nhóm |
| **2026-09-26** | Claude / Gemini | `src/comparison_engine/engine.py` | Viết logic so sánh field-by-field song song | Tính match_score độc lập không dùng AI, đảm bảo tính khách quan | Châu Quốc Lâm Phong & Quỳnh Nhi |
| **2026-09-26** | Claude / Gemini | `src/hallucination_checks/detector.py` | Viết bộ phát hiện ảo giác (Hallucination Detector) | Nâng cấp thuật toán trích xuất số nguyên `\b\d+\b` để bắt lỗi sửa ngày phép | Châu Quốc Lâm Phong |
| **2026-09-26** | Claude / Gemini | `src/contradiction_checks/checker.py` | Viết bộ phát hiện mâu thuẫn chính sách nội bộ | Kiểm tra regex phát hiện mâu thuẫn thời hạn đổi mật khẩu và thông báo nghỉ | Quỳnh Nhi |
| **2026-09-26** | Claude / Gemini | `src/security/injection_filter.py` | Viết khiên lọc mã độc Prompt Injection | Quét regex chặn các chuỗi `SYSTEM OVERRIDE`, `DAN`, `ignore previous instructions` | Quỳnh Nhi & Lâm Phong |
| **2026-09-26** | Claude / Gemini | `tests/test_adversarial.py` | Xây dựng 11 kịch bản kiểm thử bẫy tấn công | Chạy 11/11 tests pass, xác nhận hệ thống tự hạ về `MANUAL_REVIEW_REQUIRED` | Lê Thị Kiều Duyên |
| **2026-09-27** | Claude / Gemini | `src/document_processing/pdf_reader.py` | Gia cố xử lý edge cases (file scan, mã hóa, Unicode) | Thêm kiểm tra `pdf.is_encrypted`, ném `PDFReadError`, chuẩn hóa NFC | Châu Quốc Lâm Phong |
| **2026-09-27** | Claude / Gemini | `src/document_processing/docx_reader.py` | Bổ sung trích xuất dữ liệu Bảng (Tables) trong DOCX | Đọc toàn bộ các cell trong table, gộp nội dung dạng markdown table | Châu Quốc Lâm Phong |
| **2026-09-27** | Claude / Gemini | `hidden_test_ready/` | Xây dựng kịch bản và runner Hidden Test tự động | Chạy `run_hidden_test.py` trên tài liệu mới, xuất `hidden_test_report.json` | Châu Quốc Lâm Phong |
| **2026-09-27** | Claude / Gemini | `documentation/demo_script.md` | Biên soạn kịch bản video demo sản phẩm (05:00) | Bố cục 6 cảnh quay chi tiết, lời thoại và checklist quay cụ thể | Cả nhóm |
| **2026-09-28** | Claude / Gemini | `README.md` | Viết tài liệu hướng dẫn triển khai A – Z | Soát lỗi chính tả, xác nhận các lệnh chạy độc lập từ clone đến test | Cả nhóm |
| **2026-09-28** | Claude / Gemini | `.env.example` & `.gitignore` | Rà soát an toàn bảo mật và ẩn thông tin nhạy cảm | Kiểm tra `git log -S` đảm bảo không có API key hay secret nào bị lọt | Lê Thị Kiều Duyên |

---

## II. QUY TẮC ĐẠO ĐỨC & KIỂM SOÁT AI CỦA NHÓM

1. **Không sao chép nguyên văn (Zero Raw Copy-Paste):** Mọi đoạn code được gợi ý đều được refactor lại theo phong cách sinh viên tự nhiên, đặt tên biến phù hợp với ngữ cảnh thực tế của dự án.
2. **Không phụ thuộc AI ở luồng Ground-Truth (Pure Python Rule Engine):** Module kiểm chứng đối soát trong `src/comparison_engine/` và `src/contradiction_checks/` tuyệt đối không dùng bất kỳ SDK AI nào để đảm bảo tính khách quan và độc lập 100%.
3. **Bảo mật thông tin tối đa:** Không bao giờ đưa tài liệu nhạy cảm hay API Key của thành viên lên các dịch vụ đám mây công cộng mà không qua mã hóa hoặc kiểm soát.
