import { useEffect, useState } from "react";
import {
  Modal,
  TextInput,
  NumberInput,
  Textarea,
  Group,
  Button,
  Switch,
  Alert,
} from "@mantine/core";

import { adminUpdateProgressGoal } from "../../../api/progress";

export default function AdminProgressGoalEditModal({
  opened,
  onClose,
  goal,
  onUpdated,
}) {
  const [form, setForm] = useState({
    goal_type: "",
    target_value: null,
    unit: "",
    deadline_date: "",
    is_active: true,
    is_completed: false,
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!goal) return;
    setForm({
      goal_type: goal.goal_type || "",
      target_value: goal.target_value ?? null,
      unit: goal.unit || "",
      deadline_date: goal.deadline_date || "",
      is_active: !!goal.is_active,
      is_completed: !!goal.is_completed,
      notes: goal.notes || "",
    });
    setErr(null);
  }, [goal]);

  function resetAndClose() {
    setErr(null);
    setSaving(false);
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!goal) return;

    setSaving(true);
    setErr(null);

    try {
      const payload = {
        goal_type: form.goal_type || null,
        target_value: form.target_value == null ? null : Number(form.target_value),
        unit: form.unit || null,
        deadline_date: form.deadline_date || null,
        is_active: !!form.is_active,
        is_completed: !!form.is_completed,
        notes: form.notes || null,
      };

      const res = await adminUpdateProgressGoal(goal.id, payload);
      const updated = res.data || res;

      onUpdated?.(updated);
      resetAndClose();
    } catch (e) {
      setErr(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={resetAndClose}
      title={goal ? `Edit progress goal #${goal.id}` : "Edit progress goal"}
      centered
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Group grow mb="sm">
          <TextInput
            label="Goal type"
            value={form.goal_type}
            onChange={(e) =>
              setForm((f) => ({ ...f, goal_type: e.currentTarget.value }))
            }
          />
          <TextInput
            label="Unit"
            value={form.unit}
            onChange={(e) =>
              setForm((f) => ({ ...f, unit: e.currentTarget.value }))
            }
          />
        </Group>

        <Group grow mb="sm">
          <NumberInput
            label="Target value"
            value={form.target_value}
            onChange={(v) => setForm((f) => ({ ...f, target_value: v }))}
            min={0}
          />
          <TextInput
            label="Deadline date (YYYY-MM-DD)"
            value={form.deadline_date}
            onChange={(e) =>
              setForm((f) => ({ ...f, deadline_date: e.currentTarget.value }))
            }
          />
        </Group>

        <Group mb="sm">
          <Switch
            label="Active"
            checked={form.is_active}
            onChange={(e) =>
              setForm((f) => ({ ...f, is_active: e.currentTarget.checked }))
            }
          />
          <Switch
            label="Completed"
            checked={form.is_completed}
            onChange={(e) =>
              setForm((f) => ({ ...f, is_completed: e.currentTarget.checked }))
            }
          />
        </Group>

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) =>
            setForm((f) => ({ ...f, notes: e.currentTarget.value }))
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