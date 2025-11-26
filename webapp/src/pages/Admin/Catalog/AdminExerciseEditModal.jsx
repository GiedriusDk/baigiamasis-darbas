import { useEffect, useState } from "react";
import { Modal, TextInput, Button, Stack, Group } from "@mantine/core";

export default function AdminExerciseEditModal({
  opened,
  onClose,
  exercise,
  onSave,
}) {
  const [form, setForm] = useState({
    name: "",
    primary_muscle: "",
    equipment: "",
    image_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (exercise && opened) {
      setForm({
        name: exercise.name || "",
        primary_muscle: exercise.primary_muscle || "",
        equipment: exercise.equipment || "",
        image_url: exercise.image_url || "",
      });
      setErr(null);
    }
  }, [exercise, opened]);

  function handleChange(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.currentTarget.value }));
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!onSave) return;

    setSaving(true);
    setErr(null);
    try {
      await onSave(form);
    } catch (error) {
      setErr(error.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Edit exercise" centered>
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="Name"
            value={form.name}
            onChange={handleChange("name")}
            required
          />

          <TextInput
            label="Primary muscle"
            value={form.primary_muscle}
            onChange={handleChange("primary_muscle")}
          />

          <TextInput
            label="Equipment"
            value={form.equipment}
            onChange={handleChange("equipment")}
          />

          <TextInput
            label="Image URL"
            value={form.image_url}
            onChange={handleChange("image_url")}
          />

          {err && (
            <div style={{ color: "red", fontSize: 14 }}>
              {err}
            </div>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}