"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { NO_ADDITIONAL_INVESTMENT } from "@/lib/simulation";
import { exportResultsToExcel } from "@/lib/exportExcel";
import type { SimulationResult } from "@/types/simulation";

interface SimulationResultProps {
  results: SimulationResult[];
}

const CHART_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

function formatYen(value: number): string {
  return (
    new Intl.NumberFormat("ja-JP", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(value) + " 円"
  );
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/** 商品価格を表示用に変換（1口1万円時は1万口あたり円で表示） */
function formatPriceForDisplay(
  pricePerUnit: number,
  priceUnitMode: "yen" | "man"
): number {
  if (priceUnitMode === "man") return pricePerUnit * 10_000;
  return pricePerUnit;
}

function getYearLabel(year: number): string {
  if (year === NO_ADDITIONAL_INVESTMENT) return "追加投資なし";
  return year === 0 ? "開始時" : `${year}年目`;
}

export function SimulationResultDisplay({ results }: SimulationResultProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const result = results[selectedIndex] ?? results[0];
  if (!result) return null;

  const { summary, snapshots, productSummaries, input } = result;
  const productMap = new Map(input.products.map((p) => [p.id, p]));
  const priceUnitMode = input.priceUnitMode ?? "yen";

  const chartData = snapshots.map((s) => {
    const base: Record<string, string | number> = {
      label: s.yearIndex === 0 ? "開始" : `${s.yearIndex}年目`,
      合計_累計投資額: s.totalInvested,
      合計_評価額: s.valuation,
    };
    s.products.forEach((ps) => {
      base[`val_${ps.productId}`] = ps.valuation;
    });
    return base;
  });

  const rawDiff = summary.finalValuation - summary.targetAmount;
  const targetDiff = Math.abs(rawDiff) < 1 ? 0 : rawDiff;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => exportResultsToExcel(results)}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          Excelダウンロード
        </button>
      </div>

      {results.length > 1 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            シナリオ比較
          </h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedIndex(i)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  selectedIndex === i
                    ? "bg-emerald-600 text-white dark:bg-emerald-500"
                    : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                }`}
              >
                {getYearLabel(r.additionalInvestmentYear)}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="px-4 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    追加投資年
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    累計投資額
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    評価額
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    追加投資額
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    目標達成
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    リターン
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedIndex(i)}
                    className={`cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50 ${
                      selectedIndex === i ? "bg-emerald-50 dark:bg-emerald-900/20" : ""
                    }`}
                  >
                    <td className="px-4 py-2 font-medium text-zinc-900 dark:text-zinc-100">
                      {getYearLabel(r.additionalInvestmentYear)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatYen(r.summary.totalInvested)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatYen(r.summary.finalValuation)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatYen(r.summary.additionalInvestment)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={
                          r.summary.targetAchieved
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }
                      >
                        {r.summary.targetAchieved ? "達成" : "未達成"}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-2 text-right ${
                        r.summary.returnRate >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatPercent(r.summary.returnRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {results.length > 1
            ? `目標達成（${getYearLabel(result.additionalInvestmentYear)}）`
            : "目標達成"}
        </h2>
        <div className="mb-4 flex items-center gap-4">
          <span
            className={`text-lg font-bold ${
              summary.targetAchieved
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            {summary.targetAchieved ? "達成" : "未達成"}
          </span>
          <span className="text-zinc-600 dark:text-zinc-400">
            目標 {formatYen(summary.targetAmount)} に対し
            {targetDiff >= 0
              ? ` +${formatYen(targetDiff)}`
              : ` ${formatYen(targetDiff)}`}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {results.length > 1
            ? `結果サマリー（${getYearLabel(result.additionalInvestmentYear)}）`
            : "結果サマリー（合計）"}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              累計投資額
            </p>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatYen(summary.totalInvested)}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              保有口数
            </p>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {new Intl.NumberFormat("ja-JP").format(summary.totalUnits)} 口
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              評価額
            </p>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatYen(summary.finalValuation)}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              リターン
            </p>
            <p
              className={`text-xl font-bold ${
                summary.returnRate >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatPercent(summary.returnRate)}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              追加投資額
            </p>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {formatYen(summary.additionalInvestment)}
            </p>
          </div>
        </div>
      </div>

      {productSummaries.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            商品別サマリー
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {productSummaries.map((ps, i) => {
              const product = productMap.get(ps.productId);
              const name = product?.name || `商品${i + 1}`;
              return (
                <div
                  key={ps.productId}
                  className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {name}
                  </p>
                  <div className="space-y-1 text-sm">
                    <p>
                      投資額: {formatYen(ps.totalInvested)} / 口数:{" "}
                      {new Intl.NumberFormat("ja-JP").format(ps.totalUnits)}
                    </p>
                    <p>評価額: {formatYen(ps.valuation)}</p>
                    <p
                      className={
                        ps.returnRate >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      リターン: {formatPercent(ps.returnRate)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            推移グラフ
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-zinc-200 dark:stroke-zinc-700"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  className="text-zinc-600 dark:text-zinc-400"
                />
                <YAxis
                  tickFormatter={(v) =>
                    v >= 10000 ? `${v / 10000}万` : String(v)
                  }
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  className="text-zinc-600 dark:text-zinc-400"
                />
                <Tooltip
                  formatter={(value, name) => {
                    const num =
                      typeof value === "number" ? value : Number(value);
                    const strName = String(name ?? "");
                    return [
                      value != null && !Number.isNaN(num)
                        ? formatYen(num)
                        : "-",
                      strName,
                    ];
                  }}
                  labelFormatter={(label) => label}
                  contentStyle={{
                    backgroundColor: "var(--background)",
                    border: "1px solid var(--foreground)",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="合計_累計投資額"
                  name="合計 累計投資額"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="合計_評価額"
                  name="合計 評価額"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                />
                {productSummaries.map((ps, i) => {
                  const product = productMap.get(ps.productId);
                  const name = product?.name || `商品${i + 1}`;
                  const dataKey = `val_${ps.productId}`;
                  return (
                    <Line
                      key={ps.productId}
                      type="monotone"
                      dataKey={dataKey}
                      name={`${name} 評価額`}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            ※ 評価額は期待成長率を反映した価格で計算しています
          </p>
        </div>
      )}

      {snapshots.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            詳細（年別・合計）
          </h2>
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="px-4 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    年
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    累計投資額
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    保有口数
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    評価額
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                    リターン
                  </th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s, i) => (
                  <tr
                    key={i}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                      {s.yearIndex === 0 ? "開始" : `${s.yearIndex}年目`}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatYen(s.totalInvested)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {new Intl.NumberFormat("ja-JP").format(s.totalUnits)} 口
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatYen(s.valuation)}
                    </td>
                    <td
                      className={`px-4 py-2 text-right font-medium ${
                        s.returnRate >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatPercent(s.returnRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {productSummaries.length > 0 && snapshots.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            詳細（年別・商品毎）
          </h2>
          {productSummaries.map((ps, idx) => {
            const product = productMap.get(ps.productId);
            const name = product?.name || `商品${idx + 1}`;
            return (
              <div
                key={ps.productId}
                className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="mb-4 font-medium text-zinc-800 dark:text-zinc-200">
                  {name}
                </h3>
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="px-4 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                          年
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                          積立金額
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                          商品価格
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                          累計投資額
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                          保有口数
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                          評価額
                        </th>
                        <th className="px-4 py-2 text-right font-medium text-zinc-700 dark:text-zinc-300">
                          リターン
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshots.map((s, i) => {
                        const pSnap = s.products.find(
                          (p) => p.productId === ps.productId
                        );
                        if (!pSnap) return null;
                        return (
                          <tr
                            key={i}
                            className="border-b border-zinc-100 dark:border-zinc-800"
                          >
                            <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                              {s.yearIndex === 0 ? "開始" : `${s.yearIndex}年目`}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {pSnap.yearlyAmount != null
                                ? formatYen(pSnap.yearlyAmount)
                                : "-"}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {pSnap.price != null
                                ? formatYen(
                                    formatPriceForDisplay(
                                      pSnap.price,
                                      priceUnitMode
                                    )
                                  )
                                : "-"}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {formatYen(pSnap.totalInvested)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {new Intl.NumberFormat("ja-JP").format(
                                pSnap.totalUnits
                              )}{" "}
                              口
                            </td>
                            <td className="px-4 py-2 text-right">
                              {formatYen(pSnap.valuation)}
                            </td>
                            <td
                              className={`px-4 py-2 text-right font-medium ${
                                pSnap.returnRate >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {formatPercent(pSnap.returnRate)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
