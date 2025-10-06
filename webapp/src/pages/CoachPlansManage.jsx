import React, { useEffect, useState } from "react";
import { myProducts, createProduct, updateProduct, archiveProduct } from "../api/payments";
import PlanCard from "../components/PlanCard";

const empty = { title: "", description: "", price: "", currency: "EUR", is_active: true, metadata: {} };

export default function CoachPlansManage() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await myProducts();
      setPlans(res?.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description || null,
      price: Math.round(parseFloat(String(form.price || "0").replace(",", ".")) * 100),
      currency: form.currency || "EUR",
      is_active: !!form.is_active,
      metadata: form.metadata && typeof form.metadata === "string" ? JSON.parse(form.metadata || "{}") : form.metadata || {},
    };
    if (editing) {
      await updateProduct(editing.id, payload);
    } else {
      await createProduct(payload);
    }
    setForm(empty);
    setEditing(null);
    await load();
  }

  function startEdit(p) {
    setEditing(p);
    setForm({
      title: p.title,
      description: p.description || "",
      price: (p.price / 100).toFixed(2),
      currency: p.currency,
      is_active: !!p.is_active,
      metadata: p.metadata ? JSON.stringify(p.metadata) : "{}",
    });
  }

  async function onArchive(p) {
    await archiveProduct(p.id);
    await load();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">{editing ? "Edit plan" : "Create plan"}</h2>
      <form onSubmit={onSubmit} className="grid gap-3 grid-cols-1 sm:grid-cols-2 bg-white border rounded-xl p-4 mb-8">
        <input name="title" value={form.title} onChange={onChange} placeholder="Title" className="border rounded-md p-2 col-span-2" required />
        <textarea name="description" value={form.description} onChange={onChange} placeholder="Description" className="border rounded-md p-2 col-span-2" rows={3} />
        <input name="price" value={form.price} onChange={onChange} placeholder="Price (e.g. 19.99)" className="border rounded-md p-2" required />
        <input name="currency" value={form.currency} onChange={onChange} placeholder="Currency" className="border rounded-md p-2" />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_active" checked={!!form.is_active} onChange={onChange} />
          <span>Active</span>
        </label>
        <textarea name="metadata" value={form.metadata} onChange={onChange} placeholder='Metadata JSON' className="border rounded-md p-2 col-span-2" rows={2} />
        <div className="col-span-2 flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-black text-white">{editing ? "Save" : "Create"}</button>
          {editing && (
            <button type="button" onClick={() => { setEditing(null); setForm(empty); }} className="px-4 py-2 rounded-lg border">
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3 className="text-lg font-semibold mb-3">My plans</h3>
      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} onEdit={startEdit} onArchive={onArchive} />
          ))}
        </div>
      )}
    </div>
  );
}