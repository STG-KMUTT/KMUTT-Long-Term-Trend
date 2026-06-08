import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Bilingual, Lang } from './types'

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
}

const Ctx = createContext<LangCtx>({ lang: 'th', setLang: () => {} })

const STORAGE_KEY = 'kmutt-trend-lang'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'th'
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved === 'en' || saved === 'th' ? saved : 'th'
  })

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = (l: Lang) => {
    window.localStorage.setItem(STORAGE_KEY, l)
    setLangState(l)
  }

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>
}

export function useLang() {
  return useContext(Ctx)
}

export function pick(b: Bilingual, lang: Lang): string {
  return b[lang]
}

// UI strings (not chart-data — those live in JSON)
export const UI = {
  brand_short:    { th: 'มจธ.',                 en: 'KMUTT' },
  brand_long:     { th: 'มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี',
                    en: "King Mongkut's University of Technology Thonburi" },
  page_title:     { th: 'แนวโน้มระยะยาว',         en: 'Long-Term Trends' },
  page_subtitle:  { th: 'ภาพรวมข้อมูลสถาบันย้อนหลัง พ.ศ. 2536-2568',
                    en: 'Institutional data 1993-2025' },
  org_unit:       { th: 'กลุ่มงานวิจัยสถาบันและสารสนเทศ สำนักงานยุทธศาสตร์',
                    en: 'Institutional Research & Information Unit, Strategy Office' },
  prototype_note: { th: 'Prototype — แสดง 20 กราฟ จากสไลด์ต้นฉบับ 22 หน้า',
                    en: 'Prototype — 20 charts drawn from a 22-slide source deck' },
  section: {
    education: { th: 'การศึกษา',  en: 'Education' },
    personnel: { th: 'บุคลากร',    en: 'Personnel' },
    research:  { th: 'งานวิจัยและทรัพย์สินทางปัญญา', en: 'Research & IP' },
    finance:   { th: 'การเงิน',    en: 'Finance' },
  },
  key_takeaway:   { th: 'ประเด็นสำคัญ', en: 'Key takeaway' },
  autonomy_short: { th: 'ม.ในกำกับของรัฐ', en: 'Autonomous univ.' },
  autonomy_full:  { th: 'มจธ. ปรับสถานะเป็นมหาวิทยาลัยในกำกับของรัฐ (พ.ศ. 2541)',
                    en: 'KMUTT became an autonomous university (1998)' },
  methodology:    { th: 'หมายเหตุ',  en: 'Methodology' },
  source:         { th: 'ที่มาข้อมูล', en: 'Source' },
  latest_year:    { th: 'ปีล่าสุด', en: 'Latest year' },
  change_vs_prev: { th: 'เทียบปีก่อน', en: 'vs prev. year' },
  ten_yr_avg:    { th: 'เฉลี่ย 10 ปี', en: '10-yr avg.' },
  peak:           { th: 'จุดสูงสุด',     en: 'Peak' },
  toggle_to_en:   { th: 'EN',          en: 'TH' },
  zoom_hint:      { th: 'ลากแถบด้านล่างเพื่อ zoom ช่วงปี',
                    en: 'Drag the bottom slider to zoom year range' },
  show_methodology: { th: 'ดูหมายเหตุ', en: 'Show methodology' },
  hide_methodology: { th: 'ซ่อนหมายเหตุ', en: 'Hide methodology' },
  unit_people:    { th: 'คน', en: 'people' },
  unit_items:     { th: 'รายการ', en: 'items' },
  unit_programs:  { th: 'สาขา', en: 'programs' },
  unit_percent:   { th: '%', en: '%' },
  unit_million_baht: { th: 'ล้านบาท', en: 'M฿' },
  unit_million_per_person: { th: 'ลบ./คน', en: 'M฿/person' },
  unit_papers_per_person: { th: 'บทความ/คน', en: 'papers/person' },
} as const

export function t(key: keyof typeof UI, lang: Lang): string {
  return (UI[key] as Bilingual)[lang]
}
