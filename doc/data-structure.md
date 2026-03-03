# データ構造設計

## 商品（最大4つ）

```typescript
interface Product {
  id: string
  name: string
  currentPrice: number           // 現在の価格（1口1円時: 円/口、1口1万円時: 円/万口）
  expectedGrowthRate: number     // 期待成長率（%/年、例: 3 = 3%）
  monthlyAmount?: number        // 積立する場合の月々の金額（円）
  targetRatio?: number          // 目標口数比率（%）
  currentUnits?: number         // 現在の保有口数
  currentValuation?: number     // 現在の保有評価額（円）
}
```

---

## 投資条件（シミュレーション入力）

```typescript
interface SimulationInput {
  targetAmount: number           // 目標資産額（円、入力は万円単位）
  targetYears: number            // 目標達成年数
  additionalInvestmentYears: number[]  // 追加投資する年（0〜targetYears、最大4つ）
  hasRegularInvestment: boolean  // 積立投資するか
  priceUnitMode: "yen" | "man"   // 価格単位（1口1円 or 1口1万円）
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

- 目標達成年時点で口数が目標口数比率になるよう追加投資を算出
- targetUnits_i = targetAmount × (ratio_i) / Σ(ratio_j × price_j)

### 現在保有の換算

- 保有口数入力時: 評価額 = 口数 × 現在の価格（円換算後）
- 保有評価額入力時: 口数 = 評価額 ÷ 現在の価格（円換算後）
- 保有評価額は常に円単位で入力

### 価格の推移（年単位）

- 価格(t) = 現在の価格 × (1 + 成長率/100)^年数

### 積立投資「する」の場合

- 年ごとの積立金額 ÷ その年の終了時点の価格 = 年間購入口数

### 追加投資

- 目標口数比率を満たす口数に不足分を、指定年に一括投資
- 追加投資年を複数指定した場合、各シナリオの結果を比較可能

---

*型定義は `src/types/` に実装*
