import type { Bilingual, ChartData } from '../types'
import { useLang, UI } from '../i18n'

interface Props {
  data: ChartData
  /** key of the series to highlight, defaults to first series */
  seriesKey?: string
  unitKey?: keyof typeof UI
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return n.toLocaleString('en-US', { maximumFractionDigits: 1 })
}

export function KpiCard({ data, seriesKey, unitKey }: Props) {
  const { lang } = useLang()
  const series = seriesKey
    ? data.series.find(s => s.key === seriesKey) ?? data.series[0]
    : data.series[0]

  const values = series.values
  const lastIdx = (() => {
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i] !== null && values[i] !== undefined) return i
    }
    return -1
  })()
  const last = lastIdx >= 0 ? values[lastIdx] : null
  const prev = lastIdx > 0 ? values[lastIdx - 1] : null
  const delta = last !== null && prev !== null && prev !== 0
    ? ((last - prev) / prev) * 100
    : null
  const peak = values.reduce<number>((m, v) => (v !== null && v > m ? v : m), -Infinity)
  const peakIdx = values.findIndex(v => v === peak)
  const lastYearTh = data.categories_buddhist[lastIdx]
  const lastYearLabel = lang === 'th'
    ? lastYearTh
    : (lastYearTh && !lastYearTh.includes('-') ? String(Number(lastYearTh) - 543) : lastYearTh)
  const peakYearTh = peakIdx >= 0 ? data.categories_buddhist[peakIdx] : null
  const peakYearLabel = peakYearTh
    ? (lang === 'th' ? peakYearTh : (peakYearTh.includes('-') ? peakYearTh : String(Number(peakYearTh) - 543)))
    : null

  const unit = unitKey ? (UI[unitKey] as Bilingual)[lang] : ''
  const deltaColor = delta === null
    ? 'text-slate-400'
    : delta >= 0
      ? 'text-emerald-600'
      : 'text-rose-600'
  const deltaSign = delta === null ? '' : delta >= 0 ? '+' : ''

  return (
    <div className="grid grid-cols-3 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className="text-xs uppercase tracking-wider text-slate-500">
          {series.name[lang]} · {UI.latest_year[lang]} {lastYearLabel}
        </div>
        <div className="mt-1 font-display text-3xl font-semibold text-slate-900 tabular-nums">
          {fmt(last)}
          {unit && <span className="ml-1 text-base font-normal text-slate-500">{unit}</span>}
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-slate-500">{UI.change_vs_prev[lang]}</div>
        <div className={`mt-1 font-display text-3xl font-semibold tabular-nums ${deltaColor}`}>
          {delta === null ? '—' : `${deltaSign}${delta.toFixed(1)}%`}
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-slate-500">
          {UI.peak[lang]}{peakYearLabel ? ` · ${peakYearLabel}` : ''}
        </div>
        <div className="mt-1 font-display text-3xl font-semibold text-slate-900 tabular-nums">
          {peak === -Infinity ? '—' : fmt(peak)}
        </div>
      </div>
    </div>
  )
}
