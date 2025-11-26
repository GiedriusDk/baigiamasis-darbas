// webapp/src/pages/Admin/Payments/AdminOrderEditModal.jsx
import { useEffect, useState } from "react";
import {
  Modal,
  TextInput,
  Group,
  Button,
  Alert,
  Textarea,
} from "@mantine/core";

export default function AdminOrderEditModal({
  opened,
  onClose,
  order,
  onUpdated,
  onSaveApi, // adminUpdateOrder
}) {
  const [form, setForm] = useState({
    status: "",
    paid_at: "",
    expires_at: "",
    metadata: "",
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!order) return;
    setForm({
      status: order.status || "",
      paid_at: order.paid_at || "",
      expires_at: order.expires_at || "",
      metadata:
        order.metadata != null
          ? JSON.stringify(order.metadata, null, 2)
          : "",
    });
    setErr(null);
  }, [order]);

  function resetAndClose() {
    setErr(null);
    setSaving(false);
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!order) return;

    setSaving(true);
    setErr(null);

    try {
      let metadata = null;
      if (form.metadata && form.metadata.trim()) {
        try {
          metadata = JSON.parse(form.metadata);
        } catch (parseErr) {
          throw new Error("Metadata must be valid JSON");
        }
      }

      const payload = {
        status: form.status || null,
        paid_at: form.paid_at || null,
        expires_at: form.expires_at || null,
        metadata,
      };

      const res = await onSaveApi(order.id, payload);
      const updated = res.data || res;

      onUpdated?.(updated);
      resetAndClose();
    } catch (e) {
      setErr(e.message || "Failed to save order");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={resetAndClose}
      title={order ? `Edit order #${order.id}` : "Edit order"}
      centered
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Group grow mb="sm">
          <TextInput
            label="Status"
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({ ...f, status: e.currentTarget.value }))
            }
          />
        </Group>

        <Group grow mb="sm">
          <TextInput
            label="Paid at (ISO datetime)"
            placeholder="2025-11-26 10:30:00"
            value={form.paid_at}
            onChange={(e) =>
              setForm((f) => ({ ...f, paid_at: e.currentTarget.value }))
            }
          />
          <TextInput
            label="Expires at (ISO datetime)"
            placeholder="2025-12-01 23:59:59"
            value={form.expires_at}
            onChange={(e) =>
              setForm((f) => ({ ...f, expires_at: e.currentTarget.value }))
            }
          />
        </Group>

        <Textarea
          label="Metadata (JSON)"
          description="Optional additional data. Must be valid JSON."
          value={form.metadata}
          onChange={(e) =>
            setForm((f) => ({ ...f, metadata: e.currentTarget.value }))
          }
          minRows={4}
          mb="sm"
        />

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