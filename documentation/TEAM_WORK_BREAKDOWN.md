cat << 'EOF' > documentation/TEAM_WORK_BREAKDOWN.md
# SKILLSPRINT AI - WORK BREAKDOWN STRUCTURE (WBS)
**Dự án:** SkillSprint AI – Dual-Pipeline AI Document Verification System  
**Cuộc thi:** TechWiz 7 – Generative AI Powerplay Track  
**Quy mô đội thi:** 4 thành viên | **Thời gian:** 5 ngày (5 Phases)

---

## I. MA TRẬN TRÁCH NHIỆM TỔNG QUAN (RACI MATRIX)

| Thành viên | Vai trò chuyên trách | Nhánh Git phụ trách | Thư mục code đảm nhận |
| :--- | :--- | :--- | :--- |
| **Thành viên 1** | **AI & Ingestion Engineer** | `feat/genai-pipeline` | `src/document_processing/`<br>`src/document_validation/`<br>`src/genai_pipeline/`<br>`src/prompt_templates/` |
| **Thành viên 2** | **Backend & Rule Engine Engineer** | `feat/python-rule-engine` | `src/python_validation/`<br>`src/role_matrix/`<br>`src/comparison_engine/`<br>`src/hallucination_checks/`<br>`src/contradiction_checks/` |
| **Thành viên 3** | **Fullstack & Database Developer** | `feat/frontend-dashboard` | `src/database/`<br>`templates/`<br>`static/`<br>`src/schemas/` |
| **Thành viên 4** | **QA, Security, Data & Docs Lead** | `docs/test-and-reports` | `tests/`<br>`sample_documents/`<br>`hidden_test_ready/`<br>`documentation/`<br>`reports/` |

---

## II. BẢNG PHÂN CÔNG CHI TIẾT THEO TỪNG GIAI ĐOẠN (5 PHASES)

### 🔹 PHASE 1: Thiết lập Môi trường, Dữ liệu Nền tảng & CSDL (Ngày 1)
* **Mục tiêu:** Hoàn thiện hạ tầng dự án, liên kết CSDL PostgreSQL, tạo khung schema và bộ dữ liệu ban đầu.

| Thành viên | Nhiệm vụ cụ thể | Thư mục / File thực hiện | Sản phẩm bàn giao (Deliverables) |
| :--- | :--- | :--- | :--- |
| **Thành viên 1** | Viết module đọc file PDF/DOCX, trích xuất text và bóc tách thành các `document_chunks` kèm metadata (`doc_id`, `chunk_id`, `section_id`, `page`). | `src/document_processing/`<br>`src/document_validation/` | Script đọc file chạy trơn tru, lưu cấu trúc chunk chuẩn. |
| **Thành viên 2** | Dựng khung API FastAPI, khai báo toàn bộ các Pydantic Schemas định nghĩa cấu trúc Plan, Module, Task, Quiz. | `src/schemas/models.py`<br>`main.py` | Tài liệu Swagger UI (`/docs`) hiển thị đầy đủ schema request/response. |
| **Thành viên 3** | Thiết lập kết nối PostgreSQL qua SQLAlchemy, chạy mã tạo 11 bảng CSDL và nạp dữ liệu mẫu (Seed Data). | `src/database/connection.py`<br>`src/database/models.py` | CSDL tạo đủ 11 bảng; API test kết nối DB trả về status 200 OK. |
| **Thành viên 4** | Soạn thảo 10 tài liệu chính sách mẫu (PDF/DOCX); lập bảng tiêu chuẩn `Role Requirement Matrix` cho 10 chức danh công việc. | `sample_documents/`<br>`src/role_matrix/` | Đủ 10 file tài liệu và bảng ma trận yêu cầu vai trò định dạng CSV/JSON. |

---

### 🔹 PHASE 2: Xây dựng Độc lập 2 Đường ống (Dual Pipeline Core) (Ngày 2)
* **Mục tiêu:** Pipeline 1 (GenAI sinh dữ liệu) và Pipeline 2 (Python Rule Engine) vận hành độc lập, đáp ứng tiêu chuẩn đề bài.

| Thành viên | Nhiệm vụ cụ thể | Thư mục / File thực hiện | Sản phẩm bàn giao (Deliverables) |
| :--- | :--- | :--- | :--- |
| **Thành viên 1** | Tích hợp Google Gemini Pro API dùng Pydantic `response_schema` để sinh Kế hoạch, Nhiệm vụ, Trắc nghiệm; quản lý template prompt kèm `prompt_version`. | `src/genai_pipeline/`<br>`src/prompt_templates/` | API sinh JSON đúng schema 100%, có cơ chế retry khi gặp sự cố mạng/quota. |
| **Thành viên 2** | Lập trình Python thuần túy đối soát bảng `Role Requirement Matrix`, tính chỉ số `Coverage Score`, kiểm tra thứ tự học tiên quyết (`Prerequisite Check`). | `src/python_validation/`<br>`src/role_matrix/` | Engine Python tính đúng tỷ lệ % bao phủ chính sách, không phụ thuộc AI. |
| **Thành viên 3** | Xây dựng màn hình tải tài liệu (*Document Ingestion*) và giao diện hiển thị lộ trình kế hoạch đào tạo tổng quan. | `templates/ingestion.html`<br>`templates/plan_detail.html` | Người dùng upload được file và xem danh sách các bài học sinh ra. |
| **Thành viên 4** | Soạn thảo đủ 20 tài liệu doanh nghiệp mẫu; bắt đầu viết dàn ý chi tiết báo cáo đồ án (*Project Report*). | `sample_documents/`<br>`documentation/` | Đủ 20 file tài liệu mẫu trong repo; khung tài liệu báo cáo kỹ thuật. |

---

### 🔹 PHASE 3: Tích hợp Đối soát chéo & Giao diện Reviewer (Ngày 3)
* **Mục tiêu:** Hoàn thiện Comparison Engine so khớp 2 luồng, phát hiện ảo giác và hỗ trợ ban giám khảo thẩm định.

| Thành viên | Nhiệm vụ cụ thể | Thư mục / File thực hiện | Sản phẩm bàn giao (Deliverables) |
| :--- | :--- | :--- | :--- |
| **Thành viên 1 & 2** | Viết logic Comparison Engine đối chiếu output 2 luồng; phát hiện ảo giác (*Hallucination Check*), phân loại trạng thái: `Verified`, `Verified with Warning`, `Manual Review Required`. | `src/comparison_engine/`<br>`src/hallucination_checks/` | Module đối soát tự động cảnh báo cờ đỏ khi phát hiện số liệu AI bịa ra. |
| **Thành viên 3** | Xây dựng giao diện **Dual Comparison View** (2 cột so sánh song song) và các nút thao tác `Approve`, `Reject`, `Override` ghi vết vào `audit_logs`. | `templates/reviewer_dashboard.html`<br>`static/js/comparison.js` | Giao diện Reviewer tương tác mượt mà, lưu chính xác log phê duyệt vào DB. |
| **Thành viên 4** | Chuẩn bị và đưa vào hệ thống 10 kịch bản tiêm lệnh (*Prompt Injection*) và 10 ca tài liệu mâu thuẫn để kiểm thử độ bền hệ thống. | `tests/test_adversarial.py`<br>`sample_documents/adversarial/` | Bộ test case bảo mật tự động xác nhận hệ thống chặn thành công bẫy. |

---

### 🔹 PHASE 4: Thử nghiệm Dữ liệu Mới, Viết Blog & Quay Video (Ngày 4)
* **Mục tiêu:** Sẵn sàng cho bài kiểm thử ẩn của ban giám khảo (Hidden Test Ready); hoàn thiện các ấn phẩm truyền thông bắt buộc.

| Thành viên | Nhiệm vụ cụ thể | Thư mục / File thực hiện | Sản phẩm bàn giao (Deliverables) |
| :--- | :--- | :--- | :--- |
| **Cả nhóm** | Thực hiện kịch bản "Hidden Test Ready": Nạp 1 tài liệu chính sách hoàn toàn mới để kiểm tra hệ thống bóc tách và sinh lộ trình bình thường. | `hidden_test_ready/` | Hệ thống xử lý tự động thành công tài liệu chưa từng thấy trước đó. |
| **Thành viên 3** | Hoàn thiện Cổng học tập cho nhân viên (*Learner Portal*): bảng checklist có ô tích hoàn thành và màn hình làm trắc nghiệm trích dẫn nguồn. | `templates/learner_portal.html`<br>`templates/quiz_view.html` | Nhân viên tích hoàn thành task và làm trắc nghiệm được tính điểm ngay. |
| **Thành viên 4** | Biên soạn và đăng tải bài viết **Technical Blog (trên 2.000 từ)** lên Medium/Dev.to; lên kịch bản quay video demo. | `documentation/BLOG_DRAFT.md` | Có đường dẫn URL bài viết kỹ thuật công khai trên 2.000 từ. |
| **Thành viên 1 & Cả nhóm** | Quay và dựng video màn hình demo hệ thống thuyết minh rõ ràng theo thời lượng quy định (định dạng `.mp4`). | `documentation/demo_script.md` | File video demo `.mp4` hoàn chỉnh sẵn sàng nộp bài. |

---

### 🔹 PHASE 5: Đóng gói Triển khai & Rà soát Bàn giao (Ngày 5)
* **Mục tiêu:** Đưa hệ thống lên môi trường trực tuyến đám mây và hoàn thiện 100% danh mục 18 đầu việc nghiệm thu.

| Thành viên | Nhiệm vụ cụ thể | Thư mục / File thực hiện | Sản phẩm bàn giao (Deliverables) |
| :--- | :--- | :--- | :--- |
| **Thành viên 3** | Triển khai ứng dụng lên Render/Railway để lấy link truy cập công khai (*Deployed URL*). | `config/`<br>`Dockerfile` | Hệ thống chạy online ổn định trên nền tảng đám mây. |
| **Thành viên 4** | Rà soát toàn bộ 18 tiêu chí trong Final Submission Checklist, hoàn thiện file `AI_USAGE.md` và xuất bản tài liệu báo cáo hoàn chỉnh (*Project Report PDF*). | `AI_USAGE.md`<br>`reports/Project_Report.pdf` | Bộ hồ sơ nghiệm thu kỹ thuật và file báo cáo đầy đủ sơ đồ kiến trúc. |
| **Thành viên 1 & 2** | Tối ưu hóa code, dọn dẹp ghi chú thừa, kiểm tra lại file `.env.example` và hoàn thiện tài liệu hướng dẫn chạy trong `README.md`. | `.env.example`<br>`README.md` | Hướng dẫn cài đặt rõ ràng, giám khảo chạy thử local thành công 100%. |
| **Cả nhóm** | Kiểm tra biểu đồ commit trên GitHub để đảm bảo phân bổ đều đặn cho cả 4 thành viên trong suốt 5 ngày. | GitHub Repository | Lịch sử commit minh bạch, phân bố đồng đều giữa các thành viên. |

---

## III. NGUYÊN TẮC LÀM VIỆC DỰ ÁN

| Tiêu chuẩn | Quy định bắt buộc |
| :--- | :--- |
| **Tần suất Commit** | Mỗi thành viên cam kết commit tối thiểu **1 - 2 lần mỗi ngày** trên nhánh riêng để ghi nhận tiến độ liên tục. |
| **Quy trình Merge** | Hoàn thành tính năng trên nhánh `feat/...` $\rightarrow$ Tạo **Pull Request (PR)** $\rightarrow$ Thành viên khác review code trước khi gộp vào `main`. |
| **Bảo mật mã nguồn** | **Tuyệt đối không commit** file `.env`, mật khẩu CSDL hoặc API Key cá nhân lên GitHub. |
| **Tính minh bạch AI** | Bắt buộc ghi lại mọi đoạn code/tài liệu có sự hỗ trợ của AI vào bảng nhật ký `AI_USAGE.md`. |
EOF