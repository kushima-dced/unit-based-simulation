"use client";

import type {
  InvestmentInputMode,
  Product,
  RatioMode,
  SimulationInput,
} from "@/types/simulation";

const MAN = 10_000;

interface SimulationFormProps {
  value: SimulationInput;
  onChange: (value: SimulationInput) => void;
  onSubmit: () => void;
}

const MAX_PRODUCTS = 4;

function generateId(): string {
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** 評価額入力モードか（currentUnits が undefined のとき評価額を表示） */
function useValuation(p: Product): boolean {
  return p.currentUnits === undefined;
}

export function SimulationForm({ value, onChange, onSubmit }: SimulationFormProps) {
  const update = (partial: Partial<SimulationInput>) => {
    onChange({ ...value, ...partial });
  };

  const updateProduct = (index: number, partial: Partial<Product>) => {
    const products = [...value.products];
    products[index] = { ...products[index], ...partial };
    onChange({ ...value, products });
  };

  const addProduct = () => {
    if (value.products.length >= MAX_PRODUCTS) return;
    onChange({
      ...value,
      products: [
        ...value.products,
        createDefaultProduct(priceUnitMode, value.products.length + 1),
      ],
    });
  };

  const removeProduct = (index: number) => {
    if (value.products.length <= 1) return;
    const products = value.products.filter((_, i) => i !== index);
    onChange({ ...value, products });
  };

  const priceUnitMode = value.priceUnitMode ?? "yen";
  const ratioMode: RatioMode = value.ratioMode ?? "units";
  const ratioLabel =
    ratioMode === "asset" ? "目標資産比率" : "目標口数比率";
  const investmentInputMode: InvestmentInputMode =
    value.investmentInputMode ?? "perProduct";
  const showPerProductAmount =
    value.hasRegularInvestment && investmentInputMode === "perProduct";
  const products =
    value.products.length > 0
      ? value.products
      : [createDefaultProduct(priceUnitMode, 1)];
  const totalRatio = products.reduce((s, p) => s + (p.targetRatio ?? 0), 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-6"
    >
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          目標
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              目標資産額（万円）
            </label>
            <input
              type="number"
              min={0}
              step="any"
              value={value.targetAmount ? value.targetAmount / MAN : ""}
              onChange={(e) => {
                const v = Number(e.target.value) || 0;
                update({ targetAmount: v * MAN });
              }}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              目標達成年数
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={value.targetYears || ""}
              onChange={(e) =>
                update({ targetYears: Number(e.target.value) || 1 })
              }
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              比率モード
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ratioMode"
                  checked={ratioMode === "units"}
                  onChange={() => update({ ratioMode: "units" })}
                  className="text-emerald-600"
                />
                <span className="text-sm">口数比率（6-1）</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="ratioMode"
                  checked={ratioMode === "asset"}
                  onChange={() => update({ ratioMode: "asset" })}
                  className="text-emerald-600"
                />
                <span className="text-sm">資産比率（6-2）</span>
              </label>
            </div>
          </div>
          <div className="lg:col-span-3">
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              追加投資する年（任意・最大4つ、比較用）
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {(value.additionalInvestmentYears ?? []).map((y, i) => (
                <div key={i} className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={value.targetYears || 50}
                    value={y}
                    onChange={(e) => {
                      const num =
                        e.target.value === ""
                          ? value.targetYears ?? 10
                          : Number(e.target.value);
                      const newYears = [
                        ...(value.additionalInvestmentYears ?? []),
                      ];
                      newYears[i] =
                        num !== undefined && !Number.isNaN(num) ? num : 0;
                      update({ additionalInvestmentYears: newYears });
                    }}
                    className="w-20 rounded-lg border border-zinc-300 px-2 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newYears = (
                        value.additionalInvestmentYears ?? []
                      ).filter((_, j) => j !== i);
                      update({ additionalInvestmentYears: newYears });
                    }}
                    className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                    aria-label="削除"
                  >
                    ×
                  </button>
                </div>
              ))}
              {(value.additionalInvestmentYears ?? []).length < 4 && (
                <button
                  type="button"
                  onClick={() => {
                    const years = value.additionalInvestmentYears ?? [];
                    const last =
                      years[years.length - 1] ?? value.targetYears ?? 10;
                    update({
                      additionalInvestmentYears: [
                        ...years,
                        Math.min(last + 1, value.targetYears ?? 10),
                      ],
                    });
                  }}
                  className="rounded-lg bg-zinc-200 px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                >
                  + 追加
                </button>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              任意入力。0=開始時、1以上=その年目。未入力時は追加投資なし（積立のみ）で計算。複数指定で結果を比較できます
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          積立投資
        </h2>
        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="hasRegularInvestment"
              checked={value.hasRegularInvestment}
              onChange={() => update({ hasRegularInvestment: true })}
              className="text-emerald-600"
            />
            <span className="text-sm">する</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="hasRegularInvestment"
              checked={!value.hasRegularInvestment}
              onChange={() => update({ hasRegularInvestment: false })}
              className="text-emerald-600"
            />
            <span className="text-sm">しない</span>
          </label>
        </div>

        {value.hasRegularInvestment && (
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                金額入力方法
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="investmentInputMode"
                    checked={investmentInputMode === "perProduct"}
                    onChange={() =>
                      update({ investmentInputMode: "perProduct" })
                    }
                    className="text-emerald-600"
                  />
                  <span className="text-sm">商品毎</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="investmentInputMode"
                    checked={investmentInputMode === "total"}
                    onChange={() => update({ investmentInputMode: "total" })}
                    className="text-emerald-600"
                  />
                  <span className="text-sm">総額</span>
                </label>
              </div>
            </div>

            {investmentInputMode === "total" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    月額（円/月）
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={value.totalMonthlyAmount ?? 0}
                    onChange={(e) =>
                      update({
                        totalMonthlyAmount: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    全商品合計の月額積立金額（目標比率で按分）
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    スポット（円/年）
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={value.totalSpotAmount ?? 0}
                    onChange={(e) =>
                      update({
                        totalSpotAmount: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-emerald-500 focus:ring-emerald-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    任意。毎年追加で投資する金額（目標比率で按分）
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            商品（最大{MAX_PRODUCTS}つ）
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              価格単位:
            </span>
            <div className="flex gap-4">
                <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="priceUnitMode"
                  checked={priceUnitMode === "yen"}
                  onChange={() => update({ priceUnitMode: "yen" })}
                  className="text-emerald-600"
                />
                <span className="text-sm">1口1円</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="priceUnitMode"
                  checked={priceUnitMode === "man"}
                  onChange={() => update({ priceUnitMode: "man" })}
                  className="text-emerald-600"
                />
                <span className="text-sm">1口1万円</span>
              </label>
            </div>
          </div>
          {products.length < MAX_PRODUCTS && (
            <button
              type="button"
              onClick={addProduct}
              className="rounded-lg bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              + 商品を追加
            </button>
          )}
        </div>
        {totalRatio !== 0 && totalRatio !== 100 && (
          <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
            {ratioLabel}の合計が100%ではありません（現在: {totalRatio}%）
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-700">
                <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  商品名
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  現在の価格
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  期待成長率
                </th>
                <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  {ratioLabel}
                </th>
                {showPerProductAmount && (
                  <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                    積立金額
                  </th>
                )}
                <th className="px-3 py-2 text-left font-medium text-zinc-700 dark:text-zinc-300">
                  現在の保有
                </th>
                {products.length > 1 && (
                  <th className="w-12 px-3 py-2"></th>
                )}
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr
                  key={product.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      placeholder="例: 投資信託A"
                      value={product.name}
                      onChange={(e) =>
                        updateProduct(index, { name: e.target.value })
                      }
                      className="min-w-[120px] rounded border border-zinc-300 px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={product.currentPrice ?? ""}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        updateProduct(index, { currentPrice: v });
                      }}
                      className="w-24 rounded border border-zinc-300 px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {priceUnitMode === "man" ? "円/万口" : "円/口"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      step={0.1}
                      value={product.expectedGrowthRate ?? ""}
                      onChange={(e) =>
                        updateProduct(index, {
                          expectedGrowthRate: Number(e.target.value) ?? 0,
                        })
                      }
                      className="w-20 rounded border border-zinc-300 px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
                      %/年
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={product.targetRatio ?? ""}
                      onChange={(e) =>
                        updateProduct(index, {
                          targetRatio: Number(e.target.value) ?? 0,
                        })
                      }
                      className="w-16 rounded border border-zinc-300 px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                    <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
                      %
                    </span>
                  </td>
                  {showPerProductAmount && (
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={product.monthlyAmount ?? ""}
                        onChange={(e) =>
                          updateProduct(index, {
                            monthlyAmount: Number(e.target.value) ?? 0,
                          })
                        }
                        className="w-24 rounded border border-zinc-300 px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                      />
                      <span className="ml-1 text-xs text-zinc-500 dark:text-zinc-400">
                        円/月
                      </span>
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`hold-${product.id}`}
                          checked={!useValuation(product)}
                          onChange={() =>
                            updateProduct(index, {
                              currentUnits: product.currentUnits ?? 0,
                              currentValuation: undefined,
                            })
                          }
                          className="text-emerald-600"
                        />
                        <span className="text-xs">口数</span>
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`hold-${product.id}`}
                          checked={useValuation(product)}
                          onChange={() =>
                            updateProduct(index, {
                              currentValuation: product.currentValuation ?? 0,
                              currentUnits: undefined,
                            })
                          }
                          className="text-emerald-600"
                        />
                        <span className="text-xs">評価額</span>
                      </label>
                      {useValuation(product) ? (
                        <input
                          type="number"
                          min={0}
                          step="any"
                          placeholder="円"
                          value={product.currentValuation ?? ""}
                          onChange={(e) => {
                            const v = Number(e.target.value) || 0;
                            updateProduct(index, {
                              currentValuation: v,
                              currentUnits: undefined,
                            });
                          }}
                          className="w-24 rounded border border-zinc-300 px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      ) : (
                        <input
                          type="number"
                          min={0}
                          placeholder="口数"
                          value={product.currentUnits ?? ""}
                          onChange={(e) =>
                            updateProduct(index, {
                              currentUnits: Number(e.target.value) || 0,
                              currentValuation: undefined,
                            })
                          }
                          className="w-24 rounded border border-zinc-300 px-2 py-1.5 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                        />
                      )}
                    </div>
                  </td>
                  {products.length > 1 && (
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        aria-label="削除"
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        シミュレーション実行
      </button>
    </form>
  );
}

function createDefaultProduct(
  priceUnitMode: "yen" | "man" = "yen",
  index: number = 1
): Product {
  return {
    id: generateId(),
    name: `商品${index}`,
    currentPrice: 10000,
    expectedGrowthRate: 3,
    targetRatio: 100,
    monthlyAmount: 10000,
    currentUnits: 0,
  };
}
