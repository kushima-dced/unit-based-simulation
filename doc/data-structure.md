# データ構造設計

## 商品（最大4つ）

```typescript
interface Product {
  id: string
  name: string
  currentPrice: number           // 現在の価格（1口1円時: 円/口、1口1万円時: 円/万口）
  expectedGrowthRate: number     // 期待成長率（%/年、例: 3 = 3%）
  monthlyAmount?: number        // 商品毎モード時の月々の積立金額（円）
  targetRatio?: number          // 目標比率（%）（口数比率 or 資産比率）
  currentUnits?: number         // 現在の保有口数
  currentValuation?: number     // 現在の保有評価額（円）
}
```

---

## 型定義

```typescript
type PriceUnitMode = "yen" | "man"           // 価格単位（1口1円 or 1口1万円）
type RatioMode = "units" | "asset"           // 比率モード（口数比率 or 資産比率）
type InvestmentInputMode = "perProduct" | "total"  // 金額入力方法（商品毎 or 総額）
```

---

## 投資条件（シミュレーション入力）

```typescript
interface SimulationInput {
  targetAmount: number           // 目標資産額（円、入力は万円単位）
  targetYears: number            // 目標達成年数
  additionalInvestmentYears: number[]  // 追加投資する年（0〜targetYears、最大4つ、任意）
  hasRegularInvestment: boolean  // 積立投資するか
  priceUnitMode: PriceUnitMode   // 価格単位
  ratioMode?: RatioMode          // 比率モード（デフォルト "units"）
  investmentInputMode?: InvestmentInputMode  // 金額入力方法（デフォルト "perProduct"）
  totalMonthlyAmount?: number    // 総額モード時の月額（円/月）
  totalSpotAmount?: number       // 総額モード時のスポット（円/年、任意）
  products: Product[]
}
```

---

## シミュレーション結果（1時点・商品単位）

```typescript
interface ProductSnapshot {
  productId: string
  totalInvested: number
  totalUnits: number
  valuation: number
  returnRate: number
  yearlyAmount?: number    // その年の積立金額（円）
  price?: number           // その年の商品価格（1口あたり・円）
  regularUnits?: number    // その年の積立投資で購入した口数
  additionalUnits?: number // その年の追加投資で購入した口数
  additionalAmount?: number // その年の追加投資金額（円）
}

interface SimulationSnapshot {
  yearIndex: number        // 年インデックス（0=開始、1=1年目...）
  products: ProductSnapshot[]
  totalInvested: number
  totalUnits: number
  valuation: number
  returnRate: number
}
```

---

## シミュレーション結果（全体）

```typescript
interface SimulationResult {
  input: SimulationInput
  additionalInvestmentYear: number  // この結果の追加投資年（比較表示用）
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
```

---

## 計算ロジック概要

### 目標の商品別配分

比率モードに応じて目標口数を算出:

- **口数比率（6-1）**: `targetUnits_i = targetAmount × ratio_i / Σ(ratio_j × price_j)`
- **資産比率（6-2）**: `targetUnits_i = (targetAmount × ratio_i) / price_i`

### 現在保有の換算

- 保有口数入力時: 評価額 = 口数 × 現在の価格（円換算後）
- 保有評価額入力時: 口数 = 評価額 ÷ 現在の価格（円換算後）
- 保有評価額は常に円単位で入力

### 価格の推移（年単位）

- 価格(t) = 現在の価格 × (1 + 成長率/100)^年数

### 積立投資の按分

金額入力方法に応じて各商品の年間投資額を算出:

- **商品毎**: 各商品の月額 × 12
- **総額**:
  - 口数比率モード: `money_i = totalYearly × (ratio_i × price_i) / Σ(ratio_j × price_j)`（価格加重按分、各年の商品価格を考慮）
  - 資産比率モード: `money_i = totalYearly × ratio_i / Σ(ratio_j)`（単純按分）
  - `totalYearly = 月額 × 12 + スポット`

### 追加投資

- 目標比率を満たす口数に不足分を、指定年に一括投資
- 追加投資年を複数指定した場合、各シナリオの結果を比較可能
- スポット（総額モードの年額追加投資）とは別物

---

*型定義は `src/types/` に実装*
