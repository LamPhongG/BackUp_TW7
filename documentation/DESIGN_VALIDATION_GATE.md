# Thiết kế: cổng kiểm định giữa HR và Reviewer

> Trạng thái: bản đề xuất, chưa code. Q1–Q4 ở mục 3 đã chốt; Q5–Q10 ở mục 12 chờ nhóm duyệt.
> Ngày: 26/09/2026 · Người soạn: Phạm Tấn Tài (có AI hỗ trợ, xem `AI_USAGE.md`)
> Đầu vào: yêu cầu "tool riêng nằm giữa Reviewer và HR, không tin tài liệu và lộ trình AI tạo" của Tài; SRS Pipeline 2 (Python validation) và Comparison.

## 1. Mục tiêu

Cổng kiểm định là một bước kiểm tra bằng Python thuần, chạy mỗi khi HR gửi lộ trình. Cổng coi cả lộ trình do AI viết lẫn tài liệu HR tải lên là chưa đáng tin. Mọi lỗi tìm được được xếp theo mức nặng. Reviewer xem các lỗi đó để quyết định: phát hành cho nhân viên, hoặc trả HR sửa và sinh lại. Vòng HR → cổng → Reviewer lặp lại cho tới khi lộ trình được phát hành.

Cổng không gọi Gemini và không import SDK AI nào (Rules mục 3). Kết quả của cổng không dựa trên báo cáo mà Pipeline 1 tự khai lúc sinh: cổng tính lại mọi thứ từ nội dung cuối cùng của lộ trình (sau khi HR hoặc Reviewer đã sửa) và từ tài liệu trong kho.

## 2. Hiện trạng

Server đã có một phần của cổng, nằm ở `services/path_checks.py`:

| Đã có | Ở đâu | Ghi chú |
| :--- | :--- | :--- |
| Câu trích phải có nguyên văn trong chunk; đáp án phải nằm trong câu trích | `check_knowledge` | Trạng thái `hallucination`, `contradiction`, `source_missing`, `outdated_source`, `pending` |
| Thứ tự giai đoạn, nhiệm vụ có tiêu chí, dạy trước rồi mới kiểm tra | `check_flow` | 13 mã `flow_*`, mức `error` hoặc `warning` |
| Câu lệnh tấn công trong nội dung gửi tới nhân viên | `check_injection` | |
| Mục trùng nhau | `check_duplicates` | Ngưỡng giống nhau 0,85 |
| Chạy lại khi gửi, khi yêu cầu sửa, khi duyệt; chặn duyệt khi có lỗi chặn | `submit`, `request_changes`, `approve` trong `services/paths.py` | Duyệt khi chưa *Verified* phải có lý do ≥ 10 ký tự |

Những phần còn thiếu:

- **Coverage theo Role Requirement Matrix chưa bao giờ được tính.** `rule_pipeline.compute_coverage` chỉ có test gọi; cả 10 lộ trình trong DB có `coverage = null`, nên mọi lộ trình đều mang cảnh báo `reason_coverage_pending`. Ví dụ LP-17D8260750 (Hội nhập Branch Manager, đã phát hành) thiếu 9/23 yêu cầu bắt buộc theo `generation.requirements`, nhưng kiểm định chỉ ra *Verified with Warning* và không nhắc tới 9 yêu cầu đó.
- Chưa kiểm tra lại tài liệu nguồn: số mục được trích có tồn tại không, chunk được trích có bị gắn cờ tấn công không, các tài liệu có nói ngược nhau không.
- Lỗi chỉ có 2 mức (chặn / cảnh báo) và chỉ được đếm theo nhóm. Reviewer không có danh sách từng lỗi kèm bằng chứng, không đánh dấu chấp nhận từng lỗi được.
- Kết quả kiểm định không được lưu, nên không so được vòng này với vòng trước.
- Chưa có thông báo. Sinh lại luôn sinh cả lộ trình.

Chạy `check_path` trên DB hiện tại: 430 ms cho lộ trình 111 mục, 1,8 giây cho lộ trình 254 mục. Cổng chạy đồng bộ ngay lúc HR bấm gửi được, không cần job nền.

## 3. Quyết định đã chốt

| # | Câu hỏi | Chốt |
| :---: | :--- | :--- |
| Q1 | Cổng không bắt được lỗi nào thì lộ trình đi đâu? | Vẫn tới Reviewer, gắn nhãn *Đạt kiểm định*; Reviewer phát hành bằng 1 lần bấm |
| Q2 | Có lỗi nghiêm trọng thì sao? | Vẫn chuyển Reviewer (cổng không tự trả HR). Reviewer không phát hành được cho tới khi hết lỗi nghiêm trọng: sửa trực tiếp hoặc trả HR |
| Q3 | Thông báo qua đâu? | Chuông trong ứng dụng. Dùng bảng `notifications` đã thiết kế ở `DESIGN_PATH_ASSIGNMENT.md` mục 4.3 |
| Q4 | Làm gì trước? | Viết tài liệu này cho nhóm duyệt, rồi mới code |

## 3b. Tên gọi

| Tên trong tài liệu | Trong code |
| :--- | :--- |
| Cổng kiểm định | `services/validation_gate.py` |
| Một lần chạy cổng | bảng `validation_runs` |
| Lỗi | `issue`, mỗi lỗi có `code`, `severity`, `origin` |
| Kết luận của một lần chạy | `verdict`: `pass`, `minor`, `major`, `critical` |

`verdict` không thay cho `final_status` (`verified` / `verified_warning` / `manual_review`) đang dùng ở frontend và audit log. Quy đổi: `pass` → `verified`; `minor` → `verified_warning`; `major` và `critical` → `manual_review`.

## 4. Luồng

```
HR tạo / sửa / sinh lại  ──►  (tuỳ chọn) HR bấm "Kiểm tra trước"  ──►  HR gửi duyệt
                                                                        │
                                                          Cổng kiểm định chạy, lưu validation_run
                                                                        │
                                                        in_review + thông báo chuông cho Reviewer
                                                                        │
     ┌─────────────────────────────┬────────────────────────────┬───────┴───────────────────────┐
  verdict pass                 verdict minor                verdict major                 verdict critical
  Phát hành 1 lần bấm          Phát hành kèm lý do          Chấp nhận từng lỗi lớn         Không phát hành được.
                                                            kèm lý do, hoặc trả HR         Sửa trực tiếp (cổng chạy
                                                                                           lại) hoặc trả HR
                                                                        │
                                                   Trả HR: lỗi được chọn thành góp ý gắn vào từng mục,
                                                   thông báo chuông cho HR, trạng thái changes_requested
                                                                        │
                                          HR sinh lại các học phần lỗi hoặc sửa tay / tải tài liệu mới
                                                                        │
                                                        Gửi duyệt lại (r2, r3…), quay về cổng
```

Trạng thái lộ trình giữ nguyên 5 giá trị đang có (`draft`, `in_review`, `changes_requested`, `published`, `archived`), không thêm trạng thái mới. Cổng chạy bên trong hành động gửi, nên lộ trình không bao giờ nằm ở trạng thái "đang kiểm định".

Cổng chạy trong 5 trường hợp:

1. HR gửi hoặc gửi lại.
2. HR bấm *Kiểm tra trước* khi còn ở `draft` / `changes_requested`. Lần chạy này được lưu nhưng không gửi thông báo.
3. Reviewer sửa trực tiếp khi `in_review`. Chạy lại sau mỗi lần lưu, để lỗi đã sửa biến mất khỏi danh sách.
4. Reviewer bấm phát hành. Server chạy lại lần cuối, vì tài liệu có thể đã đổi từ lúc gửi.
5. Reviewer bấm *Chạy lại*.

### 4.1 Gợi ý của cổng cho Reviewer

Cổng ghi thêm một gợi ý. Reviewer vẫn là người quyết định.

| Điều kiện | Gợi ý |
| :--- | :--- |
| Không có lỗi | Phát hành |
| Chỉ có lỗi nhỏ | Phát hành kèm lý do |
| Có lỗi nghiêm trọng, hoặc từ 3 lỗi lớn trở lên, hoặc coverage < 60% | Trả HR |
| 1–2 lỗi lớn | Reviewer tự cân nhắc |

Con số 3 lỗi lớn là đề xuất, xem Q5.

### 4.2 Lỗi do lộ trình hay do tài liệu

Mỗi lỗi có `origin`, vì cách sửa khác nhau:

- `path`: nội dung lộ trình sai, ví dụ câu trích bịa hoặc thiếu yêu cầu bắt buộc. HR sửa tay hoặc sinh lại.
- `document`: bản thân tài liệu có vấn đề, ví dụ trích mục không tồn tại, hai tài liệu nói ngược nhau, tài liệu hết hiệu lực. Sinh lại không sửa được; HR phải tải phiên bản mới hoặc bỏ tài liệu khỏi nguồn.
- `matrix`: Role Requirement Matrix lệch với tài liệu, ví dụ dòng ma trận ghi `Source_Version` 1.0 trong khi bản đang hiệu lực là 1.1.

Khi một lỗi có `origin = document` xuất hiện lại qua 2 vòng liên tiếp, màn hình của HR ghi rõ "sinh lại không sửa được lỗi này" và chỉ ra tài liệu cần sửa.

## 5. Danh sách kiểm tra

Ba mức nặng:

- **`critical`** (nghiêm trọng): không phát hành được. Gồm toàn bộ lỗi đang chặn duyệt hiện nay, cộng các kiểm tra tài liệu mới có cùng độ nguy hiểm.
- `major` (lớn): phát hành được nếu Reviewer chấp nhận từng lỗi kèm lý do.
- `minor` (nhỏ): phát hành được với một lý do chung.

### 5.1 Nội dung lộ trình (đã có, đổi cách xếp mức)

| Mã | Kiểm tra | Mức | Origin |
| :--- | :--- | :--- | :--- |
| `hallucination` | Câu trích không có nguyên văn trong chunk của tài liệu | critical | path |
| `contradiction` | Đáp án đúng không nằm trong câu trích | critical | path |
| `source_missing` | Mục không có nguồn, hoặc nguồn không có trong kho | critical | path |
| `injection_content` | Nội dung gửi tới nhân viên có câu lệnh tấn công | critical | path |
| `flow_*` mức `error` | Ví dụ `flow_stage_order`, `flow_untaught_item`, `flow_task_no_criteria`, `flow_quiz_invalid` | critical | path |
| `outdated_source` | Trích bản tài liệu `obsolete`, `expired` hoặc `upcoming` | major (hiện là cảnh báo) | document |
| `mandatory_sources_missing` | Thiếu tài liệu bắt buộc của ma trận | major | path |
| `flow_*` mức `warning` | Ví dụ `flow_foundation_late`, `flow_no_final_assessment` | minor | path |
| `duplicate_items` | Hai mục giống nhau ≥ 0,85 | minor | path |
| `pending` | Chunk được trích chưa được trích xuất xong | minor | document |

### 5.2 Yêu cầu của vị trí (Pipeline 2, mới)

Tính theo từng dòng của bảng `role_requirements` (203 dòng R001… nhập từ `role_matrix/role_matrix.csv`), không theo dict viết tay `rule_pipeline/matrix.py`. Mỗi mục được gắn Requirement ID bằng mã tài liệu và số mục của câu trích, như `genai_pipeline/requirements.py::tag_modules` đang làm. Hàm này chuyển sang `rule_pipeline/` để cổng gọi lại trên nội dung cuối cùng.

| Mã | Kiểm tra | Mức | Origin |
| :--- | :--- | :--- | :--- |
| `req_mandatory_not_taught` | Yêu cầu bắt buộc không có bài học nào dạy (1 lỗi / yêu cầu) | major | path |
| `req_mandatory_not_assessed` | Yêu cầu bắt buộc đã dạy nhưng không có nhiệm vụ hay câu hỏi nào kiểm tra | minor | path |
| `req_low_coverage` | Coverage < 60% | major | path |
| `req_medium_coverage` | Coverage 60–85% | minor | path |
| `req_version_mismatch` | `Source_Version` của dòng ma trận khác bản tài liệu đang hiệu lực | minor | matrix |

Coverage = số yêu cầu bắt buộc đã được dạy / tổng số yêu cầu bắt buộc của vị trí. Yêu cầu tuỳ chọn không tính (xem Q6). Kết quả ghi vào `learning_paths.coverage` theo đúng dạng `{score, requiredDocs, topics}` mà frontend đang đọc. `topics` là danh sách yêu cầu (`id` = R001…, `label` = nội dung yêu cầu, `covered`). Nhờ vậy cảnh báo `reason_coverage_pending` biến mất mà frontend không phải sửa.

### 5.3 Tài liệu nguồn (mới)

| Mã | Kiểm tra | Mức | Origin |
| :--- | :--- | :--- | :--- |
| `src_section_missing` | Số mục được trích (`source_reference.section`) không có trong dàn ý của tài liệu (trường hợp CTX-09, SRS Step 38) | critical | document |
| `src_flagged_chunk` | Chunk được trích có dòng trong `injection_flags` | critical | document |
| `src_unsupported_number` | Nhiệm vụ hoặc câu hỏi có số (ngày, giờ, số tiền, phần trăm) không xuất hiện trong chunk được trích. Grounding đã loại lỗi này lúc sinh, nhưng HR và Reviewer sửa tay có thể đưa vào lại | major | path |
| `src_role_mismatch` | Mục lấy từ phần tài liệu gắn `[ROLE-SPECIFIC: …]` của vị trí khác (SRS Step 36, CTX-08) | major | path |
| `src_conflict` | Hai tài liệu cùng được trích cho một yêu cầu nhưng khác số liệu; lộ trình dạy theo tài liệu có thẩm quyền thấp hơn (`rule_pipeline/precedence.py`: Handbook/Policy > SOP > FAQ; cùng bậc thì bản mới hơn thắng). Ví dụ CTX-02 (FAQ) và DOC-01 §6 | major | document |

`src_conflict` so số liệu có đơn vị (ví dụ "24 giờ" và "48 giờ") trong các chunk được gắn cùng Requirement ID. Cách này có thể báo nhầm, nên chỉ ở mức `major`, không chặn phát hành.

### 5.4 Dạng một lỗi

```json
{
  "id": "a3f9c2d1",
  "code": "req_mandatory_not_taught",
  "severity": "major",
  "origin": "path",
  "module_id": null,
  "item_id": null,
  "doc_code": "DOC-06",
  "section": "5",
  "requirement_id": "R062",
  "vars": {"requirement": "Oversee incident-reporting compliance within the branch, ensuring 1-hour reporting to IT Security"},
  "evidence": {"expected": "Bài học trích DOC-06 §5", "found": "Không có"},
  "first_seen_revision": 1
}
```

`id` là mã băm của `code` + `item_id` + `requirement_id` + `doc_code` + `section`, nên cùng một lỗi có cùng `id` qua các vòng. Nhờ đó so được vòng này với vòng trước (đã sửa, còn lại, mới xuất hiện). Câu hiển thị được dịch ở frontend từ `code` + `vars` (khoá `issue_<code>`), không lưu sẵn trong DB.

## 6. Mô hình dữ liệu

### 6.1 Bảng `validation_runs` (mới)

| Cột | Kiểu | Ý nghĩa |
| :--- | :--- | :--- |
| `id` | int | |
| `path_id` | → `learning_paths.id` | |
| `revision` | int | Revision của lộ trình lúc chạy |
| `trigger` | chuỗi | `submit`, `precheck`, `reviewer_edit`, `approve`, `manual` |
| `verdict` | enum | `pass`, `minor`, `major`, `critical` |
| `recommendation` | chuỗi | `publish`, `publish_with_reason`, `reviewer_decides`, `return_to_hr` |
| `counts` | JSON | `{critical, major, minor}` |
| `issues` | JSON | Danh sách lỗi dạng mục 5.4 |
| `coverage` | JSON | Cùng dạng `learning_paths.coverage` |
| `ruleset_version` | chuỗi | Ví dụ `gate-1.0`; đổi luật thì tăng, để biết lần chạy cũ theo luật nào |
| `duration_ms` | int | |
| `run_by_id` | → `users.id` | |
| `created_at` | datetime | |

Không cập nhật hay xoá dòng cũ. Mỗi lần chạy thêm một dòng mới, đây chính là lịch sử các vòng.

### 6.2 Quyết định của Reviewer trên từng lỗi

Lưu trong audit log của hành động `approve`, không tạo bảng riêng: `details.accepted_issues = [{"id": "...", "reason": "..."}]`. Server từ chối phát hành nếu còn lỗi `major` chưa có trong danh sách này, hoặc còn bất kỳ lỗi `critical` nào.

### 6.3 Các bảng khác

- `learning_paths`: thêm `last_run_id` (→ `validation_runs.id`, null) để danh sách lộ trình lấy `verdict` mà không phải đọc cả bảng lịch sử.
- `notifications`: tạo theo `DESIGN_PATH_ASSIGNMENT.md` mục 4.3. Cổng dùng 3 `kind` có sẵn trong thiết kế đó (`review_requested`, `changes_requested`, `path_published`), `vars` thêm `verdict` và `counts`.

## 7. API

| Endpoint | Ai | Thay đổi |
| :--- | :--- | :--- |
| `POST /paths/{id}/submit` | HR | Chạy cổng, lưu run, gửi thông báo cho mọi Reviewer. Trả thêm `validation` |
| `POST /paths/{id}/validation/run` | HR (draft, changes_requested), Reviewer (in_review) | Mới. `trigger` = `precheck` hoặc `manual` |
| `GET /paths/{id}/validation` | HR, Reviewer | Mới. Lần chạy mới nhất + tóm tắt các lần trước (revision, verdict, counts) + so với vòng trước: `fixed`, `remaining`, `new` |
| `GET /paths/{id}/validation/runs/{run_id}` | HR, Reviewer | Mới. Chi tiết một lần chạy cũ |
| `PATCH /paths/{id}` | Reviewer khi `in_review` | Sau khi lưu thì chạy cổng (`trigger` = `reviewer_edit`) |
| `POST /paths/{id}/approve` | Reviewer | Thêm `accepted_issues: [{id, reason}]`. Chạy cổng lần cuối; lỗi `critical` → 409 `err_approve_blocked` (như hiện nay); lỗi `major` chưa chấp nhận → 422 `err_major_not_accepted` |
| `POST /paths/{id}/request-changes` | Reviewer | Thêm `issue_ids`: mỗi lỗi được chọn thành một góp ý gắn vào mục của nó (`item_ref`), trong tab Trao đổi. Thông báo cho HR |
| `POST /paths/{id}/regenerate` và `/regenerate/jobs` | HR | Thêm `module_ids` (tuỳ chọn): chỉ sinh lại các học phần này, giữ nguyên phần còn lại và các chỗ HR đã sửa tay |
| `GET /paths/{id}/checks` | HR, Reviewer | Giữ đến khi frontend chuyển xong sang `/validation`, rồi xoá |
| `GET /notifications`, `POST /notifications/{id}/read`, `POST /notifications/read-all` | Mọi vai trò | Theo `DESIGN_PATH_ASSIGNMENT.md` mục 6 |

## 8. Giao diện

HR, trang chi tiết lộ trình:

- Nút *Kiểm tra trước* cạnh *Gửi duyệt*, để HR tự sửa trước khi Reviewer phải xem.
- Tab *Kiểm định* đổi thành báo cáo của cổng: số lỗi theo mức, danh sách lỗi (bấm vào thì nhảy tới mục bị lỗi), bằng chứng (câu trích và đoạn tài liệu gốc đặt cạnh nhau).
- Khi bị trả về: băng thông báo đỏ ghi số lỗi Reviewer chọn, nút *Sinh lại các học phần lỗi* (điền sẵn `module_ids`). Lỗi có `origin = document` có nút mở trang tài liệu thay vì sinh lại.

Reviewer:

- Hàng đợi duyệt: nhãn `verdict` trên từng lộ trình (*Đạt kiểm định*, *Lỗi nhỏ*, *Lỗi lớn*, *Lỗi nghiêm trọng*) và bộ lọc theo nhãn. Lộ trình *Đạt kiểm định* có nút *Phát hành* ngay trên thẻ; đích phát hành điền sẵn phòng ban và vị trí của lộ trình.
- Trang duyệt: băng gợi ý của cổng (mục 4.1); danh sách lỗi theo mức; mỗi lỗi `major` có ô *Chấp nhận* kèm ô lý do; ô chọn lỗi để đưa vào *Trả HR*. Nút *Phát hành* chỉ bấm được khi không còn lỗi `critical` và mọi lỗi `major` đã được chấp nhận.
- Từ vòng 2: dòng so sánh "Đã sửa 5 · Còn 2 · Mới 1" và danh sách tương ứng.

Cả 3 vai trò: chuông trên thanh trên cùng (`DESIGN_PATH_ASSIGNMENT.md` mục 7).

## 9. Chế độ không có backend

Chế độ chỉ có frontend vẫn dùng `utils/pathChecks.js` như hiện nay. Cổng kiểm định, mức lỗi, chấp nhận từng lỗi và chuông chỉ có ở chế độ backend. Coverage theo ma trận vẫn là *chờ backend*.

## 10. Code nằm ở đâu

| Phần | File | Người làm (đề xuất, xem Q9) |
| :--- | :--- | :--- |
| Coverage theo yêu cầu, gắn Requirement ID | `rule_pipeline/coverage.py`, `rule_pipeline/requirements.py` (chuyển từ `genai_pipeline/`) | Nhi |
| Kiểm tra tài liệu nguồn (5.3) | `rule_pipeline/source_checks.py` | Nhi |
| Xếp mức lỗi, gợi ý, `id` lỗi, so vòng | `rule_pipeline/severity.py` | Nhi |
| Chạy cổng, lưu run, thông báo | `services/validation_gate.py` | Tài |
| API, migration, giao diện | `api/routes/paths.py`, `alembic/`, `frontend/src/pages/reviewer/*`, `pages/hr/*` | Tài |

`rule_pipeline/matrix.py` (dict viết tay, mã tài liệu không khớp ma trận thật) bị xoá. `src/python_validation/` không dùng được với CSV hiện tại (đọc các cột `role`, `topic`, `prerequisite_of` không có trong file, nên lỗi `KeyError: 'role'`) và import `src.genai_pipeline` kéo theo `google.generativeai`. Nhóm quyết định xoá hay giữ làm tài liệu tham khảo (Q10).

## 11. Kiểm thử

Mỗi kiểm tra ở mục 5 có ít nhất một test cho trường hợp bắt được lỗi và một test cho trường hợp không có lỗi. Ngoài ra:

- Bộ tài liệu đối kháng `sample_documents/adversarial/CTX-01…09`: mỗi file phải bị bắt đúng loại lỗi mà README của thư mục đó mô tả (ví dụ CTX-09 → `src_section_missing`, CTX-02 → `src_conflict`, CTX-08 → `src_role_mismatch`).
- Vòng lặp: gửi → trả HR với 2 lỗi → sửa 1 lỗi → gửi lại. Kết quả phải là `fixed` = 1, `remaining` = 1, `new` = 0, cùng `id` lỗi.
- Phát hành bị từ chối khi còn lỗi `critical`, và khi còn lỗi `major` chưa chấp nhận; được phép khi đã chấp nhận hết.
- Sinh lại với `module_ids`: các học phần khác giữ nguyên từng byte.
- Chạy cổng trên cả 10 lộ trình trong DB (bản sao): LP-17D8260750 phải ra 9 lỗi `req_mandatory_not_taught` (R062, R064, R116, R119, R120, R122–R125); thời gian mỗi lần chạy dưới 3 giây.
- `rule_pipeline/` không import `google`, `openai`, `langchain` (test quét import).
- E2E Chrome: HR gửi → Reviewer thấy chuông và nhãn → trả HR 2 lỗi → HR thấy chuông, sinh lại học phần lỗi, gửi lại → Reviewer thấy "Đã sửa", phát hành.

## 12. Câu hỏi cần nhóm quyết

| # | Câu hỏi | Đề xuất |
| :---: | :--- | :--- |
| Q5 | "Nhiều lỗi lớn" là bao nhiêu để cổng gợi ý trả HR? | 3 lỗi `major` trở lên, hoặc coverage < 60% |
| Q6 | Coverage tính yêu cầu tuỳ chọn không? Yêu cầu đã dạy nhưng chưa kiểm tra có tính là đã phủ không? | Chỉ yêu cầu bắt buộc. Đã dạy là tính, chưa kiểm tra thì báo lỗi `minor` riêng |
| Q7 | Reviewer được chấp nhận lỗi `major` để phát hành, hay lỗi `major` bắt buộc trả HR? | Được chấp nhận, từng lỗi một, kèm lý do; lý do lưu trong audit log |
| Q8 | Tài liệu có phiên bản mới thì có chạy lại cổng cho các lộ trình đã phát hành và báo HR không? | Có, nhưng làm ở đợt sau (sau bước 5 mục 13) |
| Q9 | Chia việc như mục 10 (Nhi làm `rule_pipeline/`, Tài làm service, API, giao diện) được không? | Được, vì đúng WBS: Pipeline 2 thuộc Nhi |
| Q10 | Xử lý `src/python_validation/` và `rule_pipeline/matrix.py` thế nào? | Xoá `matrix.py`; `src/python_validation/` xoá sau khi phần mới có test thay thế |

## 13. Thứ tự triển khai đề xuất

1. Coverage theo `role_requirements` ghi vào `learning_paths.coverage`; chuyển `tag_modules` sang `rule_pipeline/`; xoá `matrix.py`. Riêng bước này đã làm mất cảnh báo `reason_coverage_pending` và làm lộ ra các yêu cầu bắt buộc bị thiếu.
2. Mức lỗi 3 cấp, `id` lỗi, bảng `validation_runs`, `services/validation_gate.py`, API `/validation`, `accepted_issues` khi phát hành, `issue_ids` khi trả HR.
3. Kiểm tra tài liệu nguồn ở mục 5.3, chạy thử với CTX-01…09.
4. Giao diện HR và Reviewer (mục 8), bảng `notifications` và chuông (dùng chung với bước 4 của `DESIGN_PATH_ASSIGNMENT.md`).
5. Sinh lại theo `module_ids`.

Mỗi bước kết thúc bằng pytest, Vitest, một lần E2E trên Chrome, và một dòng trong `AI_USAGE.md`.
