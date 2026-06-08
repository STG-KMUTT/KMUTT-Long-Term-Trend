import { useEffect, useMemo, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption, LineSeriesOption, BarSeriesOption, ECharts } from 'echarts'
import type { ChartData, Lang } from '../types'
import { useLang, UI } from '../i18n'

/** B.E. year KMUTT became Thailand's first autonomous public university
 *  (มหาวิทยาลัยในกำกับของรัฐ), per พ.ร.บ. มจธ. พ.ศ. 2541. */
const AUTONOMY_YEAR_BE = '2541'

interface Props {
  data: ChartData
  height?: number
}

function yearLabel(buddhist: string, lang: Lang): string {
  if (lang === 'th') return buddhist
  // Handle ranges like "2538-2548"
  if (buddhist.includes('-')) {
    const [a, b] = buddhist.split('-')
    return `${Number(a) - 543}-${Number(b) - 543}`
  }
  const n = Number(buddhist)
  return Number.isFinite(n) ? String(n - 543) : buddhist
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return n.toLocaleString('en-US', { maximumFractionDigits: 1 })
}

export function Chart({ data, height = 380 }: Props) {
  const { lang } = useLang()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const instanceRef = useRef<ECharts | null>(null)

  const option = useMemo<EChartsOption>(() => {
    const cats = data.categories_buddhist.map(c => yearLabel(c, lang))
    const stackName = data.chart_type === 'stacked-bar' ? 'main' : undefined
    const fontFamily = lang === 'th'
      ? "'Sarabun', 'Inter', system-ui, sans-serif"
      : "'Inter', 'Sarabun', system-ui, sans-serif"

    const series: (LineSeriesOption | BarSeriesOption)[] = data.series.map((s) => {
      const isCumulative = !!s.is_cumulative
      const excludeStack = !!s.exclude_from_stack
      const useLine =
        data.chart_type === 'line' ||
        (data.chart_type === 'stacked-bar' && excludeStack) ||
        (data.chart_type === 'clustered-bar' && isCumulative)
      const lineWidth = s.emphasis ? 3.5 : 2
      const symbolSize = s.emphasis ? 8 : 6

      if (useLine) {
        return {
          name: s.name[lang],
          type: 'line',
          smooth: false,
          symbol: 'circle',
          symbolSize,
          lineStyle: { width: lineWidth },
          itemStyle: { color: s.color },
          data: s.values,
          yAxisIndex: isCumulative ? 1 : 0,
          z: s.emphasis ? 3 : 2,
        } satisfies LineSeriesOption
      }
      return {
        name: s.name[lang],
        type: 'bar',
        stack: stackName,
        itemStyle: { color: s.color, borderRadius: stackName ? 0 : 3 },
        data: s.values,
        barMaxWidth: 28,
      } satisfies BarSeriesOption
    })

    // Vertical divider marking the year KMUTT became an autonomous university.
    // Only drawn on charts whose timeline contains that exact year (the 3-year
    // "bucket" charts use ranges like "2539-2541", so indexOf skips them — a
    // line on a smoothed bucket boundary would be ambiguous).
    const autonomyIdx = data.categories_buddhist.indexOf(AUTONOMY_YEAR_BE)
    if (autonomyIdx >= 0 && series.length > 0) {
      const markLine: LineSeriesOption['markLine'] = {
        symbol: 'none',
        silent: true,
        lineStyle: { type: 'dashed', color: '#94a3b8', width: 1.5 },
        label: {
          show: true,
          // Single horizontal line that HANGS DOWN from just below the top end
          // of the divider, fully inside the plot. 'insideEndBottom' keeps it
          // clear of the top edge/legend, so it isn't clipped (insideEndTop sat
          // on the grid boundary and the upper half got cut off). The line sits
          // on the 2541/1998 tick, which is always in the early years, so
          // left-aligning never overflows the right edge.
          position: 'insideEndBottom',
          align: 'left',
          rotate: 0,
          formatter: () => UI.autonomy_short[lang],
          fontFamily,
          fontSize: 11,
          fontWeight: 'bold',
          color: '#475569',
          lineHeight: 16,
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          borderRadius: 4,
          padding: [3, 7],
        },
        data: [{ xAxis: cats[autonomyIdx] }],
      }
      series[0] = { ...series[0], markLine }
    }

    const hasCumulative =
      data.chart_type === 'clustered-bar' &&
      data.series.some(s => s.is_cumulative)

    const opt: EChartsOption = {
      animationDuration: 350,
      animationDurationUpdate: 200,
      textStyle: { fontFamily },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderWidth: 0,
        textStyle: { color: '#f8fafc', fontFamily },
        formatter: (params) => {
          const arr = Array.isArray(params) ? params : [params]
          if (!arr.length) return ''
          const first = arr[0] as { axisValueLabel?: string; name?: string }
          const yr = first.axisValueLabel ?? first.name ?? ''
          const rows = arr
            .filter(p => p.value !== null && p.value !== undefined)
            .map(p => {
              const marker = `<span style="display:inline-block;margin-right:6px;width:9px;height:9px;border-radius:50%;background:${p.color}"></span>`
              return `<div style="display:flex;justify-content:space-between;gap:18px">
                <span>${marker}${p.seriesName}</span>
                <span style="font-variant-numeric:tabular-nums;font-weight:600">${fmt(p.value as number)}</span>
              </div>`
            })
            .join('')
          return `<div style="font-weight:600;margin-bottom:4px">${yr}</div>${rows}`
        },
      },
      legend: {
        top: 0,
        type: 'scroll',
        textStyle: { fontFamily, color: '#475569' },
        itemGap: 16,
      },
      grid: {
        left: 56,
        right: hasCumulative ? 56 : 16,
        top: 44,
        bottom: 64,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: cats,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#475569',
          fontFamily,
          interval: cats.length > 18 ? 'auto' : 0,
          rotate: cats.length > 22 ? 30 : 0,
        },
      },
      yAxis: hasCumulative
        ? [
            {
              type: 'value',
              axisLabel: { color: '#475569', fontFamily, formatter: (v: number) => fmt(v) },
              splitLine: { lineStyle: { color: '#e2e8f0' } },
            },
            {
              type: 'value',
              position: 'right',
              axisLabel: { color: '#94a3b8', fontFamily, formatter: (v: number) => fmt(v) },
              splitLine: { show: false },
            },
          ]
        : {
            type: 'value',
            axisLabel: { color: '#475569', fontFamily, formatter: (v: number) => fmt(v) },
            splitLine: { lineStyle: { color: '#e2e8f0' } },
          },
      dataZoom: cats.length > 12
        ? [
            { type: 'inside', start: 0, end: 100 },
            {
              type: 'slider',
              height: 18,
              bottom: 8,
              start: 0,
              end: 100,
              borderColor: 'transparent',
              backgroundColor: '#f1f5f9',
              fillerColor: 'rgba(242, 148, 0, 0.18)',
              handleStyle: { color: '#f29400' },
              moveHandleStyle: { color: '#f29400' },
              selectedDataBackground: { lineStyle: { color: '#f29400' }, areaStyle: { color: 'rgba(242,148,0,0.15)' } },
              textStyle: { fontFamily, color: '#64748b' },
            },
          ]
        : undefined,
      series,
    }
    return opt
  }, [data, lang])

  // Init + dispose ECharts on mount/unmount. echarts-for-react@3 broke against
  // ECharts@6 + React@19 (instance is created but setOption is never called),
  // so we drive echarts directly. The wrapper has explicit width/height before
  // init so the canvas is sized correctly on first paint.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const inst = echarts.init(el, undefined, { renderer: 'canvas' })
    instanceRef.current = inst
    const ro = new ResizeObserver(() => inst.resize())
    ro.observe(el)
    return () => {
      ro.disconnect()
      inst.dispose()
      instanceRef.current = null
    }
  }, [])

  useEffect(() => {
    instanceRef.current?.setOption(option, true)
  }, [option])

  return <div ref={containerRef} style={{ width: '100%', height }} />
}
