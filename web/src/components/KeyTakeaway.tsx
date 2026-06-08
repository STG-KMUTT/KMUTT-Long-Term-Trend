import type { ChartData } from '../types'
import { useLang, UI } from '../i18n'
import { TAKEAWAYS } from '../data/takeaways'

/** Editorial "Key takeaway" callout for a chart.
 *
 *  Source priority, per language:
 *    1. data.key_takeaway[lang] — edited in the 📝 TAKEAWAYS tab in Sheets
 *    2. TAKEAWAYS[data.id][lang] — authored fallback in data/takeaways.ts
 *  Renders nothing if neither has text for the active language. */
export function KeyTakeaway({ data }: { data: ChartData }) {
  const { lang } = useLang()
  const fromSheet = data.key_takeaway?.[lang]?.trim()
  const fallback = TAKEAWAYS[data.id]?.[lang]?.trim()
  const text = fromSheet || fallback
  if (!text) return null

  return (
    <div className="flex gap-3 rounded-xl border border-kmutt-100 bg-kmutt-50/60 p-4">
      <span aria-hidden="true" className="mt-0.5 text-lg leading-none">💡</span>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-kmutt-700">
          {UI.key_takeaway[lang]}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-700">
          {text}
        </p>
      </div>
    </div>
  )
}
