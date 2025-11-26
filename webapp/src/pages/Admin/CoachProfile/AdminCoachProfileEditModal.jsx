import {
  Modal,
  Group,
  TextInput,
  NumberInput,
  Textarea,
  Button,
  Alert,
} from "@mantine/core";
import { useState, useEffect } from "react";
import { adminUpdateCoachProfile } from "../../../api/profiles";

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

export default function AdminCoachProfileEditModal({
  opened,
  onClose,
  profile,
  onUpdated,
}) {
  const [form, setForm] = useState({
    city: "",
    country: "",
    experience_years: null,
    availability_note: "",
    gym_name: "",
    gym_address: "",
    phone: "",
    website_url: "",
    timezone: "",
    specializations: "",
    socials: "",
    languages: "",
    certifications: "",
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!profile) return;
    setForm({
      city: profile.city || "",
      country: profile.country || "",
      experience_years: profile.experience_years ?? null,
      availability_note: profile.availability_note || "",
      gym_name: profile.gym_name || "",
      gym_address: profile.gym_address || "",
      phone: profile.phone || "",
      website_url: profile.website_url || "",
      timezone: profile.timezone || "",
      specializations: joinArray(profile.specializations),
      socials: joinArray(profile.socials),
      languages: joinArray(profile.languages),
      certifications: joinArray(profile.certifications),
    });
    setErr(null);
  }, [profile, opened]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setErr(null);
    try {
      const payload = {
        city: form.city || null,
        country: form.country || null,
        experience_years:
          form.experience_years === null || form.experience_years === ""
            ? null
            : Number(form.experience_years),
        availability_note: form.availability_note || null,
        gym_name: form.gym_name || null,
        gym_address: form.gym_address || null,
        phone: form.phone || null,
        website_url: form.website_url || null,
        timezone: form.timezone || null,
        specializations: splitToArray(form.specializations),
        socials: splitToArray(form.socials),
        languages: splitToArray(form.languages),
        certifications: splitToArray(form.certifications),
      };

      const res = await adminUpdateCoachProfile(
        profile.user_id || profile.id,
        payload
      );
      const updated = res.data || res;

      onUpdated?.(updated);
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to save coach profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="lg"
      title={
        profile
          ? `Redaguoti trenerį (user #${profile.user_id || profile.id})`
          : "Redaguoti trenerį"
      }
    >
      <form onSubmit={handleSubmit}>
        <Group grow mb="sm">
          <TextInput
            label="Miestas"
            value={form.city}
            onChange={(e) =>
              setForm((f) => ({ ...f, city: e.currentTarget.value }))
            }
          />
          <TextInput
            label="Šalis"
            value={form.country}
            onChange={(e) =>
              setForm((f) => ({ ...f, country: e.currentTarget.value }))
            }
          />
        </Group>

        <Group grow mb="sm">
          <NumberInput
            label="Patirtis (metai)"
            value={form.experience_years}
            onChange={(v) =>
              setForm((f) => ({ ...f, experience_years: v }))
            }
            min={0}
          />
          <TextInput
            label="Laiko juosta"
            value={form.timezone}
            onChange={(e) =>
              setForm((f) => ({ ...f, timezone: e.currentTarget.value }))
            }
          />
        </Group>

        <TextInput
          label="Sporto salės pavadinimas"
          value={form.gym_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, gym_name: e.currentTarget.value }))
          }
          mb="sm"
        />

        <TextInput
          label="Sporto salės adresas"
          value={form.gym_address}
          onChange={(e) =>
            setForm((f) => ({ ...f, gym_address: e.currentTarget.value }))
          }
          mb="sm"
        />

        <Group grow mb="sm">
          <TextInput
            label="Telefonas"
            value={form.phone}
            onChange={(e) =>
              setForm((f) => ({ ...f, phone: e.currentTarget.value }))
            }
          />
          <TextInput
            label="Svetainė"
            value={form.website_url}
            onChange={(e) =>
              setForm((f) => ({ ...f, website_url: e.currentTarget.value }))
            }
          />
        </Group>

        <Textarea
          label="Pasiekiamumas / užimtumas"
          value={form.availability_note}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              availability_note: e.currentTarget.value,
            }))
          }
          minRows={2}
          mb="sm"
        />

        <Textarea
          label="Specializacijos (atskirta kableliais)"
          value={form.specializations}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              specializations: e.currentTarget.value,
            }))
          }
          minRows={2}
          mb="sm"
        />

        <Textarea
          label="Socialiniai tinklai (atskirta kableliais)"
          value={form.socials}
          onChange={(e) =>
            setForm((f) => ({ ...f, socials: e.currentTarget.value }))
          }
          minRows={2}
          mb="sm"
        />

        <Textarea
          label="Kalbos (atskirta kableliais)"
          value={form.languages}
          onChange={(e) =>
            setForm((f) => ({ ...f, languages: e.currentTarget.value }))
          }
          minRows={2}
          mb="sm"
        />

        <Textarea
          label="Sertifikatai (atskirta kableliais)"
          value={form.certifications}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              certifications: e.currentTarget.value,
            }))
          }
          minRows={2}
          mb="sm"
        />

        {err && (
          <Alert color="red" mb="sm">
            {err}
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