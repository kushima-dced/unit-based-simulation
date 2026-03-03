/** 商品（最大4つ） */
export interface Product {
  id: string
  name: string
  currentPrice: number
  expectedGrowthRate: number
  monthlyAmount?: number
  targetRatio?: number
  currentUnits?: number
  currentValuation?: number
}

/** 価格表示単位: 1口1円 or 1口1万円 */
export type PriceUnitMode = "yen" | "man";

export interface SimulationInput {
  targetAmount: number
  targetYears: number
  /** 追加投資を実行する年（開始からの年数、0〜targetYears、最大4つ） */
  additionalInvestmentYears: number[]
  hasRegularInvestment: boolean
  /** 価格の表示・入力単位（1口1円 or 1口1万円） */
  priceUnitMode: PriceUnitMode
  products: Product[]
}

export interface ProductSnapshot {
  productId: string
  totalInvested: number
  totalUnits: number
  valuation: number
  returnRate: number
  /** その年の積立金額（円） */
  yearlyAmount?: number
  /** その年の商品価格（1口あたり・円） */
  price?: number
}

export interface SimulationSnapshot {
  /** 年インデックス（1年目=1, 2年目=2...） */
  yearIndex: number
  products: ProductSnapshot[]
  totalInvested: number
  totalUnits: number
  valuation: number
  returnRate: number
}

export interface SimulationResult {
  input: SimulationInput
  /** この結果の追加投資年（比較表示用） */
  additionalInvestmentYear: number
  snapshots: SimulationSnapshot[]
  summary: {
    totalInvested: number
    totalUnits: number
    finalValuation: number
    returnRate: number
    targetAmount: number
    targetAchieved: boolean
    additionalInvestment: number
  }
  productSummaries: ProductSnapshot[]
}
