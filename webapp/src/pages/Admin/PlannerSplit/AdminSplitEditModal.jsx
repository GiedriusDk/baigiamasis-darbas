import { useEffect, useState } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  Group,
  Button,
  Alert,
} from "@mantine/core";

export default function AdminSplitEditModal({
  opened,
  onClose,
  split,
  onUpdated,
  onSaveApi,
}) {
  const [form, setForm] = useState({
    title: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!split) return;
    setForm({
      title: split.title || "",
      notes: split.notes || "",
    });
    setErr(null);
  }, [split]);

  function resetAndClose() {
    setSaving(false);
    setErr(null);
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!split || !onSaveApi) return;

    setSaving(true);
    setErr(null);

    try {
      const payload = {
        title: form.title || null,
        notes: form.notes || null,
      };

      const res = await onSaveApi(split.id, payload);
      const updated = res.data || res || null;

      if (updated && onUpdated) {
        onUpdated(updated);
      }

      resetAndClose();
    } catch (e) {
      setErr(e.message || "Failed to save split");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={resetAndClose}
      title={split ? `Edit split #${split.id}` : "Edit split"}
      centered
      size="lg"
    >
      {!split ? (
        <Alert color="red">No split selected.</Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          {err && (
            <Alert color="red" mb="sm">
              {err}
            </Alert>
          )}

          <TextInput
            label="Title"
            placeholder="Upper / Lower / Push Pull Legs..."
            value={form.title}
            onChange={(e) =>
              setForm((f) => ({ ...f, title: e.currentTarget.value }))
            }
            mb="sm"
          />

          <Textarea
            label="Notes"
            minRows={3}
            value={form.notes}
            onChange={(e) =>
              setForm((f) => ({ ...f, notes: e.currentTarget.value }))
            }
            mb="md"
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={resetAndClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </Group>
        </form>
      )}
    </Modal>
  );
}