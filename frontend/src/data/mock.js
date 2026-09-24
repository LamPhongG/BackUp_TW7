// ────────────────────────────────────────────────────────────
// DỮ LIỆU MẪU — FourAngryBirds EdTech & HR Solutions
// Tài liệu công ty KHÔNG còn nằm ở đây: HR tải lên kho thật (DocumentsContext).
// Mã nguồn DOC-xx tham chiếu tới danh mục trong data/company.js.
// ────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────
// EMPLOYEES — mỗi người một trong 10 vị trí của công ty
// status theo SRS Step 54: On Track / Requires Attention / Behind Schedule / Assessment Required / Completed
// ────────────────────────────────────────────────────────────
export const employees = [
  { id: 1,  name: "Alex Morgan",   role: "Software Support Engineer",  department: "Engineering",       location: "TP. Hồ Chí Minh", level: "Intermediate", manager: "Sarah Chen",   progress: 68,  status: "On Track",            joined: "2026-09-02" },
  { id: 2,  name: "Emma Wilson",   role: "Customer Support Executive", department: "Customer Support",  location: "TP. Hồ Chí Minh", level: "Beginner",     manager: "Sarah Chen",   progress: 82,  status: "On Track",            joined: "2026-08-18" },
  { id: 3,  name: "Daniel Kim",    role: "Data Analyst",               department: "Data",              location: "TP. Hồ Chí Minh", level: "Advanced",     manager: "Michael Lee",  progress: 100, status: "Completed",           joined: "2026-07-21" },
  { id: 4,  name: "Sophia Nguyen", role: "Marketing Executive",        department: "Marketing",         location: "TP. Hồ Chí Minh", level: "Beginner",     manager: "Olivia Brown", progress: 44,  status: "Behind Schedule",     joined: "2026-09-09" },
  { id: 5,  name: "Liam Smith",    role: "Finance Associate",          department: "Finance",           location: "TP. Hồ Chí Minh", level: "Intermediate", manager: "Michael Lee",  progress: 57,  status: "Requires Attention",  joined: "2026-08-28" },
  { id: 6,  name: "Minh Tran",     role: "Sales Executive",            department: "Sales",             location: "TP. Hồ Chí Minh", level: "Beginner",     manager: "Olivia Brown", progress: 35,  status: "On Track",            joined: "2026-09-15" },
  { id: 7,  name: "Linh Pham",     role: "HR Executive",               department: "Human Resources",   location: "TP. Hồ Chí Minh", level: "Intermediate", manager: "Jordan Lee",   progress: 76,  status: "Assessment Required", joined: "2026-08-11" },
  { id: 8,  name: "Quang Le",      role: "Operations Coordinator",     department: "Operations",        location: "TP. Hồ Chí Minh", level: "Intermediate", manager: "Michael Lee",  progress: 60,  status: "On Track",            joined: "2026-08-25" },
  { id: 9,  name: "Hoa Nguyen",    role: "Branch Manager",             department: "Branch Management", location: "Đà Nẵng",         level: "Advanced",     manager: "Jordan Lee",   progress: 50,  status: "Requires Attention",  joined: "2026-08-20" },
  { id: 10, name: "Tuan Vo",       role: "Team Leader / Tech Lead",    department: "Engineering",       location: "Đà Nẵng",         level: "Advanced",     manager: "Sarah Chen",   progress: 88,  status: "On Track",            joined: "2026-07-28" },
];

// ────────────────────────────────────────────────────────────
// ONBOARDING PHASES — các giai đoạn theo SRS Step 13 (Day 1 → First 90 Days)
// Field song ngữ: `xxx` = tiếng Việt, `xxxEn` = tiếng Anh (đọc bằng pick() trong LanguageContext)
// ────────────────────────────────────────────────────────────
export const phases = [
  {
    id: 1,
    label: "Ngày 1",        labelEn: "Day 1",
    sublabel: "Khởi động",  sublabelEn: "Getting Started",
    progress: 100,
    status: "completed",
    items:   ["Đọc Sổ tay nhân viên (DOC-01)", "Thiết lập tài khoản & mật khẩu (DOC-06)", "Ký xác nhận Quy tắc ứng xử (DOC-04)"],
    itemsEn: ["Read the Employee Handbook (DOC-01)", "Set up accounts & passwords (DOC-06)", "Acknowledge the Workplace Conduct Policy (DOC-04)"],
    prerequisite: null, prerequisiteEn: null,
  },
  {
    id: 2,
    label: "Tuần 1",        labelEn: "Week 1",
    sublabel: "Nền tảng",   sublabelEn: "Foundation",
    progress: 100,
    status: "completed",
    items:   ["Chính sách bảo mật dữ liệu cá nhân (DOC-05)", "Chính sách nghỉ phép (DOC-03)", "Gặp gỡ đội ngũ"],
    itemsEn: ["Data Privacy Policy (DOC-05)", "Leave Policy (DOC-03)", "Meet the team"],
    prerequisite: null, prerequisiteEn: null,
  },
  {
    id: 3,
    label: "Tuần 2",        labelEn: "Week 2",
    sublabel: "Quy trình phòng ban", sublabelEn: "Department Processes",
    progress: 60,
    status: "active",
    items:   ["Quy trình bàn giao phần mềm (DOC-10)", "Quy trình xử lý khiếu nại (DOC-07)", "Theo ca hỗ trợ cùng mentor"],
    itemsEn: ["Software Deployment Workflow (DOC-10)", "Customer Escalation Process (DOC-07)", "Shadow a support shift with a mentor"],
    prerequisite: null, prerequisiteEn: null,
  },
  {
    id: 4,
    label: "30 ngày",       labelEn: "Day 30",
    sublabel: "Cột mốc đầu", sublabelEn: "First Milestone",
    progress: 20,
    status: "active",
    items:   ["Tự xử lý ticket hỗ trợ đầu tiên", "Tham gia review bàn giao", "Đánh giá 30 ngày"],
    itemsEn: ["Resolve your first support ticket", "Join a deployment review", "30-day review"],
    prerequisite: null, prerequisiteEn: null,
  },
  {
    id: 5,
    label: "60 ngày",       labelEn: "Day 60",
    sublabel: "Độc lập",    sublabelEn: "Independent Work",
    progress: 0,
    status: "locked",
    items:   ["Phụ trách một khách hàng", "Trực hỗ trợ production", "Peer review"],
    itemsEn: ["Own a customer account", "Production support rotation", "Peer review"],
    prerequisite: "cột mốc 30 ngày", prerequisiteEn: "the Day 30 milestone",
  },
  {
    id: 6,
    label: "90 ngày",       labelEn: "Day 90",
    sublabel: "Kết thúc",   sublabelEn: "Final Assessment",
    progress: 0,
    status: "locked",
    items:   ["Bài đánh giá thực hành", "Performance review", "Hoàn tất onboarding"],
    itemsEn: ["Practical assessment", "Performance review", "Onboarding sign-off"],
    prerequisite: "cột mốc 60 ngày", prerequisiteEn: "the Day 60 milestone",
  },
];

// ────────────────────────────────────────────────────────────
// LEARNING MODULES — nguồn là mã tài liệu trong danh mục (DOC-xx)
// ────────────────────────────────────────────────────────────
export const modules = [
  { id: 1, title: "Công ty & Văn hóa FourAngryBirds", titleEn: "FourAngryBirds Company & Culture", category: "Company",          duration: 18, progress: 100, lessons: 4, source: "DOC-01_Employee_Handbook_v2.0.docx",            sourceRef: { doc: "DOC-01", section: "§2.1", page: 5  }, status: "Completed",   validationStatus: "verified" },
  { id: 2, title: "An toàn thông tin & Mật khẩu",     titleEn: "Information Security & Passwords", category: "Security",         duration: 24, progress: 100, lessons: 5, source: "DOC-06_Information_Security_Policy.docx",      sourceRef: { doc: "DOC-06", section: "§4.2", page: 12 }, status: "Completed",   validationStatus: "verified" },
  { id: 3, title: "Bảo mật dữ liệu cá nhân",          titleEn: "Personal Data Privacy",            category: "Compliance",       duration: 32, progress: 75,  lessons: 7, source: "DOC-05_Data_Privacy_Policy.docx",              sourceRef: { doc: "DOC-05", section: "§3.0", page: 18 }, status: "In Progress", validationStatus: "verified_warning" },
  { id: 4, title: "Quy trình bàn giao phần mềm",      titleEn: "Software Deployment Workflow",     category: "Engineering",      duration: 20, progress: 40,  lessons: 5, source: "DOC-10_SOP_Software_Deployment_Workflow.docx", sourceRef: { doc: "DOC-10", section: "§1.4", page: 7  }, status: "In Progress", validationStatus: "verified" },
  { id: 5, title: "Xử lý khiếu nại & leo thang sự cố", titleEn: "Customer Escalation Process",     category: "Customer Support", duration: 42, progress: 0,   lessons: 8, source: "DOC-07_SOP_Customer_Escalation_Process.docx",  sourceRef: { doc: "DOC-07", section: "§5.1", page: 23 }, status: "Not Started", validationStatus: "manual_review" },
  { id: 6, title: "Quy tắc ứng xử công sở",           titleEn: "Workplace Conduct",                category: "Company",          duration: 28, progress: 0,   lessons: 6, source: "DOC-04_Workplace_Conduct_Policy.docx",         sourceRef: { doc: "DOC-04", section: "§2.3", page: 9  }, status: "Not Started", validationStatus: "pending" },
];

// ────────────────────────────────────────────────────────────
// TASKS
// ────────────────────────────────────────────────────────────
export const tasks = [
  { id: 1, title: "Thiết lập môi trường development cục bộ", titleEn: "Set up local development environment", phase: "Ngày 1",  phaseEn: "Day 1",  due: "2026-09-03", status: "Completed",  owner: "Alex Morgan" },
  { id: 2, title: "Tạo feature branch đầu tiên", titleEn: "Create first feature branch",              phase: "Tuần 1",  phaseEn: "Week 1", due: "2026-09-08", status: "Completed",  owner: "Alex Morgan" },
  { id: 3, title: "Submit pull request đầu tiên", titleEn: "Submit first pull request",             phase: "Tuần 2",  phaseEn: "Week 2", due: "2026-09-16", status: "In Review",  owner: "Alex Morgan" },
  { id: 4, title: "Implement health-check endpoint", titleEn: "Implement health-check endpoint",           phase: "30 ngày", phaseEn: "Day 30", due: "2026-09-28", status: "In Progress", owner: "Alex Morgan" },
  { id: 5, title: "Viết unit tests cho service layer", titleEn: "Write unit tests for service layer",         phase: "30 ngày", phaseEn: "Day 30", due: "2026-10-02", status: "Not Started", owner: "Alex Morgan" },
];

// ────────────────────────────────────────────────────────────
// QUIZ QUESTIONS — với nguồn trích dẫn chi tiết
// ────────────────────────────────────────────────────────────
export const quizQuestions = [
  {
    id: 1,
    question: "Branch nào cần dùng khi phát triển một tính năng mới?",
    questionEn: "Which branch should you use when developing a new feature?",
    options: ["main", "feature/*", "production", "hotfix/*"],
    answer: 1,
    source: "DOC-10_SOP_Software_Deployment_Workflow.docx",
    sourceRef: { doc: "DOC-10", section: "§1.4", page: 7 },
    validationStatus: "verified",
  },
  {
    id: 2,
    question: "Pull request hướng production cần bao nhiêu reviewer?",
    questionEn: "How many reviewers does a production-bound pull request need?",
    options: ["0", "1", "2", "3"],
    answer: 2,
    source: "DOC-10_SOP_Software_Deployment_Workflow.docx",
    sourceRef: { doc: "DOC-10", section: "§3.0", page: 18 },
    validationStatus: "verified",
  },
  {
    id: 3,
    question: "Khi xảy ra sự cố bảo mật, cần báo cáo ở đâu?",
    questionEn: "Where should a security incident be reported?",
    options: ["Kênh chat chung", "Kênh sự cố (Incident channel)", "Email cá nhân", "Issue tracker công khai"],
    optionsEn: ["General chat", "Incident channel", "Personal email", "Public issue tracker"],
    answer: 1,
    source: "DOC-06_Information_Security_Policy.docx",
    sourceRef: { doc: "DOC-06", section: "§4.2", page: 12 },
    validationStatus: "verified_warning",
  },
];

// ────────────────────────────────────────────────────────────
// AI GENERATION CONFIG
// ────────────────────────────────────────────────────────────
export const aiGeneration = {
  role: "Software Support Engineer",
  plan: [
    { phase: "Ngày 1",  phaseEn: "Day 1",  items: 6  },
    { phase: "Tuần 1",  phaseEn: "Week 1", items: 5  },
    { phase: "Tuần 2",  phaseEn: "Week 2", items: 4  },
    { phase: "30 ngày", phaseEn: "Day 30", items: 7  },
    { phase: "60 ngày", phaseEn: "Day 60", items: 5  },
    { phase: "90 ngày", phaseEn: "Day 90", items: 6  },
  ],
  modules: 8,
  tasks: 15,
  quiz: 30,
};

// ────────────────────────────────────────────────────────────
// REPORT DATA
// ────────────────────────────────────────────────────────────
export const reportData = {
  weeklyCompletion: [
    { week: 1, completed: 42, target: 50 },
    { week: 2, completed: 58, target: 65 },
    { week: 3, completed: 71, target: 75 },
    { week: 4, completed: 84, target: 85 },
    { week: 5, completed: 91, target: 90 },
  ],
  departmentProgress: [
    { dept: "Engineering",      employees: 18, avgProgress: 74, coverageScore: 88, traceabilityScore: 92 },
    { dept: "Customer Support", employees: 12, avgProgress: 81, coverageScore: 90, traceabilityScore: 95 },
    { dept: "Sales",            employees: 9,  avgProgress: 62, coverageScore: 75, traceabilityScore: 81 },
    { dept: "Finance",          employees: 5,  avgProgress: 57, coverageScore: 68, traceabilityScore: 73 },
    { dept: "Branch Management", employees: 4, avgProgress: 66, coverageScore: 79, traceabilityScore: 88 },
  ],
  validationCounts: {
    verified: 28,
    verified_warning: 7,
    partially_verified: 3,
    source_missing: 1,
    requirement_missing: 2,
    unsupported: 1,
    outdated_source: 2,
    hallucination: 2,
    contradiction: 1,
    manual_review: 4,
  },
  coverageScore: 84,
  traceabilityScore: 91,
};

// ────────────────────────────────────────────────────────────
// AI COMPARISON DATA — GenAI Output vs Python Ground Truth
// ────────────────────────────────────────────────────────────
export const aiComparisonData = [
  {
    id: 1,
    field: "Thời gian onboarding", fieldEn: "Onboarding duration",
    genaiOutput: "90 ngày theo lộ trình chuẩn", genaiOutputEn: "90 days on the standard path",
    groundTruth: "90 ngày theo lộ trình chuẩn", groundTruthEn: "90 days on the standard path",
    status: "verified",
    sourceRef: { doc: "DOC-01", section: "§2.1", page: 5 },
  },
  {
    id: 2,
    field: "Số lượng reviewer PR", fieldEn: "Number of PR reviewers",
    genaiOutput: "Cần ít nhất 1 reviewer", genaiOutputEn: "At least 1 reviewer required",
    groundTruth: "Cần ít nhất 2 reviewer cho production", groundTruthEn: "At least 2 reviewers required for production",
    status: "contradiction",
    sourceRef: { doc: "DOC-10", section: "§3.0", page: 18 },
  },
  {
    id: 3,
    field: "Quy ước đặt tên branch", fieldEn: "Branch naming convention",
    genaiOutput: "feature/JIRA-ID-mô-tả", genaiOutputEn: "feature/JIRA-ID-description",
    groundTruth: "feature/JIRA-ID-mô-tả", groundTruthEn: "feature/JIRA-ID-description",
    status: "verified",
    sourceRef: { doc: "DOC-10", section: "§1.4", page: 7 },
  },
  {
    id: 4,
    field: "Báo cáo sự cố bảo mật", fieldEn: "Security incident reporting",
    genaiOutput: "#security-alerts Slack channel",
    groundTruth: "#incident-response Slack channel",
    status: "hallucination",
    sourceRef: { doc: "DOC-06", section: "§4.2", page: 12 },
  },
  {
    id: 5,
    field: "SLA review code", fieldEn: "Code review SLA",
    genaiOutput: "Phản hồi trong 48 giờ làm việc", genaiOutputEn: "Respond within 48 working hours",
    groundTruth: "Phản hồi trong 24 giờ làm việc", groundTruthEn: "Respond within 24 working hours",
    status: "verified_warning",
    sourceRef: { doc: "DOC-10", section: "§3.2", page: 22 },
  },
  {
    id: 6,
    field: "Quy trình deploy", fieldEn: "Deployment process",
    genaiOutput: "Deploy qua CI/CD pipeline sau khi merge vào main", genaiOutputEn: "Deploy via the CI/CD pipeline after merging into main",
    groundTruth: "Deploy qua CI/CD pipeline sau khi merge vào main", groundTruthEn: "Deploy via the CI/CD pipeline after merging into main",
    status: "verified",
    sourceRef: { doc: "DOC-10", section: "§5.1", page: 23 },
  },
];
