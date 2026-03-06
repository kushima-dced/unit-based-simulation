import * as XLSX from "xlsx";
import type { SimulationResult } from "@/types/simulation";

function yen(v: number): number {
  return Math.round(v);
}

function pct(v: number): number {
  return Math.round(v * 10) / 10;
}

function yearLabel(year: number): string {
  if (year === -1) return "追加投資なし";
  return year === 0 ? "開始時" : `${year}年目`;
}

function priceForDisplay(
  pricePerUnit: number,
  mode: "yen" | "man"
): number {
  return mode === "man" ? pricePerUnit * 10_000 : pricePerUnit;
}

export function exportResultsToExcel(results: SimulationResult[]): void {
  const wb = XLSX.utils.book_new();
  const first = results[0];
  if (!first) return;

  const input = first.input;
  const productMap = new Map(input.products.map((p) => [p.id, p]));
  const priceUnitMode = input.priceUnitMode ?? "yen";
  const ratioMode = input.ratioMode ?? "units";
  const investMode = input.investmentInputMode ?? "perProduct";

  // --- シート1: 入力条件 ---
  const inputRows: Record<string, string | number>[] = [
    { 項目: "目標資産額（万円）", 値: input.targetAmount / 10_000 },
    { 項目: "目標資産額（円）", 値: input.targetAmount },
    { 項目: "目標達成年数", 値: input.targetYears },
    {
      項目: "追加投資する年",
      値:
        input.additionalInvestmentYears.length > 0
          ? input.additionalInvestmentYears.map((y) => yearLabel(y)).join(", ")
          : "なし",
    },
    { 項目: "積立投資", 値: input.hasRegularInvestment ? "する" : "しない" },
    {
      項目: "比率モード",
      値: ratioMode === "asset" ? "資産比率（6-2）" : "口数比率（6-1）",
    },
    {
      項目: "価格単位",
      値: priceUnitMode === "man" ? "1口1万円" : "1口1円",
    },
  ];

  if (input.hasRegularInvestment) {
    inputRows.push({
      項目: "金額入力方法",
      値: investMode === "total" ? "総額" : "商品毎",
    });
    if (investMode === "total") {
      inputRows.push(
        { 項目: "月額（円/月）", 値: input.totalMonthlyAmount ?? 0 },
        { 項目: "スポット（円/年）", 値: input.totalSpotAmount ?? 0 }
      );
    }
  }

  inputRows.push({ 項目: "", 値: "" });
  inputRows.push({ 項目: "--- 商品情報 ---", 値: "" });

  for (const p of input.products) {
    inputRows.push(
      { 項目: `${p.name} - 現在の価格`, 値: p.currentPrice },
      { 項目: `${p.name} - 期待成長率（%）`, 値: p.expectedGrowthRate },
      { 項目: `${p.name} - 目標比率（%）`, 値: p.targetRatio ?? 0 },
      {
        項目: `${p.name} - 現在の保有口数`,
        値: p.currentUnits ?? 0,
      },
      {
        項目: `${p.name} - 現在の保有評価額（円）`,
        値: p.currentValuation ?? 0,
      }
    );
    if (input.hasRegularInvestment && investMode === "perProduct") {
      inputRows.push({
        項目: `${p.name} - 月々の積立金額（円）`,
        値: p.monthlyAmount ?? 0,
      });
    }
  }

  const wsInput = XLSX.utils.json_to_sheet(inputRows);
  wsInput["!cols"] = [{ wch: 30 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsInput, "入力条件");

  // --- シート2: シナリオ比較 ---
  if (results.length > 1) {
    const scenarioRows = results.map((r) => ({
      追加投資年: yearLabel(r.additionalInvestmentYear),
      累計投資額: yen(r.summary.totalInvested),
      評価額: yen(r.summary.finalValuation),
      追加投資額: yen(r.summary.additionalInvestment),
      目標達成: r.summary.targetAchieved ? "達成" : "未達成",
      "リターン（%）": pct(r.summary.returnRate),
      目標資産額: yen(r.summary.targetAmount),
      "目標との差額": yen(r.summary.finalValuation - r.summary.targetAmount),
    }));
    const wsScenario = XLSX.utils.json_to_sheet(scenarioRows);
    wsScenario["!cols"] = Array(8).fill({ wch: 16 });
    XLSX.utils.book_append_sheet(wb, wsScenario, "シナリオ比較");
  }

  // --- 各シナリオごとにサマリー + 詳細シートを作成 ---
  for (const r of results) {
    const label =
      results.length > 1
        ? yearLabel(r.additionalInvestmentYear)
        : "結果";
    const sheetSuffix = results.length > 1 ? `_${label}` : "";

    // サマリーシート
    const summaryRows: Record<string, string | number>[] = [
      { 項目: "累計投資額（円）", 値: yen(r.summary.totalInvested) },
      { 項目: "保有口数（合計）", 値: Math.round(r.summary.totalUnits) },
      { 項目: "評価額（円）", 値: yen(r.summary.finalValuation) },
      { 項目: "リターン（%）", 値: pct(r.summary.returnRate) },
      { 項目: "追加投資額（円）", 値: yen(r.summary.additionalInvestment) },
      {
        項目: "目標達成",
        値: r.summary.targetAchieved ? "達成" : "未達成",
      },
      {
        項目: "目標との差額（円）",
        値: yen(r.summary.finalValuation - r.summary.targetAmount),
      },
    ];

    summaryRows.push({ 項目: "", 値: "" });
    summaryRows.push({ 項目: "--- 商品別サマリー ---", 値: "" });

    for (const ps of r.productSummaries) {
      const product = productMap.get(ps.productId);
      const name = product?.name ?? ps.productId;
      summaryRows.push(
        { 項目: `${name} - 累計投資額（円）`, 値: yen(ps.totalInvested) },
        { 項目: `${name} - 保有口数`, 値: Math.round(ps.totalUnits) },
        { 項目: `${name} - 評価額（円）`, 値: yen(ps.valuation) },
        { 項目: `${name} - リターン（%）`, 値: pct(ps.returnRate) }
      );
    }

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    wsSummary["!cols"] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(
      wb,
      wsSummary,
      truncateSheetName(`サマリー${sheetSuffix}`)
    );

    // 詳細シート（年別・合計）
    const detailRows = r.snapshots.map((s) => {
      const totalRegularUnits = s.products.reduce(
        (sum, p) => sum + (p.regularUnits ?? 0),
        0
      );
      const totalRegularAmount = s.products.reduce(
        (sum, p) => sum + (p.yearlyAmount ?? 0),
        0
      );
      const totalAdditionalUnits = s.products.reduce(
        (sum, p) => sum + (p.additionalUnits ?? 0),
        0
      );
      const totalAdditionalAmount = s.products.reduce(
        (sum, p) => sum + (p.additionalAmount ?? 0),
        0
      );
      const row: Record<string, string | number> = {
        年: s.yearIndex === 0 ? "開始" : `${s.yearIndex}年目`,
        "積立投資口数": totalRegularUnits > 0 ? Math.round(totalRegularUnits) : "",
        "積立投資金額（円）": totalRegularAmount > 0 ? yen(totalRegularAmount) : "",
        "追加投資口数": totalAdditionalUnits > 0 ? Math.round(totalAdditionalUnits) : "",
        "追加投資金額（円）": totalAdditionalAmount > 0 ? yen(totalAdditionalAmount) : "",
        "累計投資額（円）": yen(s.totalInvested),
        保有口数: Math.round(s.totalUnits),
        "評価額（円）": yen(s.valuation),
        "リターン（%）": pct(s.returnRate),
      };
      return row;
    });
    const wsDetail = XLSX.utils.json_to_sheet(detailRows);
    wsDetail["!cols"] = [
      { wch: 10 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 12 },
    ];
    XLSX.utils.book_append_sheet(
      wb,
      wsDetail,
      truncateSheetName(`詳細_合計${sheetSuffix}`)
    );

    // 詳細シート（年別・商品毎）
    for (const ps of r.productSummaries) {
      const product = productMap.get(ps.productId);
      const name = product?.name ?? ps.productId;

      const productRows = r.snapshots.map((s) => {
        const pSnap = s.products.find((p) => p.productId === ps.productId);
        if (!pSnap) return { 年: `${s.yearIndex}年目` };
        return {
          年: s.yearIndex === 0 ? "開始" : `${s.yearIndex}年目`,
          "積立金額（円/年）":
            pSnap.yearlyAmount != null ? yen(pSnap.yearlyAmount) : "",
          "積立投資口数":
            pSnap.regularUnits != null ? Math.round(pSnap.regularUnits) : "",
          "商品価格（円）":
            pSnap.price != null
              ? yen(priceForDisplay(pSnap.price, priceUnitMode))
              : "-",
          "追加投資口数":
            pSnap.additionalUnits != null ? Math.round(pSnap.additionalUnits) : "",
          "追加投資金額（円）":
            pSnap.additionalAmount != null ? yen(pSnap.additionalAmount) : "",
          "累計投資額（円）": yen(pSnap.totalInvested),
          保有口数: Math.round(pSnap.totalUnits),
          "評価額（円）": yen(pSnap.valuation),
          "リターン（%）": pct(pSnap.returnRate),
        };
      });

      const wsProduct = XLSX.utils.json_to_sheet(productRows);
      wsProduct["!cols"] = [
        { wch: 10 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 18 },
        { wch: 18 },
        { wch: 14 },
        { wch: 18 },
        { wch: 12 },
      ];
      XLSX.utils.book_append_sheet(
        wb,
        wsProduct,
        truncateSheetName(`詳細_${name}${sheetSuffix}`)
      );
    }
  }

  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
  XLSX.writeFile(wb, `simulation_${ts}.xlsx`);
}

function truncateSheetName(name: string): string {
  return name.length > 31 ? name.slice(0, 31) : name;
}
