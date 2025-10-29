// webapp/src/pages/CoachProfilePage.jsx
import { useEffect, useState } from "react";
import {
  Title, Grid, Stack, Textarea, NumberInput, TextInput,
  Group, Button, Avatar, FileButton, ActionIcon, Tooltip,
  LoadingOverlay, Divider
} from "@mantine/core";
import { IconUpload, IconTrash } from "@tabler/icons-react";
import { getCoachProfile, saveCoachProfile, uploadCoachAvatar } from "../api/profiles";
import { notifications } from "@mantine/notifications";

function toCsv(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.join(", ");
}
function fromCsv(s) {
  if (!s) return [];
  return String(s)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

export default function CoachProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    bio: "",
    experience_years: 0,
    specializations: "",
    avatar_path: "",
    city: "",
    country: "",
    availability_note: "",
    timezone: "",
    languages: "",
    certifications: "",
    phone: "",
    website_url: "",
    socials: {
      instagram: "",
      facebook: "",
      youtube: "",
      linkedin: "",
      tiktok: "",
      other: ""
    }
  });

  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await getCoachProfile();
        if (p) {
          setForm((f) => ({
            ...f,
            ...p,
            specializations: toCsv(p.specializations),
            languages: toCsv(p.languages),
            certifications: toCsv(p.certifications),
            socials: {
              instagram: p?.socials?.instagram || "",
              facebook: p?.socials?.facebook || "",
              youtube: p?.socials?.youtube || "",
              linkedin: p?.socials?.linkedin || "",
              tiktok: p?.socials?.tiktok || "",
              other: p?.socials?.other || ""
            }
          }));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function updateSocial(k, v) {
    setForm((f) => ({ ...f, socials: { ...f.socials, [k]: v } }));
  }

  async function onSave() {
    setSaving(true);
    try {
      if (avatarFile) {
        const { url } = await uploadCoachAvatar(avatarFile);
        update("avatar_path", url);
        window.dispatchEvent(new CustomEvent("profile:updated", { detail: { avatar: url } }));
      }

      const payload = {
        bio: form.bio || null,
        city: form.city || null,
        country: form.country || null,
        experience_years: Number(form.experience_years || 0),
        specializations: fromCsv(form.specializations),
        availability_note: form.availability_note || null,
        avatar_path: form.avatar_path || null,
        timezone: form.timezone || null,
        languages: fromCsv(form.languages),
        certifications: fromCsv(form.certifications),
        phone: form.phone || null,
        website_url: form.website_url || null,
        gym_name: form.gym_name || null,
        gym_address: form.gym_address || null,
        socials: {
          instagram: form.socials?.instagram || "",
          facebook: form.socials?.facebook || "",
          youtube: form.socials?.youtube || "",
          linkedin: form.socials?.linkedin || "",
          tiktok: form.socials?.tiktok || "",
          other: form.socials?.other || ""
        }
      };

      const saved = await saveCoachProfile(payload);
      setForm((f) => ({
        ...f,
        ...saved,
        specializations: toCsv(saved.specializations),
        languages: toCsv(saved.languages),
        certifications: toCsv(saved.certifications),
        socials: {
          instagram: saved?.socials?.instagram || "",
          facebook: saved?.socials?.facebook || "",
          youtube: saved?.socials?.youtube || "",
          linkedin: saved?.socials?.linkedin || "",
          tiktok: saved?.socials?.tiktok || "",
          other: saved?.socials?.other || ""
        }
      }));
      setAvatarFile(null);
      notifications.show({ color: "green", message: "Profile saved" });
    } catch (e) {
      notifications.show({ color: "red", message: e.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  function clearAvatar() {
    setAvatarFile(null);
    update("avatar_path", "");
    window.dispatchEvent(new CustomEvent("profile:updated", { detail: { avatar: "" } }));
  }

  const avatarPreview = avatarFile ? URL.createObjectURL(avatarFile) : form.avatar_path || undefined;

  return (
    <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto", position: "relative" }}>
      <LoadingOverlay visible={loading} zIndex={10} />
      <Group justify="space-between" mb="md">
        <Title order={2}>Coach profile</Title>
      </Group>
      <Divider mb="lg" />

      <Grid gutter="xl" align="start">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            <Stack gap="xs" align="center">
              <Avatar
                src={avatarPreview}
                size={140}
                radius={999}
                styles={{ root: { boxShadow: "0 8px 24px rgba(0,0,0,.10)" }, image: { objectFit: "cover" } }}
              />
              <Group gap="xs">
                <FileButton onChange={setAvatarFile} accept="image/png,image/jpeg,image/jpg,image/webp">
                  {(props) => <Button leftSection={<IconUpload size={16} />} {...props}>Upload</Button>}
                </FileButton>
                {(avatarFile || form.avatar_path) && (
                  <Tooltip label="Remove avatar">
                    <ActionIcon variant="light" color="red" onClick={clearAvatar}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Stack>

            <TextInput
              label="City"
              placeholder="Vilnius"
              value={form.city}
              onChange={(e) => update("city", e.currentTarget.value)}
            />
            <TextInput
              label="Country"
              placeholder="Lithuania"
              value={form.country}
              onChange={(e) => update("country", e.currentTarget.value)}
            />
            <TextInput
              label="Timezone"
              placeholder="Europe/Vilnius"
              value={form.timezone}
              onChange={(e) => update("timezone", e.currentTarget.value)}
            />
            <TextInput
              label="Phone"
              placeholder="+370 ..."
              value={form.phone}
              onChange={(e) => update("phone", e.currentTarget.value)}
            />
            <TextInput
              label="Website"
              placeholder="https://your-site.com"
              value={form.website_url}
              onChange={(e) => update("website_url", e.currentTarget.value)}
            />
            <TextInput
              label="Gym name"
              placeholder="Example: GymPlus, Impuls..."
              value={form.gym_name}
              onChange={(e) => update("gym_name", e.currentTarget.value)}
            />
            <TextInput
              label="Gym address"
              placeholder="Street, city, country"
              value={form.gym_address}
              onChange={(e) => update("gym_address", e.currentTarget.value)}
            />
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="lg">
            <Textarea
              label="Bio"
              placeholder="Tell about your coaching style, certifications, achievements..."
              minRows={4}
              value={form.bio}
              onChange={(e) => update("bio", e.currentTarget.value)}
            />

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Experience (years)"
                  min={0}
                  value={form.experience_years}
                  onChange={(v) => update("experience_years", Number(v || 0))}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Specializations (comma separated)"
                  placeholder="weight loss, strength, mobility"
                  value={form.specializations}
                  onChange={(e) => update("specializations", e.currentTarget.value)}
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Languages (comma separated)"
                  placeholder="lt, en"
                  value={form.languages}
                  onChange={(e) => update("languages", e.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Certifications (comma separated)"
                  placeholder="NASM-CPT, FMS Lv1"
                  value={form.certifications}
                  onChange={(e) => update("certifications", e.currentTarget.value)}
                />
              </Grid.Col>
            </Grid>

            <Textarea
              label="Availability note"
              placeholder="Weekdays after 18:00, Saturdays 9–12"
              minRows={3}
              value={form.availability_note}
              onChange={(e) => update("availability_note", e.currentTarget.value)}
            />

            <Divider label="Socials" />
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Instagram"
                  placeholder="https://instagram.com/username"
                  value={form.socials.instagram}
                  onChange={(e) => updateSocial("instagram", e.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Facebook"
                  placeholder="https://facebook.com/username"
                  value={form.socials.facebook}
                  onChange={(e) => updateSocial("facebook", e.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="YouTube"
                  placeholder="https://youtube.com/@channel"
                  value={form.socials.youtube}
                  onChange={(e) => updateSocial("youtube", e.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="LinkedIn"
                  placeholder="https://linkedin.com/in/username"
                  value={form.socials.linkedin}
                  onChange={(e) => updateSocial("linkedin", e.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="TikTok"
                  placeholder="https://tiktok.com/@username"
                  value={form.socials.tiktok}
                  onChange={(e) => updateSocial("tiktok", e.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Other"
                  placeholder="Any other link"
                  value={form.socials.other}
                  onChange={(e) => updateSocial("other", e.currentTarget.value)}
                />
              </Grid.Col>
            </Grid>

            <Group justify="flex-end">
              <Button onClick={onSave} loading={saving} size="md">Save</Button>
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>
    </div>
  );
}