import type { ChartData } from '../types'
import { useLang } from '../i18n'
import { Chart } from './Chart'
import { KpiCard } from './KpiCard'
import { KeyTakeaway } from './KeyTakeaway'
import { MethodologyNote } from './MethodologyNote'
import type { UI } from '../i18n'

interface Props {
  data: ChartData
  kpiSeriesKey?: string
  unitKey?: keyof typeof UI
}

export function ChartCard({ data, kpiSeriesKey, unitKey }: Props) {
  const { lang } = useLang()
  return (
    <article className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header>
        <h3 className="text-xl font-semibold text-slate-900">
          {data.title[lang]}
        </h3>
        <p className="mt-1 text-sm text-slate-500">{data.subtitle[lang]}</p>
      </header>
      <KpiCard data={data} seriesKey={kpiSeriesKey} unitKey={unitKey} />
      <Chart data={data} />
      <KeyTakeaway data={data} />
      <MethodologyNote data={data} />
    </article>
  )
}
