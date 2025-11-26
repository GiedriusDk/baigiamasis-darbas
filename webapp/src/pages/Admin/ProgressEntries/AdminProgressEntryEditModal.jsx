import { useEffect, useState } from "react";
import {
  Modal,
  TextInput,
  NumberInput,
  Textarea,
  Group,
  Button,
  Alert,
} from "@mantine/core";
import { adminUpdateProgressEntry } from "../../../api/progress";

export default function AdminProgressEntryEditModal({
  opened,
  onClose,
  entry,
  onUpdated,
}) {
  const [form, setForm] = useState({
    metric_id: null,
    value: null,
    note: "",
    source: "",
    recorded_at: "",
    date: "",
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!entry) return;
    setForm({
      metric_id: entry.metric_id ?? null,
      value: entry.value ?? null,
      note: entry.note || "",
      source: entry.source || "",
      recorded_at: entry.recorded_at || "",
      date: entry.date || "",
    });
    setErr(null);
  }, [entry]);

  function resetAndClose() {
    setErr(null);
    setSaving(false);
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!entry) return;

    setSaving(true);
    setErr(null);

    try {
      const payload = {
        metric_id:
          form.metric_id === null || form.metric_id === ""
            ? null
            : Number(form.metric_id),
        value:
          form.value === null || form.value === ""
            ? null
            : Number(form.value),
        note: form.note || null,
        source: form.source || null,
        recorded_at: form.recorded_at || null,
        date: form.date || null,
      };

      const res = await adminUpdateProgressEntry(entry.id, payload);
      const updated = res.data || res;

      onUpdated?.(updated);
      resetAndClose();
    } catch (e) {
      setErr(e.message || "Failed to save progress entry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={resetAndClose}
      title={
        entry ? `Edit progress entry #${entry.id}` : "Edit progress entry"
      }
      centered
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Group grow mb="sm">
          <NumberInput
            label="Metric ID"
            value={form.metric_id}
            onChange={(value) =>
              setForm((f) => ({ ...f, metric_id: value }))
            }
            min={1}
          />
          <NumberInput
            label="Value"
            value={form.value}
            onChange={(value) => setForm((f) => ({ ...f, value }))}
            precision={2}
          />
        </Group>

        <TextInput
          label="Source"
          value={form.source}
          onChange={(e) =>
            setForm((f) => ({ ...f, source: e.currentTarget.value }))
          }
          mb="sm"
        />

        <Group grow mb="sm">
          <TextInput
            label="Recorded at (datetime)"
            placeholder="YYYY-MM-DD HH:MM:SS"
            value={form.recorded_at}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                recorded_at: e.currentTarget.value,
              }))
            }
          />
          <TextInput
            label="Date"
            placeholder="YYYY-MM-DD"
            value={form.date}
            onChange={(e) =>
              setForm((f) => ({ ...f, date: e.currentTarget.value }))
            }
          />
        </Group>

        <Textarea
          label="Note"
          value={form.note}
          onChange={(e) =>
            setForm((f) => ({ ...f, note: e.currentTarget.value }))
          }
          minRows={3}
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