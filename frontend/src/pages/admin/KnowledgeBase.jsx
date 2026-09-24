import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Upload } from "../../components/Icons";
import { Card, SectionHeader, SearchInput, Badge, EmptyState, Button } from "../../components/UI";
import { useLanguage } from "../../contexts/LanguageContext";
import { useDocuments } from "../../contexts/DocumentsContext";
import { formatLocalDate } from "../../utils/helpers";

export default function KnowledgeBase() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { t, tv, pick, locale } = useLanguage();
  const { activeDocuments, loading } = useDocuments();
  const q = query.trim().toLowerCase();
  // Chỉ phiên bản đang hiệu lực mới là nguồn cho AI (SRS Step 8)
  const filtered = activeDocuments.filter(d => !q || [d.code, d.titleEn, d.title, d.fileName].some(v => v?.toLowerCase().includes(q)));

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("kb_eyebrow")}</span>
          <h1>{t("menu_knowledge_base")}</h1>
          <p>{t("kb_desc")}</p>
        </div>
      </div>
      <div className="toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder={t("search_kb")} />
      </div>
      <Card>
        <SectionHeader title={t("kb_active_count", { n: filtered.length })} subtitle={t("kb_indexed_desc")} />
        {!loading && activeDocuments.length === 0 ? (
          <EmptyState
            title={t("repo_empty_title")}
            description={t("kb_empty_desc")}
            action={<Button onClick={() => navigate("/admin/documents")} icon={<Upload size={16} />}>{t("upload_documents")}</Button>}
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>{t("col_document")}</th><th>{t("col_category")}</th><th>{t("col_version")}</th><th>{t("col_chunks")}</th><th>{t("col_updated")}</th></tr></thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}>
                    <td><div className="table-primary"><span className="file-icon"><FileText size={16} /></span><div><strong>{d.code} · {pick(d, "title")}</strong><span className="cell-sub">{d.fileName}</span></div></div></td>
                    <td>{tv(d.category)}</td>
                    <td><Badge tone="default">v{d.version}</Badge></td>
                    <td title={t("processing_pending_hint")}><Badge tone="orange">{t("processing_pending")}</Badge></td>
                    <td>{formatLocalDate(d.uploadedAt.slice(0, 10), locale, { day: "2-digit", month: "short", year: "numeric" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
