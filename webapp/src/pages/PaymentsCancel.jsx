import { useSearchParams, Link } from "react-router-dom";

export default function PaymentsCancel() {
  const [params] = useSearchParams();
  const order = params.get("order");

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Payment canceled</h1>
      {order ? (
        <p className="text-gray-600">Order #{order} is still pending.</p>
      ) : null}
      <Link to="/" className="px-4 py-2 rounded bg-black text-white inline-block">
        Back
      </Link>
    </div>
  );
}