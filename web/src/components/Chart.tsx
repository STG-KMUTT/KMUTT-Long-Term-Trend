import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption, LineSeriesOption, BarSeriesOption } from 'echarts'
import type { ChartData, Lang } from '../types'
import { useLang } from '../i18n'

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

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      notMerge={true}
      lazyUpdate={false}
      opts={{ renderer: 'canvas' }}
    />
  )
}
