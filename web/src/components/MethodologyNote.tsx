import { useState } from 'react'
import type { ChartData } from '../types'
import { useLang, UI } from '../i18n'

export function MethodologyNote({ data }: { data: ChartData }) {
  const { lang } = useLang()
  const [open, setOpen] = useState(false)

  return (
    <div className="border-t border-slate-100 pt-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-kmutt-700 hover:text-kmutt-800"
        aria-expanded={open}
      >
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        {open ? UI.hide_methodology[lang] : UI.show_methodology[lang]}
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
          <div>
            <div className="mb-1 font-semibold text-slate-700">{UI.methodology[lang]}</div>
            <p>{data.methodology[lang]}</p>
          </div>
          <div>
            <div className="mb-1 font-semibold text-slate-700">{UI.source[lang]}</div>
            <p>{data.source[lang]}</p>
          </div>
        </div>
      )}
    </div>
  )
}
