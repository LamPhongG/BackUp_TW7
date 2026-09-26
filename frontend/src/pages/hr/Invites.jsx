import { useCallback, useEffect, useState } from "react";
import { Check, CircleAlert, Clock, Copy, Link2, Mail, Plus, RefreshCw, Trash2, Users } from "../../components/Icons";
import { Badge, Button, Card, EmptyState, Modal, SectionHeader, StatCard, Toast } from "../../components/UI";
import { apiRequest, backendEnabled } from "../../services/apiClient";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatDateTime } from "../../utils/helpers";

const STATUS_TONE = { valid: "green", used: "blue", expired: "orange" };
const EMPTY_FORM = { invited_email: "", department_code: "", job_position_id: "", expires_in_days: 7, note: "" };

function statusOf(invite) {
  if (invite.used_at) return "used";
  return invite.is_valid ? "valid" : "expired";
}

export default function HrInvites() {
  const { t, lang, locale } = useLanguage();
  const [invites, setInvites] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(backendEnabled());
  const [loadError, setLoadError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [busyToken, setBusyToken] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [inviteRows, departmentRows, positionRows] = await Promise.all([
        apiRequest("/invite"), apiRequest("/departments"), apiRequest("/job-positions"),
      ]);
      setInvites(inviteRows);
      setDepartments(departmentRows);
      setPositions(positionRows);
    } catch (err) {
      setLoadError(err.code || "err_network");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (backendEnabled()) load();
  }, [load]);

  if (!backendEnabled()) {
    return (
      <Card>
        <EmptyState title={t("invites_title")} description={t("invites_needs_backend")} />
      </Card>
    );
  }

  const name = item => (lang === "en" ? item.name_en : item.name);
  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const copyLink = async (invite) => {
    try {
      await navigator.clipboard.writeText(invite.register_url);
      setCopiedToken(invite.token);
      setToast(t("invites_copied"));
    } catch {
      setToast(t("invites_copy_failed"));
    }
  };

  const create = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const invite = await apiRequest("/invite", {
        method: "POST",
        body: { ...form, invited_email: form.invited_email.trim() || null, note: form.note.trim() || null,
          expires_in_days: Number(form.expires_in_days) },
      });
      setInvites(rows => [invite, ...rows]);
      setModalOpen(false);
      setForm(EMPTY_FORM);
      if (!invite.invited_email) setToast(t("invites_created"));
      else setToast(t(invite.email_sent ? "invites_email_sent" : "invites_email_not_sent", { email: invite.invited_email }));
    } catch (err) {
      setToast(t(err.code || "err_network"));
    } finally {
      setCreating(false);
    }
  };

  const revoke = async (invite) => {
    if (!window.confirm(t("invites_revoke_confirm"))) return;
    setBusyToken(invite.token);
    try {
      await apiRequest(`/invite/${invite.token}`, { method: "DELETE" });
      setInvites(rows => rows.map(row => (row.token === invite.token ? { ...row, is_valid: false } : row)));
      setToast(t("invites_revoked"));
    } catch (err) {
      setToast(t(err.code || "err_network"));
    } finally {
      setBusyToken(null);
    }
  };

  const counts = { valid: 0, used: 0, expired: 0 };
  invites.forEach(invite => { counts[statusOf(invite)] += 1; });
  const positionOptions = positions.filter(p => p.department_code === form.department_code);

  return (
    <div>
      <div className="page-heading">
        <div>
          <span className="eyebrow">HR</span>
          <h1>{t("invites_title")}</h1>
          <p>{t("invites_subtitle")}</p>
        </div>
        <div className="heading-actions">
          <Button variant="secondary" onClick={load} icon={<RefreshCw size={16} />}>{t("invites_refresh")}</Button>
          <Button onClick={() => setModalOpen(true)} icon={<Plus size={16} />}>{t("invites_new")}</Button>
        </div>
      </div>

      <div className="stat-grid invite-stats">
        <StatCard label={t("invites_status_valid")} value={counts.valid} icon={Users} tone="green" />
        <StatCard label={t("invites_status_used")} value={counts.used} icon={Check} tone="blue" />
        <StatCard label={t("invites_status_expired")} value={counts.expired} icon={Clock} tone="orange" />
      </div>

      <Card>
        <SectionHeader title={t("invites_list")} subtitle={t("invites_list_hint")} />
        {loading && <p className="cell-sub">{t("invites_loading")}</p>}
        {!loading && loadError && (
          <div className="notice notice--danger"><CircleAlert size={16} /><span>{t(loadError)}</span></div>
        )}
        {!loading && !loadError && invites.length === 0 && (
          <EmptyState title={t("invites_empty")} description={t("invites_empty_hint")}
            action={<Button onClick={() => setModalOpen(true)} icon={<Plus size={16} />}>{t("invites_new")}</Button>} />
        )}
        {!loading && invites.length > 0 && (
          <ul className="invite-list">
            {invites.map(invite => {
              const status = statusOf(invite);
              return (
                <li key={invite.token} className={`invite-item invite-item--${status}`}>
                  <div className="invite-item__info">
                    <div className="invite-item__top">
                      <Badge tone={STATUS_TONE[status]}>{t(`invites_status_${status}`)}</Badge>
                      <strong>{lang === "en" ? invite.job_position_name_en : invite.job_position_name}</strong>
                      <span className="cell-sub">{lang === "en" ? invite.department_name_en : invite.department_name}</span>
                    </div>
                    {invite.invited_email && <div className="invite-item__line"><Mail size={13} /> {invite.invited_email}</div>}
                    <code className="invite-item__url">{invite.register_url}</code>
                    <div className="invite-item__line">
                      {status === "used"
                        ? t("invites_used_on", { date: formatDateTime(invite.used_at, locale) })
                        : t("invites_expires_on", { date: formatDateTime(invite.expires_at, locale) })}
                      {invite.note && <> · <em>{invite.note}</em></>}
                    </div>
                  </div>
                  {status === "valid" && (
                    <div className="invite-item__actions">
                      <button type="button" className="icon-btn" title={t("invites_copy")} aria-label={t("invites_copy")}
                        onClick={() => copyLink(invite)}>
                        {copiedToken === invite.token ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                      <button type="button" className="icon-btn invite-revoke" title={t("invites_revoke")} aria-label={t("invites_revoke")}
                        onClick={() => revoke(invite)} disabled={busyToken === invite.token}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal open={modalOpen} title={t("invites_new")} onClose={() => setModalOpen(false)} width="520px">
        <form onSubmit={create} className="form-grid invite-form">
          <label>{t("invites_department")}
            <select required value={form.department_code}
              onChange={e => setForm(f => ({ ...f, department_code: e.target.value, job_position_id: "" }))}>
              <option value="">{t("invites_choose")}</option>
              {departments.map(d => <option key={d.code} value={d.code}>{name(d)}</option>)}
            </select>
          </label>
          <label>{t("invites_position")}
            <select required value={form.job_position_id} disabled={!form.department_code}
              onChange={e => set("job_position_id", e.target.value)}>
              <option value="">{t("invites_choose")}</option>
              {positionOptions.map(p => <option key={p.id} value={p.id}>{name(p)}</option>)}
            </select>
          </label>
          <label>{t("invites_email")}
            <input type="email" placeholder="name@fourangrybirds.vn" value={form.invited_email}
              onChange={e => set("invited_email", e.target.value)} />
          </label>
          <label>{t("invites_days")}
            <input type="number" min={1} max={30} value={form.expires_in_days}
              onChange={e => set("expires_in_days", e.target.value)} />
          </label>
          <label>{t("invites_note")}
            <textarea maxLength={500} value={form.note} onChange={e => set("note", e.target.value)} />
          </label>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={creating || !form.job_position_id}
              icon={form.invited_email ? <Mail size={16} /> : <Link2 size={16} />}>
              {t(creating ? "invites_creating" : form.invited_email ? "invites_create_send" : "invites_create")}
            </Button>
          </div>
        </form>
      </Modal>

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
