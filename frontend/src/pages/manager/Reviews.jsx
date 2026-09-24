import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "../../components/Icons";
import { Card, Badge, SectionHeader, Button } from "../../components/UI";
import { employees } from "../../data/mock";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatLocalDate } from "../../utils/helpers";

const reviews = employees.map((e, i) => ({
  ...e,
  reviewDays: i % 2 === 0 ? 30 : 60,
  due: i % 2 === 0 ? "2026-09-30" : "2026-10-15",
  reviewStatus: e.progress > 80 ? "Ready" : e.progress > 50 ? "In Progress" : "Pending",
}));

export default function Reviews() {
  const nav = useNavigate();
  const { t, tv, locale } = useLanguage();
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("performance_eyebrow")}</span>
          <h1>{t("menu_reviews")}</h1>
          <p>{t("reviews_desc")}</p>
        </div>
      </div>
      <Card>
        <SectionHeader title={t("upcoming_reviews")} subtitle={t("upcoming_reviews_desc")} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>{t("col_employee")}</th><th>{t("col_review_type")}</th><th>{t("col_progress")}</th><th>{t("col_due")}</th><th>{t("col_status")}</th><th /></tr>
            </thead>
            <tbody>
              {reviews.map(r => (
                <tr key={r.id}>
                  <td><div className="person-cell"><div className="avatar small">{r.name.split(" ").map(x => x[0]).join("").slice(0, 2)}</div><strong>{r.name}</strong></div></td>
                  <td>{t("review_n_day", { n: r.reviewDays })}</td>
                  <td>{r.progress}%</td>
                  <td>{formatLocalDate(r.due, locale, { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td><Badge tone={r.reviewStatus === "Ready" ? "green" : r.reviewStatus === "In Progress" ? "purple" : "orange"}>{tv(r.reviewStatus)}</Badge></td>
                  <td><Button variant="ghost" onClick={() => nav(`/manager/team/${r.id}`)}>{t("review_label")} <ArrowUpRight size={14} /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
