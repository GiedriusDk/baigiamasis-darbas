// src/pages/Admin/CoachExercises/AdminCoachExerciseEditModal.jsx
import { useState, useEffect } from "react";
import {
  Modal,
  TextInput,
  Textarea,
  Group,
  Button,
  NumberInput,
  Alert,
} from "@mantine/core";

import { adminUpdateCoachExercise } from "../../../api/profiles";

export default function AdminCoachExerciseEditModal({
  opened,
  onClose,
  item,
  onUpdated,
}) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    equipment: "",
    primary_muscle: "",
    difficulty: "",
    tags: "",
    media_path: "",
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title || "",
        description: item.description || "",
        equipment: item.equipment || "",
        primary_muscle: item.primary_muscle || "",
        difficulty: item.difficulty || "",
        tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
        media_path: item.media_path || "",
      });
    }
  }, [item]);

  async function handleSave() {
    if (!item) return;

    setSaving(true);
    setErr(null);

    try {
      const payload = {
        title: form.title || null,
        description: form.description || null,
        equipment: form.equipment || null,
        primary_muscle: form.primary_muscle || null,
        difficulty: form.difficulty || null,
        tags: form.tags
          ? form.tags.split(",").map((s) => s.trim())
          : null,
        media_path: form.media_path || null,
      };

      const res = await adminUpdateCoachExercise(item.id, payload);
      const updated = res.data || res;

      onUpdated(updated);
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={item ? `Redaguoti pratimą #${item.id}` : "Redagavimas"}
      centered
      size="lg"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }}
      >
        <TextInput
          label="Pavadinimas"
          value={form.title}
          onChange={(e) =>
            setForm((f) => ({ ...f, title: e.currentTarget.value }))
          }
          mb="sm"
        />

        <Textarea
          label="Aprašymas"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.currentTarget.value }))
          }
          minRows={3}
          mb="sm"
        />

        <TextInput
          label="Raumuo"
          value={form.primary_muscle}
          onChange={(e) =>
            setForm((f) => ({ ...f, primary_muscle: e.currentTarget.value }))
          }
          mb="sm"
        />

        <TextInput
          label="Įranga"
          value={form.equipment}
          onChange={(e) =>
            setForm((f) => ({ ...f, equipment: e.currentTarget.value }))
          }
          mb="sm"
        />

        <TextInput
          label="Sunkumas"
          value={form.difficulty}
          onChange={(e) =>
            setForm((f) => ({ ...f, difficulty: e.currentTarget.value }))
          }
          mb="sm"
        />

        <TextInput
          label="Žymės (atskirta kableliais)"
          value={form.tags}
          onChange={(e) =>
            setForm((f) => ({ ...f, tags: e.currentTarget.value }))
          }
          mb="sm"
        />

        <TextInput
          label="Media URL"
          value={form.media_path}
          onChange={(e) =>
            setForm((f) => ({ ...f, media_path: e.currentTarget.value }))
          }
          mb="sm"
        />

        {err && <Alert color="red" mb="sm">{err}</Alert>}

        <Group justify="flex-end">
          <Button variant="subtle" onClick={onClose}>
            Atšaukti
          </Button>
          <Button type="submit" loading={saving}>
            Išsaugoti
          </Button>
        </Group>
      </form>
    </Modal>
  );
}