# SkillSprint AI — Backend

API FastAPI cho SkillSprint AI: đăng nhập, kho tài liệu, lộ trình học, kiểm duyệt, tiến độ học, và hai pipeline AI / Python.

> Cập nhật: 25/09/2026 · Người dựng khung: Phạm Tấn Tài
> Đây là **chuẩn chung của cả nhóm** cho phần backend. Code mới đặt đúng thư mục và làm theo mục **Quy ước**.

---

## 1. Chạy trên máy

Yêu cầu: **Python 3.12 trở lên** (đã chạy thử trên 3.14).

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

copy .env.example .env            # macOS/Linux: cp .env.example .env
# Mở .env, điền JWT_SECRET (tạo bằng lệnh ghi trong file)

alembic upgrade head              # tạo bảng
python -m app.db.seed             # 10 phòng ban, 10 vị trí, 3 tài khoản demo
uvicorn app.main:app --reload     # http://localhost:8000/api/docs
```

- Mặc định dùng SQLite tại `backend/skillsprint.db`. Muốn dùng PostgreSQL thì đặt `DATABASE_URL=postgresql+psycopg://...` trong `.env`.
- Nối frontend: tạo `frontend/.env.local` với `VITE_API_URL=http://localhost:8000/api`.
- Chạy test: `pytest` (dùng một DB tạm, không đụng DB của bạn).

Tài khoản demo (mật khẩu `Demo@123`, lưu dạng băm bcrypt):

| Vai trò | Email |
| :--- | :--- |
| HR | `hr@fourangrybirds.vn` |
| Reviewer | `reviewer@fourangrybirds.vn` |
| Nhân viên | `alex.morgan@fourangrybirds.vn` |

---

## 2. Cấu trúc thư mục

```
backend/
├── app/
│   ├── main.py              # Tạo app FastAPI, CORS, gắn router dưới /api
│   ├── core/                # config.py (đọc .env), security.py (bcrypt, JWT)
│   ├── db/                  # base.py (Base, new_id, str_enum), session.py (engine, get_db), seed.py
│   ├── models/              # ORM SQLAlchemy, mỗi file một miền nghiệp vụ
│   ├── schemas/             # Pydantic: request / response của API
│   ├── api/
│   │   ├── deps.py          # DbSession, CurrentUser, require_roles(...)
│   │   ├── router.py        # Gắn mọi router
│   │   └── routes/          # Mỗi file một nhóm endpoint
│   ├── services/            # Logic nghiệp vụ: documents, paths, path_workflow, audit, visibility
│   ├── ingestion/           # Phong: kiểm tra file, trích xuất PDF/DOCX/TXT/MD/CSV (.markdown lưu thành md), chia chunk
│   ├── genai_pipeline/      # Phong: Pipeline 1 Gemini + prompts/
│   ├── rule_pipeline/       # Nhi: Pipeline 2 Python thuần (Role Matrix, coverage, tiên quyết)
│   └── comparator/          # Nhi + Phong: so sánh 2 pipeline, hallucination, mâu thuẫn
├── alembic/                 # Migration (không sửa tay bảng trong DB)
├── tests/                   # pytest
├── requirements.txt
└── .env.example
```

| Thành viên | Làm việc ở |
| :--- | :--- |
| Phạm Tấn Tài | `core/`, `db/`, `models/`, `schemas/`, `api/`, `services/`, `alembic/` |
| Châu Quốc Lâm Phong | `ingestion/`, `genai_pipeline/` |
| Đoàn Thị Quỳnh Nhi | `rule_pipeline/`, `comparator/`, `core/injection_filter.py` (đã có bản chuyển từ frontend, cùng bộ luật; mở rộng ở đây và ở `frontend/src/utils/injectionScan.js`) |
| Lê Thị Kiều Duyên | `tests/` (kịch bản tấn công, dữ liệu kiểm thử) |

Code của pipeline **không tự mở DB và không tự tạo route**: nhận dữ liệu thuần (list chunk, dict), trả về Pydantic model. Route trong `api/routes/` gọi pipeline rồi lưu kết quả. Nhờ vậy pipeline test được mà không cần DB.

---

## 3. Cơ sở dữ liệu

13 bảng, tạo bằng migration `alembic/versions/*_initial_schema.py`:

| Bảng | Nội dung |
| :--- | :--- |
| `departments` | 10 phòng ban. Khoá là tên tiếng Anh (`Engineering`) như frontend đang dùng |
| `job_positions` | 10 vị trí (`support-engineer`…), thuộc một phòng ban |
| `users` | Tài khoản: `user_role` = `hr` / `reviewer` / `employee`, mật khẩu băm bcrypt, phòng ban, vị trí |
| `documents` | Một phiên bản của một tài liệu: mã, `family`, phiên bản, ngày hiệu lực/hết hạn, SHA-256 (chống trùng), đường dẫn file, trạng thái xử lý |
| `document_chunks` | Chunk theo contract `{doc_id, chunk_id, section_id, heading, page, content}` |
| `injection_flags` | Cờ prompt injection theo từng chunk |
| `learning_paths` | Lộ trình: trạng thái, revision, mục đích, mức độ, vị trí đích; **nội dung giai đoạn → học phần → bài học/nhiệm vụ/câu hỏi lưu ở cột JSON `stages`** |
| `path_sources` | Lộ trình được sinh từ phiên bản tài liệu nào |
| `path_assignments` | Phát hành cho phòng ban và/hoặc vị trí nào |
| `path_comments` | Góp ý Reviewer ↔ HR, gắn được vào từng mục |
| `audit_logs` | Nhật ký thao tác, chỉ thêm. Không có khoá ngoại tới lộ trình để xoá bản nháp vẫn giữ lịch sử |
| `enrollments` | Tiến độ học của nhân viên trên một lộ trình |
| `quiz_attempts` | Các lần làm bài kiểm tra |

Vì sao nội dung lộ trình để JSON thay vì các bảng `modules` / `tasks` / `quizzes`:
- HR và Reviewer luôn sửa và duyệt **cả cây** cùng lúc.
- Mỗi mục đã mang sẵn `source_reference` của nó.
- Tách bảng chỉ thêm join và thêm việc đồng bộ khi sửa.
- Tiến độ học trỏ tới id của mục trong JSON. Lộ trình đã phát hành thì chỉ đọc, nên id không đổi.

Cấu trúc JSON xem mục 7 của [documentation/FRONTEND_FLOWS.md](../documentation/FRONTEND_FLOWS.md).

---

## 4. API

Mọi endpoint nằm dưới **`/api`**. Swagger UI: `http://localhost:8000/api/docs`.

Gửi token ở header `Authorization: Bearer <access_token>`.

Lỗi nghiệp vụ trả về `{"detail": "...", "code": "err_...", "vars": {...}}`:
- `code` trùng khoá dịch của frontend (`err_duplicate_file`, `err_action_not_allowed`…), để giao diện dịch được.
- `detail` là câu tiếng Anh, dùng khi không có bản dịch.
- Lỗi validate dữ liệu là 422 theo định dạng chuẩn của FastAPI.

| Endpoint | Quyền | Trạng thái |
| :--- | :--- | :---: |
| `GET /ping`, `GET /health` (kiểm tra DB) | Công khai | ✅ |
| `POST /auth/login` → `{access_token, expires_in, user}` | Công khai | ✅ |
| `GET /auth/me` | Đã đăng nhập | ✅ |
| `GET /departments`, `GET /job-positions` | Đã đăng nhập | ✅ |
| `POST /paths/jobs`, `POST /paths/{id}/regenerate/jobs` → 202 + job; `GET /paths/jobs/{job_id}` theo dõi từng bước (kiểm tra nguồn → phân tích → dàn ý → từng học phần → ma trận → lưu) | HR (chỉ người tạo job) | ✅ |
| `GET /job-positions/{id}/required-sources`: tài liệu ma trận yêu cầu trích cho vị trí, quy về bản đang hiệu lực (`mandatory`, `status` ready / not_ready / missing, yêu cầu viết theo bản cũ) | HR, Reviewer | ✅ |
| `GET /documents`, `GET /documents/{id}` (kèm `lifecycle_status`: active / obsolete / expired / upcoming) | Tất cả; nhân viên chỉ thấy tài liệu liên quan | ✅ |
| `POST /documents` (multipart: `file` + metadata) → kiểm tra, lưu, trích xuất, chia chunk, quét injection | HR | ✅ |
| `GET /documents/{id}/chunks`, `POST /documents/{id}/process` (thử lại), `DELETE /documents/{id}` | HR (xem chunk: cả Reviewer) | ✅ |
| `GET /documents/{id}/file` (mở inline, dùng được `#page=N`) | Người thấy tài liệu | ✅ |
| `GET /paths`, `GET /paths/{id}` (kèm `allowed_actions` của người đang xem) | Theo vai trò | ✅ |
| `POST /paths`, `PATCH /paths/{id}`, `DELETE /paths/{id}`, `/regenerate`, `/submit`, `/archive` | HR (sửa và thu hồi: cả Reviewer) | ✅ |
| `POST /paths/{id}/comments`, `/comments/{cid}/resolve` | HR, Reviewer | ✅ |
| `GET /audit-logs?path_id=&action=&limit=&offset=` | HR, Reviewer | ✅ |
| `POST /invite` (tạo link mời theo vị trí, gửi email nếu có `invited_email`), `GET /invite`, `DELETE /invite/{token}` (thu hồi) | HR (chỉ lời mời mình tạo) | ✅ |
| `GET /invite/{token}`, `POST /invite/{token}/register` (nhân viên tự tạo tài khoản, vai trò `employee`, đúng vị trí và phòng ban của lời mời) | Công khai, cần token còn hiệu lực | ✅ |
| `/paths/{id}/approve` (server chạy lại kiểm định), `/request-changes` | Reviewer | ✅ |
| `GET /paths/{id}/checks` (kiểm định phía server) | HR, Reviewer | ✅ |
| `/enrollments`, `/quiz-attempts` | Nhân viên | ⬜ Tài |
| Sinh nội dung: `POST /paths` / `/regenerate` không kèm `content` → Pipeline 1 | HR | ✅ (Coverage của Pipeline 2: ⬜ Nhi) |

**Tạo lộ trình:** `POST /paths` không kèm `content` thì server tự sinh (mục 8). Vẫn nhận `content` gửi lên (ví dụ để test); server kiểm tra cấu trúc, id không trùng, đáp án hợp lệ, giai đoạn đúng mục đích và độ dài, và tài liệu nguồn đã xử lý xong.
- `duration_days` (7 / 30 / 90, chỉ với hội nhập, mặc định 90) cắt mẫu giai đoạn. Giá trị được lưu ở `learning_paths.duration_days`; sinh lại và sửa đều dùng giá trị này.
- **Tài liệu bắt buộc** (`services/role_matrix.py`: `required_sources`, `missing_mandatory_sources`), áp dụng cả khi tạo lẫn khi sinh lại:
  - Bỏ sót bản đang hiệu lực, đã xử lý xong, của một tài liệu bắt buộc → 422 `err_mandatory_sources`.
  - Tài liệu bắt buộc không chọn được (chưa có trong kho, chưa xử lý xong, hoặc chỉ còn bản cũ) → vẫn sinh, ghi vào `generation.mandatory_unavailable`.
  - Kiểm định luôn báo `reason_mandatory_sources_missing`, kể cả khi tài liệu bắt buộc được tải lên sau khi lộ trình đã sinh.

**Lời mời nhân viên** (`api/routes/invite.py`, `core/email.py`):
- Token 32 byte ngẫu nhiên, dùng một lần, hết hạn sau 1–30 ngày. Link đã dùng, hết hạn hoặc bị thu hồi trả 410 `err_invite_expired`.
- Email gửi qua SMTP (`SMTP_*`, `FRONTEND_URL` trong `.env`). Chưa cấu hình hoặc máy chủ từ chối thì lời mời vẫn được tạo, response có `email_sent: false` để HR tự gửi link.
- Email xác nhận tài khoản không chứa mật khẩu. Tên người và vị trí được escape trước khi đưa vào HTML.
- Test không bao giờ gửi email thật: `conftest.py` xoá `SMTP_HOST`, `tests/test_invite.py` thay `smtplib.SMTP` bằng bản giả.

**Quyền do server kiểm tra:** bảng quyền trong `services/path_workflow.py` là bản chép từ `frontend/src/utils/pathWorkflow.js`. Sửa một bên thì phải sửa bên còn lại.
- Vai trò không bao giờ có quyền làm thao tác đó → 403.
- Có quyền nhưng sai trạng thái lộ trình → 409.
- Lộ trình mà người dùng không được thấy → 404, để không lộ việc nó tồn tại.

---

## 5. Quy ước

**Code**
- Code, docstring, comment và thông báo lỗi viết bằng **tiếng Anh**. Tài liệu viết tiếng Việt.
- Comment chỉ giải thích *vì sao*, không mô tả *làm gì* (Rules mục 1).
- Bắt lỗi cụ thể, không dùng `except Exception: pass`.
- Route mỏng: kiểm tra quyền → gọi service/pipeline → trả schema. Logic dùng chung đặt ở `services/`.
- Quyền: `user: CurrentUser` cho người đã đăng nhập; `Depends(require_roles(UserRole.HR))` để giới hạn vai trò. **Server tự kiểm tra quyền và trạng thái**, không tin frontend.
- Id công khai tạo bằng `new_id("LP")` → `LP-3F9A1C0B2E`.
- Cột enum dùng `str_enum(EnumClass, "<tên cột>")`: lưu dạng chuỗi + CHECK, chạy giống nhau trên SQLite và PostgreSQL. Giá trị enum phải khớp frontend.
- Secret và URL đọc qua `get_settings()`, không hard-code, không dùng `os.getenv` rải rác.

**Đổi schema DB**
1. Sửa hoặc thêm model trong `app/models/`. Model mới phải được import trong `app/models/__init__.py`.
2. `alembic revision --autogenerate -m "add xyz"`, rồi **đọc lại file sinh ra** trước khi commit.
3. `alembic upgrade head` và chạy `pytest`. Test `test_migrations_match_models` sẽ fail nếu model đổi mà quên migration.
4. Commit model và migration trong cùng một commit. **Không sửa migration đã merge vào `main`**: muốn đổi thì tạo migration mới.

**Git**
- Không commit `.env`, `*.db`, `uploads/`, `.venv/` (đã có trong `.gitignore`).
- Mỗi lần dùng AI thì ghi một dòng vào `AI_USAGE.md`.

---

## 6. Khác với kế hoạch cũ (WBS, `requirements.txt` gốc)

| Kế hoạch cũ | Bây giờ | Lý do |
| :--- | :--- | :--- |
| Code ở `src/...` (WBS) | `backend/app/...` | Theo Rules mục 2; tách rõ backend và frontend |
| `main.py` ở gốc repo | `backend/app/main.py`, API dưới `/api` | Một domain phục vụ cả frontend (`/`) và API (`/api`) khi deploy |
| `python-jose`, `passlib` | `PyJWT`, `bcrypt` | Hai thư viện cũ đã ngừng bảo trì; `passlib` lỗi với `bcrypt` mới |
| `google-generativeai` | `google-genai` | Thư viện cũ đã bị Google ngừng phát triển |
| `psycopg2-binary` | `psycopg[binary]` (v3) | Bản kế nhiệm của psycopg2, SQLAlchemy 2 hỗ trợ trực tiếp |
| Phiên bản ghim cũ (FastAPI 0.111, Pydantic 2.7…) | Bản mới nhất, đã ghim | Các bản cũ ra đời trước Python 3.13 nên không có bản cài sẵn cho Python mới. Bộ mới đã cài thử trên venv sạch, `pip check` không lỗi |
| Bảng `roles` + tài khoản `admin` | Cột `user_role` + bảng `job_positions`; tài khoản `hr` | Vai trò đăng nhập (3 loại) khác vị trí công việc (10 loại) |
| `plans`, `modules`, `tasks`, `quizzes` | `learning_paths.stages` (JSON) | Xem mục 3 |
| `policy_matrix` | Chưa tạo | Chờ Nhi chốt: đọc `role_matrix.csv` hay lưu DB |
| `.env.example` ở gốc repo | `backend/.env.example` | Mỗi phần tự quản biến môi trường của mình |
| `POST /upload` trả chunk list | `POST /documents` vừa lưu vừa xử lý; xem chunk ở `GET /documents/{id}/chunks` | Tài liệu, file gốc và chunk phải nằm cùng một chỗ để trích dẫn mở lại được |
| Chunker của Phong (`src/document_processing/`) | `app/ingestion/` chuyển từ chunker của frontend | Xem mục 7 |

---

## 7. Ghi chú cho Phong: xử lý tài liệu

`app/ingestion/` hiện là bản chuyển sang Python từ `frontend/src/utils/chunker.js`, dùng PyMuPDF và python-docx để đọc file. Đã so khớp với bản JS trên 8 bộ dữ liệu: kết quả giống hệt. Code ở nhánh `feat/genai-pipeline` chưa được dùng vì lệch contract ở các điểm sau:

| Nhánh `feat/genai-pipeline` | Vấn đề |
| :--- | :--- |
| `chunk_id = uuid4()` | Mỗi lần xử lý lại id đổi hết, trích dẫn cũ trỏ vào chunk không còn. Cần id ổn định dạng `DOC-10-C0001` |
| Cắt nội dung ở 2000 ký tự, bỏ chunk dưới 80 ký tự | Mất chữ, nên `exact_quote` không tìm thấy trong tài liệu |
| Heading DOCX bị đổi thành chữ in hoa | Câu trích nguyên văn không còn khớp |
| `doc_id` là mã băm file | Contract dùng mã tài liệu (`DOC-10`) |
| Chỉ đọc PDF, DOCX | Frontend nhận cả TXT, MD, CSV |

Muốn cải tiến (OCR cho PDF scan, bảng trong PDF…) thì sửa trong `app/ingestion/` và **sửa cả chunker của frontend**, vì trình duyệt vẫn chia chunk khi chạy không có backend.

---

## 8. Pipeline 1: AI sinh lộ trình (`app/genai_pipeline/`)

```
Tài liệu nguồn (chunk, đã bỏ chunk có cờ injection)
  └─ local_draft.generate      → thứ tự học phần theo tầng tài liệu + bản nháp dự phòng cho từng học phần
       └─ mỗi học phần, chạy song song (GENERATION_WORKERS):
            Gemini lần 1: bài học + nhiệm vụ (schemas.ModuleDraft)
            Gemini lần 2: câu hỏi trắc nghiệm   (schemas.QuizDraft)
            grounding.py: giữ mục trích được nguyên văn tài liệu, loại / sửa mục sai
            Gemini lỗi → dùng bản nháp của học phần đó
  └─ arrange_stages            → giai đoạn theo mẫu (Ngày 1 → 90 ngày / Nền tảng → Đánh giá) + bài đánh giá tổng hợp
  └─ learning_paths.generation → báo cáo: model, token, thời gian, từng học phần, số mục bị loại
```

- **Không có `GEMINI_API_KEY`:** dùng bộ sinh bản nháp (`engine = local-draft`). Bộ này là bản chuyển từ `frontend/src/utils/pathGenerator.js`, đã so khớp với bản JS trên 4 tài liệu mẫu × 6 cấu hình: kết quả giống hệt.
- **Cấu trúc do luật quyết định, nội dung do AI viết:** thứ tự học phần và giai đoạn luôn giống bản nháp, nên luôn qua được kiểm tra "luồng".
- **Grounding** áp dụng đúng luật kiểm định của Reviewer ngay lúc sinh:
  - `exact_quote` phải có nguyên văn trong tài liệu. Model trích đúng câu nhưng ghi sai `chunk_id` thì tìm lại chunk đúng. Bài học trích sai thì thay bằng câu đầu của chunk mà bài học đó dựa vào.
  - Nhiệm vụ trích sai thì bị loại.
  - Nhiệm vụ **thiếu tiêu chí hoàn thành** bị loại (`task_no_criteria`).
  - Tiêu chí có con số (ngày, giờ, số tiền) không có trong chunk được trích cũng bị loại (`task_criteria_unsupported`). Lý do: hạn chót bịa ra là thứ nguy hiểm nhất một tiêu chí có thể chứa.
  - Câu hỏi bị loại khi: đáp án đúng không nằm trong câu trích, phương án trùng nhau, phương án sai cũng có trong câu trích, hoặc có câu lệnh tấn công.
  - Vị trí đáp án được xáo lại theo câu trích, vì model hay đặt đáp án đúng ở A.
  - Thông tin trích dẫn (`doc_id`, mục, trang) luôn lấy từ DB, không lấy từ model.
- **Chống prompt injection:**
  - Chunk có cờ không được gửi cho model.
  - Tài liệu được bọc trong `<document>`/`<chunk>`, và không thể tự đóng thẻ để thoát ra ngoài.
  - Yêu cầu thêm của HR được quét trước (`err_prompt_injection`).
  - Output của model được quét lại trước khi lưu.
- **Nguyên tắc thiết kế bài học** (SRS Step 26–27), chia việc giữa Python và AI:
  - **Dàn ý do Python quyết định:** thứ tự học phần và giai đoạn (`local_draft.plan_stages`), theo thứ tự nền tảng công ty → quy trình phòng ban → thực hành. Không giao dàn ý cho AI, để luồng học luôn giống nhau và luôn qua được kiểm tra luồng.
  - **Mỗi học phần gọi AI 2 lần:**
    - Lần 1 viết bài học, nhiệm vụ và `learning_objectives`.
    - Lần 2 viết câu hỏi. Lần này AI nhận **danh sách bài vừa dạy** (`<taught_lessons>`) và chỉ được hỏi về các chunk mà những bài đó dạy.
  - **Ma trận yêu cầu làm đề bài:** `_generate` truyền ma trận của vị trí vào `GenerationRequest.requirements`. Prompt của mỗi học phần liệt kê các yêu cầu trích tài liệu đó (bắt buộc trước) và cách đánh giá mà ma trận ghi.
  - **Độ khó theo mức:** phong cách nhiệm vụ theo `TASK_STYLE`: Beginner đọc hiểu, xác nhận; Intermediate thực hành trên hệ thống; Advanced xử lý tình huống.
  - **Dạy trước rồi mới kiểm tra:** nhiệm vụ hoặc câu hỏi trích chunk mà không bài học nào của học phần dạy thì bị loại (`task_untaught`, `quiz_untaught`). Bước kiểm định báo lỗi chặn `flow_untaught_item`, kể cả khi HR xoá một bài học sau này.
  - **Python gắn mã yêu cầu, không tin AI tự khai:** `genai_pipeline/requirements.py` khớp mỗi mục với yêu cầu theo mã tài liệu và số mục của chunk được trích. Kết quả là `requirement_ids` trên từng mục và học phần, và `generation.requirements` (yêu cầu đã dạy, đã kiểm tra, bắt buộc chưa dạy, bắt buộc chưa kiểm tra).
  - Học phần do bộ sinh bản nháp viết thì dùng các yêu cầu bắt buộc làm mục tiêu học tập.
  - Điểm Coverage độc lập vẫn là việc của Pipeline 2 (`path.coverage`). Pipeline 1 chỉ tự báo, không tự chấm điểm chính mình.
- **Tiến độ thật khi sinh** (`services/generation_jobs.py`):
  - `generate_content(..., progress)` báo các sự kiện `analysis`, `plan`, `module` (các pha lessons, quiz, done, fallback), `coverage`, `assemble`. Service báo thêm `sources` và `saving`.
  - Job chạy trong luồng riêng, với phiên DB riêng, và gộp sự kiện thành `state` để giao diện vẽ dòng thời gian.
  - Job lưu trong bộ nhớ của tiến trình: mất khi khởi động lại, và không dùng chung được giữa nhiều worker. Chạy nhiều worker thì cần chuyển sang bảng DB hoặc Redis.
- **Test không bao giờ gọi Gemini thật:** `tests/conftest.py` đặt `GEMINI_API_KEY=""`. Các test cần Pipeline 1 dùng `tests/fake_llm.py`.
- **Chỉ gửi cho AI phần tài liệu của đúng vị trí** (`genai_pipeline/relevance.py`):
  - Tài liệu dùng chung hay có mục riêng cho từng vai trò: DOC-13/14/15 mô tả nhiều vị trí, DOC-12 có mục cho Branch Manager, DOC-20 có ngoại lệ theo phòng ban.
  - Một mục bị bỏ khi tiêu đề của nó, hoặc tiêu đề cha, thuộc người khác:
    - ghi tên vị trí khác;
    - có thẻ `[ROLE-SPECIFIC: X]` với X là vị trí khác;
    - là `[EXCEPTION]` của phòng ban khác.
  - Chunk chỉ lưu tiêu đề gần nhất, nên server đọc lại file để lấy dàn ý đầy đủ (`ingestion.chunker.outline`). Nhờ đó biết "3.1 Mission" nằm dưới "3. Sales Executive".
  - Mục mà ma trận của vị trí có trích tới thì luôn được giữ. Các mục bị bỏ được ghi vào `generation.off_role_sections`.
- **AI tự gắn cờ injection** (lớp phòng thủ thứ hai sau bộ lọc regex):
  - `ModuleDraft.suspicious_chunk_ids`: model liệt kê các chunk chứa lệnh nhắm vào AI hoặc Reviewer.
  - Các chunk đó không được dạy, không được hỏi, và được thêm vào `excluded_chunks` với `rule_ids: ["model_flagged"]`.
- **Cờ bắt buộc và truy xuất ở mức học phần:**
  - Mỗi học phần có `mandatory` (theo ma trận) và `source_sections` (các mục tài liệu học phần đó dạy).
  - Mỗi mục có `mandatory` và `requirement_ids`.
  - JSON cuối cùng do Python lắp ráp từ các phần AI viết (`ModuleDraft`, `QuizDraft`, là structured output đã kiểm tra bằng Pydantic). Mỗi mục đều có `source_reference` gồm `doc_id`, `doc`, `section`, `page`, `chunk_id`, `exact_quote`.
- **Khả năng chống lỗi của client Gemini** (`genai_pipeline/client.py`):
  - JSON bị bọc trong khối ````json```` hoặc lẫn chữ thừa được bóc trước khi kiểm tra schema, nên không tốn thêm lời gọi.
  - **Model dự phòng** (`GEMINI_FALLBACK_MODELS`):
    - Model trả 404 (bị khai tử) thì bị bỏ hẳn trong suốt tiến trình.
    - Model trả 429 (hết quota; quota tính riêng cho từng model) thì bị bỏ 5 phút.
    - Khi mọi model đều hết quota, các học phần còn lại dùng bản nháp ngay, không gửi thêm request nào.
  - Không chọn model bằng `models.list()`, vì danh sách vẫn liệt kê cả model đã đóng với tài khoản mới (`gemini-2.5-flash-lite`).
  - Mã lỗi `QUOTA_EXCEEDED` / `MODEL_UNAVAILABLE` được dịch thành câu dễ hiểu trên giao diện. Báo cáo ghi model thực tế đã viết từng học phần.
  - Không dùng lộ trình giả khi API lỗi: bản nháp theo luật dựng từ chính tài liệu, trích dẫn thật và qua được kiểm định.
- **Hạn mức Gemini miễn phí:**
  - `gemini-2.5-flash` Free tier chỉ cho 20 request/ngày, trong khi một lộ trình khoảng 10 học phần cần khoảng 20 lời gọi.
  - Hết hạn mức thì học phần tự dùng bản nháp theo luật, và báo cáo ghi `UPSTREAM_REJECTED`.
  - Tài khoản mới không dùng được `gemini-2.5-flash-lite`; dùng `gemini-3.5-flash-lite`, hoặc bật billing.
- **Prompt v1.1** (mặc định từ 26/09):
  - Báo cho model độ dài lộ trình và giai đoạn của học phần.
  - Bắt mỗi nhiệm vụ có `completion_criteria` và câu trích nguồn; thiếu một trong hai thì nhiệm vụ bị loại.
  - Giai đoạn được tính trước khi gọi model (`local_draft.plan_stages`).
- **Prompt** nằm ở `prompts/<phiên bản>/{system,module,quiz}.md`. Muốn sửa prompt thì chép sang thư mục phiên bản mới và đổi `PROMPT_VERSION`. Lộ trình cũ giữ phiên bản prompt đã dùng để sinh ra nó.
- **Lỗi Gemini:** SDK tự thử lại khi gặp 429/5xx (backoff 2s, tối đa 3 lần). Output sai schema được gọi lại 1 lần. Bị chặn (`SAFETY`, `RECITATION`…) thì học phần dùng bản nháp và báo cáo ghi `BLOCKED_…`.
- **Test** không gọi mạng: `tests/fake_llm.py` đọc prompt thật và trả lời từ các chunk trong prompt, có thể gài lỗi (sai trích dẫn, đáp án sai, sập API).
- **Chưa chạy thử với Gemini thật** (repo chưa có key). Khi có key, cần xem báo cáo `generation` của vài lộ trình: nếu tỉ lệ mục bị loại cao thì chỉnh prompt ở phiên bản mới.

**Kiểm định phía server** (`services/path_checks.py`, chuyển từ `frontend/src/utils/pathChecks.js`) chạy khi gửi duyệt, trả về, duyệt, và ở `GET /paths/{id}/checks`. Kết quả `final_status` ghi vào audit log là do server tính; giá trị client gửi lên bị bỏ qua. Còn lỗi chặn thì không phát hành được, kể cả khi có lý do.