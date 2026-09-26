import { Modal, Button } from "../UI";
import { Award, Download } from "../Icons";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatLocalDate } from "../../utils/helpers";
import "../../styles/certificate.css";

export default function CertificateModal({ path, employee, enrollment, onClose }) {
  const { t, pick, locale } = useLanguage();
  
  const certId = `SSA-${employee.employee_code || "EMP-0000"}-${path.id.substring(0,6).toUpperCase()}`;
  const todayStr = new Date().toISOString();
  const completionDate = enrollment.completedAt || todayStr;
  
  const handlePrint = () => {
    // Basic print trick for the certificate
    const content = document.getElementById("certificate-node").innerHTML;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${employee.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;600&display=swap');
            body { font-family: 'Inter', sans-serif; display: grid; place-items: center; padding: 20px; }
            .certificate-wrapper { max-width: 800px; width: 100%; font-family: "Playfair Display", serif; }
            .cert-border-outer { border: 12px solid #e5e7eb; padding: 10px; background: #f9fafb; }
            .cert-border-inner { border: 2px solid #d1d5db; padding: 50px; background: #fff; text-align: center; position: relative; }
            .cert-header { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 40px; }
            .cert-logo { height: 60px; border-radius: 8px; }
            .cert-header h2 { font-size: 32px; color: #1e3a8a; margin: 0; font-family: 'Inter', sans-serif; font-weight: 800; letter-spacing: -1px; }
            .cert-subtitle { font-size: 16px; letter-spacing: 5px; color: #6b7280; margin-bottom: 30px; text-transform: uppercase; font-family: 'Inter', sans-serif; font-weight: 600; }
            .cert-name { font-size: 48px; font-style: italic; margin: 10px 0; color: #111827; }
            .cert-text { font-size: 18px; color: #4b5563; font-style: italic; }
            .cert-path-title { font-size: 28px; color: #1e3a8a; margin: 25px 0; font-weight: 700; }
            .cert-points { font-size: 16px; color: #374151; font-family: 'Inter', sans-serif; }
            .cert-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px; padding: 0 20px; }
            .sig-line { border-bottom: 1px solid #9ca3af; padding-bottom: 5px; font-size: 22px; font-style: italic; color: #111827; margin-bottom: 5px; width: 220px; text-align: center; }
            .cert-date .sig-line { font-family: 'Inter', sans-serif; font-style: normal; font-size: 16px; }
            .cert-footer span { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-family: 'Inter', sans-serif; font-weight: 600; }
            .cert-seal { width: 110px; height: 110px; border-radius: 50%; background: #fbbf24; border: 3px dashed #b45309; display: grid; place-items: center; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
            .seal-inner { font-size: 14px; font-family: 'Inter', sans-serif; font-weight: 700; color: #b45309; text-transform: uppercase; transform: rotate(-15deg); border-top: 2px solid #b45309; border-bottom: 2px solid #b45309; padding: 3px 0; letter-spacing: 2px; }
            .cert-meta { font-family: 'Inter', sans-serif; font-size: 11px; color: #9ca3af; margin-top: 40px; text-align: center; }
            @media print { body { -webkit-print-color-adjust: exact; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="certificate-wrapper">${content}</div>
          <script>setTimeout(() => window.print(), 500);</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal title={t("certificate")} onClose={onClose} width={850}>
      <div id="certificate-node" className="certificate-wrapper">
        <div className="cert-border-outer">
          <div className="cert-border-inner">
            <div className="cert-header">
              <img src="/logonhomai.jpg" alt="Logo" className="cert-logo" />
              <h2>SkillSprint AI</h2>
            </div>
            
            <div className="cert-body">
              <div className="cert-subtitle">CERTIFICATE OF COMPLETION</div>
              <p className="cert-presented">This is to certify that</p>
              <h1 className="cert-name">{employee.name}</h1>
              <p className="cert-text">has successfully completed the training path</p>
              <h3 className="cert-path-title">{pick(path, "title")}</h3>
              <p className="cert-points">Earning <strong>{path.points || 100}</strong> Points with Excellent Grades</p>
            </div>
            
            <div className="cert-footer">
              <div className="cert-signature">
                <div className="sig-line">SkillSprint Automated System</div>
                <span>Authorized Signature</span>
              </div>
              <div className="cert-seal">
                <div className="seal-inner">CERTIFIED</div>
              </div>
              <div className="cert-date">
                <div className="sig-line">{formatLocalDate(completionDate, locale, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <span>Date Completed</span>
              </div>
            </div>
            <div className="cert-meta">
              Verify at: skillsprint.fourangrybirds.vn/verify/{certId}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-actions" style={{ marginTop: 25, justifyContent: "center" }}>
         <Button onClick={handlePrint}><Download size={16} /> {t("download")} Certificate</Button>
         <Button variant="secondary" onClick={onClose}>{t("close")}</Button>
      </div>
    </Modal>
  );
}
