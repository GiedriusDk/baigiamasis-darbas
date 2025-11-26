import { useEffect, useState } from "react";
import {
  Modal,
  TextInput,
  NumberInput,
  Textarea,
  Alert,
  Group,
  Button,
} from "@mantine/core";
import { adminUpdateProfile } from "../../../api/profiles";

function joinArray(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function splitToArray(value) {
  if (!value) return null;
  const arr = String(value)
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  return arr.length ? arr : null;
}

export default function AdminProfileEditModal({
  opened,
  profile,
  onClose,
  onUpdated,
}) {
  const [form, setForm] = useState({
    city: "",
    goal: "",
    sex: "",
    activity_level: "",
    sessions_per_week: null,
    available_minutes: null,
    height_cm: null,
    weight_kg: null,
    equipment: "",
    preferences: "",
    injuries: "",
  });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      city: profile.city || "",
      goal: profile.goal || "",
      sex: profile.sex || "",
      activity_level: profile.activity_level || "",
      sessions_per_week: profile.sessions_per_week ?? null,
      available_minutes: profile.available_minutes ?? null,
      height_cm: profile.height_cm ?? null,
      weight_kg: profile.weight_kg ?? null,
      equipment: joinArray(profile.equipment),
      preferences: joinArray(profile.preferences),
      injuries: joinArray(profile.injuries),
    });
    setFormErr(null);
  }, [profile]);

  async function handleSave(e) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setFormErr(null);

    try {
      const payload = {
        city: form.city || null,
        goal: form.goal || null,
        sex: form.sex || null,
        activity_level: form.activity_level || null,
        sessions_per_week:
          form.sessions_per_week === null || form.sessions_per_week === ""
            ? null
            : Number(form.sessions_per_week),
        available_minutes:
          form.available_minutes === null || form.available_minutes === ""
            ? null
            : Number(form.available_minutes),
        height_cm:
          form.height_cm === null || form.height_cm === ""
            ? null
            : Number(form.height_cm),
        weight_kg:
          form.weight_kg === null || form.weight_kg === ""
            ? null
            : Number(form.weight_kg),
        equipment: splitToArray(form.equipment),
        preferences: splitToArray(form.preferences),
        injuries: splitToArray(form.injuries),
      };

      const userId = profile.user_id || profile.id;
      const res = await adminUpdateProfile(userId, payload);
      const updated = res.data || res;

      if (onUpdated) onUpdated(updated);
      onClose();
    } catch (e) {
      setFormErr(e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        profile
          ? `Redaguoti profilį (user #${profile.user_id || profile.id})`
          : "Redaguoti profilį"
      }
      centered
      size="lg"
    >
      <form onSubmit={handleSave}>
        <Group grow mb="sm">
          <TextInput
            label="Tikslas"
            value={form.goal}
            onChange={(e) =>
              setForm((f) => ({ ...f, goal: e.currentTarget.value }))
            }
          />
          <TextInput
            label="Lytis"
            value={form.sex}
            onChange={(e) =>
              setForm((f) => ({ ...f, sex: e.currentTarget.value }))
            }
          />
        </Group>

        <Group grow mb="sm">
          <NumberInput
            label="Treniruotės per savaitę"
            value={form.sessions_per_week}
            onChange={(value) =>
              setForm((f) => ({ ...f, sessions_per_week: value }))
            }
            min={0}
            max={21}
          />
          <NumberInput
            label="Minutės vienai sesijai"
            value={form.available_minutes}
            onChange={(value) =>
              setForm((f) => ({ ...f, available_minutes: value }))
            }
            min={0}
            max={600}
          />
        </Group>

        <Group grow mb="sm">
          <NumberInput
            label="Ūgis (cm)"
            value={form.height_cm}
            onChange={(value) =>
              setForm((f) => ({ ...f, height_cm: value }))
            }
            min={0}
          />
          <NumberInput
            label="Svoris (kg)"
            value={form.weight_kg}
            onChange={(value) =>
              setForm((f) => ({ ...f, weight_kg: value }))
            }
            min={0}
            precision={2}
          />
        </Group>

        <TextInput
          label="Aktyvumo lygis"
          value={form.activity_level}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              activity_level: e.currentTarget.value,
            }))
          }
          mb="sm"
        />

        <Textarea
          label="Įranga (atskirta kableliais)"
          value={form.equipment}
          onChange={(e) =>
            setForm((f) => ({ ...f, equipment: e.currentTarget.value }))
          }
          mb="sm"
          minRows={2}
        />

        <Textarea
          label="Preferencijos (atskirta kableliais)"
          value={form.preferences}
          onChange={(e) =>
            setForm((f) => ({ ...f, preferences: e.currentTarget.value }))
          }
          mb="sm"
          minRows={2}
        />

        <Textarea
          label="Traumos (atskirta kableliais)"
          value={form.injuries}
          onChange={(e) =>
            setForm((f) => ({ ...f, injuries: e.currentTarget.value }))
          }
          mb="sm"
          minRows={2}
        />

        {formErr && (
          <Alert color="red" mb="sm">
            {formErr}
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
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