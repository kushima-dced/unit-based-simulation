"use client";

import { useState } from "react";
import { SimulationForm } from "@/components/SimulationForm";
import { SimulationResultDisplay } from "@/components/SimulationResult";
import {
  runSimulation,
  NO_ADDITIONAL_INVESTMENT,
} from "@/lib/simulation";
import type { Product, SimulationInput, SimulationResult } from "@/types/simulation";

function createDefaultProduct(
  priceUnitMode: "yen" | "man" = "yen",
  index: number = 1
): Product {
  return {
    id: `p-${Date.now()}`,
    name: `商品${index}`,
    currentPrice: 10000,
    expectedGrowthRate: 3,
    targetRatio: 100,
    monthlyAmount: 10000,
    currentUnits: 0,
  };
}

const defaultInput: SimulationInput = {
  targetAmount: 10_000_000,
  targetYears: 10,
  additionalInvestmentYears: [],
  hasRegularInvestment: true,
  priceUnitMode: "yen",
  products: [createDefaultProduct("yen", 1)],
};

export default function Home() {
  const [input, setInput] = useState<SimulationInput>(defaultInput);
  const [results, setResults] = useState<SimulationResult[]>([]);

  const handleSubmit = () => {
    const years = input.additionalInvestmentYears ?? [];
    const res =
      years.length > 0
        ? years.map((y) => runSimulation(input, y))
        : [runSimulation(input, NO_ADDITIONAL_INVESTMENT)];
    setResults(res);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            ユニットベースプランニング
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            目標資産額を達成するための投資シミュレーション
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="space-y-8">
          <SimulationForm
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
          />

          {results.length > 0 && (
            <SimulationResultDisplay results={results} />
          )}
        </div>
      </main>
    </div>
  );
}
