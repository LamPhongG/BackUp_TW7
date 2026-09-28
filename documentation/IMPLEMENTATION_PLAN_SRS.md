# Kế hoạch hoàn thiện theo SRS cho agent lập trình

> Ngày: 28/09/2026 · Người soạn: Phạm Tấn Tài (có AI hỗ trợ, xem `AI_USAGE.md`)
> Người đọc: agent lập trình (Gemini 3.1) và nhóm FourAngryBirds.
> Đầu vào: `SkillSprint AI-Generative AI PowerPlay_SRS.pdf` (52 trang), mã nguồn tại commit `6e4254e` trên nhánh `rajpham`.
> Mọi số liệu "hiện trạng" dưới đây đã được kiểm tra trên code và DB tại commit đó.
> Cập nhật 28/09/2026: T1 và T2 đã làm và đã rà lại (xem dòng cuối `AI_USAGE.md`). Route danh sách học viên là `GET /learners`. Thêm migration `a4d1c7e93b02` cho vai trò admin; `GET /users` chỉ cho Admin và HR. T3 đã làm (coverage theo yêu cầu, `rule_pipeline/coverage.py`). T5 đã làm phần trung thực: comparator chỉ so trường có dữ liệu độc lập; muốn có cột "GenAI result" đầy đủ theo Step 46 vẫn cần T4 (Gemini khai `genai_claims`).

## 0. Đọc trước khi code

Tài liệu này chia việc thành các task độc lập, có thứ tự ưu tiên (P0 → P3). Làm lần lượt, mỗi task một commit. Mỗi task có: căn cứ SRS, bằng chứng hiện trạng, việc cần làm, file liên quan và tiêu chí xong.

### 0.1 Luật bắt buộc

1. **Không bao giờ tạo dữ liệu giả.** SRS mục 1.8 #12 cấm "fabricated validation scores", "hard-coded comparison results", "fake API responses", "hard-coded quiz answers". Không có dữ liệu thật thì hiển thị trạng thái rỗng kèm lý do. Không dùng số mặc định kiểu `|| 95`.
2. Đọc `Rules/Rules` (mục 1–6) và làm đúng: comment chỉ giải thích "tại sao", không TODO, không emoji, heading viết hoa kiểu câu, không từ ngữ thổi phồng.
3. Module trong `backend/app/rule_pipeline/` và `backend/app/comparator/` **không import SDK AI nào**, kể cả gián tiếp (SRS Pipeline 2, Rules mục 3).
4. **Không xoá, tạo lại hay seed lại `backend/skillsprint.db`.** DB chứa dữ liệu thật của nhóm (28 tài liệu, các lộ trình, nhật ký). Mọi thay đổi schema phải qua migration Alembic. Chạy migration trên **bản sao DB** trước (upgrade → `alembic check` → downgrade → upgrade), sao lưu DB thật rồi mới nâng cấp. SQLite trong `alembic/env.py` đã chạy migration với `foreign_keys OFF`. Enum dùng `str_enum(Enum, "<tên cột>")` để tên CHECK không trùng nhau.
5. Test không được gọi Gemini thật. `backend/tests/conftest.py` đã ép `GEMINI_API_KEY=""`; dùng `tests/fake_llm.py`. Quota miễn phí khoảng 20 request/ngày, một lộ trình tốn 20+ request.
6. Chạy Vite cho E2E thì đặt `BROWSER=none` (PowerShell: `$env:BROWSER="none"; npx vite --port 3001 --strictPort`). Không dùng `--open false`.
7. Sau khi sửa backend thì khởi động lại uvicorn; `--reload` trên máy Windows này không nhận route mới.
8. Một số file dùng CRLF (ví dụ `frontend/src/locales/vi.js`, vài file trong `backend/app/services/`). Giữ nguyên kiểu xuống dòng khi sửa.
9. Khoá dịch `en.js` và `vi.js` phải khớp nhau hoàn toàn. Chuỗi hiển thị lấy từ `t(key, vars)`, không viết cứng tiếng Việt trong JSX.
10. Có code chạy song song Python và JavaScript (chunker, bộ sinh bản nháp, kiểm định, tiến độ). Sửa một bên thì sửa bên kia và giữ test đối chiếu.
11. Mỗi task xong thì thêm một dòng vào `AI_USAGE.md`, đúng các cột đang có (SRS 1.8 #16). Ghi số test đạt bằng số thật.
12. Không commit `.env`, file `.db`, khoá API. Không push nếu chưa được yêu cầu.

### 0.2 Mốc test hiện tại

| Bộ | Lệnh | Kết quả tại `6e4254e` |
| :--- | :--- | :--- |
| Backend | `cd backend; .venv/Scripts/python -m pytest` | 360 passed |
| Lint | `.venv/Scripts/ruff check app tests alembic` | sạch |
| Frontend | `cd frontend; npx vitest run` | 95 passed |
| Build | `npx vite build` | thành công |
| `tests/` ở gốc (code cũ `src/`) | `python -m pytest tests` | 7 lỗi khi nạp test: `No module named 'google.generativeai'` |

Mỗi task phải giữ các bộ trên xanh, cộng thêm test mới của task đó.

### 0.3 Bản đồ code

| Khối | Ở đâu |
| :--- | :--- |
| API | `backend/app/api/routes/*.py`, prefix `/api` |
| Nạp tài liệu | `backend/app/ingestion/` (extract, chunker, validation), `services/documents.py`, `services/document_catalog.py` |
| Pipeline 1 | `backend/app/genai_pipeline/` (generator, local_draft, grounding, relevance, requirements, client, prompts/v1.0, v1.1) |
| Pipeline 2 | `backend/app/services/path_checks.py`, `services/role_matrix.py` (coverage), `rule_pipeline/` (precedence, weak_areas) |
| So sánh | `backend/app/comparator/engine.py`, route `GET /paths/{id}/comparison` |
| Luồng duyệt | `services/paths.py`, `services/path_workflow.py` |
| Gán và học | `services/enrollments.py`, `services/progress.py`, route `/me/enrollments`, `/learners` |
| Frontend | `frontend/src/pages/{hr,reviewer,employee,admin,shared}`, `components/path/*`, `contexts/PathsContext.jsx`, `services/apiMappers.js` |
| Thiết kế đã có | `documentation/DESIGN_VALIDATION_GATE.md`, `documentation/DESIGN_PATH_ASSIGNMENT.md`, `documentation/FRONTEND_FLOWS.md`, `backend/README.md` |

## 1. Đối chiếu SRS với hiện trạng

Ký hiệu: **Đủ** · **Một phần** · **Thiếu** · **Sai** (có làm nhưng vi phạm SRS).

| SRS | Yêu cầu | Hiện trạng | Task |
| :--- | :--- | :--- | :--- |
| 1.8 #12 | Không bịa số liệu, không hard-code kết quả so sánh | **Sai**: `Reports.jsx` bịa coverage, tỷ lệ đỗ, độ chính xác trích dẫn, cảnh báo; `PlanComparisonModal.jsx` hiện 95%/90% cố định; `comparator/engine.py` gán "Match" cứng cho Role, Priority, Due Stage | T1, T5 |
| Step 4–5 | Upload, kiểm tra loại, kích thước, trùng, rỗng, version, ngày, phòng ban, loại | Một phần: chưa đối chiếu nhãn với danh mục và nội dung, chưa bắt gần trùng, version mới không bắt buộc lớn hơn | T22 |
| Step 6–7, trang 27 | Chunk giữ Document ID, Chunk ID, Section, Heading, vị trí; DOCX cần số đoạn | Một phần: DOCX không có số đoạn; chunk CSV vượt 1.200 ký tự (DOC-26: 8.141) | T21 |
| Step 8 | Phân biệt bản đang hiệu lực và bản cũ | Đủ (`compute_lifecycle`) | |
| Step 9 | Hồ sơ nhân viên đủ trường | Đủ ở model `users`; `UserCreate` chưa nhận các trường hồ sơ | T18 |
| Step 10 | Ma trận đủ cột | Đủ (203 dòng, 188 bắt buộc, 137 riêng theo vị trí) | |
| Step 11 | Must Know / Complete / Demonstrate / Acknowledge / Recommended / Optional / Not Applicable | Thiếu: chỉ có `mandatory` bool | T7 |
| 1.2, README "Generate requirement matrix" | Tạo ma trận từ tài liệu | Thiếu: chỉ import CSV lúc seed, không có API | T8 |
| 1.8 #3, mục iv | Thêm vị trí mới, gắn yêu cầu | Thiếu: không có API tạo `JobPosition` hay import ma trận | T7 |
| Pipeline 1, Step 37 | Mỗi mục có Requirement ID, Role, Mandatory, Source Doc/Section ID, Priority, Due Stage, Task, Assessment Topic | Thiếu: schema Gemini (`genai_pipeline/schemas.py`) không có các trường này; Requirement ID do Python gắn | T4 |
| Step 13 | Giai đoạn cấu hình được | Một phần: viết cứng trong `genai_pipeline/types.py` | T9 |
| Step 14 | Module có purpose, key concepts, required sources, duration, activities, assessment, completion criteria | Một phần: thiếu purpose, key concepts, completion criteria của module | T14 |
| Step 17 | Checklist | Thiếu | T14 |
| Step 18 | Nhiệm vụ có expected outcome, difficulty, due stage | Một phần: chỉ có title và completion_criteria | T14 |
| Step 20–21 | Câu hỏi nhiều loại; mỗi câu có explanation, difficulty | Một phần: chỉ một đáp án; explanation chỉ ở câu AI; không có difficulty | T15 |
| Step 22 | Kiểm tra phương án nhiễu | Đủ (grounding loại câu có phương án sai nằm trong câu trích) | |
| Step 24 | Rubric cho bài thực hành | Thiếu | T14 |
| Step 26–27 | Tiên quyết, thứ tự học | Một phần: có "dạy trước rồi kiểm tra", "nền tảng trước nghiệp vụ"; chưa có quan hệ tiên quyết giữa các chủ đề | T14 |
| Step 28–29 | Required / covered / missing / unsupported / duplicate; Coverage = số yêu cầu bắt buộc đã phủ / tổng × 100 | **Sai**: `role_matrix.compute_coverage` tính theo số *tài liệu*, và một yêu cầu được coi là đã phủ chỉ cần tài liệu của nó được trích ở bất kỳ mục nào | T3 |
| Step 30 | Traceability score | Một phần: comparator đếm mục "có trường doc", không kiểm tra câu trích | T6 |
| Step 31–32 | Hallucination, unsupported claims | Một phần: grounding và `check_knowledge` có; thử thách 1.8 #8 (chủ đề không có trong tài liệu) chưa có | T16 |
| Step 33, 1.8 #6 | Mâu thuẫn giữa tài liệu (cũ và mới, FAQ và Policy, Role desc và SOP) | Thiếu: trạng thái `contradiction` hiện chỉ nghĩa là "đáp án không có trong câu trích" | T10 |
| Step 34 | Thứ tự ưu tiên cấu hình được, có tài liệu mô tả | Một phần: `rule_pipeline/precedence.py` viết cứng | T9 |
| Step 35 | Trùng lặp | Đủ (đã bỏ qua bài đánh giá tổng hợp) | |
| Step 36 | Liên quan theo vị trí | Một phần: lọc lúc sinh (`relevance.py`); kiểm định sau khi sửa tay chưa có | T10 |
| Step 38–39 | Kiểm schema, retry có giới hạn và **có log** | Một phần: retry có giới hạn nhưng chỉ ghi log console | T12 |
| Step 41 | Ghi prompt version, model, thời điểm, phiên bản nguồn | Đủ | |
| Step 44–45, xl–xli | Chạy lặp và điểm nhất quán | Thiếu | T13 |
| Step 46, Deliverable 6 | So sánh GenAI và Python ≥ 100 dòng, có giải thích | **Sai**: xem 1.8 #12 | T5 |
| Step 47 | Trạng thái cuối | Một phần: path_checks có 3 trạng thái, comparator có trạng thái riêng, hai nơi không thống nhất | T3, T5 |
| Step 48–49, xlvii | Duyệt, sửa, sinh lại; giữ kết quả gốc và quyết định Reviewer | Một phần: sửa và sinh lại ghi đè nội dung gốc | T12 |
| Step 50–53 | Dashboard nhân viên, admin, theo vị trí; theo dõi tiến độ | Một phần: API `/learners` thiếu điểm quiz; chưa có dashboard theo vị trí từ dữ liệu thật | T1, T18 |
| Step 54–56 | Đánh giá tiến độ, gợi ý, điểm yếu | Thiếu ở server: `weak_areas.analyze_weak_areas` chưa được gọi; "on track" chỉ tính ở frontend | T17 |
| Step 57–59, 1.8 #4 | Phát hiện cập nhật, phân tích ảnh hưởng, sinh lại chọn lọc | Thiếu: chỉ có cờ `outdated_source` mức cả tài liệu | T11 |
| Step 60 | So sánh lộ trình | Một phần: có `PlanComparisonModal` nhưng coverage bịa | T1 |
| Step 61 | Tìm kiếm, lọc | Một phần | T18 |
| Step 62–63 | Báo cáo, xuất CSV/PDF/Excel | Một phần: có xuất file (`utils/exportHelpers.js`) nhưng số liệu bịa | T1 |
| Hidden dataset | Chạy tài liệu mới không sửa code | Một phần: danh mục, phòng ban, vị trí, ưu tiên viết cứng; `hidden_test_ready/run_hidden_test.py` chạy trên `src/` cũ thay vì backend | T9, T23 |
| 1.8 #8 | Chủ đề không có trong tài liệu phải bị từ chối hoặc chuyển duyệt tay | Thiếu | T16 |
| Deliverable 4 | Sample requests, responses, failure examples, retry evidence | Thiếu (không lưu) | T12 |
| Deliverable 14 | Deploy | Thiếu file triển khai | T25 |

## 2. Task P0: tính trung thực của số liệu

### T1. Bỏ toàn bộ số liệu tự tạo ở frontend, thay bằng API thật

**Căn cứ:** SRS 1.8 #12, Step 51–53, 60–63.

**Bằng chứng:**
- `frontend/src/pages/hr/Reports.jsx`:
  - dòng 112–132: số yêu cầu = `6 + (idx % 4) * 2`, traceability = `95` hoặc `78`;
  - dòng 135–157: tỷ lệ đỗ = `75 + m.id.charCodeAt(0) % 22`, số lượt thi = `12 + qCount * 3`;
  - dòng 173 và 662: `attribution_accuracy: "98.5%"`;
  - dòng 180 trở đi: 3 cảnh báo viết sẵn, trong đó có "DOC-SEC-99" (không tồn tại);
  - dòng 38–87: học viên giả khi không có backend.
- `frontend/src/pages/hr/Learners.jsx` dòng 36–75: học viên giả khi không có backend.
- `frontend/src/components/path/PlanComparisonModal.jsx` dòng 37, 47: `coverage: pathA.coverage_score || 95` và `|| 90`. Trường `coverage_score` không tồn tại trên object lộ trình (`apiMappers.js` dòng 75 map thành `coverage`), nên màn hình luôn hiện 95% và 90%.
- API `GET /learners` (`schemas/enrollments.py::GlobalLearnerOut`) không có điểm quiz, trong khi `Reports.jsx` đọc `quiz_score`, `hours_spent`, `cert_issued`.

**Việc cần làm:**
1. Backend, file mới `backend/app/services/reports.py` và `backend/app/api/routes/reports.py` (prefix `/reports`, quyền HR, Reviewer, Admin). Tất cả số liệu tính từ DB:
   - `GET /reports/role-coverage`: mỗi vị trí gồm số yêu cầu bắt buộc, số đã phủ, coverage và traceability của lộ trình *đã phát hành mới nhất* cho vị trí đó (dùng hàm của T3 và T6). Vị trí chưa có lộ trình thì trả `null` và frontend hiện "chưa có lộ trình".
   - `GET /reports/quiz-analytics`: mỗi học phần gồm số lượt nộp, tỷ lệ đạt (≥ 70%), điểm trung bình, lấy từ bảng `quiz_attempts`. Chưa có lượt nộp thì trả `attempts: 0`, không bịa số.
   - `GET /reports/documents`: mỗi tài liệu gồm số chunk thật, số lộ trình trích dẫn, **tỷ lệ câu trích kiểm chứng được** (số mục có trạng thái `verified` / tổng số mục trích tài liệu đó, tính bằng `check_knowledge`), trạng thái vòng đời.
   - `GET /reports/alerts`: tổng hợp từ `injection_flags` (tài liệu), `excluded_chunks` của lộ trình, mục `hallucination` / `contradiction` trong kiểm định, và mâu thuẫn giữa tài liệu (T10, khi có). Mỗi cảnh báo trỏ tới tài liệu, lộ trình hoặc mục có thật.
   - Mở rộng `GlobalLearnerOut` thêm `best_quiz_percent` (trung bình điểm cao nhất theo học phần, `null` nếu chưa nộp) và `certificate` (`status == completed`). **Bỏ cột "Giờ học"**, vì hệ thống không đo thời gian học.
2. Frontend:
   - `Reports.jsx`, `Learners.jsx`: xoá mọi nhánh mock và số cố định; gọi các API trên. Không có backend (`backendEnabled()` false) thì hiện `EmptyState` với khoá `reports_need_backend`.
   - `PlanComparisonModal.jsx`: dùng `path.coverage?.score` (0–1, nhân 100); `null` thì hiện "Chưa tính".
   - Xuất CSV/PDF dùng cùng dữ liệu thật.
3. Test:
   - `backend/tests/test_reports.py`: mỗi endpoint trả đúng số trên dữ liệu dựng trong test (tạo lộ trình, nộp quiz, kiểm tra tỷ lệ đạt).
   - Vitest: render `Reports` với API giả lập trả mảng rỗng thì không có số nào khác 0 hay "—".

**Xong khi:** `grep -nE "charCodeAt|98\.5|DOC-SEC-99|\|\| 9[05]|mock" frontend/src/pages/hr/Reports.jsx frontend/src/pages/hr/Learners.jsx frontend/src/components/path/PlanComparisonModal.jsx` không còn kết quả; các test mới đạt.

### T2. Dọn script sửa DB trực tiếp

**Căn cứ:** SRS 1.8 #12 (không sửa kết quả bằng tay), Step 48–49 (mọi thay đổi phải qua luồng duyệt và nhật ký).

**Bằng chứng:** `backend/publish_path.py` từng đặt `status='published'` bằng SQL, bỏ qua bước duyệt, khiến bảng điều khiển HR bị sập. Hiện còn các file chưa commit: `backend/{check_all_paths,check_api,check_cols,check_completed,check_users,fix_db,fix_progress,fix_progress_2,publish_path}.py`, `fix.py`, `resolve.py`. Các file đã commit: `backend/force_complete.py`, `backend/check_schema.py`.

**Việc cần làm:** hỏi nhóm trước khi xoá. Sau khi đồng ý: xoá các file trên; thêm vào `.gitignore` mẫu `backend/check_*.py` và `backend/fix_*.py`. Dữ liệu demo phải đi qua `app/db/seed.py` hoặc các hàm service (xem `seed_demo_certificate`).

## 3. Task P1: ma trận và so sánh hai pipeline (trọng tâm chấm điểm)

### T3. Coverage theo yêu cầu, một nguồn tính duy nhất

**Căn cứ:** Step 28–29, NFR 4 ("100% coverage of the approved mandatory Role Requirement Matrix before final approval"), mục 1.2 "Verified only when all mandatory requirements are covered".

**Bằng chứng:** `backend/app/services/role_matrix.py::compute_coverage` tính `score` = số tài liệu bắt buộc được trích / tổng số tài liệu bắt buộc. Mỗi yêu cầu trong `topics` có `covered = r.source_doc_code in cited`, nghĩa là chỉ cần trích tài liệu ở mục bất kỳ. `comparator/engine.py` lại tự tính một coverage khác (dòng 261–264). Hai con số hiện trên hai màn hình khác nhau.

**Việc cần làm:**
1. Chuyển `genai_pipeline/requirements.py::{section_number, matching, tag_modules}` sang `backend/app/rule_pipeline/requirements.py`; `genai_pipeline` import lại từ đó. Pipeline 2 không được phụ thuộc vào Pipeline 1.
2. Viết `rule_pipeline/coverage.py::evaluate_requirements(stages, requirements) -> RequirementEvaluation`. Hàm thuần, không đụng DB. Gắn yêu cầu **từ nội dung cuối cùng**, không đọc `requirement_ids` có sẵn trong `stages`. Kết quả gồm:
   - `taught`: yêu cầu có bài học trích đúng tài liệu và mục (khớp theo tiền tố: yêu cầu §4 được phủ bởi 4, 4.1, 4.2…);
   - `assessed`: yêu cầu có nhiệm vụ hoặc câu hỏi trích đúng mục;
   - `missing`: yêu cầu bắt buộc chưa được dạy;
   - `not_assessed`: đã dạy nhưng chưa kiểm tra;
   - `duplicate`: yêu cầu được dạy ở từ 2 học phần trở lên;
   - `unsupported`: mục trích tài liệu và mục **không** thuộc yêu cầu nào của vị trí. Đây là nội dung có căn cứ trong tài liệu nhưng ngoài ma trận; tính là cảnh báo, không phải bịa.
   - `score = len(taught ∩ mandatory) / len(mandatory)`. Vị trí không có yêu cầu bắt buộc thì `score = None` và thêm lý do `reason_matrix_empty`. **Không tự cho 100%.**
3. `role_matrix.compute_coverage` gọi hàm trên và giữ dạng trả về `{score, requiredDocs, topics}` mà frontend đang đọc. Thêm `counts: {required, covered, missing, unsupported, duplicate, not_assessed}`. `topics[].covered` tính theo mục.
4. `path_checks.run_checks`:
   - `score < 1.0` thì không bao giờ *Verified*;
   - `< 0.6` thì *Manual Review Required*;
   - `score is None` thì *Manual Review Required* với lý do "chưa có ma trận".
5. `comparator/engine.py` dùng đúng kết quả này, không tự tính lại.
6. Test `backend/tests/test_requirement_coverage.py`:
   - ví dụ trong SRS: ma trận 3 yêu cầu bắt buộc, lộ trình phủ 2 thì score = 2/3 và `missing` có đúng 1 mã;
   - yêu cầu §4.2 không được phủ bởi mục trích §4.3 của cùng tài liệu;
   - cùng dữ liệu cho cùng kết quả ở `path.coverage`, `/checks` và `/comparison`.
7. Sau khi xong, tính lại `coverage` cho các lộ trình trong DB bằng một migration dữ liệu hoặc lệnh `python -m app.db.recompute_coverage` (chạy trên bản sao trước). Kết quả mong đợi: LP-17D8260750 thiếu các yêu cầu R062, R064, R116, R119, R120, R122–R125 (đã đo trên `generation.requirements`).

### T4. Pipeline 1 tự khai các trường cấu trúc theo SRS

**Căn cứ:** SRS mục Pipeline 1 ("Each generated item should contain … Requirement ID, Role, Module, Mandatory or Optional status, Source Document ID, Source Section ID, Priority, Due Stage, Task, Assessment Topic"), Step 37, Step 46 ("GenAI result").

**Bằng chứng:** `backend/app/genai_pipeline/schemas.py` (`LessonDraft`, `TaskDraft`, `QuestionDraft`, `ModuleDraft`) không có các trường trên. Requirement ID hiện do Python gắn (`tag_modules`), nên không có "kết quả của GenAI" để so với Python.

**Việc cần làm:**
1. Tạo prompt `backend/app/genai_pipeline/prompts/v1.2/` (sao từ v1.1). Thêm vào `system.md` các luật văn phong theo Rules mục 6: không emoji, không thổi phồng, không Title Case, không "Cần lưu ý rằng". Đặt `prompt_version` mặc định thành `v1.2` trong config.
2. Mở rộng schema (Pydantic, `Field(description=…)`, vì mô tả trường là một phần của prompt):
   - `ModuleDraft`: `module_category` (enum: `policy`, `process`, `role_skill`, `compliance`, `tooling`), `purpose`, `key_concepts: list[str]` (2–5 mục).
   - Mỗi `LessonDraft`, `TaskDraft`, `QuestionDraft`: `claimed_requirement_ids: list[str]` (chỉ được chọn trong danh sách R… đưa vào prompt, hoặc để rỗng), `claimed_mandatory: bool`, `claimed_priority: Literal["High","Medium","Low"]`, `claimed_due_stage` (key giai đoạn trong mẫu), `assessment_topic: str`.
   - `TaskDraft`: thêm `expected_outcome`, `difficulty` (Beginner/Intermediate/Advanced). `QuestionDraft`: thêm `difficulty`.
3. `grounding.py`: lưu các giá trị model khai vào `item["genai_claims"] = {...}`, **tách riêng** khỏi `item["requirement_ids"]` do Python tính (T3). Mã R… không có trong danh sách đưa vào prompt vẫn giữ trong `genai_claims`, để comparator báo *Unsupported Requirement*. Không được âm thầm xoá.
4. Bộ sinh bản nháp Python (`local_draft.py`) không có AI, nên `genai_claims = None`. Comparator hiện "GenAI result: không có (bản nháp theo luật)", không giả làm kết quả AI.
5. `backend/tests/fake_llm.py` trả về các trường mới. Test: mã R… lạ đi vào `genai_claims` và comparator báo *Unsupported*; bản nháp theo luật cho ra `genai_claims is None`.

### T5. Viết lại comparator theo Step 46–47 và Deliverable 6

**Căn cứ:** Step 46 (Requirement ID, Python expected, GenAI result, Match/Mismatch, Source, Validation status), Step 47, Table 1, Deliverable 6 (từ 100 dòng, có coverage status, traceability status, giải thích khi lệch), 1.8 #12.

**Bằng chứng** (`backend/app/comparator/engine.py`):
- dòng 144–150: `Requirement ID`, `Role`, `Priority`, `Due Stage` luôn `match: True`; `"gt": "Week 1"` cố định; Priority phía GenAI chép từ ground truth;
- dòng 82: tên giai đoạn đọc `stage.get("name")`, nhưng giai đoạn chỉ có `key`, nên luôn ra "Stage N";
- dòng 115: `mandatory` mặc định `True`;
- dòng 124: `contradiction_count` luôn 0;
- nhánh *Unsupported* (dòng 226) không thể xảy ra vì mọi mã đều lấy từ chính ma trận.

**Việc cần làm:**
1. Mỗi dòng ứng với một yêu cầu R… của vị trí:
   - **Python expected** (lấy từ ma trận và luật): tài liệu, mục, mandatory, priority, giai đoạn mong đợi. Giai đoạn mong đợi tính bằng `local_draft.assign_stage` theo tầng tài liệu, cắt theo `duration_days`, vì ma trận không có cột giai đoạn. Ghi rõ nguồn của giai đoạn mong đợi trong giải thích.
   - **GenAI result** (lấy từ `genai_claims` của các mục có khai R… đó): tài liệu và mục của câu trích, mandatory, priority, giai đoạn thực tế của học phần chứa mục, assessment topic.
   - So sánh **từng trường có dữ liệu thật ở cả hai phía**. Phía nào thiếu thì ghi "không có dữ liệu", không tính Match.
2. Kết quả mỗi dòng: `Match` · `Mismatch` (liệt kê trường lệch) · `Requirement Missing` (bắt buộc, không mục nào dạy) · `Unsupported Requirement` (GenAI khai mã không có trong ma trận) · `Source Support Missing` (mục khai R… nhưng câu trích không kiểm chứng được) · `Outdated Source` · `Contradiction Detected` (từ T10). Kèm `coverage_status` (taught/assessed/missing), `traceability_status` (verified/không) và `explanation` sinh từ danh sách trường lệch.
3. Chỉ số: Coverage (T3), Traceability (T6), Requirement Consistency = số dòng Match / số dòng có dữ liệu GenAI, Missing Count, Unsupported Count, Contradiction Count.
4. Trạng thái cuối theo Step 47. *Verified* chỉ khi coverage = 100%, traceability của mục bắt buộc = 100%, không còn mâu thuẫn hay yêu cầu không có căn cứ chưa xử lý.
5. Xuất báo cáo: `GET /reports/comparison.csv?paths=…` và lệnh `python -m app.reports.export_comparison --out ../reports/genai_python_comparison.csv`, gộp lộ trình của 10 vị trí để có từ 100 dòng.
6. Frontend `DualComparisonTable.jsx`: hiện đúng các cột trên, lọc theo kết quả, đánh dấu trường lệch.
7. Test `backend/tests/test_comparator.py` (viết lại): lộ trình dựng tay có 1 Match, 1 Mismatch về giai đoạn, 1 Missing, 1 Unsupported, và kết quả đúng từng dòng; bản nháp theo luật không có dòng Match nào.

### T6. Traceability score thật

**Căn cứ:** Step 30, NFR 4.

**Việc cần làm:** trong `path_checks.py` thêm `traceability = {score, mandatory_score, total, verified}`. Một mục tính là truy vết được khi `check_knowledge` trả `verified`: câu trích có nguyên văn trong chunk, tài liệu còn hiệu lực, đáp án nằm trong câu trích. `mandatory_score` chỉ tính mục thuộc yêu cầu bắt buộc. Comparator và trang Báo cáo dùng giá trị này. Test: một mục có câu trích sai làm giảm điểm đúng 1/n.

### T7. Quản lý ma trận, thêm vị trí mới, phân loại yêu cầu

**Căn cứ:** Step 10, Step 11, mục iv (Role Management), 1.8 #3 (Hidden Role: add role, map requirements, generate, validate, explain), 1.8 #9 ("Add a role", "Change a mandatory requirement"), README execution "Create role".

**Bằng chứng:** `backend/app/api/routes/catalog.py` chỉ có GET. `role_matrix.import_csv` chỉ được gọi trong `seed.py`. Bảng `role_requirements` chỉ có `mandatory: bool`.

**Việc cần làm:**
1. Migration: thêm cột `requirement_type` (enum `must_know`, `must_complete`, `must_demonstrate`, `must_acknowledge`, `recommended`, `optional`, `not_applicable`). Dữ liệu cũ nhận giá trị theo luật xác định, ghi trong docstring:
   - `Mandatory` + `Assessment_Requirement` bắt đầu bằng "Practical task" → `must_complete`;
   - bắt đầu bằng "Scenario" hoặc "Role-play" → `must_demonstrate`;
   - bắt đầu bằng "Acknowledg" → `must_acknowledge`;
   - còn lại → `must_know`;
   - `Optional` → `optional`.
   - CSV nhận thêm cột tuỳ chọn `Requirement_Type`.
   - `mandatory` suy ra từ loại (4 loại "must" là bắt buộc).
2. API (HR và Admin ghi, Reviewer đọc):
   - `POST /job-positions` và `PATCH /job-positions/{id}` (id dạng slug, tên vi/en, phòng ban, cấp độ);
   - `GET /role-requirements?position=`, `POST /role-requirements`, `PATCH /role-requirements/{id}` (mã R… tự tăng);
   - `POST /role-requirements/import` (CSV, trả `ImportReport` gồm số dòng tạo, sửa, lỗi).
   - Mỗi thay đổi ghi vào nhật ký kiểm toán.
3. Frontend trang mới `/hr/matrix` và `/reviewer/matrix`:
   - bảng lọc theo vị trí, loại, mức ưu tiên;
   - mỗi dòng có trạng thái tài liệu: có trong kho, đúng phiên bản (`Source_Version` so với bản đang hiệu lực), mục có tồn tại trong dàn ý tài liệu;
   - nút *Thêm vị trí*, *Import CSV*, sửa dòng.
4. Test: tạo vị trí mới, import 3 yêu cầu, sinh lộ trình bằng bản nháp theo luật, `/comparison` có 3 dòng. Kịch bản này chính là thử thách Hidden Role.

### T8. Trích yêu cầu từ tài liệu

**Căn cứ:** mục 1.2 ("creates a structured Role Requirement Matrix from the approved company documents"), Step 11, Deliverable 5 ("Requirement extraction"), Deliverable 10 ("Requirement extraction tests").

**Việc cần làm:**
1. `backend/app/rule_pipeline/extraction.py`, Python thuần:
   - Duyệt chunk theo mục; tách câu bằng `text.split_sentences`.
   - Câu chứa từ nghĩa vụ (dùng lại `_OBLIGATION` trong `local_draft.py`: must, shall, required, never, always, phải, cần, bắt buộc, không được, nghiêm cấm) là yêu cầu ứng viên.
   - Loại đề xuất: câu có "acknowledge", "sign", "xác nhận", "ký" → `must_acknowledge`; câu có động từ hành động kèm hạn hay ngưỡng (số + đơn vị) → `must_complete`; "should", "recommended", "nên" → `recommended`; còn lại → `must_know`.
   - Vị trí đề xuất: lấy từ heading hoặc thẻ `[ROLE-SPECIFIC: …]` của mục (dùng lại `relevance.belongs_to_others` theo chiều ngược). Mục chung thì đề xuất "tất cả vị trí".
   - Bỏ câu đã có trong ma trận (so khớp tài liệu, mục và độ trùng từ ≥ 0,6).
2. `GET /documents/{id}/requirement-candidates` trả danh sách ứng viên. Trang ma trận có tab *Đề xuất từ tài liệu*: HR chọn vị trí rồi chấp nhận thì tạo dòng mới.
3. Test trên file mẫu trong `sample_documents/`: DOC-07 §4.2 phải sinh ra ứng viên tương ứng R001 (leo thang trong 1 giờ làm việc).

## 4. Task P1: chạy được bộ tài liệu ẩn mà không sửa code

### T9. Đưa cấu hình ra `config/`

**Căn cứ:** Hidden Evaluation Dataset ("without modifying the existing source code", "must not … hard-code hidden requirements"), Step 13, Step 34, 1.8 #9 ("Modify policy precedence", "Change onboarding duration"), cấu trúc repo có thư mục `config/`.

**Bằng chứng:** `config/` chỉ có `.gitkeep`. Các chỗ viết cứng: `services/document_catalog.py::CATALOG` (28 mã), `rule_pipeline/precedence.py::PRECEDENCE_TIER`, `genai_pipeline/types.py::{STAGE_TEMPLATES, ONBOARDING_DURATIONS, doc_tier}`, `db/seed.py::DEPARTMENTS` và vị trí, các ngưỡng trong `path_checks.py`, `progress.py`.

**Việc cần làm:**
1. Các file YAML (thêm `PyYAML` vào `backend/requirements.txt`), có schema Pydantic, nạp một lần lúc khởi động và báo lỗi rõ ràng nếu sai:
   - `config/organization.yaml`: phòng ban, vị trí (khởi tạo DB khi trống, không ghi đè dữ liệu đã sửa qua API T7);
   - `config/document_catalog.yaml`: mã, family, tên vi/en, loại, phòng ban;
   - `config/precedence.yaml`: danh sách bậc theo thứ tự, ví dụ `[{tier: 1, categories: [Handbook, Policy, Compliance], scope: company-wide}, …]`; `doc_tier` và `precedence_tier` cùng đọc file này;
   - `config/stages.yaml`: mẫu giai đoạn theo mục đích, độ dài 7/30/90;
   - `config/validation.yaml`: ngưỡng coverage, điểm đạt quiz 0,7, ngưỡng trùng lặp 0,85, độ dài câu trích 15–300, giới hạn upload.
2. Frontend lấy danh mục, phòng ban, vị trí qua API (`GET /catalog/...`), không dùng `frontend/src/data/company.js` ở chế độ backend.
3. Loại tài liệu `Test Case` không được chọn làm nguồn sinh lộ trình (422 `err_source_test_case`). Hiện DOC-18 đang là nguồn của LP-17D8260750.
4. Viết `documentation/POLICY_PRECEDENCE.md` mô tả thứ tự ưu tiên thật (Step 34 yêu cầu "document the actual hierarchy").
5. Test: đổi thứ tự trong một file YAML tạm thì kết quả `resolve_precedence` đổi theo mà không sửa code; YAML sai thì khởi động báo lỗi có tên trường.

### T10. Phát hiện mâu thuẫn giữa tài liệu và kiểm tra liên quan vị trí sau khi sửa

**Căn cứ:** Step 33, Step 34, Step 36, 1.8 #6 (Policy v2, SOP cũ, FAQ mâu thuẫn), Hidden dataset ("A conflicting FAQ", "An ambiguous or contradictory clause").

**Việc cần làm:**
1. `backend/app/rule_pipeline/contradictions.py`, Python thuần:
   - **Cùng chủ đề:** hai chunk thuộc hai tài liệu khác nhau cùng được gắn một yêu cầu R… (T3), hoặc có độ trùng từ ≥ 0,35 (Jaccard, bỏ stopword). Ngưỡng đặt trong `validation.yaml`.
   - **Khác số liệu:** trích các cặp (số, đơn vị) như "24 giờ", "5 ngày", "2.000.000 VND", "45-day", rồi chuẩn hoá đơn vị. Cùng đơn vị mà khác số thì là mâu thuẫn.
   - **Kết luận:** ghi tài liệu thắng theo `precedence` và lý do (bậc hoặc phiên bản).
   - **Bốn loại theo Step 33:** bản cũ và bản mới (cùng family), FAQ và Policy, Role Description và SOP, nhiệm vụ sinh ra trái quy tắc (số trong tiêu chí hoàn thành khác số trong tài liệu thắng).
2. Tích hợp vào `path_checks` thành nhóm `contradictions`. Lộ trình dạy theo tài liệu thua thì *Contradiction Detected*.
3. Kiểm tra liên quan vị trí sau khi sửa tay: mục nằm trong phần tài liệu mà `relevance.belongs_to_others` xác định là của vị trí khác thì báo `role_irrelevant`.
4. Test dùng `sample_documents/adversarial/CTX-*` và DOC-17. Tối thiểu: CTX-02 (FAQ và DOC-01 §6) bị bắt và DOC-01 thắng; hai phiên bản DOC-11 bị bắt; không báo mâu thuẫn giữa hai tài liệu không cùng chủ đề.

### T11. Cập nhật chính sách: phân tích ảnh hưởng và sinh lại chọn lọc

**Căn cứ:** Step 57, 58, 59, 1.8 #4 ("What changed? Which modules are affected? Which questions are outdated? Which onboarding plans require regeneration?"), README execution ("Update policy", "Regenerate affected content").

**Bằng chứng:** hiện chỉ có trạng thái `outdated_source` mức cả tài liệu; `regenerate` luôn sinh lại cả lộ trình (`services/paths.py::regenerate`).

**Việc cần làm:**
1. `backend/app/rule_pipeline/document_diff.py`: so hai phiên bản cùng family theo từng mục (khoá là số mục, dự phòng là heading đã chuẩn hoá). Ra `added`, `removed`, `changed` (hash văn bản chuẩn hoá khác nhau), `unchanged`, kèm các cặp số liệu đổi (dùng lại phần trích số của T10).
2. `GET /documents/{id}/impact` (bản mới so với bản đang hiệu lực trước đó): danh sách mục thay đổi; lộ trình bị ảnh hưởng; trong mỗi lộ trình, các học phần, bài học, nhiệm vụ, câu hỏi trích **đúng mục đã đổi hoặc bị xoá**; nhân viên đang học các lộ trình đó (enrollment `assigned` hoặc `in_progress`).
3. `path_checks`: mục trích mục đã đổi thì `outdated_source`. Mục trích mục không đổi của bản cũ được *chuyển trích dẫn* sang bản mới khi câu trích vẫn tìm thấy nguyên văn, và vẫn là `verified`.
4. `POST /paths/{id}/regenerate` và `/regenerate/jobs` nhận `module_ids: list[str] | None`. Có danh sách thì chỉ sinh lại các học phần đó (gọi `_module_with_fallback` cho từng tài liệu tương ứng), giữ nguyên các học phần khác, kể cả phần HR đã sửa tay, rồi chạy lại kiểm định và coverage.
5. Frontend:
   - trang Tài liệu có nút *Tải phiên bản mới* trên từng tài liệu (điền sẵn mã, loại, phòng ban, tự tăng version);
   - sau khi tải lên hiện bảng ảnh hưởng;
   - trang lộ trình có nút *Sinh lại các học phần bị ảnh hưởng*.
6. Test: tải DOC-11 v1.1 từ `sample_documents/` (đáp án có trong `sample_documents/README_PHASE2.md` mục 6), kiểm tra danh sách mục đổi đúng đáp án; sinh lại chọn lọc thì các học phần khác giữ nguyên từng byte.

## 5. Task P2: bằng chứng GenAI và nội dung còn thiếu

### T12. Lưu phiên bản lộ trình và bằng chứng gọi GenAI

**Căn cứ:** Step 39 ("Log the retry"), Step 41, 48, 49 ("The original result and reviewer decision must remain both in the audit trail"), mục xlvii, lxv, Deliverable 4 (sample requests, sample responses, failure examples, retry evidence).

**Việc cần làm:**
1. Migration tạo bảng `path_revisions` (`id`, `path_id`, `revision`, `kind`: `generate` / `regenerate` / `edit` / `reviewer_edit` / `approve`, `stages` JSON, `coverage` JSON, `check_summary` JSON, `actor_id`, `created_at`). Ghi ở mọi chỗ đang ghi đè `path.stages`. Không bao giờ sửa hay xoá dòng cũ.
2. Migration tạo bảng `llm_calls` (`id`, `path_id`, `module_id`, `phase`: lessons / quiz, `model`, `prompt_version`, `attempt`, `status`: ok / invalid_json / quota / blocked / timeout / error, `error_code`, `input_tokens`, `output_tokens`, `request_excerpt` (4 KB đầu), `response_json`, `dropped` JSON (lý do grounding loại), `created_at`). Ghi trong `genai_pipeline/client.py` ở **mỗi lần thử**, gồm cả lần bị từ chối vì JSON sai schema. Pipeline chạy bằng thread (`ThreadPoolExecutor`), nên ghi qua một hàng đợi hoặc session riêng cho mỗi thread.
3. API `GET /paths/{id}/revisions`, `GET /paths/{id}/revisions/{rev}`, `GET /paths/{id}/llm-calls`. Tab *Lịch sử* hiện so sánh giữa hai phiên bản. Tab *Sinh bằng AI* hiện các lần gọi và lần thử lại.
4. Lệnh `python -m app.reports.export_genai_evidence --out ../reports/genai_evidence/` xuất mẫu request, response, lỗi và lần thử lại cho Deliverable 4.
5. Test với FakeLLM: lần đầu trả JSON hỏng, lần hai trả đúng thì `llm_calls` có 2 dòng `invalid_json` và `ok`; sửa nội dung thì thêm 1 revision và revision cũ không đổi.

### T13. Kiểm tra nhất quán giữa các lần sinh

**Căn cứ:** Step 44, 45, mục xl, xli.

**Việc cần làm:**
1. `POST /paths/{id}/consistency-runs` (HR hoặc Reviewer): chạy lại việc sinh N = 2 lần với cùng nguồn, cùng prompt version, nhiệt độ 0,2. Kết quả lưu thành `path_revisions.kind = consistency`, **không thay nội dung lộ trình**. Trước khi chạy, cảnh báo số request Gemini sẽ tốn.
2. `rule_pipeline/consistency.py`: so các lần chạy trên 4 chiều cấu trúc theo Step 44: tập yêu cầu bắt buộc đã phủ, tập tài liệu nguồn, tập `module_category`, tập `assessment_topic` (chuẩn hoá chữ thường). Điểm = trung bình Jaccard của 4 chiều. Chiều nào < 0,8 thì là "khác biệt lớn".
3. Hiện điểm và các khác biệt lớn trên tab *Sinh bằng AI*.
4. Test với FakeLLM trả 2 kết quả khác nhau có chủ ý: điểm và danh sách khác biệt đúng.

### T14. Checklist, rubric, trường của nhiệm vụ và học phần, tiên quyết

**Căn cứ:** Step 14, 17, 18, 23, 24, 26, 53; Pipeline 2 ("Checklist completeness", "Prerequisite requirements").

**Việc cần làm:**
1. Dữ liệu trong `stages` (cập nhật `schemas/paths.py` và kiểm tra cấu trúc):
   - `module.purpose`, `module.key_concepts`, `module.completion_criteria`, `module.estimated_minutes` (tổng thời lượng bài học);
   - `module.checklist: [{id, activity, required, due_stage, source_reference, responsible}]`. `responsible` là `employee`, `manager` hoặc `hr`;
   - `module.rubric` cho học phần có nhiệm vụ thực hành: `[{criterion, weight, expected_performance, pass_condition}]`, tổng `weight` = 100;
   - `task.expected_outcome`, `task.difficulty`, `task.due_stage`.
2. Gemini sinh các trường trên (thêm vào schema của T4); grounding kiểm tra nguồn như với nhiệm vụ. Bộ sinh bản nháp theo luật dựng checklist một cách xác định: mỗi bài học thành "Đọc …", mỗi nhiệm vụ thành "Hoàn thành …", mỗi yêu cầu `must_acknowledge` thành "Xác nhận đã đọc …". Rubric theo luật lấy tiêu chí từ `completion_criteria` của nhiệm vụ, chia đều trọng số. Sửa cả `frontend/src/utils/pathGenerator.js` cho khớp.
3. Kiểm định:
   - *Checklist completeness*: mỗi yêu cầu bắt buộc phải có ít nhất một mục checklist hoặc nhiệm vụ;
   - rubric có tổng trọng số khác 100 là lỗi;
   - *Tiên quyết*: cấu hình trong `config/validation.yaml` các cặp category hoặc chủ đề tiên quyết (ví dụ Information Security trước Data Handling trước Customer Data Access, theo ví dụ Step 26). Học phần phụ thuộc đứng trước học phần tiên quyết là `flow_prerequisite_order`.
4. Tiến độ: enrollment thêm `checklist_done: list[str]`; API đánh dấu mục checklist; `progress.py` và `progress.js` tính cả checklist bắt buộc.
5. Frontend: trang học của nhân viên có danh sách checklist; trang chi tiết lộ trình hiện checklist và rubric.
6. Test: bản nháp theo luật có checklist cho mọi học phần; rubric sai tổng bị bắt; cặp tiên quyết sai thứ tự bị bắt.

### T15. Nhiều loại câu hỏi và tab câu hỏi riêng

**Căn cứ:** Step 20, 21, 22, 25, mục xxv, 1.8 #9 ("Add a new quiz type").

**Việc cần làm:**
1. Một bảng đăng ký loại câu hỏi ở mỗi phía:
   - backend `genai_pipeline/question_types.py`: `QUESTION_TYPES = {kind: QuestionType(schema, validate_grounding, score)}`;
   - frontend `components/quiz/questionTypes.js`: `kind → {Renderer, isAnswered}`.
   - Thêm một loại mới chỉ cần thêm một mục ở mỗi bên.
2. Các loại:
   - `single` (hiện có);
   - `multiple`: `answers: list[int]`, chấm đúng khi chọn đủ và không thừa; mọi đáp án đúng phải nằm trong câu trích;
   - `true_false`: câu đúng là câu trích nguyên văn; câu sai được dựng bằng Python bằng cách đổi một số liệu trong câu trích (dùng `_number_distractors`) và phải khác câu trích;
   - `scenario`: tình huống một câu, đáp án phải nằm trong câu trích như `single`.
3. Mỗi câu hỏi có `difficulty` và `explanation`. Câu theo luật có giải thích "Theo {mã tài liệu} · {mục}: {câu trích}".
4. `services/progress.py::score_quiz` và `frontend/src/utils/progress.js` chấm theo loại. Server chấm, không gửi đáp án xuống trình duyệt của nhân viên (Q6 trong `DESIGN_PATH_ASSIGNMENT.md`).
5. Frontend: tab mới **Bài kiểm tra** trong `pages/shared/PathDetail.jsx`, nhóm theo giai đoạn và học phần. Mỗi câu hiện loại, độ khó, các phương án, đáp án đúng, giải thích, câu trích nguồn, trạng thái kiểm định; vẫn sửa được như hiện nay. Tab *Nội dung* chỉ còn bài học và nhiệm vụ.
6. Test cho từng loại: grounding, chấm điểm, và câu `true_false` sai không trùng câu trích.

### T16. Chủ đề không có trong tài liệu

**Căn cứ:** 1.8 #8 ("should refuse, flag insufficient information, or route the request for manual review"), Step 31, 32, Deliverable 9 ("Unsupported-topic tests").

**Việc cần làm:**
1. Trước khi sinh: nếu HR có ghi yêu cầu thêm (`prompt`), trích các cụm danh từ chính (Python, bỏ stopword vi/en). Cụm nào không có trong chunk nào của các nguồn đã chọn (so khớp sau chuẩn hoá, kèm biến thể số ít/số nhiều cơ bản) thì là *không có căn cứ*.
2. Có cụm không có căn cứ: vẫn sinh từ tài liệu, không sinh nội dung cho cụm đó. Ghi `generation.unsupported_topics`, thêm lý do `reason_unsupported_topic` (mức *Manual Review Required*), và hiện thông báo cho HR: "Tài liệu nguồn không có thông tin về: …".
3. Thêm luật vào prompt v1.2: nội dung chỉ lấy từ `<document>`; phần nào HR yêu cầu mà tài liệu không có thì không viết.
4. Test: HR yêu cầu "chính sách làm việc trên sao Hoả" với nguồn DOC-07 thì lộ trình không có mục nào nhắc tới, `unsupported_topics` có cụm đó, và trạng thái là Manual Review.

### T17. Đánh giá tiến độ và gợi ý học

**Căn cứ:** Step 54, 55, 56, mục liv–lvi.

**Việc cần làm:**
1. `services/progress.py::assess(enrollment, path, today)` trả một trong: `completed`; `assessment_required` (xong bài học và nhiệm vụ nhưng chưa đạt quiz); `behind_schedule` (tiến độ thực thấp hơn tiến độ mong đợi quá 20 điểm phần trăm; tiến độ mong đợi = số ngày đã qua / tổng số ngày tới hạn × 100); `requires_attention` (có học phần yếu, hoặc trượt cùng một quiz từ 2 lần); `on_track`. Các ngưỡng đặt trong `config/validation.yaml`.
2. Nối `rule_pipeline/weak_areas.analyze_weak_areas` vào `submit_quiz` và vào API chi tiết enrollment.
3. Gợi ý: học phần yếu → *Revision module* (mở lại học phần đó) và *Additional quiz* (câu hỏi cùng yêu cầu R… ở học phần khác); từ 2 học phần yếu → *Manager review*; hoàn thành với điểm ≥ 90% → *Advanced module* (lộ trình Thăng tiến đã phát hành cho vị trí đó, nếu có).
4. Trả về trong `/me/enrollments` và `/learners`. Frontend bỏ phần tính "on track" riêng trong `Learners.jsx` và dùng trạng thái của server.
5. Test cho từng trạng thái với ngày cố định.

### T18. Dashboard theo vị trí, tìm kiếm và lọc, hồ sơ nhân viên

**Căn cứ:** Step 9, 51, 52, 61, README execution ("Create employee").

**Việc cần làm:**
1. `GET /reports/roles`: mỗi vị trí gồm số yêu cầu (theo loại), lộ trình đã phát hành, số nhân viên, tỷ lệ hoàn thành, điểm quiz trung bình. Trang *Dashboard theo vị trí*.
2. Tìm kiếm và lọc theo nhân viên, vị trí, phòng ban, học phần, tài liệu, trạng thái, tiến độ, kết quả kiểm định. Lọc ở server bằng query param trên `/paths`, `/learners`, `/documents`.
3. `UserCreate` và `UserUpdate` nhận đủ trường hồ sơ Step 9: `employee_code`, `experience_level`, `location`, `joining_date`, `manager_id`, `competencies`, `previous_experience`, `training_status`. Form Admin và HR hiện đủ các trường này. Không yêu cầu thông tin nhạy cảm.

## 6. Task P3: dọn dẹp và trải nghiệm

### T19. Bỏ emoji và icon kiểu AI

**Bằng chứng:**
- `backend/README.md`: 24 ký hiệu ✅ ⬜;
- `frontend/src/contexts/LanguageContext.jsx`: cờ 🇬🇧 🇻🇳;
- `components/UI.jsx`: ✦;
- `components/ValidationTag.jsx`: ✓ ⚠;
- `documentation/FRONTEND_FLOWS.md`: 💬;
- `frontend/README.md`: 📄;
- icon `Sparkles` / `WandSparkles` trong 9 file: `layouts/RoleLayout.jsx`, `pages/auth/Login.jsx`, `pages/auth/SelfRegister.jsx`, `pages/hr/{Dashboard,CreatePath,Reports}.jsx`, `pages/shared/PathList.jsx`, `components/path/{GenerationProgress,PlanComparisonModal}.jsx`.

**Việc cần làm:** thay bằng icon lucide trung tính (`Route`, `FilePlus2`, `Languages`) hoặc chữ. Giữ nguyên các ví dụ minh hoạ trong `documentation/AI_WRITING_SIGNS.html`. Thêm test `backend/tests/test_no_emoji.py`: quét các file được git theo dõi (bỏ `AI_WRITING_SIGNS.html`) theo dải Unicode pictograph, kết quả phải rỗng. Trong grounding, loại emoji khỏi văn bản do AI viết.

### T20. Làm nổi lý do cảnh báo ở trang Reviewer

**Căn cứ:** Step 47, mục xliii, xliv, README execution ("Review hallucination warnings", "Review contradictions").

**Việc cần làm:**
- Ô *Trạng thái cuối* gom lý do theo tên trạng thái của SRS (Requirement Missing, Source Support Missing, Unsupported Requirement, Outdated Source, Contradiction Detected), có số đếm và màu theo mức: chặn màu đỏ, cần Reviewer quyết màu cam, cảnh báo màu vàng.
- Bấm vào nhóm thì mở tab *Kiểm định*, lọc và cuộn tới mục.
- Reviewer mở lộ trình chưa *Verified* thì vào thẳng tab *Kiểm định*.
- Sửa nhãn "Nguồn Ground Truth (Vector DB)" thành "Tài liệu nguồn", vì hệ thống không dùng vector DB.
- Phân mức lỗi theo `DESIGN_VALIDATION_GATE.md` mục 5.

### T21. Chunk

**Căn cứ:** Step 6, 7, trang 27 ("Paragraph or section reference for DOCX").

**Việc cần làm:**
- Thêm cột `heading_path` (chuỗi mục cha, lấy từ `chunker.outline`) và đưa vào prompt, không đưa vào `content`.
- DOCX: thêm `paragraph_start` và `paragraph_end` (chỉ số đoạn trong tài liệu).
- CSV: tách tiếp khi 25 dòng vượt `MAX_CHUNK_CHARS`.
- Sửa `frontend/src/utils/chunker.js` cho khớp, giữ nguyên mã chunk.
- **Không thêm chồng lấp (overlap):** chunk là đơn vị trích dẫn, chồng lấp làm một câu trích khớp nhiều chunk.
- Migration có backfill bằng `reprocess` trên bản sao DB.

### T22. Tải tài liệu: chống sai nhãn và trùng gần đúng

**Căn cứ:** Step 5, mục vi.

**Việc cần làm** (theo phân tích ngày 27/09, số liệu đo trên 29 tài liệu):
1. Đọc khối metadata tự khai ở đầu file (front matter YAML, hoặc bảng "Document ID / Department / Version / Effective date"). Đọc đúng khối header, bỏ các dòng "superseded by …". Dùng để điền sẵn form và báo lệch.
2. Đối chiếu mã với danh mục (T9): lệch phòng ban hoặc loại thì 409 `err_catalog_mismatch`, trừ khi HR xác nhận kèm lý do.
3. Mã có dòng ma trận: tỷ lệ từ của yêu cầu có trong mục được trích (trung vị) < 0,5 thì cảnh báo `warn_matrix_mismatch`. Đã đo: file đúng ≥ 0,56, file bị tráo ≤ 0,45.
4. Phiên bản mới phải lớn hơn bản mới nhất của cùng family.
5. Gần trùng: Jaccard từ ≥ 0,9 với tài liệu có sẵn thì gợi ý "đây có thể là {mã}, tải lên làm phiên bản mới?". Đã đo: cùng tài liệu ≥ 0,94, khác tài liệu ≤ 0,34.
6. Độ giống tài liệu gần nhất trong kho (TF-IDF cosine) < 0,10 thì trạng thái *cần xác nhận*: không được chọn làm nguồn cho tới khi HR xác nhận. DOC-1111 (đề tài bán laptop, nhãn Company-wide Handbook) đo được 0,05.

### T23. Bộ kiểm tra tài liệu ẩn chạy trên backend thật

**Căn cứ:** Hidden Evaluation Dataset, Deliverable 10 ("Hidden-document readiness tests").

**Bằng chứng:** `hidden_test_ready/run_hidden_test.py` import `src.comparison_engine`, `src.document_processing`, `src.genai_pipeline` (code cũ). `tests/` ở gốc lỗi khi nạp test vì thiếu `google.generativeai`.

**Việc cần làm:**
1. Viết lại `run_hidden_test.py` gọi backend qua HTTP (hoặc `TestClient`): đăng nhập, tải mọi PDF/DOCX trong một thư mục, in kết quả kiểm tra tài liệu (T22), mâu thuẫn (T10), ảnh hưởng phiên bản (T11), cờ tấn công; tạo vị trí mới nếu thư mục có `role_matrix.csv`; sinh lộ trình bằng bản nháp theo luật; in coverage, traceability, bảng so sánh. Ghi `hidden_test_ready/hidden_test_report.json`.
2. Nhóm quyết định với `src/` và `tests/` ở gốc: chuyển các test còn giá trị sang `backend/tests/`, rồi đánh dấu `src/` là bản cũ trong `src/README.md`, hoặc xoá. Đừng để `tests/` đỏ trong repo nộp bài.

### T24. Đọc CV khi tạo tài khoản nhân viên (tuỳ chọn, làm sau cùng)

**Căn cứ:** Step 9 ("Sensitive personal information should not be required"), mục 1.5 (privacy). SRS không yêu cầu tính năng này.

**Ràng buộc nếu làm:**
- Chỉ trích các trường Step 9 cần: tên, email, kinh nghiệm trước, năng lực.
- Không lưu file CV sau khi trích.
- HR xem lại trước khi tạo.
- Gửi **link đặt mật khẩu** (tái dùng token lời mời, `api/routes/invite.py`), không gửi mật khẩu dạng chữ.
- CV dạng ảnh cần OCR; ghi rõ trong README: Gemini vision tốn quota và gửi dữ liệu cá nhân ra ngoài, Tesseract phải cài thêm.

### T25. Triển khai

**Căn cứ:** Deliverable 11, 14.

**Việc cần làm:** thêm `backend/Dockerfile` (Python 3.14, `uvicorn app.main:app`), build frontend tĩnh, file cấu hình Render hoặc Railway, hướng dẫn biến môi trường trong README (không commit khoá). Dùng PostgreSQL khi deploy (`psycopg` đã có). Migration chạy lúc khởi động.

## 7. Thứ tự làm và phụ thuộc

```
T1 ─┐
T2 ─┤ (P0, làm ngay, độc lập)
    │
T3 ──► T4 ──► T5 ──► T6          (P1 ma trận: T5 cần T3 và T4)
T7 ──► T8                          (P1 ma trận: quản lý rồi trích)
T9 ──► T10 ──► T11                 (P1 dữ liệu ẩn: T10 dùng precedence cấu hình)
T12 ──► T13                        (P2: consistency lưu vào revisions)
T14, T15, T16, T17, T18            (P2, độc lập; T14 và T15 dùng schema của T4)
T19, T20, T21, T22, T23            (P3, T22 cần T9)
T24, T25                           (tuỳ chọn và triển khai)
```

## 8. Kiểm tra trước khi đánh dấu một task là xong

1. `pytest` backend xanh, số test tăng đúng số test mới; `ruff check app tests alembic` sạch.
2. `npx vitest run` xanh; `npx vite build` thành công; khoá `en.js` và `vi.js` khớp nhau.
3. Task có migration: đã chạy upgrade, downgrade, upgrade và `alembic check` trên bản sao DB; đã sao lưu DB thật rồi mới nâng cấp.
4. Task có giao diện: đã mở bằng Chrome headless với backend thật (`BROWSER=none`), không lỗi console, đã chụp màn hình vào scratchpad.
5. Không có số liệu tự tạo, không có emoji, không có TODO.
6. Đã thêm một dòng vào `AI_USAGE.md` ghi file sửa, việc làm, số test thật, người kiểm.
7. Tài liệu liên quan đã cập nhật: `backend/README.md` (API), `documentation/FRONTEND_FLOWS.md` (giao diện), README gốc (hướng dẫn chạy, nếu đổi).
