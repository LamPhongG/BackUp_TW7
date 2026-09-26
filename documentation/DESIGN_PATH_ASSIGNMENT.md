# Thiết kế: gán lộ trình, tiến độ học và thông báo

> Trạng thái: **bước 1–2 đã làm (26/09/2026)**; Q1, Q2 đã chốt; bước 3–5 và Q3–Q6 chờ nhóm duyệt.
> Ngày: 26/09/2026 · Người soạn: Phạm Tấn Tài (có AI hỗ trợ, xem `AI_USAGE.md`)
> Đầu vào: đặc tả "Hai loại lộ trình, luồng duyệt, gán và thực hiện" của nhóm.

## 1. Mục tiêu

Đặc tả của nhóm yêu cầu 3 việc mà hệ thống hiện tại chưa làm:

- Mỗi lần giao lộ trình cho một nhân viên phải thành một **bản ghi cá nhân** lưu ở server, có trạng thái đang học / hoàn thành và hạn hoàn thành.
- Lộ trình Hội nhập được **tự gán** cho nhân viên mới của phòng ban/vị trí; lộ trình Thăng tiến được **gán đích danh**.
- Nhân viên, Reviewer và HR **được thông báo** khi có việc liên quan tới họ.

Tài liệu này mô tả thay đổi về dữ liệu, luồng, API, quyền, giao diện và kiểm thử để nhóm duyệt trước khi code.

## 2. Đối chiếu đặc tả với hệ thống hiện tại

| Đặc tả | Hệ thống hiện tại | Việc cần làm |
| :--- | :--- | :--- |
| Hai loại: Hội nhập / Thăng tiến | Có (`purpose`: `onboarding` / `promotion`), chọn khi HR tạo | Không đổi |
| HR tạo → chờ duyệt | HR tạo ra bản nháp (`draft`), sửa, rồi *Gửi duyệt* → `in_review` | Giữ bước nháp (đã chốt, mục 3) |
| Reviewer nhận yêu cầu duyệt | Hàng đợi duyệt và dashboard; chưa có thông báo | Thêm thông báo (mục 7) |
| Duyệt → `APPROVED/PUBLISHED`, vào thư viện | `published`; danh sách lộ trình đã phát hành là thư viện | Không đổi |
| Hội nhập: tự gán theo phòng ban/vị trí | Nhân viên *thấy* lộ trình phát hành cho phòng ban/vị trí của mình; không có bản ghi gán | Tạo bản ghi gán tự động (mục 5.3) |
| Thăng tiến: gán đích danh | Chưa có; Reviewer chỉ phát hành được cho phòng ban/vị trí | Thêm gán thủ công (mục 5.4) |
| Bản ghi cá nhân `Employee_LearningPaths` | Bảng `enrollments` có trong DB nhưng chưa có API; tiến độ đang lưu ở `localStorage` của trình duyệt | Mở rộng `enrollments`, thêm API (mục 4.2, 6) |
| Hạn hoàn thành | Chưa có | Thêm `due_date` (mục 5.3, 5.4) |
| Thông báo email / in-app | Chưa có (email chỉ dùng cho lời mời) | Thêm bảng `notifications` (mục 4.3, 7) |
| `IN_PROGRESS` → `COMPLETED` | Tính ở trình duyệt, không lưu | Tính và lưu ở server (mục 5.5) |

## 3. Quyết định đã chốt

- **Giữ tên hiện tại.** Không đổi tên trạng thái hay tên bảng; dùng bảng đối chiếu dưới đây trong mọi tài liệu và khi trao đổi.
- **Giữ bước bản nháp.** HR phải đọc và sửa nội dung AI sinh ra trước khi gửi duyệt.

| Tên trong đặc tả | Tên trong hệ thống |
| :--- | :--- |
| `LearningPath_Templates` | bảng `learning_paths` |
| `PENDING_REVIEW` | `in_review` |
| `APPROVED` / `PUBLISHED` | `published` |
| Thư viện lộ trình (Path Library) | các lộ trình `published` |
| `Employee_LearningPaths` | bảng `enrollments` (mở rộng) |
| `IN_PROGRESS` / `COMPLETED` | `enrollments.status` = `in_progress` / `completed` |

## 4. Mô hình dữ liệu

### 4.1 Không nhân bản nội dung lộ trình

Đặc tả nói "nhân bản bản gốc thành bản ghi cá nhân". Đề xuất **không chép** cây nội dung (`stages`) vào bản ghi cá nhân, chỉ trỏ tới lộ trình:

- Lộ trình đã phát hành là chỉ đọc (`services/path_workflow.py`): muốn đổi phải thu hồi rồi tạo lộ trình mới với id mới. Vì vậy nội dung mà một bản ghi cá nhân trỏ tới không bao giờ thay đổi.
- Lộ trình bị thu hồi vẫn giữ nguyên nội dung, nên lịch sử học vẫn mở lại được.
- Chép cây nội dung (thường 150–230 mục) cho từng nhân viên làm DB lớn nhanh mà không thêm thông tin gì.

### 4.2 Bảng `enrollments` (mở rộng)

Một dòng = một lần giao một lộ trình cho một nhân viên. Giữ ràng buộc duy nhất `(user_id, path_id)`.

| Cột | Kiểu | Mới? | Ý nghĩa |
| :--- | :--- | :---: | :--- |
| `id` | int | | |
| `user_id` | → `users.id` | | Nhân viên được giao |
| `path_id` | → `learning_paths.id` | | Lộ trình (đã phát hành) |
| `status` | `assigned` / `in_progress` / `completed` / `withdrawn` | mới | Mục 5.5 |
| `source` | `auto_department` / `auto_position` / `manual` | mới | Vì sao được giao |
| `assigned_by_id` | → `users.id`, null | mới | Null khi tự gán |
| `assigned_at` | datetime | mới | |
| `due_date` | date, null | mới | Hạn hoàn thành |
| `note` | text, null | mới | Lời nhắn của người gán (gán thủ công) |
| `started_at` | datetime, **null** | đổi | Hiện mặc định là lúc tạo dòng; đổi thành lúc nhân viên học mục đầu tiên |
| `completed_at` | datetime, null | | |
| `withdrawn_at`, `withdrawn_reason` | null | mới | Khi HR rút lại hoặc lộ trình bị thu hồi |
| `lessons_read`, `tasks_done` | JSON | | Giữ như hiện tại |

Bảng `quiz_attempts` giữ nguyên. Thêm index `(user_id, status)` cho trang "Lộ trình của tôi" và `(path_id, status)` cho trang tiến độ của HR.

`path_assignments` giữ vai trò **đích phát hành** (phòng ban / vị trí) của lộ trình Hội nhập, dùng để tự gán. Cột `user_id` của bảng này đã xoá (migration `drop path_assignments.user_id`); gán đích danh ghi thẳng vào `enrollments`.

### 4.3 Bảng `notifications` (mới)

| Cột | Kiểu | Ý nghĩa |
| :--- | :--- | :--- |
| `id` | int | |
| `user_id` | → `users.id` | Người nhận |
| `kind` | chuỗi | `review_requested`, `changes_requested`, `path_published`, `path_assigned`, `due_soon`, `overdue`, `assignment_withdrawn` |
| `vars` | JSON | Tham số cho câu thông báo, ví dụ `{"path": "...", "due": "2026-10-31"}` |
| `link` | chuỗi | Đường dẫn trong app, ví dụ `/employee/paths/LP-…` |
| `ref_id` | chuỗi, null | Id lộ trình hoặc bản ghi gán; cùng `kind` tạo ràng buộc duy nhất để không nhắc trùng |
| `email_sent` | bool | |
| `created_at`, `read_at` | datetime | |

Câu thông báo **không lưu sẵn** mà dịch ở frontend từ `kind` + `vars` (khoá `notif_<kind>`), nên chuông hiện đúng ngôn ngữ người dùng đang chọn. Email dùng tiếng Việt như email lời mời.

### 4.4 Migration và dữ liệu đang có

- Một migration: thêm cột cho `enrollments`, tạo `notifications`, đổi `started_at` thành nullable.
- Backfill: với mỗi lộ trình Hội nhập đang `published`, chạy luật tự gán ở mục 5.3 cho nhân viên hiện có. Trên DB hiện tại: 1 lộ trình đã phát hành (LP-8D2A8BAA24, Finance / Finance Associate), 2 nhân viên đều ở phòng Engineering, nên backfill tạo **0** bản ghi. Không nhân viên nào mất lộ trình đang thấy.
- Tiến độ đang nằm ở `localStorage` của từng trình duyệt: **không chuyển** lên server (dữ liệu demo, không tin được). Ghi rõ trong ghi chú phát hành.

## 5. Luồng

### 5.1 Tạo và duyệt

Không đổi: `draft` → (HR gửi) → `in_review` → (Reviewer duyệt) → `published`, hoặc → `changes_requested` → HR sửa → gửi lại. Thêm thông báo ở mỗi bước chuyển (mục 7).

### 5.2 Phát hành

- **Hội nhập**: Reviewer bắt buộc chọn ít nhất một phòng ban hoặc vị trí, như hiện tại. Ngay sau khi phát hành, server chạy tự gán (5.3).
- **Thăng tiến**: không bắt buộc chọn đích. Lộ trình vào thư viện; việc giao làm ở bước gán thủ công (5.4). Trong hộp thoại duyệt, Reviewer có thể gán luôn cho các nhân viên đã được đề cử (không bắt buộc).
- **Tạm thời, cho tới khi có bước 3**: Reviewer vẫn chọn đích cho lộ trình Thăng tiến như trước, và server gán cho mọi nhân viên thuộc đích đó (không áp dụng Q1). Như vậy nhân viên không mất lộ trình Thăng tiến đang thấy.

### 5.3 Tự gán lộ trình Hội nhập

**Khi nào chạy:**

- Khi một lộ trình Hội nhập được phát hành.
- Khi có nhân viên mới: đăng ký qua link mời (`POST /invite/{token}/register`), hoặc khi có API tạo nhân viên sau này.
- Khi nhân viên đổi phòng ban hoặc vị trí. Hiện chưa có API cho việc này (trang Hồ sơ chỉ đổi thử ở chế độ trình duyệt); khi thêm API thì gọi cùng hàm.

**Nhân viên nào được gán:** nhân viên đang hoạt động (`is_active`), vai trò `employee`, và:

- phòng ban nằm trong đích phát hành (đích `Company-wide` = mọi phòng ban), hoặc vị trí nằm trong đích phát hành;
- **và chưa hoàn thành hội nhập**: `training_status` khác `completed`. Ví dụ trên DB hiện tại: phát hành một lộ trình Hội nhập cho Engineering thì Alex Morgan (vào 21/09/2026, `not_started`) được gán, còn Minh Nguyen (vào 2023, `completed`) thì không. Xem câu hỏi Q1.

**Không gán trùng:** đã có bản ghi cho cặp (nhân viên, lộ trình) thì bỏ qua. Một nhân viên khớp nhiều lộ trình Hội nhập (một theo phòng ban, một theo vị trí) thì được gán cả hai. Xem câu hỏi Q2.

**Hạn hoàn thành:** `joining_date + duration_days` của lộ trình (7 / 30 / 90 ngày). Nếu thiếu `joining_date` thì tính từ ngày gán. Nếu hạn đã qua (nhân viên vào lâu rồi mới có lộ trình) thì đặt hạn là ngày gán + `duration_days`.

`source` ghi `auto_position` khi khớp theo vị trí, ngược lại `auto_department`. Mỗi lần tự gán ghi một dòng audit `assign`. Cột người thực hiện (`audit_logs.actor_id`) bắt buộc có giá trị, nên ghi người gây ra việc gán: Reviewer vừa phát hành, hoặc chính nhân viên vừa đăng ký; `details.source` cho biết đây là tự gán.

### 5.4 Gán thủ công (chủ yếu cho Thăng tiến)

- Người gán: **HR hoặc Reviewer** (đặc tả ghi "HR hoặc Manager"; Reviewer là Trưởng phòng/Giám đốc).
- Điều kiện: lộ trình đang `published`. Gán được cho cả lộ trình Hội nhập (ví dụ nhân viên chuyển phòng), nhưng nút gán chủ yếu nằm ở lộ trình Thăng tiến.
- Chọn một hoặc nhiều nhân viên (tối đa 50 mỗi lần), lọc theo phòng ban/vị trí/tên.
- Hạn hoàn thành: **bắt buộc** với Thăng tiến, không được trước hôm nay; Hội nhập mặc định như 5.3.
- Kết quả trả về: số người được gán, danh sách người bỏ qua vì đã có bản ghi.

HR có thể **rút lại** một bản ghi chưa hoàn thành (`withdrawn`, có lý do). Bản ghi không bị xoá để giữ lịch sử và kết quả bài kiểm tra.

### 5.5 Nhân viên học và trạng thái

```
assigned ──(học mục đầu tiên)──► in_progress ──(hoàn thành mọi học phần)──► completed
    │                                  │
    └──────────(HR rút lại / lộ trình bị thu hồi)──────────► withdrawn
```

- "Học mục đầu tiên" = đánh dấu đọc một bài, đánh dấu một nhiệm vụ hoặc nộp một bài kiểm tra.
- **Hoàn thành** tính ở server theo đúng luật đang có ở `frontend/src/utils/progress.js`: học phần xong khi đọc hết bài, làm hết nhiệm vụ và đạt bài kiểm tra (≥ 70%); lộ trình xong khi mọi học phần xong. Luật được chép sang Python (`services/progress.py`) như cách `pathChecks.js` ↔ `path_checks.py` đang làm, kèm test so khớp hai bên.
- **Quá hạn** không phải một trạng thái lưu trong DB: tính từ `due_date < hôm nay` và `status` chưa `completed`/`withdrawn`.
- Khi lộ trình Hội nhập đầu tiên của một nhân viên hoàn thành, cập nhật `users.training_status = completed`; khi bắt đầu học, `in_progress`. Xem câu hỏi Q3.

### 5.5b Trang chủ và Khám phá lộ trình (đã làm 26/09/2026)

Hai cách nhân viên gặp lộ trình, dùng cùng bảng `enrollments`:

- **Trang chủ – Lộ trình đang học**: mọi bản ghi gán của nhân viên (query theo `user_id`), mỗi lộ trình có thanh tiến độ, nút *Bắt đầu học* / *Tiếp tục học* mở thẳng học phần tiếp theo, hạn hoàn thành và nhãn quá hạn. Lộ trình chưa xong lên trước, rồi theo hạn gần nhất. Trong lúc tải, trang hiện "Đang tải" thay vì "Chưa có lộ trình".
- **Khám phá lộ trình** (menu nhân viên): mọi lộ trình đã phát hành cho phòng ban của nhân viên, cho toàn công ty, hoặc cho một vị trí thuộc phòng ban đó (ví dụ lộ trình Team Leader hiện cho Software Support Engineer cùng phòng, để xem trước bước tiếp theo). Mỗi lộ trình có *Xem trước* (dàn ý: giai đoạn, học phần, tên bài, số nhiệm vụ và câu hỏi; không có nội dung bài và đáp án) và *Đăng ký tham gia*.
- Tự đăng ký tạo bản ghi `source = self`, **không có hạn**, gắn nhãn *Tự chọn*; ghi audit `enroll`. Đăng ký lại lộ trình đã có trả 409 `err_already_enrolled`; lộ trình ngoài phòng ban trả 404.

### 5.6 Thu hồi lộ trình

Khi HR hoặc Reviewer thu hồi (`archive`) một lộ trình:

- bản ghi `assigned` / `in_progress` chuyển thành `withdrawn` (lý do `path_archived`) và người học nhận thông báo;
- bản ghi `completed` giữ nguyên;
- lộ trình thay thế được phát hành sau đó sẽ tự gán lại theo 5.3. Nhân viên đang học dở bản cũ học lại từ đầu trên bản mới. Xem câu hỏi Q4.

## 6. API

Mọi API mới nằm dưới `/api`, lỗi trả `code` là khoá dịch như các API hiện có.

| Phương thức và đường dẫn | Ai gọi | Nội dung |
| :--- | :--- | :--- |
| `GET /employees?department=&position=&q=` | HR, Reviewer | Danh sách nhân viên để chọn khi gán (chưa có API này) |
| `POST /paths/{id}/assign` | HR, Reviewer | `{user_ids, due_date?, note?}` → `{assigned, skipped}` |
| `GET /paths/{id}/enrollments` | HR, Reviewer | Tiến độ từng người của một lộ trình: trạng thái, %, hạn, quá hạn |
| `GET /enrollments?status=&overdue=&department=` | HR, Reviewer | Tổng hợp cho dashboard |
| `POST /enrollments/{id}/withdraw` | HR | `{reason}` |
| `GET /me/enrollments` | Nhân viên | "Lộ trình của tôi": lộ trình, trạng thái, %, hạn |
| `POST /me/enrollments/{path_id}/lessons/{lesson_id}` | Nhân viên | Đánh dấu đã đọc |
| `PUT /me/enrollments/{path_id}/tasks/{task_id}` | Nhân viên | `{done: bool}` |
| `POST /me/enrollments/{path_id}/quizzes/{module_id}` | Nhân viên | `{answers}` → server chấm và trả `{score, total, passed, results}` |
| `GET /notifications?unread=` | Mọi vai trò | Thông báo của người đang đăng nhập |
| `POST /notifications/{id}/read`, `POST /notifications/read-all` | Mọi vai trò | Đánh dấu đã đọc |

Thay đổi ở API có sẵn:

- `POST /paths/{id}/approve`: với Thăng tiến, `departments` và `job_positions` được để trống; thêm `assign_user_ids` và `due_date` (không bắt buộc).
- `POST /paths/{id}/archive`: rút các bản ghi đang học (5.6).
- `POST /invite/{token}/register`: tự gán sau khi tạo tài khoản (5.3).
- Quyền xem của nhân viên (`services/visibility.py`): nhân viên thấy một lộ trình khi có bản ghi gán không ở trạng thái `withdrawn`, thay vì suy ra từ phòng ban/vị trí. Quyền xem tài liệu nguồn đi theo luật này.

## 7. Thông báo

| Sự kiện | Người nhận | In-app | Email |
| :--- | :--- | :---: | :---: |
| HR gửi duyệt / gửi duyệt lại | Mọi Reviewer | Có | Có |
| Reviewer yêu cầu sửa | HR tạo lộ trình | Có | Có |
| Reviewer phát hành | HR tạo lộ trình | Có | Không |
| Nhân viên được gán lộ trình | Nhân viên | Có | Có |
| Còn 3 ngày tới hạn | Nhân viên | Có | Có |
| Quá hạn | Nhân viên, và HR đã gán (hoặc mọi HR nếu tự gán) | Có | Có |
| Bản ghi bị rút / lộ trình bị thu hồi | Nhân viên | Có | Không |

Ví dụ câu gán, theo đặc tả: *"Bạn vừa được giao lộ trình: Đào tạo Leader tương lai. Vui lòng hoàn thành trước ngày 31/10/2026."*

- Email gửi qua `core/email.py` như email lời mời: SMTP chưa cấu hình hoặc lỗi thì chỉ ghi log, `email_sent = false`, thông báo in-app vẫn tạo.
- **Nhắc hạn không cần job chạy nền.** Server tạo thông báo `due_soon` / `overdue` khi người dùng mở danh sách thông báo hoặc "Lộ trình của tôi"; ràng buộc duy nhất `(user_id, kind, ref_id)` đảm bảo mỗi bản ghi chỉ nhắc một lần. Nhược điểm: người không đăng nhập thì không nhận email nhắc. Xem câu hỏi Q5.
- Frontend: biểu tượng chuông trên thanh trên cùng cho cả 3 vai trò, số chưa đọc, danh sách thả xuống, bấm vào mở `link`. Hỏi lại server mỗi 60 giây khi tab đang mở.

## 8. Quyền

| Hành động | HR | Reviewer | Nhân viên |
| :--- | :---: | :---: | :---: |
| Gán thủ công | Có | Có | Không |
| Rút bản ghi gán | Có | Không | Không |
| Xem tiến độ mọi người | Có | Có | Không |
| Xem và cập nhật tiến độ của mình | — | — | Có |
| Xem danh sách nhân viên | Có | Có | Không |

Bảng quyền đặt cạnh bảng `ACTIONS` hiện có ở `services/path_workflow.py` và bản chép ở `frontend/src/utils/pathWorkflow.js`, sửa cả hai cùng lúc như quy ước hiện tại.

## 9. Giao diện

- **Chi tiết lộ trình (HR, Reviewer)**: tab mới *Học viên*: danh sách người được gán, nguồn gán, trạng thái, % tiến độ, hạn, quá hạn tô đỏ; nút *Gán cho nhân viên* (hộp chọn nhiều người + hạn + lời nhắn) và *Rút lại*.
- **Hộp thoại duyệt**: với Thăng tiến, phần chọn phòng ban/vị trí thành không bắt buộc, thêm phần chọn người và hạn.
- **Dashboard HR**: số người đang học, đã xong, quá hạn; danh sách quá hạn.
- **Lộ trình của tôi (nhân viên)**: lấy từ `GET /me/enrollments` thay cho lọc theo phòng ban; hiện hạn và nhãn *Quá hạn* / *Còn n ngày*.
- **Trang học**: `EnrollmentContext` ở chế độ backend gọi API thay cho `localStorage`; chế độ không có backend giữ nguyên như hiện tại.
- **Chuông thông báo** trên thanh trên cùng (mục 7).
- Khoá dịch mới thêm đủ ở `en.js` và `vi.js`.

## 10. Chế độ không có backend

Gán, thông báo và tiến độ trên server chỉ có khi có backend, như tính năng mời nhân viên. Ở chế độ trình duyệt, trang học và "Lộ trình của tôi" hoạt động như hiện tại; tab *Học viên* và chuông báo "cần backend".

## 11. Kiểm thử

- **Tự gán**: phát hành Hội nhập cho phòng ban → đúng nhân viên chưa hoàn thành hội nhập được gán, người đã `completed` không được gán; đích `Company-wide`; khớp cả phòng ban lẫn vị trí không tạo trùng; nhân viên mới đăng ký qua link mời được gán ngay; hạn tính từ `joining_date`.
- **Gán thủ công**: HR và Reviewer gán được, nhân viên bị 403; lộ trình chưa phát hành bị 409; hạn trong quá khứ bị 422; người đã có bản ghi nằm trong `skipped`.
- **Tiến độ**: `assigned` → `in_progress` ở hành động đầu tiên → `completed` khi xong mọi học phần; luật hoàn thành Python và JS cho cùng kết quả trên cùng bộ dữ liệu; nhân viên không cập nhật được tiến độ của người khác hoặc của lộ trình không được giao.
- **Thu hồi**: bản ghi đang học thành `withdrawn`, bản ghi đã xong giữ nguyên; nhân viên không còn thấy lộ trình đã rút.
- **Thông báo**: đúng người nhận cho từng sự kiện; nhắc hạn chỉ tạo một lần; SMTP lỗi không chặn thao tác; test không gửi email thật (như `test_invite.py`).
- **Migration**: nâng cấp DB có dữ liệu giữ nguyên các dòng cũ; backfill tạo đúng số bản ghi.
- **E2E Chrome**: HR tạo → Reviewer phát hành cho Engineering → Alex thấy lộ trình và thông báo, Minh không thấy → Alex học xong → HR thấy *Hoàn thành*; lộ trình Thăng tiến gán cho Alex có hạn → thông báo đúng câu của đặc tả.

## 12. Câu hỏi cần nhóm quyết

| # | Câu hỏi | Đề xuất |
| :---: | :--- | :--- |
| Q1 | Lộ trình Hội nhập mới phát hành có gán cho nhân viên cũ của phòng ban không? | **Đã chốt:** không; chỉ nhân viên có `training_status` khác `completed` |
| Q2 | Nhân viên khớp 2 lộ trình Hội nhập (theo phòng ban và theo vị trí): gán cả hai hay chỉ lộ trình theo vị trí? | **Đã chốt:** gán cả hai |
| Q3 | `users.training_status` tự cập nhật theo tiến độ, hay HR đặt tay như hiện nay? | Tự cập nhật theo lộ trình Hội nhập |
| Q4 | Thu hồi rồi phát hành bản mới: nhân viên học dở có được giữ tiến độ các bài giống nhau không? | Không; học lại trên bản mới. Nội dung có thể đã đổi, id các mục cũng đổi |
| Q5 | Email nhắc hạn có cần gửi cả khi nhân viên không đăng nhập (cần job chạy nền)? | Chưa cần trong đợt này |
| Q6 | Đáp án đúng của bài kiểm tra đang được gửi xuống trình duyệt của nhân viên (xem được trong dữ liệu trang). Có ẩn đi và để server chấm không? | Có: server chấm (API ở mục 6), bỏ `answer` khỏi dữ liệu gửi cho nhân viên, chỉ trả kết quả sau khi nộp |

## 13. Thứ tự triển khai đề xuất

1. **Đã làm.** Migration `enrollments` (bảng `notifications` chuyển sang bước 4), backfill, API tiến độ của nhân viên, `EnrollmentContext` gọi API. Tiến độ đã nằm ở server; server chấm bài và tính hoàn thành (`services/progress.py`, cùng kết quả với `progress.js` trên 500 trường hợp ngẫu nhiên).
2. **Đã làm.** Tự gán Hội nhập (phát hành, đăng ký qua link mời), quyền xem theo bản ghi gán, "Lộ trình của tôi" theo bản ghi gán, hạn hoàn thành, thu hồi rút bản ghi đang học. Có thêm `GET /paths/{id}/enrollments` (danh sách học viên, chưa có giao diện).
3. `GET /employees`, gán thủ công, rút lại, tab *Học viên*, hộp thoại duyệt cho Thăng tiến, dashboard HR.
4. Thông báo in-app + email, chuông trên thanh trên cùng, nhắc hạn.
5. Server chấm bài kiểm tra và ẩn đáp án (nếu Q6 được chấp nhận).

Mỗi bước kết thúc bằng test tự động và một lần E2E trên Chrome, ghi vào `AI_USAGE.md`.
