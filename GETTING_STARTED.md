# Hướng dẫn cài đặt và khởi chạy dự án SkillSprint AI

Tài liệu hướng dẫn chi tiết dành cho thành viên trong nhóm, giảng viên và ban giám khảo khi clone mã nguồn từ GitHub về máy tính mới.

## 1. Yêu cầu môi trường tiên quyết (Prerequisites)

Trước khi bắt đầu, hãy đảm bảo máy tính đã cài đặt các công cụ sau:
- Python: Phiên bản 3.11, 3.12, 3.13 hoặc 3.14. Kiểm tra bằng lệnh: `python --version`
- Node.js: Phiên bản 18.x trở lên cùng npm. Kiểm tra bằng lệnh: `node -v` và `npm -v`
- Git: Kiểm tra bằng lệnh: `git --version`

## 2. Bước 1: Clone repository từ GitHub

Mở terminal (PowerShell trên Windows hoặc Terminal trên macOS/Linux) và chạy lệnh:

```bash
git clone https://github.com/LamPhongG/BackUp_TW7.git
cd BackUp_TW7
```

## 3. Bước 2: Cấu hình môi trường ảo Python và cài đặt thư viện

Khuyến nghị tạo môi trường ảo (virtual environment) để tránh xung đột thư viện:

Trên Windows (PowerShell):
```powershell
# Tạo môi trường ảo
python -m venv .venv

# Kích hoạt môi trường ảo
.venv\Scripts\Activate.ps1

# Cài đặt toàn bộ thư viện backend và pipeline
pip install -r backend/requirements.txt
pip install -r requirements.txt
```

Trên macOS / Linux:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
pip install -r requirements.txt
```

## 4. Bước 3: Thiết lập biến môi trường (.env)

Tạo file `.env` cho backend từ file mẫu:

Trên Windows (PowerShell):
```powershell
copy backend\.env.example backend\.env
```

Trên macOS / Linux:
```bash
cp backend/.env.example backend/.env
```

Mở file `backend/.env` và cập nhật các thông số cần thiết:
- `JWT_SECRET`: Chuỗi khóa bảo mật ít nhất 32 ký tự (có thể sinh nhanh bằng lệnh: `python -c "import secrets; print(secrets.token_urlsafe(48))"`).
- `DATABASE_URL`: Mặc định để trống sẽ tự dùng SQLite tại `backend/skillsprint.db` (không cần cài thêm DB server). Nếu dùng PostgreSQL thì cấu hình chuỗi kết nối tương ứng.
- `GEMINI_API_KEY`: Điền API Key của Google Gemini nếu muốn gọi trực tiếp mô hình AI thật. Nếu không điền, hệ thống sẽ tự động kích hoạt bộ sinh bản nháp quy chuẩn Python (`local-draft`), bảo đảm 100% chức năng vẫn hoạt động trơn tru.

## 5. Bước 4: Khởi tạo cơ sở dữ liệu và nạp 28 tài liệu tri thức

Chỉ cần chạy một lệnh duy nhất từ thư mục gốc của dự án:

```powershell
python setup_database.py
```

Lệnh này sẽ tự động:
1. Tạo toàn bộ 13 bảng cơ sở dữ liệu và ràng buộc quan hệ.
2. Nạp 10 phòng ban và 10 chức vụ chuẩn hóa (SRS Step 2).
3. Nạp 203 quy định nghiệp vụ từ Role Requirement Matrix (SRS Step 10).
4. Tạo sẵn các tài khoản demo (Admin, HR, Reviewer, Employee).
5. Tự động bóc tách và phân đoạn toàn bộ 28 tài liệu tri thức từ `sample_documents/` thành 384 chunk chuẩn và lưu vào cơ sở dữ liệu.
6. Tạo sẵn 1 lộ trình mẫu và 1 chứng chỉ tốt nghiệp để kiểm tra tính năng Certificate.

*Mẹo: Nếu muốn xóa sạch dữ liệu cũ và dựng lại từ đầu, chạy lệnh:*
```powershell
python setup_database.py --reset
```

## 6. Bước 5: Cài đặt và khởi chạy Frontend

Mở một cửa sổ terminal mới và thực hiện:

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại địa chỉ: `http://localhost:3000`

## 7. Bước 6: Khởi chạy Backend Server (FastAPI)

Tại cửa sổ terminal đã kích hoạt môi trường ảo `.venv`:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Backend API sẽ chạy tại địa chỉ: `http://localhost:8000`  
Tài liệu Swagger UI kiểm tra API: `http://localhost:8000/api/docs`

## 8. Danh sách tài khoản đăng nhập mẫu

Mật khẩu dùng chung cho tất cả tài khoản demo là: `password123` (hoặc `Demo@123`)

| Vai trò | Email đăng nhập | Mật khẩu | Mục đích kiểm thử |
|:---|:---|:---|:---|
| Admin | `admin@fourangrybirds.vn` | `password123` | Quản trị tài khoản người dùng, xem thống kê hệ thống |
| HR Manager | `hr@fourangrybirds.vn` | `password123` | Xem 28 tài liệu, tạo lộ trình AI, quản lý danh sách nhân sự |
| Reviewer | `reviewer@fourangrybirds.vn` | `password123` | Thẩm định lộ trình, xem bảng so sánh Dual-Pipeline, phê duyệt |
| Employee (Đang học) | `alex.morgan@fourangrybirds.vn` | `password123` | Đọc học phần, làm trắc nghiệm, cập nhật tiến độ học tập |
| Employee (Đã xong) | `sales.emp@fourangrybirds.vn` | `password123` | Xem lộ trình đã hoàn thành 100%, mở chứng chỉ số Certificate |

## 9. Hướng dẫn chạy kiểm thử tự động (547 Tests)

Hệ thống được bảo vệ bởi 547 bài kiểm thử tự động, có thể chạy lại bất cứ lúc nào để kiểm tra tính toàn vẹn:

1. Chạy 364 tests kiểm tra Backend API, ma trận vai trò, bảo mật:
```powershell
pytest backend/tests
```

2. Chạy 88 tests kiểm tra gói thuật toán lõi, chunking và kiểm thử bẫy Prompt Injection:
```powershell
pytest tests
```

3. Chạy 95 tests kiểm tra giao diện Frontend Vitest:
```powershell
cd frontend
npm test -- --run
```

4. Chạy kiểm tra tự động kịch bản Hidden Test của ban giám khảo:
```powershell
python hidden_test_ready/run_hidden_test.py
```

## 10. Xử lý các sự cố thường gặp (Troubleshooting)

- Sự cố: Lỗi "Port 8000 already in use" hoặc "Port 3000 already in use":
  * Khắc phục: Đóng tiến trình đang chiếm cổng hoặc đổi cổng khởi chạy (ví dụ `--port 8001` cho backend).
- Sự cố: Lỗi không import được thư viện khi chạy pytest:
  * Khắc phục: Đảm bảo đã kích hoạt môi trường ảo `.venv` và đã cài đủ `pip install -r backend/requirements.txt`.
- Sự cố: Frontend không gọi được Backend:
  * Khắc phục: Kiểm tra file `frontend/.env.local` đã có dòng `VITE_API_URL=http://localhost:8000/api` chưa và backend server đang chạy ở port 8000.
