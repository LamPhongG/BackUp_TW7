import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ArrowUpRight } from "../../components/Icons";
import { Card, Badge, SectionHeader, SearchInput, ProgressBar, Button } from "../../components/UI";
import { employees } from "../../data/mock";
import { useLanguage } from "../../contexts/LanguageContext";
import { needsAttention, progressTone } from "../../utils/helpers";

export default function Team() {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const { t, tv } = useLanguage();
  const list = employees.filter(e =>
    e.name.toLowerCase().includes(q.toLowerCase()) || e.role.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("nav_manager_workspace")}</span>
          <h1>{t("menu_team")}</h1>
          <p>{t("team_desc")}</p>
        </div>
      </div>
      <div className="stat-grid">
        <Card className="mini-stat"><Users size={20} /><div><strong>{employees.length}</strong><span>{t("team_members")}</span></div></Card>
        <Card className="mini-stat"><div className="mini-dot green" /><div><strong>{employees.filter(e => e.status === "On Track").length}</strong><span>{tv("On Track")}</span></div></Card>
        <Card className="mini-stat"><div className="mini-dot orange" /><div><strong>{employees.filter(e => needsAttention(e.status)).length}</strong><span>{t("needs_attention")}</span></div></Card>
      </div>
      <Card>
        <SectionHeader title={t("team_progress")} action={<SearchInput value={q} onChange={setQ} placeholder={t("search_people")} />} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>{t("col_employee")}</th><th>{t("col_role")}</th><th>{t("col_progress")}</th><th>{t("col_status")}</th><th>{t("col_manager")}</th><th /></tr></thead>
            <tbody>
              {list.map(e => (
                <tr key={e.id}>
                  <td><div className="person-cell"><div className="avatar small">{e.name.split(" ").map(x => x[0]).join("").slice(0, 2)}</div><strong>{e.name}</strong></div></td>
                  <td>{e.role}</td>
                  <td><div className="progress-cell"><ProgressBar value={e.progress} /><span>{e.progress}%</span></div></td>
                  <td><Badge tone={progressTone(e.status)}>{tv(e.status)}</Badge></td>
                  <td>{e.manager}</td>
                  <td><Button variant="ghost" onClick={() => nav(`/manager/team/${e.id}`)}>{t("view")} <ArrowUpRight size={14} /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
