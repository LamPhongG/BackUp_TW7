# SkillSprint AI — Frontend

Giao diện web của SkillSprint AI cho công ty giả lập **FourAngryBirds EdTech & HR Solutions**. Ứng dụng có ba nhóm người dùng: Nhân viên (Employee), Quản lý (Manager) và Quản trị HR (HR Admin). Toàn bộ giao diện hỗ trợ **tiếng Việt và tiếng Anh**.

> **Trạng thái (24/09/2026):** chạy độc lập, chưa nối backend Python. Kho tài liệu đã chạy thật: HR tải file lên, file được lưu trong IndexedDB của trình duyệt. Các màn hình còn lại vẫn dùng dữ liệu mẫu (xem [Giới hạn hiện tại](#giới-hạn-hiện-tại)).

---

## 1. Công nghệ sử dụng

| Hạng mục | Công nghệ | Phiên bản | Dùng để |
| :--- | :--- | :--- | :--- |
| UI framework | React | 18.3 | Component, state, context |
| Build tool | Vite + `@vitejs/plugin-react` | 6.x | Dev server, build production |
| Routing | React Router DOM | 7.x | Điều hướng theo vai trò `/employee`, `/manager`, `/admin` |
| Biểu đồ | Recharts | 2.15 | Biểu đồ trang Báo cáo |
| Icon | lucide-react | 0.468 | Bộ icon |
| Đa ngôn ngữ | Tự viết (`LanguageContext`) | — | `t()`, `tv()`, `tNode()`, `pick()`; lưu lựa chọn vào `localStorage` |
| Lưu trữ tài liệu | IndexedDB (API trình duyệt) | — | Lưu metadata và nội dung file HR tải lên |
| Phát hiện file trùng | Web Crypto API (`crypto.subtle`, SHA-256) | — | Băm nội dung file |
| Giao diện | CSS thuần (`src/styles/index.css`) | — | Không dùng UI framework, có responsive |

Không có backend, không cần API key, không cần database để chạy frontend.

---

## 2. Chạy dự án

Yêu cầu: Node.js ≥ 18.

```bash
cd frontend
npm install        # hoặc: npm ci
npm run dev        # http://localhost:3000
npm run build      # build production vào dist/
npm run preview    # chạy thử bản build
```

**Đăng nhập demo:** ở trang `/login`, bấm một trong ba nút *Nhân viên / Quản lý / Quản trị HR* (chưa có xác thực thật).

| Vai trò | Tài khoản demo | Trang chính |
| :--- | :--- | :--- |
| Nhân viên | Alex Morgan — Software Support Engineer | `/employee/dashboard` |
| Quản lý | Sarah Chen — Team Leader / Tech Lead | `/manager/dashboard` |
| Quản trị HR | Jordan Lee — HR Admin | `/admin/dashboard` |

Nút **🇬🇧 EN / 🇻🇳 VN** ở góc trên (cả trang đăng nhập) dùng để đổi ngôn ngữ.

---

## 3. Cấu trúc thư mục

```
frontend/
├── index.html
├── package.json / package-lock.json
├── vite.config.js
└── src/
    ├── main.jsx, App.jsx          # Điểm khởi động + khai báo route
    ├── components/                # UI dùng chung: Card, Modal, Badge, ValidationTag, SourceBadge, MultiStageTimeline...
    ├── contexts/
    │   ├── LanguageContext.jsx    # Đa ngôn ngữ vi/en
    │   └── DocumentsContext.jsx   # Kho tài liệu dùng chung cho mọi trang
    ├── data/
    │   ├── company.js             # Hồ sơ FourAngryBirds: 10 vị trí, phòng ban, danh mục 20 tài liệu, quy tắc upload
    │   └── mock.js                # Dữ liệu mẫu: nhân viên, giai đoạn, học phần, nhiệm vụ, quiz, báo cáo
    ├── hooks/useAuth.js           # Đăng nhập demo theo vai trò
    ├── layouts/                   # Khung trang cho Auth / Employee / Manager / Admin
    ├── locales/en.js, vi.js       # ~580 chuỗi giao diện, hai file có cùng bộ key
    ├── pages/
    │   ├── auth/                  # Đăng nhập, đăng ký, quên mật khẩu
    │   ├── employee/              # Dashboard, lộ trình, học phần, quiz, nhiệm vụ, checklist, tài liệu, hồ sơ
    │   ├── manager/               # Dashboard, đội ngũ, chi tiết nhân viên, nhiệm vụ, đánh giá, báo cáo
    │   └── admin/                 # Dashboard, nhân viên, phòng ban, vị trí, kho tài liệu, knowledge base,
    │                              # lộ trình, học phần, quiz, AI Studio, báo cáo, cài đặt
    ├── services/documentStore.js  # Lớp lưu trữ IndexedDB — sẽ thay bằng API backend
    ├── styles/index.css
    └── utils/
        ├── documentValidation.js  # Kiểm tra file tải lên + vòng đời phiên bản (hàm thuần, dễ test)
        └── helpers.js             # Định dạng ngày theo locale, trạng thái tiến độ...
```

---

## 4. Những gì đã làm

### 4.1 Đa ngôn ngữ Việt / Anh
- `LanguageContext`:
  - Kiểm tra ngôn ngữ đọc từ `localStorage`: giá trị lạ hoặc storage bị chặn thì dùng `vi`, không làm app crash.
  - Thiếu bản dịch thì hiện tiếng Anh, không hiện key thô.
  - Cập nhật `<html lang>` theo ngôn ngữ đang chọn.
- Các helper:
  - `t("key", { n: 3 })`: dịch chuỗi, có tham số `{n}`, `{name}`...
  - `tv("On Track")`: dịch giá trị dữ liệu (trạng thái, phòng ban, loại tài liệu).
  - `tNode()`: dịch câu có phần in đậm mà vẫn đúng trật tự từ của từng ngôn ngữ.
  - `pick(item, "title")`: đọc field `titleEn` khi đang ở chế độ tiếng Anh.
- Đã chuyển ngữ 100% trang, layout và component dùng chung. Ngày tháng và thời lượng hiển thị theo locale `vi-VN` / `en-US`.
- Lỗi đã sửa trong quá trình chuyển ngữ:
  - Nút "Tiếp" bị cắt chữ.
  - Textarea ở AI Studio không đổi khi đổi ngôn ngữ.
  - Câu cảnh báo Hallucination/Contradiction bị ghép sai.
  - Quiz luôn hiện "2 / 3 đúng" dù trả lời thế nào; giờ tính điểm thật.
  - Checklist làm tròn lên nên hiển thị sai số mục đã xong (85% thành 4/4).

### 4.2 Kho tài liệu HR (SRS Step 4–8)
Trang **Quản trị HR → Tài liệu** (`src/pages/admin/Documents.jsx`):
- **Tải lên:** chọn hoặc kéo thả nhiều file cùng lúc. Nhận PDF và DOCX (bắt buộc), thêm TXT, MD, CSV.
- **Tự điền metadata** từ tên file theo quy ước `DOC-01_Employee_Handbook_v2.0.docx`: mã, tên, phiên bản; loại tài liệu và phòng ban lấy từ danh mục 20 tài liệu của công ty. HR xem lại và sửa trước khi lưu.
- **Kiểm tra (SRS Step 5)**, thực hiện ở `utils/documentValidation.js`:

  | Kiểm tra | Cách làm |
  | :--- | :--- |
  | Định dạng file | Whitelist đuôi file và đọc byte đầu (`%PDF`, ZIP `PK\x03\x04` cho DOCX) để phát hiện file hỏng hoặc bị đổi đuôi |
  | Dung lượng | Tối đa 20 MB/file |
  | File rỗng | 0 byte, hoặc TXT/MD/CSV chỉ có khoảng trắng |
  | File trùng | So SHA-256 với kho và với các file khác trong cùng lượt tải |
  | Mã tài liệu | Định dạng `DOC-xx`; một mã không được dùng cho hai tài liệu khác nhau |
  | Phiên bản | Định dạng `1.0` / `2.1.3`; không trùng phiên bản đã có |
  | Ngày hiệu lực / hết hạn | Bắt buộc có ngày hiệu lực; ngày hết hạn phải sau ngày hiệu lực |
  | Phòng ban, loại tài liệu | Bắt buộc chọn |

- **Quản lý phiên bản (SRS Step 8):** các phiên bản của cùng một tài liệu được gom nhóm (ví dụ DOC-01 v2.0 và DOC-02 v1.0 đều là *Employee Handbook*). Trạng thái được tính tự động:
  - *Đang hiệu lực*
  - *Đã bị thay thế* (có ghi "Thay bởi vX")
  - *Hết hạn*
  - *Sắp hiệu lực*
- **Danh mục bắt buộc:** hiển thị 20 mã DOC-01…DOC-20 và độ phủ (bao nhiêu mã đã tải lên).
- **Thao tác trên kho:** tìm kiếm; lọc theo trạng thái, loại và phòng ban; xem trước (PDF, TXT, MD, CSV); tải xuống; xoá có xác nhận.
- **Dùng chung dữ liệu:** Knowledge Base, AI Studio (chọn nguồn Ground Truth) và trang Tài liệu của nhân viên đọc cùng kho này, và **chỉ dùng phiên bản đang hiệu lực**.
- **Không giả lập kết quả xử lý:** cột "Xử lý" ghi *Chờ trích xuất* cho tới khi có backend Python làm parsing/chunking.

### 4.3 Dữ liệu theo hồ sơ FourAngryBirds và SRS
- `data/company.js`:
  - 10 vị trí: Sales Executive, Customer Support Executive, HR Executive, Finance Associate, Operations Coordinator, Marketing Executive, Software Support Engineer, Branch Manager, Data Analyst, Team Leader / Tech Lead.
  - Các phòng ban.
  - Danh mục 20 tài liệu DOC-01…DOC-20.
- Giai đoạn onboarding (SRS Step 13): Ngày 1 → Tuần 1 → **Tuần 2** → 30 → 60 → 90 ngày. Mỗi hạng mục tham chiếu tới mã tài liệu nguồn.
- Trạng thái tiến độ (SRS Step 54): On Track / Requires Attention / Behind Schedule / Assessment Required / Completed.
- Trạng thái kiểm định (SRS mục 1.2): Verified, Verified with Warning, Partially Verified, Source Support Missing, Requirement Missing, Unsupported Requirement, Outdated Source, Contradiction Detected, Manual Review Required, cùng cờ Hallucination.
- Mức độ (SRS Step 25): Beginner / Intermediate / Advanced.

### 4.4 Dọn mã nguồn
- Xoá 19 file không còn dùng: prototype cũ, layout cũ, API mock đã hỏng, script một lần.
- Xoá các export và import không dùng.
- Build, render thử và test lại sau khi dọn.

---

## 5. Kiểm thử đã chạy

| Kiểm thử | Kết quả |
| :--- | :--- |
| `npm run build` | Thành công (2257 module) |
| Unit test logic kiểm tra file và phiên bản (`utils/documentValidation.js`): 20 tên file của hồ sơ công ty, file PDF/DOCX giả, file rỗng, trùng SHA-256, trùng phiên bản, mã thuộc tài liệu khác, so sánh phiên bản `10.0 > 9.5`, vòng đời active/obsolete/expired/upcoming, đủ bản dịch cho mọi thông báo lỗi | 26/26 đạt |
| Render server-side toàn bộ 31 route × 3 trường hợp ngôn ngữ (`vi`, `en`, giá trị không hợp lệ `fr`) | 0 lỗi, không lộ key dịch hay `undefined` |
| Đối chiếu key giữa `en.js` và `vi.js` | Khớp 100%, không trùng key |

> Các test trên được chạy thủ công bằng script Node/esbuild, **chưa được đưa vào repo**. Việc tiếp theo: thêm Vitest và commit test vào `frontend/tests/`.

---

## 6. Giới hạn hiện tại

- **Kho tài liệu chỉ lưu trong trình duyệt đang dùng** (IndexedDB). Máy khác hoặc trình duyệt khác sẽ không thấy. Khi có backend, thay `src/services/documentStore.js` bằng lời gọi API và giữ nguyên chữ ký hàm (`listDocuments`, `saveDocuments`, `getDocumentFile`, `deleteDocument`).
- **Vẫn là dữ liệu mẫu, phải thay bằng dữ liệu từ backend trước khi nộp bài** (SRS mục 1.8 #12 cấm lộ trình, điểm kiểm định và kết quả so sánh ghi cứng):
  - Kết quả sinh lộ trình và bảng so sánh GenAI/Python ở **AI Studio**.
  - Điểm Coverage/Traceability và số liệu kiểm định ở **Báo cáo**.
  - Nhân viên, học phần, nhiệm vụ, câu hỏi quiz trong `data/mock.js`.
- **Đăng nhập chưa có xác thực thật**, chưa chặn truy cập route theo vai trò. SRS yêu cầu 5 vai trò (thêm Training Manager, Reviewer); hiện mới có 3.
- **Chưa có màn hình:** Role Requirement Matrix, hàng đợi duyệt thủ công kèm audit trail, phân tích ảnh hưởng khi chính sách thay đổi (SRS Step 10, 48–49, 57–59).
- **Chưa hỗ trợ các loại câu hỏi** Multiple response, True/False và tình huống (SRS Step 20).

---

## 7. Điểm nối với backend (dự kiến)

| Frontend | API backend cần có |
| :--- | :--- |
| `services/documentStore.js` | `GET/POST/DELETE /documents`, `GET /documents/{id}/file` |
| Cột "Xử lý" ở kho tài liệu | Trạng thái parsing/chunking của từng tài liệu |
| AI Studio | Pipeline 1 (sinh lộ trình JSON), Pipeline 2 (kiểm định), kết quả so sánh |
| Báo cáo | Coverage, Traceability, Consistency score, số lỗi theo trạng thái |
| `hooks/useAuth.js` | Đăng nhập và phân quyền theo vai trò |
