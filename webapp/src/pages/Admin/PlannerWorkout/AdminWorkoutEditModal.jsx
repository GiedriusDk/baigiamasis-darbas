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

export default function AdminWorkoutEditModal({
  opened,
  onClose,
  workout,
  onUpdated,
  onSaveApi, // adminUpdateWorkout
}) {
  const [form, setForm] = useState({
    name: "",
    day_index: null,
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!workout) return;
    setForm({
      name: workout.name || "",
      day_index:
        workout.day_index === null || workout.day_index === undefined
          ? null
          : workout.day_index,
      notes: workout.notes || "",
    });
    setErr(null);
  }, [workout]);

  function resetAndClose() {
    setErr(null);
    setSaving(false);
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!workout) return;

    setSaving(true);
    setErr(null);

    try {
      const payload = {
        name: form.name || null,
        day_index:
          form.day_index === null || form.day_index === ""
            ? null
            : Number(form.day_index),
        notes: form.notes || null,
      };

      const res = await onSaveApi(workout.id, payload);
      const updated = res.data || res;

      onUpdated?.(updated);
      resetAndClose();
    } catch (e) {
      setErr(e.message || "Failed to save workout");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={resetAndClose}
      title={workout ? `Edit workout #${workout.id}` : "Edit workout"}
      centered
      size="lg"
    >
      {!workout ? (
        <Alert color="red">No workout selected.</Alert>
      ) : (
        <form onSubmit={handleSubmit}>
          {err && (
            <Alert color="red" mb="md">
              {err}
            </Alert>
          )}

          <Group grow mb="sm">
            <NumberInput
              label="Day index"
              value={form.day_index}
              onChange={(value) =>
                setForm((f) => ({ ...f, day_index: value ?? null }))
              }
            />
            <TextInput
              label="Name"
              value={form.name}
              onChange={(e) =>
                setForm((f) => ({ ...f, name: e.currentTarget.value }))
              }
            />
          </Group>

          <Textarea
            label="Notes"
            value={form.notes}
            minRows={3}
            autosize
            onChange={(e) =>
              setForm((f) => ({ ...f, notes: e.currentTarget.value }))
            }
          />

          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={resetAndClose}>
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