import React, { useEffect, useState, useMemo } from "react";
import { listProducts, createOrder, checkout } from "../api/payments";
import PlanCard from "../components/PlanCard";

export default function CoachPlansPublic({ coachId }) {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let on = true;
    setLoading(true);
    listProducts()
      .then((res) => {
        const items = (res?.data || []).filter((p) => p.is_active && String(p.coach_id) === String(coachId));
        if (on) setPlans(items);
      })
      .catch((e) => on && setError(e.message || "Error"))
      .finally(() => on && setLoading(false));
    return () => (on = false);
  }, [coachId]);

  const grid = useMemo(() => plans || [], [plans]);

  async function handleBuy(p) {
    try {
      const order = await createOrder(p.id, 1);
      const jump = await checkout(order.data ? order.data.id : order.id);
      const url = jump.checkout_url || jump.url || jump;
      window.location.href = url;
    } catch (e) {
      alert(e.message || "Failed");
    }
  }

  if (loading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Plans</h2>
      {grid.length === 0 ? (
        <div>No plans yet.</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {grid.map((p) => (
            <PlanCard key={p.id} plan={p} onBuy={handleBuy} />
          ))}
        </div>
      )}
    </div>
  );
}