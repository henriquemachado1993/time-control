"use client";

import { useEffect, useRef, useState } from "react";
import { formatHours } from "@/lib/hours";
import type { ChartPoint, ChartSeries } from "../lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
export function Legend({ series, reference }: { series: ChartSeries[]; reference?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {series.map(item => <span key={item.label} className="inline-flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: item.color }} aria-hidden="true" />{item.label}</span>)}
      {reference && <span className="inline-flex items-center gap-2"><span className="w-4 border-t border-dashed border-current" aria-hidden="true" />{reference}</span>}
    </div>
  );
}

export function DurationChart({ points, series, label, referenceMinutes }: {
  points: ChartPoint[];
  series: ChartSeries[];
  label: string;
  referenceMinutes?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(720);
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const width = Math.max(points.length > 10 ? 620 : 240, Math.floor(containerWidth));
  const height = 236;
  const left = 46;
  const top = 12;
  const bottom = 202;
  const plotWidth = width - left - 12;
  const maximum = Math.max(referenceMinutes ?? 0, ...points.flatMap(point => point.values), 1);
  const tickUnit = maximum <= 4 ? 1 : maximum <= 30 ? 5 : maximum <= 120 ? 15 : maximum <= 1440 ? 60 : 240;
  const maxMinutes = Math.ceil(maximum / (4 * tickUnit)) * 4 * tickUnit;
  const y = (value: number) => bottom - (value / maxMinutes) * (bottom - top);
  const slot = plotWidth / points.length;
  const barWidth = Math.min(series.length === 1 ? 13 : 20, slot / (series.length + 2));

  return (
    <>
      <div ref={containerRef} className="overflow-x-auto overscroll-x-contain py-2">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} className={`w-full ${points.length > 10 ? "min-w-[620px]" : "min-w-[240px]"}`}>
          {[0, 1, 2, 3, 4].map(tick => {
            const value = maxMinutes * tick / 4;
            const tickLabel = value % 60 === 0 ? `${value / 60}h` : value < 60 ? `${value}m` : `${Math.floor(value / 60)}h${value % 60}`;
            return <g key={tick}><line x1={left} x2={width - 12} y1={y(value)} y2={y(value)} stroke="var(--color-chart-grid)" /><text x={left - 10} y={y(value) + 5} textAnchor="end" fontSize="14" fill="var(--color-text-secondary)">{tickLabel}</text></g>;
          })}
          {referenceMinutes !== undefined && <line x1={left} x2={width - 12} y1={y(referenceMinutes)} y2={y(referenceMinutes)} stroke="var(--color-text-secondary)" strokeDasharray="5 5" />}
          {points.map((point, index) => {
            const center = left + slot * (index + 0.5);
            const groupWidth = series.length * barWidth + (series.length - 1) * 3;
            return <g key={point.description}>
              {point.values.map((value, seriesIndex) => <rect key={series[seriesIndex].label} x={center - groupWidth / 2 + seriesIndex * (barWidth + 3)} y={y(value)} width={barWidth} height={bottom - y(value)} rx="3" fill={series[seriesIndex].color}><title>{point.description}: {series[seriesIndex].label.toLowerCase()}, {formatHours(value / 60)}</title></rect>)}
              {(points.length <= 10 || index === 0 || (index + 1) % 5 === 0 || index === points.length - 1) && <text x={center} y={bottom + 24} textAnchor="middle" fontSize="14" fill="var(--color-text-secondary)">{point.label}</text>}
            </g>;
          })}
        </svg>
      </div>
      {points.length > 10 && <p className="text-xs text-muted-foreground sm:hidden">Deslize o gráfico para ver todos os dias do mês.</p>}
      <details className="group border-t pt-3">
        <summary className="w-fit cursor-pointer rounded-sm text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Ver dados em tabela</summary>
        <div className="mt-3 max-h-64 overflow-auto">
          <Table>
            <caption className="sr-only">{label}</caption>
            <TableHeader><TableRow><TableHead>Período</TableHead>{series.map(item => <TableHead key={item.label} className="text-right">{item.label}</TableHead>)}{referenceMinutes !== undefined && <TableHead className="text-right">Jornada diária</TableHead>}</TableRow></TableHeader>
            <TableBody>{points.map(point => <TableRow key={point.description}><TableCell>{point.description}</TableCell>{point.values.map((value, index) => <TableCell key={series[index].label} className="text-right tabular-nums">{formatHours(value / 60)}</TableCell>)}{referenceMinutes !== undefined && <TableCell className="text-right tabular-nums">{formatHours(referenceMinutes / 60)}</TableCell>}</TableRow>)}</TableBody>
          </Table>
        </div>
      </details>
    </>
  );
}

