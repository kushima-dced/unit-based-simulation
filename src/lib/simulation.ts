import type {
  Product,
  ProductSnapshot,
  SimulationInput,
  SimulationResult,
  SimulationSnapshot,
} from "@/types/simulation";

const MAX_PRODUCTS = 4;
const MAN = 10_000;

/**
 * 1口あたりの価格（円）を返す（内部計算用）
 * - 1口1円: 価格は1口あたり円 → そのまま
 * - 1口1万円: 価格は1万口あたり（円）。1口あたり = 価格/10000
 *   例: 8000円/万口 → 0.8円/口 → 20万口×8000 = 16万円
 */
function toPricePerUnitInYen(
  price: number,
  priceUnitMode: "yen" | "man"
): number {
  if (priceUnitMode === "yen") return price;
  // 1口1万円: 価格は1万口あたり（円）。1口あたり = 価格/10000
  if (price >= 1) return price / MAN;
  // 価格 < 1: 0.8など（万円/万口）→ 0.8円/口
  return price;
}

/** 年インデックスから価格を算出（0 = 開始年） */
function getPriceAtYear(
  currentPrice: number,
  growthRate: number,
  yearIndex: number
): number {
  return currentPrice * Math.pow(1 + growthRate / 100, yearIndex);
}

/** 現在保有から口数を算出（口数優先）priceInYen は円換算済みの現在価格 */
function getInitialUnits(product: Product, priceInYen: number): number {
  if (product.currentUnits != null && product.currentUnits > 0) {
    return product.currentUnits;
  }
  if (
    product.currentValuation != null &&
    product.currentValuation > 0 &&
    priceInYen > 0
  ) {
    return product.currentValuation / priceInYen;
  }
  return 0;
}

/** 商品ごとの年間投資額を算出（商品毎モード or 総額モードの按分） */
function getYearlyAmountForProduct(
  product: Product,
  input: SimulationInput,
  products: Product[]
): number {
  if (input.investmentInputMode === "total") {
    const totalRatio = products.reduce((s, p) => s + (p.targetRatio ?? 0), 0);
    const ratio =
      totalRatio > 0
        ? (product.targetRatio ?? 0) / totalRatio
        : 1 / products.length;
    const totalYearly =
      (input.totalMonthlyAmount ?? 0) * 12 + (input.totalSpotAmount ?? 0);
    return totalYearly * ratio;
  }
  return (product.monthlyAmount ?? 0) * 12;
}

/** 積立投資のみでシミュレーション（追加投資なし）年単位 */
function runRegularOnly(
  products: Product[],
  input: SimulationInput,
  totalYears: number
): Map<string, { units: number; invested: number }> {
  const mode = input.priceUnitMode ?? "yen";
  const state = new Map<string, { units: number; invested: number }>();
  products.forEach((p) => {
    const priceInYen = toPricePerUnitInYen(p.currentPrice, mode);
    const units = getInitialUnits(p, priceInYen);
    state.set(p.id, {
      units,
      invested: units * priceInYen,
    });
  });

  for (let yearIndex = 1; yearIndex <= totalYears; yearIndex++) {
    if (input.hasRegularInvestment) {
      for (const p of products) {
        const s = state.get(p.id)!;
        const priceInYen = toPricePerUnitInYen(p.currentPrice, mode);
        const price = getPriceAtYear(
          priceInYen,
          p.expectedGrowthRate,
          yearIndex
        );
        const yearlyAmount = getYearlyAmountForProduct(p, input, products);
        if (price > 0 && yearlyAmount > 0) {
          s.units += yearlyAmount / price;
          s.invested += yearlyAmount;
        }
      }
    }
  }

  return state;
}

/** 追加投資なしを表す特殊値（積立のみでシミュレーション） */
export const NO_ADDITIONAL_INVESTMENT = -1;

/** シミュレーションを実行（additionalInvestmentYear で追加投資年を指定。NO_ADDITIONAL_INVESTMENT の場合は追加投資なし） */
export function runSimulation(
  input: SimulationInput,
  additionalInvestmentYear: number
): SimulationResult {
  const products = input.products
    .slice(0, MAX_PRODUCTS)
    .filter((p) => p.currentPrice > 0);

  const isNoAdditionalInvestment =
    additionalInvestmentYear === NO_ADDITIONAL_INVESTMENT;

  if (products.length === 0) {
    const addInvestYear = isNoAdditionalInvestment
      ? NO_ADDITIONAL_INVESTMENT
      : Math.min(
          Math.max(0, additionalInvestmentYear),
          Math.max(1, input.targetYears)
        );
    return {
      input,
      additionalInvestmentYear: addInvestYear,
      snapshots: [],
      summary: {
        totalInvested: 0,
        totalUnits: 0,
        finalValuation: 0,
        returnRate: 0,
        targetAmount: input.targetAmount,
        targetAchieved: false,
        additionalInvestment: 0,
      },
      productSummaries: [],
    };
  }

  const totalRatio = products.reduce((s, p) => s + (p.targetRatio ?? 0), 0);
  const ratioScale =
    totalRatio > 0 ? totalRatio / 100 : 1 / Math.max(1, products.length);

  const targetYears = Math.max(1, input.targetYears);
  const addInvestYear = isNoAdditionalInvestment
    ? NO_ADDITIONAL_INVESTMENT
    : Math.min(
        Math.max(0, additionalInvestmentYear),
        targetYears
      );

  const mode = input.priceUnitMode ?? "yen";
  const ratioMode = input.ratioMode ?? "units";

  // 目標達成年時点の価格
  const priceAtTarget = new Map<string, number>();
  let sumRatioPrice = 0;
  for (const p of products) {
    const priceInYen = toPricePerUnitInYen(p.currentPrice, mode);
    const price = getPriceAtYear(
      priceInYen,
      p.expectedGrowthRate,
      targetYears
    );
    priceAtTarget.set(p.id, price);
    const r = (p.targetRatio ?? 0) / ratioScale / 100 || 1 / products.length;
    sumRatioPrice += r * price;
  }

  // 目標口数（目標達成年時点）
  // 口数比率: targetUnits_i = targetAmount * ratio_i / sum(ratio_j * price_j)
  // 資産比率: targetUnits_i = (targetAmount * ratio_i) / price_i
  const targetUnitsPerProduct = new Map<string, number>();
  if (ratioMode === "asset") {
    for (const p of products) {
      const r = (p.targetRatio ?? 0) / ratioScale / 100 || 1 / products.length;
      const price = priceAtTarget.get(p.id) ?? 0;
      const targetUnits = price > 0 ? (input.targetAmount * r) / price : 0;
      targetUnitsPerProduct.set(p.id, targetUnits);
    }
  } else if (sumRatioPrice > 0) {
    for (const p of products) {
      const r = (p.targetRatio ?? 0) / ratioScale / 100 || 1 / products.length;
      const targetUnits = (input.targetAmount * r) / sumRatioPrice;
      targetUnitsPerProduct.set(p.id, targetUnits);
    }
  }

  const regularOnlyState = runRegularOnly(products, input, targetYears);

  const productState = new Map<
    string,
    { units: number; invested: number; targetValuation: number }
  >();

  for (const p of products) {
    const ratio = (p.targetRatio ?? 0) / ratioScale / 100 || 1 / products.length;
    const targetValuation = input.targetAmount * ratio;
    const priceInYen = toPricePerUnitInYen(p.currentPrice, mode);
    const units = getInitialUnits(p, priceInYen);
    productState.set(p.id, {
      units,
      invested: units * priceInYen,
      targetValuation,
    });
  }

  const snapshots: SimulationSnapshot[] = [];

  for (let yearIndex = 0; yearIndex <= targetYears; yearIndex++) {
    if (yearIndex > 0 && input.hasRegularInvestment) {
      for (const p of products) {
        const state = productState.get(p.id)!;
        const priceInYen = toPricePerUnitInYen(p.currentPrice, mode);
        const price = getPriceAtYear(
          priceInYen,
          p.expectedGrowthRate,
          yearIndex
        );
        const yearlyAmount = getYearlyAmountForProduct(p, input, products);
        if (price > 0 && yearlyAmount > 0) {
          const newUnits = yearlyAmount / price;
          state.units += newUnits;
          state.invested += yearlyAmount;
        }
      }
    }

    const isAddInvestYear =
      addInvestYear !== NO_ADDITIONAL_INVESTMENT &&
      yearIndex === addInvestYear;
    if (isAddInvestYear && targetUnitsPerProduct.size > 0) {
      for (const p of products) {
        const state = productState.get(p.id)!;
        const targetUnits = targetUnitsPerProduct.get(p.id) ?? 0;
        // 積立のみの口数（全期間）= 目標口数との差を追加投資で補う
        const regularOnlyUnits = regularOnlyState.get(p.id)?.units ?? 0;
        const additionalUnits = Math.max(0, targetUnits - regularOnlyUnits);
        const priceInYen = toPricePerUnitInYen(p.currentPrice, mode);
        const priceAtAdd = getPriceAtYear(
          priceInYen,
          p.expectedGrowthRate,
          addInvestYear
        );
        if (priceAtAdd > 0 && additionalUnits > 0) {
          const investAmount = additionalUnits * priceAtAdd;
          state.units += additionalUnits;
          state.invested += investAmount;
        }
      }
    }

    const productSnapshots: ProductSnapshot[] = [];
    let totalInvested = 0;
    let totalUnits = 0;
    let valuation = 0;

    for (const p of products) {
      const state = productState.get(p.id)!;
      const priceInYen = toPricePerUnitInYen(p.currentPrice, mode);
      const price = getPriceAtYear(
        priceInYen,
        p.expectedGrowthRate,
        yearIndex
      );
      const val = state.units * price;
      const rr =
        state.invested > 0 ? ((val - state.invested) / state.invested) * 100 : 0;
      const yearlyAmount = input.hasRegularInvestment
        ? getYearlyAmountForProduct(p, input, products)
        : 0;
      productSnapshots.push({
        productId: p.id,
        totalInvested: state.invested,
        totalUnits: state.units,
        valuation: val,
        returnRate: rr,
        yearlyAmount: yearIndex > 0 ? yearlyAmount : undefined,
        price,
      });
      totalInvested += state.invested;
      totalUnits += state.units;
      valuation += val;
    }

    const returnRate =
      totalInvested > 0 ? ((valuation - totalInvested) / totalInvested) * 100 : 0;

    snapshots.push({
      yearIndex,
      products: productSnapshots,
      totalInvested,
      totalUnits,
      valuation,
      returnRate,
    });
  }

  const last = snapshots[snapshots.length - 1];
  const initialTotal = products.reduce((s, p) => {
    const priceInYen = toPricePerUnitInYen(p.currentPrice, mode);
    return s + getInitialUnits(p, priceInYen) * priceInYen;
  }, 0);
  const regularTotal = input.hasRegularInvestment
    ? products.reduce(
        (s, p) =>
          s + getYearlyAmountForProduct(p, input, products) * targetYears,
        0
      )
    : 0;
  const additionalTotal = Math.max(
    0,
    (last?.totalInvested ?? 0) - initialTotal - regularTotal
  );

  const summary = last
    ? {
        totalInvested: last.totalInvested,
        totalUnits: last.totalUnits,
        finalValuation: last.valuation,
        returnRate: last.returnRate,
        targetAmount: input.targetAmount,
        targetAchieved: last.valuation >= input.targetAmount,
        additionalInvestment: additionalTotal,
      }
    : {
        totalInvested: 0,
        totalUnits: 0,
        finalValuation: 0,
        returnRate: 0,
        targetAmount: input.targetAmount,
        targetAchieved: false,
        additionalInvestment: 0,
      };

  const productSummaries = last?.products ?? [];

  return {
    input,
    additionalInvestmentYear: addInvestYear,
    snapshots,
    summary,
    productSummaries,
  };
}
