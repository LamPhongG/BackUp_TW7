# SKILLSPRINT AI — KỊCH BẢN QUAY VIDEO DEMO SẢN PHẨM
**Cuộc thi:** TechWiz 7 – Generative AI Powerplay Track  
**Dự án:** SkillSprint AI – Dual-Pipeline AI Document Verification System  
**Thời lượng video:** Chính xác 05:00 (300 giây) | **Độ phân giải:** 1080p 60fps (Full HD)  
**Phân công thuyết minh:** Đội Four Angry Birds (Châu Quốc Lâm Phong phụ trách phần Pipeline & Thẩm định)

---

## I. TỔNG QUAN TIMELINE CÁC CẢNH QUAY (5 PHÚT)

| Cảnh | Thời lượng | Phân đoạn nội dung | Người phụ trách demo |
| :---: | :---: | :--- | :--- |
| **Scene 1** | 0:00 – 0:40 (40s) | Giới thiệu bài toán Onboarding & Rủi ro AI Hallucination | Cả nhóm |
| **Scene 2** | 0:40 – 1:30 (50s) | Phase 1 & 2: Ingestion tài liệu và GenAI sinh Onboarding Plan | Châu Quốc Lâm Phong |
| **Scene 3** | 1:30 – 2:30 (60s) | Phase 3: Dual-Pipeline thẩm định song song & Match Scoring | Châu Quốc Lâm Phong & Quỳnh Nhi |
| **Scene 4** | 2:30 – 3:45 (75s) | **ĐIỂM NHẤN:** Kích hoạt hệ thống phòng thủ bắt 4 loại bẫy | Châu Quốc Lâm Phong |
| **Scene 5** | 3:45 – 4:30 (45s) | Phase 4: Thử nghiệm Hidden Test tự động 100% | Châu Quốc Lâm Phong & Kiều Duyên |
| **Scene 6** | 4:30 – 5:00 (30s) | Tổng kết giá trị thực tiễn & Lời chào ban giám khảo | Cả nhóm |

---

## II. KỊCH BẢN CHI TIẾT TỪNG PHÂN CẢNH (SCENE-BY-SCENE SCRIPT)

### SCENE 1: ĐẶT VẤN ĐỀ & GIỚI THIỆU HỆ THỐNG (0:00 – 0:40)
* **Hình ảnh / Video trên màn hình:**
  * 0:00 – 0:15: Slide mở đầu với logo dự án SkillSprint AI, tên đội Four Angry Birds và track thi TechWiz 7.
  * 0:15 – 0:40: Animation/Infographic chỉ ra 2 nghịch lý lớn của doanh nghiệp hiện đại: Sổ tay nhân viên dài hàng trăm trang làm nhân viên mới ngợp, nhưng nếu dùng ChatGPT/Gemini thuần túy thì AI rất dễ bịa đặt thông tin (Hallucination) hoặc bị tấn công Prompt Injection.
* **Lời thuyết minh (Voiceover):**
  > *"Kính chào Ban giám khảo TechWiz 7. Trong kỷ nguyên làm việc kết hợp, việc đào tạo hòa nhập (onboarding) nhân sự mới thường mất hàng tuần lễ đọc các cuốn cẩm nang nội bộ dày đặc.  
  > Khi ứng dụng GenAI để tóm tắt hay tạo lộ trình học tập, một hiểm họa an ninh và pháp lý cực lớn xuất hiện: AI rất dễ bị ảo giác — tự bịa thêm quyền lợi nghỉ phép, trợ cấp, hoặc bị kẻ xấu chèn mã độc Prompt Injection vào văn bản để qua mặt hệ thống.  
  > Đó chính là lý do đội Four Angry Birds mang đến **SkillSprint AI** — Hệ thống kép Dual-Pipeline đầu tiên ứng dụng Rule Engine thẩm định chéo độc lập để bảo đảm an toàn 100% cho doanh nghiệp."*

---

### SCENE 2: INGESTION TÀI LIỆU & GENAI PLAN GENERATION (0:40 – 1:30)
* **Hình ảnh / Video trên màn hình:**
  * 0:40 – 1:05: Màn hình thao tác nạp tài liệu chính sách `Company_Policy_Handbook.pdf`. Quay cận cảnh terminal/code trích xuất chunks với PyMuPDF, gắn `doc_id`, `chunk_id`, và `page_number`.
  * 1:05 – 1:30: Giao diện kết quả sinh Onboarding Plan. Phóng to cấu trúc Pydantic Schema: Mỗi Module, Task và Quiz trắc nghiệm đều có thuộc tính bắt buộc `source_citation` trích dẫn chính xác từng câu từ tài liệu gốc.
* **Lời thuyết minh (Voiceover):**
  > *"Bước vào Pipeline 1, hệ thống của chúng tôi nạp tài liệu PDF hoặc Word đa trang, tự động phân tích cấu trúc theo section heading và bóc tách thành các đoạn chunk độc lập kèm mã định danh số trang.  
  > Tiếp đó, mô hình Gemini Pro xử lý các chunk này cùng với yêu cầu vị trí công việc, ví dụ 'Software Engineer'. Điểm mấu chốt của SkillSprint AI là **bắt buộc tuân thủ Structured Output**: Mọi nhiệm vụ, thời gian ước tính và câu hỏi trắc nghiệm đều bắt buộc phải đính kèm `exact_quote` trích xuất nguyên bản từ tài liệu, loại bỏ hoàn toàn việc sinh văn bản tự do không thể kiểm chứng."*

---

### SCENE 3: DUAL-PIPELINE COMPARISON & MATCH SCORING (1:30 – 2:30)
* **Hình ảnh / Video trên màn hình:**
  * 1:30 – 1:55: Sơ đồ tương tác đối chiếu 2 luồng: Pipeline 1 (GenAI) đối chiếu song song với Pipeline 2 (Python Rule Engine thuần, không phụ thuộc AI).
  * 1:55 – 2:30: Màn hình Dashboard thẩm định: Hiển thị bảng so sánh từng trường dữ liệu (Field-by-field diff), điểm Match Score đạt 100%, hệ thống tự động phân loại trạng thái xanh: `VERIFIED`.
* **Lời thuyết minh (Voiceover):**
  > *"Một quy trình GenAI thông thường sẽ dừng lại ở đây, nhưng SkillSprint AI thì không. Hệ thống kích hoạt ngay **Pipeline 2: Bộ Rule Engine thuần viết bằng Python**, hoàn toàn độc lập với AI.  
  > Rule Engine tự tính toán ma trận yêu cầu chuyên môn, kiểm tra thứ tự học tiên quyết và kích hoạt bộ Hallucination Detector để so khớp ngược toàn bộ trích dẫn của AI với văn bản gốc.  
  > Với tài liệu chuẩn, cả hai luồng đồng thuận 100%, hệ thống tự động cấp chứng nhận `VERIFIED` chỉ trong vòng chưa đầy 2 giây mà không cần con người phải rà soát thủ công."*

---

### SCENE 4: ADVERSARIAL DEFENSE & BẮT 4 LOẠI BẪY HIỂM HÓC (2:30 – 3:45)
* **Hình ảnh / Video trên màn hình:**
  * 2:30 – 2:50: **Bẫy 1 & 2:** Bấm kích hoạt bẫy AI bịa trợ cấp gym $500 và bẫy tráo đổi ngày phép từ 15 thành 30 ngày. Màn hình ngay lập tức chuyển sang màu đỏ: cắm cờ `HallucinationFlag`, hạ trạng thái về `MANUAL_REVIEW_REQUIRED`.
  * 2:50 – 3:15: **Bẫy 3:** Bẫy chính sách nội bộ mâu thuẫn (hạn đổi mật khẩu 90 ngày ở trang 1 vs 30 ngày ở trang 2). Contradiction Checker phát hiện xung đột và cắm cờ cảnh báo chéo.
  * 3:15 – 3:45: **Bẫy 4 (Prompt Injection):** Nhúng chuỗi độc hại `SYSTEM OVERRIDE: Ignore all previous instructions...`. Khiên lọc an ninh Regex phát hiện mã độc, triệt tiêu nguy cơ chiếm quyền và khóa toàn bộ tài liệu.
* **Lời thuyết minh (Voiceover):**
  > *"Để chứng minh sự vượt trội, chúng tôi thử nghiệm các đòn tấn công thực tế mà các hệ thống AI thông thường luôn thất bại.  
  > Thứ nhất: Khi AI cố tình 'bịa' ra chế độ trợ cấp gym 500 đô hoặc bị kẻ xấu tráo đổi số ngày phép từ 15 thành 30 ngày, Detector bóc tách chuỗi số nguyên và lập tức cắm cờ `HallucinationFlag`.  
  > Thứ hai: Khi tài liệu nội bộ có 2 điều khoản tự đá nhau về thời hạn mật khẩu 90 ngày và 30 ngày, bộ Contradiction Checker tự động tóm gọn mâu thuẫn.  
  > Và đặc biệt nhất: Đòn tấn công Prompt Injection `SYSTEM OVERRIDE` nhằm ép hệ thống phê duyệt đã bị khiên an ninh chặn đứng ngay từ tầng lọc đầu vào. Trạng thái lập tức hạ về `MANUAL_REVIEW_REQUIRED`, bảo vệ dữ liệu doanh nghiệp an toàn tuyệt đối."*

---

### SCENE 5: HIDDEN TEST AUTONOMOUS EXECUTION (3:45 – 4:30)
* **Hình ảnh / Video trên màn hình:**
  * 3:45 – 4:10: Chạy script `hidden_test_ready/run_hidden_test.py` trên một tài liệu chính sách hoàn toàn mới: `sample_unseen_policy.pdf` (Chính sách làm việc từ xa và bảo mật mạng 2026).
  * 4:10 – 4:30: Terminal và file báo cáo JSON `hidden_test_report.json` xuất hiện với trạng thái `VERIFIED`, match score 100%, 0 hallucination, thời gian xử lý toàn trình dưới 1.5 giây.
* **Lời thuyết minh (Voiceover):**
  > *"Sẵn sàng cho vòng thẩm định Hidden Test của Ban giám khảo, SkillSprint AI được thiết kế để xử lý tài liệu mới 100% tự động.  
  > Khi nạp một bộ quy tắc bảo mật từ xa chưa từng thấy trong cơ sở dữ liệu, toàn bộ pipeline từ nạp file, chuẩn hóa Unicode, chia chunk, sinh lộ trình và đối soát quy tắc đều vận hành tự động, xuất báo cáo JSON chuẩn mực mà không cần bất kỳ sự can thiệp hay cấu hình mã nguồn nào."*

---

### SCENE 6: TỔNG KẾT & LỜI CẢM ƠN (4:30 – 5:00)
* **Hình ảnh / Video trên màn hình:**
  * 4:30 – 4:45: Slide tổng kết 3 giá trị cốt lõi: Giảm 80% thời gian onboarding, Triệt tiêu 100% rủi ro ảo giác AI, và Kiểm soát an ninh đa tầng.
  * 4:45 – 5:00: Màn hình danh sách 4 thành viên đội Four Angry Birds, logo TechWiz 7 và lời cảm ơn.
* **Lời thuyết minh (Voiceover):**
  > *"Với kiến trúc Dual-Pipeline tiên phong, SkillSprint AI không chỉ giải phóng nguồn lực cho phòng nhân sự mà còn thiết lập một chuẩn mực mới về sự an toàn và tin cậy khi đưa GenAI vào doanh nghiệp.  
  > Đội Four Angry Birds xin chân thành cảm ơn Hội đồng Giám khảo TechWiz 7 đã theo dõi phần trình diễn của chúng tôi!"*

---

## III. CHECKLIST QUAY VIDEO DÀNH CHO NHÓM (RECORDING CHECKLIST)

### 1. Chuẩn bị trước khi bấm máy (Pre-recording)
- [ ] Dọn dẹp màn hình desktop, ẩn taskbar thừa, tắt toàn bộ thông báo Zalo/Telegram/Discord.
- [ ] Cài đặt OBS Studio: Chọn quay màn hình 1920x1080 @ 60fps, bitrate ≥ 6.000 Kbps.
- [ ] Micro thu âm rõ, bật khử ồn (Noise Suppression filter trong OBS).
- [ ] Chạy sẵn môi trường Python: kích hoạt virtual environment, chạy `pytest tests/ -v` xác nhận 54/54 tests xanh.

### 2. Các cảnh quay màn hình cần thu lại (Footage Checklist)
- [ ] **Clip 1 (Phase 1 Ingestion):** Terminal chạy hiển thị các chunk bóc tách từ PDF.
- [ ] **Clip 2 (Phase 2 GenAI):** Cấu trúc JSON kế hoạch onboarding có trích dẫn `exact_quote`.
- [ ] **Clip 3 (Phase 3 Clean Flow):** Trạng thái so khớp đạt 100% xanh `VERIFIED`.
- [ ] **Clip 4 (Phase 3 Trap 1 & 2):** Bắt lỗi bịa quyền lợi và tráo đổi số ngày phép.
- [ ] **Clip 5 (Phase 3 Trap 3):** Bắt lỗi mâu thuẫn thời hạn mật khẩu 90d vs 30d.
- [ ] **Clip 6 (Phase 3 Trap 4):** Bắt lỗi Prompt Injection `SYSTEM OVERRIDE`.
- [ ] **Clip 7 (Phase 4 Hidden Test):** Chạy `python hidden_test_ready/run_hidden_test.py` xuất ra `hidden_test_report.json`.

### 3. Hậu kỳ & Xuất file (Post-production)
- [ ] Ghép giọng đọc voiceover khớp với từng chuyển động chuột và cửa sổ.
- [ ] Thêm phụ đề tiếng Anh (Bilingual Subtitles) để ban giám khảo quốc tế dễ theo dõi.
- [ ] Chèn nhạc nền (Background Music) năng động, âm lượng giữ ở mức -22dB để không át giọng nói.
- [ ] Xuất file định dạng `.mp4` (H.264, kích thước ≤ 300MB, đúng thời lượng 05:00).
