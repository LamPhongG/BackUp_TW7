import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Play } from "../../components/Icons";
import { Card, Badge, ProgressBar, SearchInput, Button } from "../../components/UI";
import { modules } from "../../data/mock";
import { useLanguage } from "../../contexts/LanguageContext";

const FILTERS = ["All", "In Progress", "Not Started", "Completed"];

export default function LearningModules() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const navigate = useNavigate();
  const { t, tv, pick } = useLanguage();
  const filtered = modules.filter(
    m => pick(m, "title").toLowerCase().includes(query.toLowerCase()) && (filter === "All" || m.status === filter)
  );
  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("learning_eyebrow")}</span>
          <h1>{t("learning_title")}</h1>
          <p>{t("learning_desc")}</p>
        </div>
      </div>
      <div className="toolbar">
        <SearchInput value={query} onChange={setQuery} placeholder={t("search_modules")} />
        <div className="filter-tabs">
          {FILTERS.map(x => (
            <button className={filter === x ? "active" : ""} key={x} onClick={() => setFilter(x)}>{x === "All" ? t("filter_all") : tv(x)}</button>
          ))}
        </div>
      </div>
      <div className="module-grid">
        {filtered.map(m => (
          <Card className="module-card" key={m.id}>
            <div className="module-cover">
              <span>{tv(m.category)}</span><BookOpen size={28} />
            </div>
            <div className="module-card-body">
              <Badge tone={m.status === "Completed" ? "green" : m.status === "In Progress" ? "purple" : "default"}>{tv(m.status)}</Badge>
              <h3>{pick(m, "title")}</h3>
              <p>{t("lessons_count", { n: m.lessons })} · {t("min_n", { n: m.duration })}</p>
              <ProgressBar value={m.progress} showValue />
              <small className="source">{t("source_prefix")} {m.source}</small>
              <Button variant={m.progress ? "primary" : "secondary"} onClick={() => navigate(`/employee/learning/${m.id}`)} icon={<Play size={15} />}>
                {m.progress ? t("continue") : t("start_module")}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
