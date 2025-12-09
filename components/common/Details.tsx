import React from "react";

interface DetailsProps {
  values: { label: string; value: React.ReactNode }[];
}

export function Details({ values }: DetailsProps) {
  return (
    <div className="flex w-full flex-col gap-4 rounded-xl border border-gray-200 p-4">
      {values.map((value) => (
        <div key={value.label} className="flex items-center justify-between text-sm">
          <div className="text-gray-900">{value.label}</div>
          <div className="font-medium text-gray-900">{value.value}</div>
        </div>
      ))}
    </div>
  );
}
