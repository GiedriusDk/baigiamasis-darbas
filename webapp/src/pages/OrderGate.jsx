import React, { useEffect, useState } from "react";
import { access } from "../payments";

export default function OrderGate({ orderId, children }) {
  const [state, setState] = useState({ loading: true, can: false });

  useEffect(() => {
    let on = true;
    access(orderId)
      .then((r) => on && setState({ loading: false, can: !!r?.can_access }))
      .catch(() => on && setState({ loading: false, can: false }));
    return () => (on = false);
  }, [orderId]);

  if (state.loading) return <div className="p-6">Checking access…</div>;
  if (!state.can) return <div className="p-6">No access.</div>;
  return <>{children}</>;
}