import { LanguageProvider, useLang, UI } from './i18n'
import { LanguageToggle } from './components/LanguageToggle'
import { ChartCard } from './components/ChartCard'
import type { ChartData } from './types'

// — Education
import programsRaw            from './data/programs.json'
import studentsNewRaw         from './data/students-new.json'
import studentsAllRaw         from './data/students-all.json'
import graduatesRaw           from './data/graduates.json'
import employmentBachelorRaw  from './data/employment-bachelor.json'
import employmentGraduateRaw  from './data/employment-graduate.json'

// — Personnel
import staffTotalRaw          from './data/staff-total.json'
import facultyDegreeRaw       from './data/faculty-degree.json'
import staffAcademicSupportRaw from './data/staff-academic-support.json'

// — Research
import researchFundingRaw     from './data/research-funding.json'
import researchFunding3yrRaw  from './data/research-funding-3yr.json'
import researchPerStaffRaw    from './data/research-per-staff.json'
import researchPerStaff3yrRaw from './data/research-per-staff-3yr.json'
import researchPerAcad3yrRaw  from './data/research-per-academic-3yr.json'
import publicationsRaw        from './data/publications.json'
import publications3yrRaw     from './data/publications-3yr.json'
import publicationsPerAcadRaw from './data/publications-per-academic.json'
import patentsRaw             from './data/patents.json'

// — Finance
import incomeExpenseRaw       from './data/income-expense.json'
import incomeExpense3yrRaw    from './data/income-expense-3yr.json'

const cast = (j: unknown) => j as ChartData

const programs            = cast(programsRaw)
const studentsNew         = cast(studentsNewRaw)
const studentsAll         = cast(studentsAllRaw)
const graduates           = cast(graduatesRaw)
const employmentBachelor  = cast(employmentBachelorRaw)
const employmentGraduate  = cast(employmentGraduateRaw)

const staffTotal          = cast(staffTotalRaw)
const facultyDegree       = cast(facultyDegreeRaw)
const staffAcademicSupport = cast(staffAcademicSupportRaw)

const researchFunding     = cast(researchFundingRaw)
const researchFunding3yr  = cast(researchFunding3yrRaw)
const researchPerStaff    = cast(researchPerStaffRaw)
const researchPerStaff3yr = cast(researchPerStaff3yrRaw)
const researchPerAcad3yr  = cast(researchPerAcad3yrRaw)
const publications        = cast(publicationsRaw)
const publications3yr     = cast(publications3yrRaw)
const publicationsPerAcad = cast(publicationsPerAcadRaw)
const patents             = cast(patentsRaw)

const incomeExpense       = cast(incomeExpenseRaw)
const incomeExpense3yr    = cast(incomeExpense3yrRaw)

type SectionId = 'education' | 'personnel' | 'research' | 'finance'

const SECTIONS: SectionId[] = ['education', 'personnel', 'research', 'finance']

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

function SectionHeader({ id, title }: { id: SectionId; title: string }) {
  const idx = SECTIONS.indexOf(id) + 1
  return (
    <div className="mb-6 flex items-baseline gap-3" id={id}>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-kmutt-100 text-sm font-semibold text-kmutt-700">
        {idx}
      </span>
      <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">{title}</h2>
    </div>
  )
}

function Nav() {
  const { lang } = useLang()
  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 overflow-x-auto px-6 py-3 text-sm font-medium text-slate-600">
        {SECTIONS.map((s, i) => (
          <a
            key={s}
            href={`#${s}`}
            className="whitespace-nowrap rounded-full px-3 py-1.5 hover:bg-slate-100 hover:text-slate-900"
          >
            <span className="mr-1.5 text-slate-400">{i + 1}.</span>
            {UI.section[s][lang]}
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
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 space-y-16">

        <section className="space-y-6">
          <SectionHeader id="education" title={UI.section.education[lang]} />
          <ChartCard data={studentsNew}         kpiSeriesKey="total"    unitKey="unit_people" />
          <ChartCard data={studentsAll}         kpiSeriesKey="total"    unitKey="unit_people" />
          <ChartCard data={programs}            kpiSeriesKey="thai"     unitKey="unit_programs" />
          <ChartCard data={graduates}           kpiSeriesKey="total"    unitKey="unit_people" />
          <ChartCard data={employmentBachelor}  kpiSeriesKey="employed" unitKey="unit_percent" />
          <ChartCard data={employmentGraduate}  kpiSeriesKey="employed" unitKey="unit_percent" />
        </section>

        <section className="space-y-6">
          <SectionHeader id="personnel" title={UI.section.personnel[lang]} />
          <ChartCard data={staffTotal}           kpiSeriesKey="total"    unitKey="unit_people" />
          <ChartCard data={facultyDegree}        kpiSeriesKey="total"    unitKey="unit_people" />
          <ChartCard data={staffAcademicSupport} kpiSeriesKey="academic" unitKey="unit_percent" />
        </section>

        <section className="space-y-6">
          <SectionHeader id="research" title={UI.section.research[lang]} />
          <ChartCard data={researchFunding}     kpiSeriesKey="total"                unitKey="unit_million_baht" />
          <ChartCard data={researchFunding3yr}  kpiSeriesKey="total"                unitKey="unit_million_baht" />
          <ChartCard data={researchPerStaff}    kpiSeriesKey="per_active_researcher" unitKey="unit_million_per_person" />
          <ChartCard data={researchPerStaff3yr} kpiSeriesKey="per_active_researcher" unitKey="unit_million_per_person" />
          <ChartCard data={researchPerAcad3yr}  kpiSeriesKey="per_academic"         unitKey="unit_million_per_person" />
          <ChartCard data={publications}        kpiSeriesKey="total"                unitKey="unit_items" />
          <ChartCard data={publications3yr}     kpiSeriesKey="total"                unitKey="unit_items" />
          <ChartCard data={publicationsPerAcad} kpiSeriesKey="per_academic"         unitKey="unit_papers_per_person" />
          <ChartCard data={patents}             kpiSeriesKey="patent_filed"         unitKey="unit_items" />
        </section>

        <section className="space-y-6">
          <SectionHeader id="finance" title={UI.section.finance[lang]} />
          <ChartCard data={incomeExpense}    kpiSeriesKey="revenue" unitKey="unit_million_baht" />
          <ChartCard data={incomeExpense3yr} kpiSeriesKey="revenue" unitKey="unit_million_baht" />
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
