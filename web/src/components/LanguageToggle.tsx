import { useLang } from '../i18n'

export function LanguageToggle() {
  const { lang, setLang } = useLang()
  return (
    <div className="inline-flex items-center rounded-full border border-slate-300 bg-white p-0.5 text-sm shadow-sm">
      <button
        type="button"
        onClick={() => setLang('th')}
        className={
          'rounded-full px-3 py-1 font-medium transition ' +
          (lang === 'th'
            ? 'bg-kmutt-500 text-white shadow'
            : 'text-slate-600 hover:text-slate-900')
        }
        aria-pressed={lang === 'th'}
      >
        ไทย
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={
          'rounded-full px-3 py-1 font-medium transition ' +
          (lang === 'en'
            ? 'bg-kmutt-500 text-white shadow'
            : 'text-slate-600 hover:text-slate-900')
        }
        aria-pressed={lang === 'en'}
      >
        EN
      </button>
    </div>
  )
}
