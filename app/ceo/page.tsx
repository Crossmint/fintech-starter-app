"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface TotalMetrics {
  totalClaimed: number;
  totalCashedOut: number;
  totalProcessing: number;
  netLiability: number;
}

interface ContractorLiability {
  userEmail: string;
  totalClaimed: number;
  totalCashedOut: number;
  availableToWithdraw: number;
}

interface MetricsData {
  totalMetrics: TotalMetrics;
  contractors: ContractorLiability[];
}

export default function CEODashboard() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/metrics");
      const data = await response.json();

      if (response.ok) {
        setMetrics(data);
        setError("");
      } else {
        setError(data.error || "Failed to fetch metrics");
      }
    } catch (err) {
      setError("Failed to fetch metrics");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    const interval = setInterval(fetchMetrics, 3000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="Logo" width={54} height={54} />
            <h1 className="text-3xl font-bold">CEO Dashboard</h1>
          </div>
          <Link
            href="/"
            className="text-secondary flex items-center gap-2 text-sm hover:underline"
          >
            ← Back to App
          </Link>
        </div>

        <div className="mb-2 text-sm text-gray-600">
          Real-time contractor payment tracking • Updates every 3 seconds
        </div>

        {metrics && (
          <>
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Claimed"
                value={`$${metrics.totalMetrics.totalClaimed.toFixed(2)}`}
                subtitle="Total contractor pay claimed"
                color="blue"
              />
              <MetricCard
                title="Total Cashed Out"
                value={`$${metrics.totalMetrics.totalCashedOut.toFixed(2)}`}
                subtitle="Successfully withdrawn"
                color="green"
              />
              <MetricCard
                title="Processing"
                value={`$${metrics.totalMetrics.totalProcessing.toFixed(2)}`}
                subtitle="Currently being processed"
                color="yellow"
              />
              <MetricCard
                title="Net Liability"
                value={`$${metrics.totalMetrics.netLiability.toFixed(2)}`}
                subtitle="Company owes contractors"
                color="red"
              />
            </div>

            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-xl font-semibold">Contractor Breakdown</h2>
              {metrics.contractors.length === 0 ? (
                <div className="text-secondary py-8 text-center">
                  No contractor activity yet
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="pb-3 text-left text-sm font-semibold">Contractor Email</th>
                        <th className="pb-3 text-right text-sm font-semibold">Total Claimed</th>
                        <th className="pb-3 text-right text-sm font-semibold">Total Cashed Out</th>
                        <th className="pb-3 text-right text-sm font-semibold">
                          Available Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.contractors.map((contractor) => (
                        <tr key={contractor.userEmail} className="border-b last:border-0">
                          <td className="py-3 text-sm">{contractor.userEmail}</td>
                          <td className="py-3 text-right text-sm">
                            ${contractor.totalClaimed.toFixed(2)}
                          </td>
                          <td className="py-3 text-right text-sm">
                            ${contractor.totalCashedOut.toFixed(2)}
                          </td>
                          <td className="py-3 text-right text-sm font-semibold">
                            ${contractor.availableToWithdraw.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-lg bg-blue-50 p-4">
              <div className="text-sm font-medium text-blue-900">Demo Mode</div>
              <div className="mt-1 text-sm text-blue-700">
                This dashboard shows real-time tracking of contractor payments. The company knows
                exactly how much it owes to contractors when they cash out. Data is stored
                in-memory and will reset on server restart.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: "blue" | "green" | "yellow" | "red";
}

function MetricCard({ title, value, subtitle, color }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-900 border-blue-200",
    green: "bg-green-50 text-green-900 border-green-200",
    yellow: "bg-yellow-50 text-yellow-900 border-yellow-200",
    red: "bg-red-50 text-red-900 border-red-200",
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="mb-2 text-sm font-medium opacity-80">{title}</div>
      <div className="mb-1 text-3xl font-bold">{value}</div>
      <div className="text-xs opacity-70">{subtitle}</div>
    </div>
  );
}
