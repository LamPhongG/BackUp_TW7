import { useState } from "react";
import { FileText } from "./Icons";
import { useLanguage } from "../contexts/LanguageContext";

/**
 * Source Traceability Badge
 * Hiển thị nhãn nguồn trích dẫn với tooltip chi tiết
 * Ví dụ: <SourceBadge doc="SOP-07" section="§4.2" page={12} />
 */
export default function SourceBadge({ doc, section, page, inline = false }) {
  const [show, setShow] = useState(false);
  const { t } = useLanguage();

  return (
    <span
      className={`source-badge ${inline ? "source-badge--inline" : ""}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <FileText size={10} />
      <span>{doc}{section ? ` · ${section}` : ""}</span>
      {show && (
        <span className="source-tooltip">
          <span className="source-tooltip__title">{t("source_title")}</span>
          <span className="source-tooltip__doc">{doc}</span>
          {section && <span className="source-tooltip__row"><b>{t("source_section")}</b> {section}</span>}
          {page && <span className="source-tooltip__row"><b>{t("source_page")}</b> {page}</span>}
          <span className="source-tooltip__note">{t("source_note")}</span>
        </span>
      )}
    </span>
  );
}

