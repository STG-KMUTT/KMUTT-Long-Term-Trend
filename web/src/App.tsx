import { LanguageProvider, useLang, UI } from './i18n'
import { LanguageToggle } from './components/LanguageToggle'
import { ChartCard } from './components/ChartCard'
import type { ChartData } from './types'

import studentsNewRaw from './data/students-new.json'
import facultyDegreeRaw from './data/faculty-degree.json'
import patentsRaw from './data/patents.json'

const studentsNew = studentsNewRaw as unknown as ChartData
const facultyDegree = facultyDegreeRaw as unknown as ChartData
const patents = patentsRaw as unknown as ChartData

function Header() {
  const { lang } = useLang()
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-6 px-6 py-6 sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-kmutt-600">
            <span className="inline-block h-2 w-2 rounded-full bg-kmutt-500" />
            {UI.brand_short[lang]} · {UI.org_unit[lang]}
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
            {UI.brand_long[lang]}
            <span className="block text-base font-normal text-slate-500 sm:mt-1">
              {UI.page_title[lang]} — {UI.page_subtitle[lang]}
            </span>
          </h1>
        </div>
        <LanguageToggle />
      </div>
    </header>
  )
}

function PrototypeBanner() {
  const { lang } = useLang()
  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto max-w-6xl px-6 py-2 text-center text-sm text-amber-900">
        {UI.prototype_note[lang]}
      </div>
    </div>
  )
}

function SectionHeader({ id, title }: { id: string; title: string }) {
  return (
    <div className="mb-4 flex items-baseline gap-3" id={id}>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-kmutt-100 text-sm font-semibold text-kmutt-700">
        {id === 'education' ? '1' : id === 'personnel' ? '2' : '3'}
      </span>
      <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h2>
    </div>
  )
}

function Nav() {
  const { lang } = useLang()
  const sections: Array<{ id: 'education' | 'personnel' | 'research' }> = [
    { id: 'education' }, { id: 'personnel' }, { id: 'research' },
  ]
  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 overflow-x-auto px-6 py-3 text-sm font-medium text-slate-600">
        {sections.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="whitespace-nowrap rounded-full px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900"
          >
            <span className="mr-1.5 text-slate-400">{i + 1}.</span>
            {UI.section[s.id][lang]}
          </a>
        ))}
      </div>
    </nav>
  )
}

function Footer() {
  const { lang } = useLang()
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-500">
        <p className="font-medium text-slate-700">{UI.brand_long[lang]}</p>
        <p className="mt-0.5">{UI.org_unit[lang]}</p>
        <p className="mt-3 text-xs">126 Pracha Uthit Road, Bang Mod, Thung Khru, Bangkok 10140 · <a href="https://www.kmutt.ac.th" className="text-kmutt-700 hover:underline">www.kmutt.ac.th</a></p>
      </div>
    </footer>
  )
}

function Dashboard() {
  const { lang } = useLang()
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <PrototypeBanner />
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 space-y-14">
        <section>
          <SectionHeader id="education" title={UI.section.education[lang]} />
          <ChartCard data={studentsNew} kpiSeriesKey="total" unitKey="unit_people" />
        </section>

        <section>
          <SectionHeader id="personnel" title={UI.section.personnel[lang]} />
          <ChartCard data={facultyDegree} kpiSeriesKey="total" unitKey="unit_people" />
        </section>

        <section>
          <SectionHeader id="research" title={UI.section.research[lang]} />
          <ChartCard data={patents} kpiSeriesKey="patent_filed" unitKey="unit_items" />
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <Dashboard />
    </LanguageProvider>
  )
}
