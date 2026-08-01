"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Lang = "en" | "hi";

/**
 * Small hand-rolled i18n. The audience is family — many of whom read Hindi
 * far more comfortably than English — so the shell, navigation and the
 * everyday words are translated. Any key without a Hindi entry simply falls
 * back to English, so adding translations later is incremental and safe.
 */
const HI: Record<string, string> = {
  // navigation
  "nav.dashboard": "मुख्य पृष्ठ",
  "nav.tasks": "कार्य",
  "nav.bookings": "बुकिंग",
  "nav.shopping": "खरीदारी",
  "nav.guests": "मेहमान",
  "nav.sangeet": "संगीत",
  "nav.moments": "यादें",
  "nav.vendors": "विक्रेता",
  "nav.contacts": "संपर्क",
  "nav.invite": "निमंत्रण",
  "nav.activity": "गतिविधि",
  "nav.settings": "सेटिंग्स",
  "nav.celebrations": "समारोह",
  "nav.more": "और",
  "nav.home": "होम",
  "nav.planner": "प्लानर",

  // greetings / countdown
  "greet.morning": "सुप्रभात",
  "greet.afternoon": "नमस्कार",
  "greet.evening": "शुभ संध्या",
  "countdown.daysToGo": "दिन बाकी",
  "countdown.planningComplete": "योजना पूर्ण",
  "countdown.days": "दिन",
  "countdown.hrs": "घंटे",
  "countdown.min": "मिनट",
  "countdown.sec": "सेकंड",
  "countdown.remaining": "शेष",
  "countdown.planned": "योजना",
  "countdown.timeElapsed": "बीता हुआ समय",

  // common actions
  "action.newTask": "नया कार्य",
  "action.addBooking": "बुकिंग जोड़ें",
  "action.shoppingItem": "खरीदारी सूची",
  "action.addGuest": "मेहमान जोड़ें",
  "action.addVendor": "विक्रेता जोड़ें",
  "action.search": "खोजें",
  "action.share": "साझा करें",
  "action.print": "प्रिंट",
  "action.signOut": "साइन आउट",
  "action.save": "सहेजें",
  "action.cancel": "रद्द करें",
  "action.delete": "हटाएँ",
  "action.edit": "बदलें",
  "action.add": "जोड़ें",

  // task status
  "status.not_started": "शुरू नहीं",
  "status.in_progress": "चल रहा है",
  "status.waiting": "प्रतीक्षारत",
  "status.blocked": "रुका हुआ",
  "status.completed": "पूर्ण",
  "status.cancelled": "रद्द",

  // priority
  "priority.critical": "अत्यावश्यक",
  "priority.high": "उच्च",
  "priority.medium": "मध्यम",
  "priority.low": "कम",

  // misc
  "misc.open": "बाकी",
  "misc.done": "पूर्ण",
  "misc.loading": "लोड हो रहा है…",
  "misc.language": "भाषा",
};

const DICTS: Record<Lang, Record<string, string>> = { en: {}, hi: HI };

interface LangValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Translate a key; `fallback` (or the key) is used when untranslated. */
  t: (key: string, fallback?: string) => string;
}

const LangContext = createContext<LangValue | null>(null);
const STORAGE_KEY = "appLang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "hi" || saved === "en") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => DICTS[lang][key] ?? fallback ?? key,
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  const ctx = useContext(LangContext);
  // Safe default so components still render if used outside the provider
  if (!ctx) return { lang: "en", setLang: () => {}, t: (k, f) => f ?? k };
  return ctx;
}
