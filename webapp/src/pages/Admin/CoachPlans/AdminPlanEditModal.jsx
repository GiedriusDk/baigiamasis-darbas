// src/pages/Admin/CoachPlans/AdminPlanEditModal.jsx
import { useEffect, useState } from "react";
import { Modal, NumberInput, Group, Button, Alert } from "@mantine/core";
import { adminUpdatePlan } from "../../../api/plans";

export default function AdminPlanEditModal({
  opened,
  onClose,
  plan,
  onUpdated,
}) {
  const [form, setForm] = useState({
    product_id: null,
    coach_id: null,
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!plan) return;
    setForm({
      product_id: plan.product_id ?? null,
      coach_id: plan.coach_id ?? null,
    });
    setErr(null);
  }, [plan]);

  function resetAndClose() {
    setErr(null);
    setSaving(false);
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!plan) return;

    setSaving(true);
    setErr(null);

    try {
      const payload = {
        product_id:
          form.product_id === null || form.product_id === ""
            ? null
            : Number(form.product_id),
        coach_id:
          form.coach_id === null || form.coach_id === ""
            ? null
            : Number(form.coach_id),
      };

      const res = await adminUpdatePlan(plan.id, payload);
      const updated = res.data || res;

      onUpdated?.(updated);
      resetAndClose();
    } catch (e) {
      setErr(e.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={resetAndClose}
      title={plan ? `Edit plan #${plan.id}` : "Edit plan"}
      centered
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Group grow mb="sm">
          <NumberInput
            label="Product ID"
            value={form.product_id}
            onChange={(value) =>
              setForm((f) => ({ ...f, product_id: value }))
            }
            min={1}
          />
          <NumberInput
            label="Coach ID"
            value={form.coach_id}
            onChange={(value) =>
              setForm((f) => ({ ...f, coach_id: value }))
            }
            min={1}
          />
        </Group>

        {err && (
          <Alert color="red" mb="sm">
            {err}
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save
          </Button>
        </Group>
      </form>
    </Modal>
  );
}