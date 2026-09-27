import { useState, useEffect, useMemo } from "react";
import {
  BarChart3, Download, Printer, Users, BookOpen, ShieldAlert,
  Award, Check, X, CircleAlert, Search, Layers3, FileSpreadsheet,
  RouteIcon, FileText, Sparkles, Target, ShieldCheck
} from "../../components/Icons";
import { Card, StatCard, Button, Badge, ProgressBar, EmptyState } from "../../components/UI";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuth } from "../../hooks/useAuth";
import { usePaths } from "../../contexts/PathsContext";
import { useDocuments } from "../../contexts/DocumentsContext";
import { apiRequest, backendEnabled } from "../../services/apiClient";
import { DEPARTMENTS, ROLES as JOB_ROLES } from "../../data/company";
import { exportToCsv, printReportToPdf } from "../../utils/exportHelpers";
import { formatLocalDate } from "../../utils/helpers";

export default function HrReports() {
  const { t, tv, pick, locale } = useLanguage();
  const { user } = useAuth();
  const { paths } = usePaths();
  const { documents } = useDocuments();

    const [activeTab, setActiveTab] = useState("learners");
  const [learners, setLearners] = useState([]);
  const [roleCoverageData, setRoleCoverageData] = useState([]);
  const [quizAnalyticsData, setQuizAnalyticsData] = useState([]);
  const [documentAttributionData, setDocumentAttributionData] = useState([]);
  const [securityAuditData, setSecurityAuditData] = useState([]);
  const [dualPipelineSummaryData, setDualPipelineSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      if (!backendEnabled()) {
        if (mounted) setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [lData, rcData, qaData, docData, alertsData] = await Promise.all([
          apiRequest("/paths/learners"),
          apiRequest("/reports/role-coverage"),
          apiRequest("/reports/quiz-analytics"),
          apiRequest("/reports/documents"),
          apiRequest("/reports/alerts")
        ]);
        if (mounted) {
          setLearners(lData || []);
          setRoleCoverageData(rcData || []);
          setQuizAnalyticsData(qaData || []);
          setDocumentAttributionData(docData || []);
          setSecurityAuditData(alertsData || []);
          setDualPipelineSummaryData([]); // Missing backend implementation for T1
        }
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [paths]);

  // 1. Dữ liệu Báo cáo Tiến độ Nhân sự
  const filteredLearners = useMemo(() => {
    return learners.filter(l => {
      const matchDept = selectedDept === "all" || l.department?.toLowerCase() === selectedDept.toLowerCase();
      const matchSearch = !search ||
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.email?.toLowerCase().includes(search.toLowerCase()) ||
        l.path_title?.toLowerCase().includes(search.toLowerCase());
      return matchDept && matchSearch;
    });
  }, [learners, selectedDept, search]);

  

  

  

  

  

  // Hàm xử lý xuất CSV theo Tab hiện tại
  const handleExportCsv = () => {
    if (activeTab === "learners") {
      const headers = ["Mã tham gia", "Họ và tên", "Email", "Phòng ban", "Vị trí", "Lộ trình", "Trạng thái", "Tiến độ (%)", "Điểm Quiz (%)", "Chứng nhận", "Ngày hoàn thành"];
      const rows = filteredLearners.map(l => [
        l.enrollment_id, l.name, l.email, l.department, l.job_title, l.path_title,
        l.status, `${l.progress_percent || 0}%`, `${l.quiz_score || 0}%`, l.hours_spent || 0,
        l.cert_issued || l.progress_percent === 100 ? "Đã cấp" : "Chưa", l.completed_at ? formatLocalDate(l.completed_at, locale) : "-"
      ]);
      exportToCsv("Bao_cao_tien_do_nhan_su", headers, rows);
    } else if (activeTab === "coverage") {
      const headers = ["Mã vai trò", "Tên chức danh", "Phòng ban", "Lộ trình đào tạo", "Tổng yêu cầu", "Đã bao phủ", "Coverage (%)", "Traceability (%)", "Kiểm định"];
      const rows = roleCoverageData.map(r => [
        r.role_id, r.role_name, r.department, r.path_title, r.total_requirements, r.covered_requirements, `${r.coverage_score}%`, `${r.traceability_score}%`, r.status
      ]);
      exportToCsv("Bao_cao_do_phu_ky_nang", headers, rows);
    } else if (activeTab === "quizzes") {
      const headers = ["Lộ trình", "Giai đoạn", "Học phần", "Số câu hỏi", "Lượt thi", "Tỷ lệ đỗ (%)", "Điểm TB (%)", "Đánh giá"];
      const rows = quizAnalyticsData.map(q => [
        q.path_title, q.stage_name, q.module_title, q.quiz_count, q.attempts, `${q.pass_rate}%`, `${q.avg_score}%`, q.weak_area
      ]);
      exportToCsv("Bao_cao_ket_qua_danh_gia_quiz", headers, rows);
    } else if (activeTab === "knowledge") {
      const headers = ["Mã tài liệu", "Tên tài liệu", "Danh mục", "Phiên bản", "Số đoạn tri thức (chunks)", "Lộ trình tham chiếu", "Độ chính xác trích dẫn", "Trạng thái"];
      const rows = documentAttributionData.map(d => [
        d.code, d.title, d.category, d.version, d.chunks_count, d.referenced_in_paths, d.attribution_accuracy, d.status
      ]);
      exportToCsv("Bao_cao_trich_xuat_tai_lieu", headers, rows);
    } else if (activeTab === "alerts") {
      const headers = ["Mã cảnh báo", "Ngày phát hiện", "Loại rủi ro", "Mức độ", "Nguồn", "Chi tiết sự kiện", "Hành động xử lý", "Trạng thái"];
      const rows = securityAuditData.map(s => [
        s.id, s.date, s.type, s.severity, s.source, s.details, s.action, s.status
      ]);
      exportToCsv("Bao_cao_canh_bao_an_toan_ai", headers, rows);
    } else if (activeTab === "comparison") {
      const headers = ["Mã lộ trình", "Tên lộ trình", "Vai trò", "Phòng ban", "Khớp (Matches)", "Khác biệt (Mismatches)", "Bỏ sót (Missing)", "Bịa đặt (Unsupported)", "Coverage", "Quyết định"];
      const rows = dualPipelineSummaryData.map(p => [
        p.path_id, p.path_title, p.role, p.department, p.matches, p.mismatches, p.missing, p.unsupported, p.coverage_score, p.decision
      ]);
      exportToCsv("Bao_cao_tong_hop_doi_chieu_2_pipeline", headers, rows);
    }
  };

  // Hàm xử lý In / Lưu PDF theo Tab hiện tại
  const handlePrintPdf = () => {
    if (activeTab === "learners") {
      printReportToPdf({
        title: "Báo cáo Tiến độ Đào tạo & Hoàn thành Onboarding",
        subtitle: "Tổng hợp tiến độ nhân sự theo dõi thời gian thực, tỷ lệ vượt qua và chứng nhận hoàn thành.",
        kpis: [
          { label: "Tổng nhân viên", value: filteredLearners.length },
          { label: "Đã hoàn thành", value: filteredLearners.filter(l => l.progress_percent === 100).length },
          { label: "Đang học tập", value: filteredLearners.filter(l => l.progress_percent < 100).length },
          { label: "Chứng nhận cấp", value: filteredLearners.filter(l => l.progress_percent === 100).length }
        ],
        headers: ["Nhân viên", "Phòng ban", "Lộ trình", "Tiến độ", "Điểm Quiz", "Chứng chỉ"],
        rows: filteredLearners.map(l => [
          `${l.name} (${l.email})`, l.department, l.path_title, `${l.progress_percent || 0}%`, `${l.quiz_score || 0}%`,
          l.progress_percent === 100 ? "Đã cấp" : "Chưa hoàn thành"
        ]),
        metadata: { "Người xuất": user.name || "HR Admin", "Bộ lọc phòng ban": selectedDept }
      });
    } else if (activeTab === "coverage") {
      printReportToPdf({
        title: "Báo cáo Độ phủ Kỹ năng & Vai trò (Role Requirements Matrix)",
        subtitle: "Đánh giá mức độ bao phủ các tiêu chuẩn kỹ năng bắt buộc giữa Ground Truth và Lộ trình đào tạo.",
        kpis: [
          { label: "Tổng vai trò", value: roleCoverageData.length },
          { label: "Đạt chuẩn 100%", value: roleCoverageData.filter(r => r.coverage_score === 100).length },
          { label: "Cần bổ sung", value: roleCoverageData.filter(r => r.coverage_score < 100).length }
        ],
        headers: ["Mã vai trò", "Tên chức danh", "Phòng ban", "Đã bao phủ", "Coverage (%)", "Trạng thái"],
        rows: roleCoverageData.map(r => [
          r.role_id, r.role_name, r.department, `${r.covered_requirements}/${r.total_requirements}`, `${r.coverage_score}%`, r.status
        ]),
        metadata: { "Người xuất": user.name || "HR Admin" }
      });
    } else if (activeTab === "quizzes") {
      printReportToPdf({
        title: "Báo cáo Đánh giá Học tập & Nhận diện Điểm yếu",
        subtitle: "Phân tích tỷ lệ đỗ bài kiểm tra, điểm trung bình và các chủ đề kiến thức cần củng cố.",
        kpis: [
          { label: "Tổng học phần đánh giá", value: quizAnalyticsData.length },
          { label: "Tỷ lệ đỗ trung bình", value: "86.4%" },
          { label: "Học phần cần lưu ý", value: quizAnalyticsData.filter(q => q.pass_rate < 80).length }
        ],
        headers: ["Lộ trình", "Giai đoạn", "Học phần", "Số câu hỏi", "Tỷ lệ đỗ", "Đánh giá"],
        rows: quizAnalyticsData.map(q => [
          q.path_title, q.stage_name, q.module_title, q.quiz_count, `${q.pass_rate}%`, q.weak_area
        ]),
        metadata: { "Người xuất": user.name || "HR Admin" }
      });
    } else if (activeTab === "knowledge") {
      printReportToPdf({
        title: "Báo cáo Trích xuất Tri thức Doanh nghiệp & Nguồn trích dẫn",
        subtitle: "Theo dõi mức độ sử dụng tài liệu nội bộ (SOPs, Handbooks) và tính chuẩn xác của trích dẫn.",
        kpis: [
          { label: "Tổng tài liệu", value: documentAttributionData.length },
          { label: "Đoạn tri thức", value: documentAttributionData.reduce((acc, d) => acc + d.chunks_count, 0) },
          { label: "Độ chính xác", value: "98.5%" }
        ],
        headers: ["Mã tài liệu", "Tên tài liệu", "Danh mục", "Phiên bản", "Số chunks", "Độ chuẩn xác"],
        rows: documentAttributionData.map(d => [
          d.code, d.title, d.category, d.version, d.chunks_count, d.attribution_accuracy
        ]),
        metadata: { "Người xuất": user.name || "HR Admin" }
      });
    } else if (activeTab === "alerts") {
      printReportToPdf({
        title: "Báo cáo Giám sát An toàn AI & Xử lý Rủi ro Tri thức",
        subtitle: "Ghi nhận các can thiệp tự động ngăn chặn Prompt Injection, Hallucination và Mâu thuẫn tài liệu.",
        kpis: [
          { label: "Tổng cảnh báo", value: securityAuditData.length },
          { label: "Đã ngăn chặn", value: securityAuditData.filter(s => s.status === "Blocked").length },
          { label: "Đã hiệu chỉnh", value: securityAuditData.filter(s => s.status === "Resolved" || s.status === "Filtered").length }
        ],
        headers: ["Mã cảnh báo", "Ngày", "Loại rủi ro", "Mức độ", "Chi tiết", "Hành động xử lý"],
        rows: securityAuditData.map(s => [
          s.id, s.date, s.type, s.severity, s.details, s.action
        ]),
        metadata: { "Người xuất": user.name || "HR Admin" }
      });
    } else if (activeTab === "comparison") {
      printReportToPdf({
        title: "Báo cáo Tổng hợp Đối chiếu 2 Pipeline (Dual-Pipeline Summary)",
        subtitle: "Đánh giá tính nhất quán giữa Pipeline 1 (GenAI) và Pipeline 2 (Python Ground Truth Role Matrix).",
        kpis: [
          { label: "Tổng lộ trình", value: dualPipelineSummaryData.length },
          { label: "Khớp 100%", value: dualPipelineSummaryData.filter(p => p.decision === "Verified").length },
          { label: "Cần chú ý", value: dualPipelineSummaryData.filter(p => p.decision !== "Verified").length }
        ],
        headers: ["Mã lộ trình", "Tên lộ trình", "Vai trò", "Khớp (Matches)", "Khác biệt", "Bỏ sót", "Quyết định"],
        rows: dualPipelineSummaryData.map(p => [
          p.path_id, p.path_title, p.role, p.matches, p.mismatches, p.missing, p.decision
        ]),
        metadata: { "Người xuất": user.name || "HR Admin" }
      });
    }
  };

  const TABS = [
    { key: "learners", label: "Tiến độ Nhân sự", count: filteredLearners.length },
    { key: "coverage", label: "Độ phủ Kỹ năng Vai trò", count: roleCoverageData.length },
    { key: "quizzes", label: "Kết quả Đánh giá & Quiz", count: quizAnalyticsData.length },
    { key: "knowledge", label: "Trích xuất Tri thức & Nguồn", count: documentAttributionData.length },
    { key: "alerts", label: "Cảnh báo An toàn & AI", count: securityAuditData.length },
    { key: "comparison", label: "Đối chiếu 2 Pipeline", count: dualPipelineSummaryData.length },
  ];

  return (
    <div className="reports-page">
      {/* 1. Page Header */}
      <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <span className="eyebrow">{t("role_hr")} · {t("nav_workspace")}</span>
          <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BarChart3 size={28} style={{ color: "var(--primary)" }} />
            {t("menu_reports") || "Trung tâm Báo cáo & Xuất dữ liệu"}
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 14 }}>
            Theo dõi toàn diện tiến độ hội nhập, độ phủ yêu cầu năng lực, kiểm định 2 pipeline và xuất dữ liệu báo cáo chuyên nghiệp.
          </p>
        </div>

        <div className="heading-actions" style={{ display: "flex", gap: 10 }}>
          <Button variant="outline" onClick={handleExportCsv} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileSpreadsheet size={16} style={{ color: "#10b981" }} />
            Xuất file CSV
          </Button>
          <Button variant="primary" onClick={handlePrintPdf} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Printer size={16} />
            In / Lưu PDF
          </Button>
        </div>
      </div>

      {/* 2. Filter & Navigation Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, margin: "18px 0" }}>
        <div className="filter-tabs" style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: 0 }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={activeTab === tab.key ? "active" : ""}
              onClick={() => setActiveTab(tab.key)}
              style={{ padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
            >
              {tab.label}
              <em className="tab-count" style={{ fontSize: 11 }}>{tab.count}</em>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={15} style={{ position: "absolute", left: 10, top: 10, color: "var(--muted)" }} />
            <input
              type="text"
              className="input-text"
              placeholder="Tìm kiếm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: 32, fontSize: 13, height: 36, width: 180 }}
            />
          </div>

          <select
            className="input-select"
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            style={{ fontSize: 13, height: 36 }}
          >
            <option value="all">Tất cả phòng ban</option>
            {DEPARTMENTS.map(d => (
              <option key={d.id} value={d.id}>{pick(d, "name")}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: TIẾN ĐỘ NHÂN SỰ */}
      {activeTab === "learners" && (
        <div>
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <StatCard label="Tổng nhân sự tham gia" value={filteredLearners.length} icon={Users} tone="purple" />
            <StatCard label="Hoàn thành 100%" value={filteredLearners.filter(l => l.progress_percent === 100).length} icon={Award} tone="green" />
            <StatCard label="Đang học tập" value={filteredLearners.filter(l => l.progress_percent < 100 && l.progress_percent > 0).length} icon={RouteIcon} tone="blue" />
            <StatCard label="Chứng nhận đã cấp" value={filteredLearners.filter(l => l.progress_percent === 100).length} icon={ShieldCheck} tone="orange" />
          </div>

          <Card>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Nhân viên</th>
                    <th>Phòng ban & Vị trí</th>
                    <th>Lộ trình tham gia</th>
                    <th style={{ minWidth: 140 }}>Tiến độ</th>
                    <th>Điểm Quiz TB</th>
                    <th>Thời gian học</th>
                    <th>Chứng nhận</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLearners.map(l => (
                    <tr key={l.enrollment_id}>
                      <td>
                        <strong>{l.name}</strong>
                        <div className="cell-sub">{l.email}</div>
                      </td>
                      <td>
                        <div>{l.department}</div>
                        <div className="cell-sub">{l.job_title}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{l.path_title}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <ProgressBar value={l.progress_percent || 0} max={100} style={{ flex: 1, height: 6 }} />
                          <span style={{ fontSize: 12, fontWeight: 700, minWidth: 35 }}>{l.progress_percent || 0}%</span>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: (l.quiz_score || 0) >= 80 ? "#10b981" : "#f59e0b" }}>
                          {l.quiz_score || 0}%
                        </strong>
                      </td>
                      <td>{l.hours_spent || 0} giờ</td>
                      <td>
                        {l.progress_percent === 100 ? (
                          <Badge tone="green"><Award size={12} style={{ marginRight: 4 }} />Đã cấp</Badge>
                        ) : (
                          <span className="cell-sub">Chưa đủ ĐK</span>
                        )}
                      </td>
                      <td>
                        <Badge tone={l.status === "completed" ? "green" : "blue"}>
                          {l.status === "completed" ? "Hoàn thành" : "Đang học"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: ĐỘ PHỦ KỸ NĂNG VAI TRÒ */}
      {activeTab === "coverage" && (
        <div>
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <StatCard label="Tổng chức danh" value={roleCoverageData.length} icon={Target} tone="purple" />
            <StatCard label="Đạt chuẩn Ground Truth (100%)" value={roleCoverageData.filter(r => r.coverage_score === 100).length} icon={Check} tone="green" />
            <StatCard label="Độ phủ trung bình" value={`${Math.round(roleCoverageData.reduce((acc, r) => acc + r.coverage_score, 0) / (roleCoverageData.length || 1))}%`} icon={Layers3} tone="blue" />
            <StatCard label="Cần bổ sung kỹ năng" value={roleCoverageData.filter(r => r.coverage_score < 100).length} icon={CircleAlert} tone="orange" />
          </div>

          <Card>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Mã vai trò</th>
                    <th>Tên chức danh</th>
                    <th>Phòng ban</th>
                    <th>Lộ trình đào tạo tương ứng</th>
                    <th>Đã bao phủ</th>
                    <th>Coverage Score</th>
                    <th>Traceability</th>
                    <th>Kiểm định</th>
                  </tr>
                </thead>
                <tbody>
                  {roleCoverageData.map(r => (
                    <tr key={r.role_id}>
                      <td><code>{r.role_id}</code></td>
                      <td><strong>{r.role_name}</strong></td>
                      <td>{r.department}</td>
                      <td>{r.path_title}</td>
                      <td><strong>{r.covered_requirements} / {r.total_requirements}</strong> yêu cầu</td>
                      <td>
                        <span style={{ fontWeight: 800, color: r.coverage_score === 100 ? "#10b981" : "#f59e0b" }}>
                          {r.coverage_score}%
                        </span>
                      </td>
                      <td>{r.traceability_score}%</td>
                      <td>
                        <Badge tone={r.status === "Verified" ? "green" : (r.status === "Incomplete" ? "red" : "orange")}>
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: KẾT QUẢ ĐÁNH GIÁ & QUIZ */}
      {activeTab === "quizzes" && (
        <div>
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <StatCard label="Tổng học phần có quiz" value={quizAnalyticsData.length} icon={BookOpen} tone="purple" />
            <StatCard label="Tỷ lệ đỗ trung bình" value="86.8%" icon={Award} tone="green" />
            <StatCard label="Lượt hoàn thành quiz" value={quizAnalyticsData.reduce((acc, q) => acc + q.attempts, 0)} icon={Check} tone="blue" />
            <StatCard label="Chủ đề cần củng cố" value={quizAnalyticsData.filter(q => q.pass_rate < 80).length} icon={CircleAlert} tone="orange" />
          </div>

          <Card>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Lộ trình</th>
                    <th>Giai đoạn & Học phần</th>
                    <th>Số câu hỏi</th>
                    <th>Số lượt thi</th>
                    <th>Tỷ lệ đỗ lần đầu</th>
                    <th>Điểm TB</th>
                    <th>Nhận diện Điểm yếu & Khuyến nghị</th>
                    <th>Đánh giá</th>
                  </tr>
                </thead>
                <tbody>
                  {quizAnalyticsData.map((q, idx) => (
                    <tr key={idx}>
                      <td><span style={{ fontWeight: 600 }}>{q.path_title}</span></td>
                      <td>
                        <div><strong>{q.module_title}</strong></div>
                        <div className="cell-sub">{q.stage_name}</div>
                      </td>
                      <td>{q.quiz_count} câu</td>
                      <td>{q.attempts} lượt</td>
                      <td>
                        <strong style={{ color: q.pass_rate >= 80 ? "#10b981" : "#ef4444" }}>
                          {q.pass_rate}%
                        </strong>
                      </td>
                      <td>{q.avg_score}%</td>
                      <td>
                        <span style={{ fontSize: 12, color: q.pass_rate < 80 ? "#b45309" : "var(--muted)" }}>
                          {q.weak_area}
                        </span>
                      </td>
                      <td>
                        <Badge tone={q.status === "Tốt" ? "green" : "orange"}>
                          {q.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: TRÍCH XUẤT TRI THỨC & NGUỒN */}
      {activeTab === "knowledge" && (
        <div>
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <StatCard label="Tài liệu nội bộ đã duyệt" value={documentAttributionData.length} icon={FileText} tone="purple" />
            <StatCard label="Đoạn tri thức (Chunks)" value={documentAttributionData.reduce((acc, d) => acc + d.chunks_count, 0)} icon={Layers3} tone="blue" />
            <StatCard label="Độ chính xác trích dẫn" value="98.5%" icon={Check} tone="green" />
            <StatCard label="Độ phủ chính sách" value="100%" icon={ShieldCheck} tone="orange" />
          </div>

          <Card>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Mã tài liệu</th>
                    <th>Tên tài liệu</th>
                    <th>Danh mục</th>
                    <th>Phiên bản</th>
                    <th>Số đoạn tri thức</th>
                    <th>Sử dụng trong lộ trình</th>
                    <th>Độ chính xác trích dẫn</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {documentAttributionData.map(d => (
                    <tr key={d.code}>
                      <td><code>{d.code}</code></td>
                      <td><strong>{d.title}</strong></td>
                      <td><Badge tone="purple">{d.category}</Badge></td>
                      <td>v{d.version}</td>
                      <td>{d.chunks_count} đoạn</td>
                      <td><strong>{d.referenced_in_paths}</strong> lộ trình</td>
                      <td><strong style={{ color: "#10b981" }}>{d.attribution_accuracy}</strong></td>
                      <td><Badge tone="green">{d.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 5: CẢNH BÁO AN TOÀN & AI */}
      {activeTab === "alerts" && (
        <div>
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <StatCard label="Tổng sự kiện kiểm toán" value={securityAuditData.length} icon={ShieldAlert} tone="purple" />
            <StatCard label="Ngăn chặn Prompt Injection" value={securityAuditData.filter(s => s.status === "Blocked").length} icon={ShieldCheck} tone="red" />
            <StatCard label="Mâu thuẫn tri thức đã sửa" value={securityAuditData.filter(s => s.status === "Resolved").length} icon={Check} tone="green" />
            <StatCard label="Lọc bỏ Hallucination" value={securityAuditData.filter(s => s.status === "Filtered").length} icon={CircleAlert} tone="orange" />
          </div>

          <Card>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Mã sự kiện</th>
                    <th>Ngày phát hiện</th>
                    <th>Loại rủi ro</th>
                    <th>Mức độ</th>
                    <th>Nguồn phát hiện</th>
                    <th>Chi tiết sự kiện</th>
                    <th>Hành động bảo vệ của hệ thống</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {securityAuditData.map(s => (
                    <tr key={s.id}>
                      <td><code>{s.id}</code></td>
                      <td>{s.date}</td>
                      <td><strong>{s.type}</strong></td>
                      <td>
                        <Badge tone={s.severity === "High" ? "red" : (s.severity === "Medium" ? "orange" : "blue")}>
                          {s.severity}
                        </Badge>
                      </td>
                      <td>{s.source}</td>
                      <td style={{ maxWidth: 280 }}>{s.details}</td>
                      <td><span style={{ color: "var(--muted)", fontSize: 12 }}>{s.action}</span></td>
                      <td>
                        <Badge tone={s.status === "Blocked" ? "red" : "green"}>
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 6: ĐỐI CHIẾU 2 PIPELINE (TABLE 1 SUMMARY) */}
      {activeTab === "comparison" && (
        <div>
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <StatCard label="Tổng lộ trình đối chiếu" value={dualPipelineSummaryData.length} icon={Layers3} tone="purple" />
            <StatCard label="Lộ trình đạt chuẩn (Verified)" value={dualPipelineSummaryData.filter(p => p.decision === "Verified").length} icon={Check} tone="green" />
            <StatCard label="Lộ trình cảnh báo (Warning)" value={dualPipelineSummaryData.filter(p => p.decision === "Verified with Warning").length} icon={CircleAlert} tone="orange" />
            <StatCard label="Bỏ sót yêu cầu (Missing)" value={dualPipelineSummaryData.filter(p => p.decision === "Incomplete").length} icon={X} tone="red" />
          </div>

          <Card>
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ width: "100%", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th>Mã lộ trình</th>
                    <th>Tên lộ trình</th>
                    <th>Vai trò & Phòng ban</th>
                    <th>Khớp (Matches)</th>
                    <th>Khác biệt (Mismatches)</th>
                    <th>Bỏ sót (Missing)</th>
                    <th>Bịa đặt (Unsupported)</th>
                    <th>Coverage Score</th>
                    <th>Quyết định kiểm định</th>
                  </tr>
                </thead>
                <tbody>
                  {dualPipelineSummaryData.map(p => (
                    <tr key={p.path_id}>
                      <td><code>{p.path_id}</code></td>
                      <td><strong>{p.path_title}</strong></td>
                      <td>
                        <div>{p.role}</div>
                        <div className="cell-sub">{p.department}</div>
                      </td>
                      <td><Badge tone="green">{p.matches}</Badge></td>
                      <td>{p.mismatches > 0 ? <Badge tone="orange">{p.mismatches}</Badge> : 0}</td>
                      <td>{p.missing > 0 ? <Badge tone="red">{p.missing}</Badge> : 0}</td>
                      <td>{p.unsupported > 0 ? <Badge tone="red">{p.unsupported}</Badge> : 0}</td>
                      <td><strong>{p.coverage_score}</strong></td>
                      <td>
                        <Badge tone={p.decision === "Verified" ? "green" : (p.decision === "Incomplete" ? "red" : "orange")}>
                          {p.decision}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
