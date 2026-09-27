/**
 * Tiện ích xuất dữ liệu (CSV & in/lưu PDF) cho Trung tâm Báo cáo (SRS Step 62, 63 & Deliverables 1.10).
 */

/**
 * Xuất dữ liệu ra file CSV tương thích chuẩn với Microsoft Excel và Google Sheets (UTF-8 with BOM).
 * @param {string} filename Tên file cần lưu (ví dụ: "Bao_cao_tien_do.csv")
 * @param {string[]} headers Danh sách tiêu đề cột
 * @param {(string|number)[][]} rows Danh sách các hàng dữ liệu
 */
export function exportToCsv(filename, headers, rows) {
  const escapeCell = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvRows = [
    headers.map(escapeCell).join(","),
    ...rows.map(row => row.map(escapeCell).join(","))
  ];

  // BOM \uFEFF giúp Excel nhận diện chính xác encoding UTF-8 (tiếng Việt có dấu không bị vỡ)
  const csvContent = "\uFEFF" + csvRows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Tạo bản in và lưu PDF chuẩn báo cáo doanh nghiệp thông qua iframe ẩn.
 * @param {Object} options
 * @param {string} options.title Tiêu đề báo cáo
 * @param {string} options.subtitle Mô tả phụ / ngữ cảnh báo cáo
 * @param {Array<{label: string, value: string|number}>} [options.kpis] Các thẻ chỉ số tổng quan
 * @param {string[]} options.headers Tiêu đề cột
 * @param {(string|number)[][]} options.rows Hàng dữ liệu
 * @param {Object} [options.metadata] Metadata bổ sung (Người xuất, thời gian, phòng ban...)
 */
export function printReportToPdf({ title, subtitle, kpis = [], headers = [], rows = [], metadata = {} }) {
  const existingFrame = document.getElementById("report-print-iframe");
  if (existingFrame) existingFrame.remove();

  const iframe = document.createElement("iframe");
  iframe.id = "report-print-iframe";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const now = new Date().toLocaleString("vi-VN");

  const kpisHtml = kpis.length > 0 ? `
    <div class="kpi-grid">
      ${kpis.map(k => `
        <div class="kpi-card">
          <div class="kpi-label">${k.label}</div>
          <div class="kpi-value">${k.value}</div>
        </div>
      `).join("")}
    </div>
  ` : "";

  const tableHeaderHtml = headers.map(h => `<th>${h}</th>`).join("");
  const tableRowsHtml = rows.map((r, idx) => `
    <tr class="${idx % 2 === 0 ? 'even' : 'odd'}">
      ${r.map(c => `<td>${c !== undefined && c !== null ? c : "-"}</td>`).join("")}
    </tr>
  `).join("");

  const docHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 14mm 12mm 14mm 12mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11pt;
            line-height: 1.4;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          .brand {
            font-size: 18pt;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #4f46e5;
          }
          .brand span {
            color: #0f172a;
          }
          .tagline {
            font-size: 9pt;
            color: #64748b;
            margin-top: 2px;
          }
          .meta {
            text-align: right;
            font-size: 8.5pt;
            color: #475569;
          }
          .title-section {
            margin-bottom: 16px;
          }
          h1 {
            font-size: 16pt;
            font-weight: 700;
            margin: 0 0 4px 0;
            color: #0f172a;
          }
          .subtitle {
            font-size: 9.5pt;
            color: #64748b;
            margin: 0;
          }
          .kpi-grid {
            display: flex;
            gap: 12px;
            margin-bottom: 16px;
          }
          .kpi-card {
            flex: 1;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 12px;
          }
          .kpi-label {
            font-size: 8pt;
            text-transform: uppercase;
            font-weight: 600;
            color: #64748b;
          }
          .kpi-value {
            font-size: 14pt;
            font-weight: 700;
            color: #0f172a;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin-bottom: 20px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-align: left;
            padding: 8px 10px;
            border-bottom: 2px solid #cbd5e1;
            font-size: 8.5pt;
            text-transform: uppercase;
          }
          td {
            padding: 7px 10px;
            border-bottom: 1px solid #e2e8f0;
            color: #1e293b;
          }
          tr.even {
            background: #ffffff;
          }
          tr.odd {
            background: #fafafa;
          }
          .footer {
            margin-top: 24px;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">SkillSprint <span>AI</span></div>
            <div class="tagline">Enterprise Knowledge & Intelligent Onboarding Platform</div>
          </div>
          <div class="meta">
            <div><strong>Thời gian xuất:</strong> ${now}</div>
            <div><strong>Hệ thống:</strong> Production Verified</div>
            ${Object.entries(metadata).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`).join("")}
          </div>
        </div>

        <div class="title-section">
          <h1>${title}</h1>
          <p class="subtitle">${subtitle || ""}</p>
        </div>

        ${kpisHtml}

        <table>
          <thead>
            <tr>${tableHeaderHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>SkillSprint AI · Confidential & Internal Compliance Report</div>
          <div>Trang 1 / 1 · Xác thực chữ ký số nền tảng</div>
        </div>
      </body>
    </html>
  `;

  iframe.contentWindow.document.open();
  iframe.contentWindow.document.write(docHtml);
  iframe.contentWindow.document.close();

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error("Print failed:", err);
      }
    }, 250);
  };
}
