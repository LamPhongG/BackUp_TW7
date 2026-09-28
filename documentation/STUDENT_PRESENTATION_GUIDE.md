# Tài liệu báo cáo và thuyết trình bảo vệ đồ án SkillSprint AI

Dành cho sinh viên đại học và nhóm thực tập trình bày trước giảng viên, hội đồng chấm thi.  
Đề tài: SkillSprint AI - Generative AI Powerplay (TechWiz 7).  
Nhóm thực hiện: Four Angry Birds.  

## 1. Tổng quan hệ thống và kiến trúc mã nguồn

### 1.1. Mục tiêu đề tài
Trong môi trường doanh nghiệp, tài liệu nội bộ (chính sách, quy chuẩn làm việc, hướng dẫn kỹ thuật SOP) rất dài và phức tạp. Nếu sử dụng ChatGPT hoặc các mô hình LLM thông thường để tạo lộ trình đào tạo nhân viên mới (Onboarding Plan), hệ thống đối mặt với 3 rủi ro lớn:
1. Ảo giác thông tin (Hallucination): AI tự tạo ra các quyền lợi, chế độ nghỉ phép hoặc thông số kỹ thuật không có trong tài liệu công ty.
2. Xung đột chính sách (Contradictions): Tài liệu phiên bản cũ mâu thuẫn với phiên bản mới, hoặc SOP xung đột với tài liệu FAQ chung.
3. Mã độc chỉ thị (Prompt Injection): Tài liệu chứa văn bản độc hại nhằm chiếm quyền điều khiển LLM (Jailbreak).

Giải pháp của SkillSprint AI: Xây dựng kiến trúc hệ thống kiểm định 2 luồng song song (Dual-Pipeline Verification System):
- Luồng 1 (Pipeline 1, GenAI): Sử dụng Google Gemini API với kỹ thuật Structured Output (Pydantic Schema) và Source Grounding để sinh kế hoạch học tập chi tiết, có trích dẫn nguyên văn (`exact_quote`).
- Luồng 2 (Pipeline 2, Rule Engine Python): Độc lập 100% với AI, sử dụng mã nguồn Python thuần túy để đọc Role Requirement Matrix từ DB/CSV, tính toán Coverage Score, kiểm tra quan hệ tiên quyết (Prerequisite DAG), và đối soát ngược các chunk tài liệu.
- Bộ so sánh đối soát chéo (Comparator Engine): So khớp từng dòng giữa Luồng 1 và Luồng 2. Nếu AI sinh ra nội dung không có trong văn bản được duyệt hoặc thiếu yêu cầu bắt buộc, hệ thống lập tức gắn cờ và hạ trạng thái, ngăn phát hành giáo án lỗi.

### 1.2. Cấu trúc thư mục dự án

```text
TechWiz7-FourAngryBirds-SkillSprint-AI/
├── backend/                       # Web API Backend (FastAPI, SQLite/PostgreSQL, SQLAlchemy)
│   ├── app/
│   │   ├── api/routes/            # Endpoints: auth, documents, paths, users, invite, catalog
│   │   ├── comparator/            # Step 46: Dual-Pipeline Comparator Engine
│   │   ├── core/                  # Cấu hình, bảo mật JWT, regex injection filter
│   │   ├── db/                    # Session, database init, seed data 10 roles và 28 docs
│   │   ├── genai_pipeline/        # Pipeline 1: Gemini client, prompt templates, grounding
│   │   ├── ingestion/             # Bóc tách PDF/DOCX, chia chunk theo cấu trúc section
│   │   ├── models/                # SQLAlchemy ORM models (Users, Paths, Documents, Chunks)
│   │   ├── rule_pipeline/         # Pipeline 2: Python Rule Engine, Coverage, Matrix
│   │   ├── schemas/               # Pydantic validation schemas
│   │   └── services/              # Nghiệp vụ: path_checks, progress, enrollments, reports
│   └── tests/                     # 364 Unit và Integration Tests tự động (100% Passed)
│
├── frontend/                      # Web Single Page Application (React, Vite, CSS hiện đại)
│   ├── src/
│   │   ├── components/path/       # UI linh kiện: DualComparisonTable, GenerationProgress, Certificate
│   │   ├── contexts/              # Quản lý state toàn cục: Paths, Documents, Enrollments, Language
│   │   ├── locales/               # Hỗ trợ song ngữ chuẩn xác (vi.js, en.js)
│   │   ├── pages/                 # Giao diện phân quyền 3 Role: Admin, HR, Employee, Reviewer
│   │   └── utils/                 # Path generator dự phòng, kiểm định logic, xuất báo cáo
│   └── tests/                     # 95 Vitest Component và Logic Tests (100% Passed)
│
├── src/                           # Gói thuật toán lõi độc lập (Python Core Package)
│   ├── comparison_engine/         # Logic so sánh chéo và phân loại trạng thái
│   ├── contradiction_checks/      # Phát hiện xung đột văn bản và quy tắc thứ tự ưu tiên
│   ├── document_processing/       # Bộ đọc PyMuPDF và python-docx chuẩn
│   ├── hallucination_checks/      # Đối soát trích dẫn nguồn gốc với chunk DB
│   └── security/                  # Bộ lọc Prompt Injection 2 lớp (EN và VI)
│
├── tests/                         # 88 Unit Tests kiểm định gói thuật toán lõi (100% Passed)
├── hidden_test_ready/             # Test harness chạy tự động đánh giá Hidden Test của ban giám khảo
├── sample_documents/              # 28 tài liệu tri thức doanh nghiệp đầy đủ (PDF, DOCX, TXT, MD, CSV)
├── role_matrix/                   # Role Requirement Matrix (203 yêu cầu chuẩn hóa)
└── documentation/                 # Toàn bộ tài liệu thiết kế, kịch bản demo, ERD và hướng dẫn
```

## 2. Bảng đối chiếu chi tiết 63 steps theo đặc tả SRS

Dưới đây là bảng ánh xạ từng bước từ đề bài SRS sang file mã nguồn và hàm thực thi cụ thể:

| Step SRS | Tên chức năng theo đề tài | File mã nguồn triển khai | Mô tả kỹ thuật cụ thể |
|:---|:---|:---|:---|
| Step 1 | Company Document Dataset Creation | `sample_documents/` | Tập 28 tài liệu nội bộ (DOC-01..28) bao phủ 10 phòng ban |
| Step 2 | Multiple Job Roles | `backend/app/models/organization.py` | 10 chức danh nghề nghiệp chuẩn hóa: Software Eng, HR, Finance, CS |
| Step 3 | Document Variation | `sample_documents/` | Đa dạng định dạng: PDF (PyMuPDF), DOCX (python-docx), TXT, MD, CSV |
| Step 4 | Document Upload | `backend/app/api/routes/documents.py` | API tải file đa luồng kèm thanh tiến trình và lưu trữ an toàn |
| Step 5 | Document Validation | `backend/app/ingestion/validation.py` | Kiểm tra Magic Bytes, mã băm SHA-256 chống trùng lặp, giới hạn dung lượng |
| Step 6 | Document Parsing | `backend/app/ingestion/extractors/` | Trích xuất nội dung giữ nguyên tiêu đề mục, bảng biểu và số trang |
| Step 7 | Content Chunking | `backend/app/ingestion/chunker.py` | Phân đoạn theo Section Heading, gắn mã `{doc_id, chunk_id, section_id, heading, page}` |
| Step 8 | Document Version Control | `backend/app/services/documents.py` | Vòng đời chính sách: `active`, `superseded`, `expired`, `upcoming` |
| Step 9 | Employee Profile Creation | `backend/app/api/routes/users.py` | Tạo hồ sơ nhân viên, gắn phòng ban, chức vụ và cấp độ kinh nghiệm |
| Step 10 | Role Requirement Matrix | `role_matrix/role_matrix.csv` | 203 dòng yêu cầu kỹ năng và quy định pháp lý cho từng chức danh |
| Step 11 | Requirement Extraction | `backend/app/rule_pipeline/matrix.py` | Phân loại yêu cầu bắt buộc (Mandatory) và thông tin tham khảo (Optional) |
| Step 12 | Personalized Onboarding Plan Generation | `backend/app/genai_pipeline/generator.py` | Sinh lộ trình học tập cá nhân hóa dựa trên vị trí và phòng ban |
| Step 13 | Multi-Stage Onboarding Plan | `backend/app/genai_pipeline/types.py` | Cấu trúc đa giai đoạn: Tuần 1 (Hòa nhập), Tuần 2 (Chuyên môn), Tháng 1 (Độc lập) |
| Step 14 | Learning Module Generation | `backend/app/genai_pipeline/generator.py` | Sinh các module học tập hoàn chỉnh: Mục tiêu, Nội dung đọc, Tóm tắt |
| Step 15 | Source-Grounded Generation | `backend/app/genai_pipeline/grounding.py` | Ràng buộc AI chỉ được trả lời dựa trên chunk đã nạp, bắt buộc trích dẫn `exact_quote` |
| Step 16 | Role-Specific Learning | `backend/app/genai_pipeline/relevance.py` | Lọc bỏ thông tin của vị trí khác (lập trình viên không học quy trình kế toán) |
| Step 17 | Checklist Generation | `backend/app/genai_pipeline/generator.py` | Sinh bảng kiểm công việc cụ thể ngày đầu nhận việc |
| Step 18 | Role-Specific Task Generation | `backend/app/genai_pipeline/generator.py` | Sinh nhiệm vụ thực hành sát với vai trò chuyên môn |
| Step 19 | Scenario-Based Task Generation | `backend/app/genai_pipeline/generator.py` | Tình huống thực tế kèm tiêu chí hoàn thành (`completion_criteria`) |
| Step 20 | Quiz Generation | `backend/app/genai_pipeline/generator.py` | Bộ câu hỏi trắc nghiệm 4 lựa chọn (A, B, C, D) kiểm tra kiến thức |
| Step 21 | Quiz Traceability | `backend/app/services/path_checks.py` | Đáp án đúng bắt buộc phải nằm trong đoạn trích dẫn của tài liệu gốc |
| Step 22 | Distractor Validation | `backend/app/genai_pipeline/prompts/` | Phương án gây nhiễu hợp lý nhưng không được mâu thuẫn với sự thật |
| Step 23 | Assessment Generation | `backend/app/genai_pipeline/generator.py` | Bài kiểm tra tổng hợp cuối giai đoạn đánh giá năng lực |
| Step 24 | Assessment Rubric | `backend/app/genai_pipeline/schemas.py` | Tiêu chí chấm điểm rõ ràng (Rubric) theo các thang đo cụ thể |
| Step 25 | Difficulty Levels | `backend/app/genai_pipeline/types.py` | Phân hóa 3 cấp độ: Beginner (Cơ bản), Intermediate, Advanced (Nâng cao) |
| Step 26 | Prerequisite Management | `backend/app/services/path_checks.py` | Quản lý điều kiện tiên quyết: học kiến thức cơ sở trước khi vào bài nâng cao |
| Step 27 | Learning Sequence Validation | `backend/app/services/path_checks.py` | Kiểm tra thứ tự logic: quy tắc dạy trước rồi mới kiểm tra |
| Step 28 | Python Requirement Validation Engine | `backend/app/rule_pipeline/coverage.py` | Luồng Python thuần độc lập tính điểm đối soát mà không cần gọi AI |
| Step 29 | Coverage Score | `backend/app/rule_pipeline/coverage.py` | Tỷ lệ % các yêu cầu bắt buộc trong Role Matrix được đáp ứng trong giáo trình |
| Step 30 | Traceability Score | `backend/app/comparator/engine.py` | Tỷ lệ % nội dung giáo án có thể truy vết về chính xác chunk ID và số trang |
| Step 31 | Hallucination Detection | `backend/app/comparator/engine.py` | Phát hiện số liệu hoặc quyền lợi mà AI tự tạo không có trong chunk DB |
| Step 32 | Unsupported Content Detection | `backend/app/comparator/engine.py` | Đánh dấu Unsupported các mục không ánh xạ được về bất kỳ chunk ID nào |
| Step 33 | Contradiction Detection | `backend/app/services/path_checks.py` | Phát hiện các điều khoản xung đột giữa các văn bản hoặc câu hỏi nghịch lý |
| Step 34 | Policy Precedence Rules | `backend/app/services/path_checks.py` | Áp dụng thứ tự ưu tiên: Bản mới thay bản cũ; Quy chuẩn chi tiết SOP ưu tiên hơn FAQ |
| Step 35 | Duplicate Learning Detection | `backend/app/services/path_checks.py` | Thuật toán `SequenceMatcher` (ngưỡng 0.85) phát hiện trùng lặp nội dung module |
| Step 36 | Role Relevance Validation | `backend/app/genai_pipeline/relevance.py` | Đảm bảo 100% nội dung bài học liên quan trực tiếp đến chức danh nhân sự |
| Step 37 | GenAI Structured Output | `backend/app/genai_pipeline/schemas.py` | Ép chuẩn Pydantic Model, loại bỏ việc LLM sinh văn bản tự do |
| Step 38 | Schema Validation | `backend/app/genai_pipeline/client.py` | Xử lý bóc tách JSON và tự động sửa định dạng nếu có khối markdown bọc ngoài |
| Step 39 | GenAI Retry and Recovery | `backend/app/genai_pipeline/client.py` | Cơ chế Exponential Backoff 3 lần và chuỗi model dự phòng khi gặp lỗi 429/503 |
| Step 40 | Prompt Template Management | `backend/app/genai_pipeline/prompts/` | Quản lý phiên bản Prompt có tổ chức tách biệt từng file markdown |
| Step 41 | Prompt Version Tracking | `backend/app/models/learning_path.py` | Ghi vết mã phiên bản prompt (v1.0, v1.1) trong siêu dữ liệu lộ trình |
| Step 42 | Prompt Injection Defense | `backend/app/core/injection_filter.py` | Bộ lọc 2 tầng Regex và Semantic quét mã độc chỉ thị cả tiếng Anh lẫn tiếng Việt |
| Step 43 | Adversarial Document Testing | `tests/test_adversarial.py` | Bộ kiểm thử tự động với tài liệu bẫy tấn công (DOC-18) |
| Step 44 | GenAI Consistency Check | `src/comparison_engine/consistency.py` | Kiểm tra tính nhất quán cấu trúc khi sinh nhiều lần |
| Step 45 | Generation Consistency Score | `src/genai_pipeline/consistency_checker.py` | Đo lường độ ổn định cấu trúc và nội dung sinh ra |
| Step 46 | Python and GenAI Result Comparison | `backend/app/comparator/engine.py` | So khớp đối chứng ma trận giữa Output AI và Ground Truth Python |
| Step 47 | Final Verification Status | `backend/app/comparator/engine.py` | Phân loại trạng thái: `Verified`, `Verified with Warning`, `Incomplete`, `Unsupported`, `Flagged` |
| Step 48 | Human Review Workflow | `frontend/src/pages/reviewer/` | Giao diện Reviewer phê duyệt, yêu cầu sửa đổi hoặc góp ý từng mục |
| Step 49 | Reviewer Override | `backend/app/api/routes/paths.py` | Cho phép Reviewer ghi đè phán quyết kèm lý do giải trình bắt buộc (Audit Log) |
| Step 50 | Employee Learning Dashboard | `frontend/src/pages/employee/` | Cổng thông tin nhân viên: xem lộ trình, đọc bài, làm quiz, nhận chứng chỉ |
| Step 51 | Administrator Dashboard | `frontend/src/pages/admin/` | Bảng điều khiển quản trị hệ thống, quản lý tài khoản, xem thống kê |
| Step 52 | Role Dashboard | `frontend/src/pages/admin/` | Thống kê số lượng lộ trình và phân bổ theo từng vị trí phòng ban |
| Step 53 | Progress Tracking | `backend/app/services/progress.py` | Lưu trữ tiến độ bài học, điểm số trắc nghiệm trên server |
| Step 54 | Progress Assessment | `backend/app/models/enums.py` | Chuyển đổi trạng thái tiến độ: `not_started`, `in_progress`, `completed` |
| Step 55 | Adaptive Recommendation | `frontend/src/pages/employee/Explore.jsx` | Khuyến nghị lộ trình học bổ sung dựa trên phòng ban và kết quả yếu |
| Step 56 | Weak-Area Identification | `backend/tests/test_weak_areas.py` | Phân tích các câu hỏi làm sai để chỉ ra phần kiến thức nhân viên chưa nắm vững |
| Step 57 | Policy Update Detection | `backend/app/services/documents.py` | Tự động phát hiện khi có phiên bản tài liệu mới được tải lên |
| Step 58 | Impact Analysis | `backend/app/services/paths.py` | Phân tích các lộ trình đang dùng phiên bản tài liệu cũ bị ảnh hưởng |
| Step 59 | Selective Regeneration | `src/genai_pipeline/selective_regenerator.py` | Tái tạo riêng các module bị ảnh hưởng thay vì phải sinh lại toàn bộ lộ trình |
| Step 60 | Training Plan Comparison | `frontend/src/components/path/PlanComparisonModal.jsx` | So sánh trực quan điểm khác biệt giữa bản cũ và bản mới sau khi cập nhật chính sách |
| Step 61 | Search and Filtering | `frontend/src/pages/shared/PathList.jsx` | Tìm kiếm và lọc lộ trình theo chức danh, phòng ban, độ khó, trạng thái |
| Step 62 | Reports | `frontend/src/pages/hr/Reports.jsx` | Báo cáo chi tiết: Tỷ lệ tuân thủ, Tiến độ nhân sự, Thống kê kiểm định AI |
| Step 63 | Export | `frontend/src/utils/exportHelpers.js` | Xuất dữ liệu giáo trình và báo cáo ra các định dạng chuẩn PDF, JSON, CSV |

## 3. Các câu hỏi thường gặp khi bảo vệ đồ án

### Câu hỏi 1: Tại sao nhóm lại dùng kiến trúc 2 luồng (Dual-Pipeline)? Dùng một mình Gemini có được không?
Trả lời:
Nếu chỉ dùng một mình GenAI, hệ thống hoàn toàn mang tính chất hộp đen. Không thể đảm bảo mô hình ngôn ngữ sẽ không bị ảo giác hoặc bị lừa bởi Prompt Injection.  
Do đó, nhóm thiết kế Lớp 2 (Pipeline 2) là một Rule Engine viết bằng Python thuần, độc lập với AI. Rule Engine dựa vào ma trận Role Requirement Matrix và các đoạn tài liệu đã được ký số (Chunk Hash) để kiểm tra độc lập.  
Sau đó, Bộ Comparator Engine so sánh chéo giữa kết quả sinh của AI và ma trận sự thật. Chỉ khi nào AI đáp ứng đầy đủ yêu cầu và trích dẫn chuẩn xác, hệ thống mới gắn nhãn Verified.

### Câu hỏi 2: Hệ thống làm thế nào để đảm bảo không bị Hallucination (Ảo giác)?
Trả lời:
Hệ thống chặn Hallucination ở 2 cấp độ:  
- Cấp độ 1 (Ingestion và Prompt): Chỉ nạp vào prompt các chunk tài liệu đã được duyệt của đúng vị trí công việc. Ép LLM tuân thủ Pydantic Schema, bắt buộc mọi bài học và câu hỏi trắc nghiệm phải có trường `source_reference` chứa `exact_quote` nguyên văn.  
- Cấp độ 2 (Python Grounding và Comparator): Khi LLM trả kết quả về, hàm `check_knowledge()` trong Python lấy từng câu `exact_quote` đối soát ngược lại với chuỗi văn bản trong Database chunk. Nếu câu trích không tồn tại hoặc sai lệch so với bản gốc, hệ thống gắn cờ `hallucination` ngay lập tức và chặn không cho phát hành.

### Câu hỏi 3: Khi có một tài liệu chính sách mới (ví dụ DOC-02 v1.1 thay thế v1.0), hệ thống xử lý như thế nào?
Trả lời:
Hệ thống có cơ chế Document Version Control (SRS Step 8, 57, 58, 59):  
1. Khi HR tải lên tài liệu mới có mã `DOC-02 v1.1` và trường `supersedes: v1.0`, hệ thống tự động đổi trạng thái của bản v1.0 thành `superseded` hoặc `obsolete`.  
2. Hệ thống chạy Impact Analysis để liệt kê các lộ trình đang dùng bản v1.0.  
3. Cơ chế Selective Regeneration (Step 59) cho phép hệ thống chỉ sinh lại các module trích dẫn từ DOC-02 mà giữ nguyên các module khác, tiết kiệm chi phí token và giữ vững tính ổn định của giáo án.

### Câu hỏi 4: Nhóm đã kiểm thử hệ thống như thế nào để chứng minh chất lượng phần mềm?
Trả lời:
Toàn bộ hệ thống được bảo vệ bởi 547 bài kiểm thử tự động (Automated Tests), đạt tỷ lệ Passed 100%:  
- 364 Pytest backend tests: Kiểm thử toàn diện API, xác thực JWT, phân quyền, vòng đời lộ trình, bộ lọc Prompt Injection, ma trận vai trò và comparator engine.  
- 88 Pytest core algorithm tests (`tests/`): Kiểm thử độc lập khả năng trích xuất PDF/DOCX, tính toán Coverage Score và phòng thủ kịch bản tấn công đối kháng (Adversarial Testing).  
- 95 Vitest frontend tests: Kiểm thử logic giao diện, chia chunk trình duyệt, quy chuẩn i18n và luồng thao tác người dùng.  
Mọi thay đổi mã nguồn đều phải vượt qua toàn bộ 547 test này trước khi được phát hành.

## 4. Hướng dẫn thao tác demo trực tiếp trước hội đồng

Khi được yêu cầu biểu diễn hệ thống trực tiếp, thực hiện theo 4 bước sau:

1. Bước 1, Đăng nhập bằng tài khoản HR:  
   Email: `hr@fourangrybirds.vn` | Password: `password123`  
   Mở menu Tài liệu: Chỉ ra 28/28 tài liệu tri thức đã được nạp và phân loại phiên bản.
2. Bước 2, Tạo lộ trình học tập tự động:  
   Vào menu Tạo lộ trình. Chọn phòng ban Engineering, vị trí Software Engineer.  
   Chỉ cho thầy cô thấy hệ thống tự động khóa và chọn sẵn các tài liệu bắt buộc theo Role Requirement Matrix.  
   Bấm nút Sinh bằng AI: Quan sát màn hình tiến độ 6 bước thời gian thực (Job Polling).
3. Bước 3, Thẩm định lộ trình và Đối soát 2 luồng:  
   Mở chi tiết lộ trình vừa sinh. Bấm vào tab Thẩm định và Kiểm tra.  
   Bấm Mở bảng đối soát 2 luồng (Dual-Pipeline Comparison):  
   Chỉ ra bảng so sánh chi tiết giữa Pipeline 1 (GenAI) và Pipeline 2 (Python Ground Truth) với từng trường dữ liệu, tỷ lệ Traceability và trạng thái Verified.
4. Bước 4, Đăng nhập tài khoản Nhân viên để làm bài:  
   Đăng nhập `employee@fourangrybirds.vn` | Password: `password123`  
   Vào trang chủ: Lộ trình đã được tự động gán. Mở học phần đầu tiên, đọc nội dung trích dẫn nguồn, làm bài trắc nghiệm và bấm nộp bài để xem hệ thống chấm điểm và ghi nhận tiến độ học tập trên server.
