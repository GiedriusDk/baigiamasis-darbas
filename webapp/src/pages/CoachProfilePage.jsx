import { useEffect, useState } from "react";
import {
  Title, Grid, Stack, Textarea, NumberInput, TextInput,
  Group, Button, Avatar, FileButton, ActionIcon, Tooltip,
  LoadingOverlay, Divider
} from "@mantine/core";
import { IconUpload, IconTrash } from "@tabler/icons-react";
import { getCoachProfile, saveCoachProfile, uploadCoachAvatar } from "../api/profiles";
import { notifications } from "@mantine/notifications";

function toCsv(arr) { return Array.isArray(arr) ? arr.join(", ") : ""; }
function fromCsv(s) { return s ? String(s).split(",").map(x=>x.trim()).filter(Boolean) : []; }

export default function CoachProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bio: "", experience_years: 0, specializations: "", avatar_path: "",
    city: "", country: "", availability_note: "",
    languages: "", certifications: "", phone: "", website_url: "",
    gym_name: "", gym_address: "",
    socials: { instagram:"", facebook:"", youtube:"", linkedin:"", tiktok:"", other:"" }
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarCleared, setAvatarCleared] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const p = await getCoachProfile();
        if (!p) return;
        setForm(f => ({
          ...f, ...p,
          specializations: toCsv(p.specializations),
          languages: toCsv(p.languages),
          certifications: toCsv(p.certifications),
          socials: {
            instagram: p?.socials?.instagram || "",
            facebook:  p?.socials?.facebook  || "",
            youtube:   p?.socials?.youtube   || "",
            linkedin:  p?.socials?.linkedin  || "",
            tiktok:    p?.socials?.tiktok    || "",
            other:     p?.socials?.other     || ""
          }
        }));
      } finally { setLoading(false); }
    })();
  }, []);

  function update(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function updateSocial(k, v) { setForm(f => ({ ...f, socials: { ...f.socials, [k]: v } })); }

  function clearAvatar() {
    setAvatarFile(null);
    setAvatarCleared(true);
    update("avatar_path", "");
    window.dispatchEvent(new CustomEvent("profile:updated", { detail: { avatar: "" } }));
  }

  async function onSave() {
    setSaving(true);
    try {
      let avatarUrlToSave = null;
      if (avatarCleared) {
        avatarUrlToSave = null;
      } else if (avatarFile) {
        const { url } = await uploadCoachAvatar(avatarFile);
        avatarUrlToSave = url?.startsWith("http") ? url : `${window.location.origin}${url || ""}`;
      } else {
        avatarUrlToSave = form.avatar_path || null;
      }

      const payload = {
        bio: form.bio || null,
        city: form.city || null,
        country: form.country || null,
        experience_years: Number(form.experience_years || 0),
        specializations: fromCsv(form.specializations),
        availability_note: form.availability_note || null,
        avatar_path: avatarUrlToSave,
        languages: fromCsv(form.languages),
        certifications: fromCsv(form.certifications),
        phone: form.phone || null,
        website_url: form.website_url || null,
        gym_name: form.gym_name || null,
        gym_address: form.gym_address || null,
        socials: form.socials
      };

      const saved = await saveCoachProfile(payload);
      setForm(f => ({
        ...f, ...saved,
        avatar_path: avatarUrlToSave || "",
        specializations: toCsv(saved.specializations),
        languages: toCsv(saved.languages),
        certifications: toCsv(saved.certifications),
        socials: saved?.socials || f.socials
      }));

      if (avatarUrlToSave)
        window.dispatchEvent(new CustomEvent("profile:updated", { detail: { avatar: avatarUrlToSave } }));

      setAvatarFile(null);
      setAvatarCleared(false);
      notifications.show({ color: "green", message: "Profile saved" });
    } catch (e) {
      notifications.show({ color: "red", message: e?.message || "Save failed" });
    } finally { setSaving(false); }
  }

  const avatarPreview = avatarFile
    ? URL.createObjectURL(avatarFile)
    : (form.avatar_path || undefined);

  return (
    <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto", position: "relative" }}>
      <LoadingOverlay visible={loading} zIndex={10} />
      <Group justify="space-between" mb="md"><Title order={2}>Coach profile</Title></Group>
      <Divider mb="lg" />
      <Grid gutter="xl" align="start">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            <Stack gap="xs" align="center">
              <Avatar src={avatarPreview} size={140} radius={999}
                styles={{ root: { boxShadow: "0 8px 24px rgba(0,0,0,.10)" }, image: { objectFit: "cover" } }} />
              <Group gap="xs">
                <FileButton onChange={setAvatarFile} accept="image/*">
                  {(props) => <Button leftSection={<IconUpload size={16} />} {...props}>Upload</Button>}
                </FileButton>
                {(avatarFile || (!!form.avatar_path && !avatarCleared)) && (
                  <Tooltip label="Remove avatar">
                    <ActionIcon variant="light" color="red" onClick={clearAvatar}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Stack>
            <TextInput label="City" value={form.city ?? ""} onChange={(e)=>update("city",e.currentTarget.value)} />
            <TextInput label="Country" value={form.country ?? ""} onChange={(e)=>update("country",e.currentTarget.value)} />
            <TextInput label="Phone" value={form.phone ?? ""} onChange={(e)=>update("phone",e.currentTarget.value)} />
            <TextInput label="Website" value={form.website_url ?? ""} onChange={(e)=>update("website_url",e.currentTarget.value)} />
            <TextInput label="Gym name" value={form.gym_name ?? ""} onChange={(e)=>update("gym_name",e.currentTarget.value)} />
            <TextInput label="Gym address" value={form.gym_address ?? ""} onChange={(e)=>update("gym_address",e.currentTarget.value)} />
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="lg">
            <Textarea label="Bio" minRows={4} value={form.bio ?? ""} onChange={(e)=>update("bio",e.currentTarget.value)} />
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput label="Experience (years)" min={0} value={form.experience_years ?? 0}
                  onChange={(v)=>update("experience_years",Number(v||0))}/>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Specializations (comma separated)" value={form.specializations ?? ""}
                  onChange={(e)=>update("specializations",e.currentTarget.value)} />
              </Grid.Col>
            </Grid>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Languages (comma separated)" value={form.languages ?? ""}
                  onChange={(e)=>update("languages",e.currentTarget.value)} />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput label="Certifications (comma separated)" value={form.certifications ?? ""}
                  onChange={(e)=>update("certifications",e.currentTarget.value)} />
              </Grid.Col>
            </Grid>
            <Textarea label="Availability note" minRows={3}
              value={form.availability_note ?? ""} onChange={(e)=>update("availability_note",e.currentTarget.value)} />
            <Divider label="Socials" />
            <Grid>
              {Object.entries(form.socials).map(([k,v])=>(
                <Grid.Col key={k} span={{ base: 12, sm: 6 }}>
                  <TextInput label={k.charAt(0).toUpperCase()+k.slice(1)}
                    value={v} onChange={(e)=>updateSocial(k,e.currentTarget.value)} />
                </Grid.Col>
              ))}
            </Grid>
            <Group justify="flex-end"><Button onClick={onSave} loading={saving} size="md">Save</Button></Group>
          </Stack>
        </Grid.Col>
      </Grid>
    </div>
  );
}