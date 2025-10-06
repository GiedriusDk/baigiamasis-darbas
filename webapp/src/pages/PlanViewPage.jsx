import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

export default function PlanViewPage() {
  const { id } = useParams();
  const token = useMemo(() => localStorage.getItem("auth_token") || "", []);
  const [plan, setPlan] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    async function load() {
      setErr("");
      try {
        const res = await fetch(`/api/planner/plans/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed");
        setPlan(data);
      } catch (e) {
        setErr(e.message || "Unexpected error");
      }
    }
    load();
  }, [id, token]);

  if (err) return <div className="p-4 border rounded-md text-red-700 bg-red-50">{err}</div>;
  if (!plan) return <div className="p-4">Loading…</div>;

  return <PlanView plan={plan} />;
}

function PlanView({ plan }) {
  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="rounded-2xl border p-4">
        <h2 className="text-xl font-semibold">Plan #{plan.id}</h2>
        <div className="text-sm text-gray-600 mt-1">
          <span className="mr-4"><b>Goal:</b> {plan.goal}</span>
          <span className="mr-4"><b>Weeks:</b> {plan.weeks}</span>
          <span><b>Start:</b> {plan.start_date}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plan.workouts?.map((w) => (
          <div key={w.id} className="rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{w.name}</h3>
              <span className="text-xs text-gray-500">Day {w.day_index + 1}</span>
            </div>
            <ul className="mt-3 space-y-3">
              {w.exercises?.map((ex) => {
                const ce = ex.catalog_exercise || {};
                return (
                  <li key={`${w.id}-${ex.order}`} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                      {ce.image_url ? <img src={ce.image_url} alt={ce.name||''} className="w-full h-full object-cover"/> : null}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">
                        #{ex.order}. {ce.name ? ce.name : `Exercise #${ex.exercise_id}`}
                      </div>
                      <div className="text-gray-500">
                        {ex.sets}× {ex.rep_min}–{ex.rep_max}, rest {ex.rest_sec}s
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}