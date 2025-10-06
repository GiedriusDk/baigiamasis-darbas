import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { confirm } from "../api/payments";

export default function PaymentsSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, error: "", ok: false });

  useEffect(() => {
    const order = params.get("order");
    const session = params.get("session_id") || params.get("session");
    if (!order || !session) {
      setState({ loading: false, error: "Missing params", ok: false });
      return;
    }
    confirm(order, session)
      .then(() => setState({ loading: false, error: "", ok: true }))
      .catch(e => setState({ loading: false, error: e.message || "Failed", ok: false }));
  }, [params]);

  if (state.loading) return <div className="p-6">Processing…</div>;
  if (state.error) return <div className="p-6 text-red-600">{state.error}</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Payment confirmed</h1>
      <button
        className="px-4 py-2 rounded bg-black text-white"
        onClick={() => navigate("/my-plan")}
      >
        Continue
      </button>
    </div>
  );
}