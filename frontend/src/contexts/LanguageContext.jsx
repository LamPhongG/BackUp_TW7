import { createContext, useContext, useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { en } from "../locales/en";
import { vi } from "../locales/vi";

const translations = { en, vi };
const SUPPORTED = Object.keys(translations);
const DEFAULT_LANG = "vi";
const FALLBACK_LANG = "en";
const STORAGE_KEY = "app_lang";

const readStoredLang = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(stored) ? stored : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Storage bị chặn (private mode...) — vẫn chạy bình thường, chỉ không lưu lựa chọn
    }
  }, [lang]);

  // t("key", { name: "Alex" }) — thay {name} trong chuỗi; thiếu bản dịch thì lấy tiếng Anh, cuối cùng mới trả về key
  const t = useCallback((key, vars) => {
    let text = translations[lang]?.[key] ?? translations[FALLBACK_LANG][key] ?? key;
    if (vars) {
      text = text.replace(/\{(\w+)\}/g, (match, name) => (vars[name] ?? match));
    }
    return text;
  }, [lang]);

  // Như t() nhưng giá trị có thể là phần tử React: tNode("key", { count: <strong>2</strong> })
  const tNode = useCallback((key, vars = {}) => {
    const parts = t(key).split(/\{(\w+)\}/);
    return parts.map((part, i) => (i % 2 === 1 ? <Fragment key={i}>{vars[part] ?? `{${part}}`}</Fragment> : part));
  }, [t]);

  // Dịch giá trị dữ liệu (trạng thái, phòng ban...): tv("On Track") → key "v_on_track"; không có key thì giữ nguyên
  const tv = useCallback((value) => {
    if (value == null) return "";
    const key = `v_${String(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
    return translations[lang]?.[key] ?? translations[FALLBACK_LANG][key] ?? value;
  }, [lang]);

  const toggleLanguage = useCallback(() => {
    setLang(prev => (prev === "vi" ? "en" : "vi"));
  }, []);

  // Chọn field theo ngôn ngữ cho dữ liệu song ngữ: pick(item, "title") → item.titleEn khi lang = en
  const pick = useCallback((item, field) => {
    if (!item) return "";
    if (lang === "en") return item[`${field}En`] ?? item[field];
    return item[field];
  }, [lang]);

  const locale = lang === "vi" ? "vi-VN" : "en-US";

  const value = useMemo(
    () => ({ lang, locale, t, tNode, tv, pick, toggleLanguage, setLang }),
    [lang, locale, t, tNode, tv, pick, toggleLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside <LanguageProvider>");
  return ctx;
};

export function LanguageToggle({ style }) {
  const { lang, toggleLanguage } = useLanguage();
  return (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={toggleLanguage}
      aria-label={lang === "vi" ? "Switch to English" : "Chuyển sang tiếng Việt"}
      style={{ height: 34, padding: "0 10px", fontSize: 13, ...style }}
    >
      {lang === "vi" ? "🇬🇧 EN" : "🇻🇳 VN"}
    </button>
  );
}
