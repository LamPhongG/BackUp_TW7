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
│   ├── ingestion/           # Phong: kiểm tra file, trích xuất PDF/DOCX/TXT/MD/CSV, chia chunk
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
| `GET /documents`, `GET /documents/{id}` (kèm `lifecycle_status`: active / obsolete / expired / upcoming) | Tất cả; nhân viên chỉ thấy tài liệu liên quan | ✅ |
| `POST /documents` (multipart: `file` + metadata) → kiểm tra, lưu, trích xuất, chia chunk, quét injection | HR | ✅ |
| `GET /documents/{id}/chunks`, `POST /documents/{id}/process` (thử lại), `DELETE /documents/{id}` | HR (xem chunk: cả Reviewer) | ✅ |
| `GET /documents/{id}/file` (mở inline, dùng được `#page=N`) | Người thấy tài liệu | ✅ |
| `GET /paths`, `GET /paths/{id}` (kèm `allowed_actions` của người đang xem) | Theo vai trò | ✅ |
| `POST /paths`, `PATCH /paths/{id}`, `DELETE /paths/{id}`, `/regenerate`, `/submit`, `/archive` | HR (sửa và thu hồi: cả Reviewer) | ✅ |
| `POST /paths/{id}/comments`, `/comments/{cid}/resolve` | HR, Reviewer | ✅ |
| `GET /audit-logs?path_id=&action=&limit=&offset=` | HR, Reviewer | ✅ |
| `/paths/{id}/approve` (server chạy lại kiểm định), `/request-changes` | Reviewer | ✅ |
| `GET /paths/{id}/checks` (kiểm định phía server) | HR, Reviewer | ✅ |
| `/enrollments`, `/quiz-attempts` | Nhân viên | ⬜ Tài |
| Sinh nội dung: `POST /paths` / `/regenerate` không kèm `content` → Pipeline 1 | HR | ✅ (Coverage của Pipeline 2: ⬜ Nhi) |

**Tạo lộ trình:** `POST /paths` không kèm `content` thì server tự sinh (mục 8). Vẫn nhận `content` gửi lên (ví dụ để test); server kiểm tra cấu trúc, id không trùng, đáp án hợp lệ, giai đoạn đúng mục đích, và tài liệu nguồn đã xử lý xong.

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
  - Câu hỏi bị loại khi: đáp án đúng không nằm trong câu trích, phương án trùng nhau, phương án sai cũng có trong câu trích, hoặc có câu lệnh tấn công.
  - Vị trí đáp án được xáo lại theo câu trích, vì model hay đặt đáp án đúng ở A.
  - Thông tin trích dẫn (`doc_id`, mục, trang) luôn lấy từ DB, không lấy từ model.
- **Chống prompt injection:**
  - Chunk có cờ không được gửi cho model.
  - Tài liệu được bọc trong `<document>`/`<chunk>`, và không thể tự đóng thẻ để thoát ra ngoài.
  - Yêu cầu thêm của HR được quét trước (`err_prompt_injection`).
  - Output của model được quét lại trước khi lưu.
- **Prompt** nằm ở `prompts/<phiên bản>/{system,module,quiz}.md`. Muốn sửa prompt thì chép sang thư mục phiên bản mới và đổi `PROMPT_VERSION`. Lộ trình cũ giữ phiên bản prompt đã dùng để sinh ra nó.
- **Lỗi Gemini:** SDK tự thử lại khi gặp 429/5xx (backoff 2s, tối đa 3 lần). Output sai schema được gọi lại 1 lần. Bị chặn (`SAFETY`, `RECITATION`…) thì học phần dùng bản nháp và báo cáo ghi `BLOCKED_…`.
- **Test** không gọi mạng: `tests/fake_llm.py` đọc prompt thật và trả lời từ các chunk trong prompt, có thể gài lỗi (sai trích dẫn, đáp án sai, sập API).
- **Chưa chạy thử với Gemini thật** (repo chưa có key). Khi có key, cần xem báo cáo `generation` của vài lộ trình: nếu tỉ lệ mục bị loại cao thì chỉnh prompt ở phiên bản mới.

**Kiểm định phía server** (`services/path_checks.py`, chuyển từ `frontend/src/utils/pathChecks.js`) chạy khi gửi duyệt, trả về, duyệt, và ở `GET /paths/{id}/checks`. Kết quả `final_status` ghi vào audit log là do server tính; giá trị client gửi lên bị bỏ qua. Còn lỗi chặn thì không phát hành được, kể cả khi có lý do.