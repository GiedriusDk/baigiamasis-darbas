import React from "react";

export default function PlanCard({ plan, onBuy, onEdit, onArchive }) {
  return (
    <div className="border rounded-xl p-4 flex flex-col gap-3">
      <div className="text-lg font-semibold">{plan.title}</div>
      <div className="text-sm text-gray-600 whitespace-pre-line">{plan.description || ""}</div>
      <div className="mt-auto flex items-center justify-between">
        <div className="text-base font-medium">{(plan.price / 100).toFixed(2)} {plan.currency}</div>
        {onBuy && (
          <button onClick={() => onBuy(plan)} className="px-3 py-1.5 rounded-lg bg-black text-white">
            Buy
          </button>
        )}
        {onEdit && (
          <div className="flex gap-2">
            <button onClick={() => onEdit(plan)} className="px-3 py-1.5 rounded-lg border">Edit</button>
            <button onClick={() => onArchive(plan)} className="px-3 py-1.5 rounded-lg border border-red-500 text-red-600">
              Archive
            </button>
          </div>
        )}
      </div>
    </div>
  );
}