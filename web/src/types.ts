export type Lang = 'th' | 'en'

export interface Bilingual {
  th: string
  en: string
}

export interface ChartSeries {
  key: string
  name: Bilingual
  color: string
  values: (number | null)[]
  emphasis?: boolean
  exclude_from_stack?: boolean
  is_cumulative?: boolean
}

export type ChartType = 'line' | 'stacked-bar' | 'clustered-bar'

export interface ChartData {
  id: string
  section: 'education' | 'personnel' | 'research' | 'finance'
  chart_type: ChartType
  title: Bilingual
  subtitle: Bilingual
  categories_buddhist: string[]
  series: ChartSeries[]
  methodology: Bilingual
  source: Bilingual
  /** Editorial "Key takeaway", sourced from the 📝 TAKEAWAYS tab in Sheets.
   *  Optional: when absent or blank, the UI falls back to the authored
   *  defaults in data/takeaways.ts. */
  key_takeaway?: Bilingual
}
