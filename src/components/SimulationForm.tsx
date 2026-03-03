"use client";

import type { Product, SimulationInput } from "@/types/simulation";

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
      products: [...value.products, createDefaultProduct(priceUnitMode)],
    });
  };

  const removeProduct = (index: number) => {
    if (value.products.length <= 1) return;
    const products = value.products.filter((_, i) => i !== index);
    onChange({ ...value, products });
  };

  const priceUnitMode = value.priceUnitMode ?? "yen";
  const products =
    value.products.length > 0 ? value.products : [createDefaultProduct(priceUnitMode)];
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
          <div className="lg:col-span-3">
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              追加投資する年（最大4つ、比較用）
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {(
                value.additionalInvestmentYears ?? [value.targetYears ?? 10]
              ).map((y, i) => (
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
                        ...(value.additionalInvestmentYears ?? [
                          value.targetYears ?? 10,
                        ]),
                      ];
                      newYears[i] =
                        num !== undefined && !Number.isNaN(num) ? num : 0;
                      update({ additionalInvestmentYears: newYears });
                    }}
                    className="w-20 rounded-lg border border-zinc-300 px-2 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  {(
                    value.additionalInvestmentYears ?? [
                      value.targetYears ?? 10,
                    ]
                  ).length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newYears = (
                          value.additionalInvestmentYears ?? [
                            value.targetYears ?? 10,
                          ]
                        ).filter((_, j) => j !== i);
                        update({
                          additionalInvestmentYears:
                            newYears.length > 0 ? newYears : [value.targetYears ?? 10],
                        });
                      }}
                      className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                      aria-label="削除"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {(
                value.additionalInvestmentYears ?? [value.targetYears ?? 10]
              ).length < 4 && (
                <button
                  type="button"
                  onClick={() => {
                    const years =
                      value.additionalInvestmentYears ?? [
                        value.targetYears ?? 10,
                      ];
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
              0=開始時、1以上=その年目。複数指定で結果を比較できます
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
            目標口数比率の合計が100%ではありません（現在: {totalRatio}%）
          </p>
        )}
        <div className="space-y-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-700"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  商品 {index + 1}
                </span>
                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    削除
                  </button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    商品名
                  </label>
                  <input
                    type="text"
                    placeholder="例: 投資信託A"
                    value={product.name}
                    onChange={(e) =>
                      updateProduct(index, { name: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    現在の価格
                    {priceUnitMode === "man"
                      ? "（1万口あたり・円）"
                      : "（1口あたり・円）"}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={product.currentPrice ?? ""}
                    onChange={(e) => {
                      const v = Number(e.target.value) || 0;
                      updateProduct(index, { currentPrice: v });
                    }}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    期待成長率（%/年）
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={product.expectedGrowthRate ?? ""}
                    onChange={(e) =>
                      updateProduct(index, {
                        expectedGrowthRate: Number(e.target.value) ?? 0,
                      })
                    }
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    目標口数比率（%）
                  </label>
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
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                {value.hasRegularInvestment && (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      月々の積立金額（円）
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={product.monthlyAmount ?? ""}
                      onChange={(e) =>
                        updateProduct(index, {
                          monthlyAmount: Number(e.target.value) ?? 0,
                        })
                      }
                      className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  </div>
                )}
              </div>
              <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  現在の保有（任意）
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2">
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
                    <span className="text-sm">口数</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`hold-${product.id}`}
                      checked={useValuation(product)}
                      onChange={() =>
                        updateProduct(index, {
                          currentValuation:
                            product.currentValuation ?? 0,
                          currentUnits: undefined,
                        })
                      }
                      className="text-emerald-600"
                    />
                    <span className="text-sm">評価額</span>
                  </label>
                  {useValuation(product) ? (
                    <input
                      type="number"
                      min={0}
                      step="any"
                      placeholder="評価額（円）"
                      value={product.currentValuation ?? ""}
                      onChange={(e) => {
                        const v = Number(e.target.value) || 0;
                        updateProduct(index, {
                          currentValuation: v,
                          currentUnits: undefined,
                        });
                      }}
                      className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
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
                      className="w-32 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
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

function createDefaultProduct(priceUnitMode: "yen" | "man" = "yen"): Product {
  return {
    id: generateId(),
    name: "商品1",
    currentPrice: priceUnitMode === "man" ? 8000 : 1000,
    expectedGrowthRate: 3,
    targetRatio: 100,
    monthlyAmount: 10000,
  };
}
