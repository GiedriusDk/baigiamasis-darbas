// webapp/src/pages/CoachProfilePage.jsx
import { useEffect, useState } from 'react';
import {
  Title, Grid, Stack, Textarea, NumberInput, TextInput,
  Group, Button, Avatar, FileButton, ActionIcon, Tooltip,
  LoadingOverlay, Divider, Text
} from '@mantine/core';
import { IconUpload, IconTrash } from '@tabler/icons-react';
import { getCoachProfile, saveCoachProfile, uploadCoachAvatar } from '../api/profiles';
import { me, updateMe } from '../api/auth';
import { notifications } from '@mantine/notifications';

export default function CoachProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Vartotojas iš AUTH (vardas, email)
  const [user, setUser] = useState(null);
  const [name, setName] = useState(''); // ← TRŪKO

  // Trenerio profilis iš PROFILES
  const [form, setForm] = useState({
    bio: '',
    experience_years: 0,
    price_per_session: 0,
    specializations: '',
    avatar_path: '',
    city: '',
    availability_note: '',
  });

  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [u, p] = await Promise.all([me(), getCoachProfile()]);
        if (u) { setUser(u); setName(u.name || ''); }
        if (p) setForm((f) => ({ ...f, ...p }));
      } catch {
        // jei profilio nėra – bus kuriamas pirmo išsaugojimo metu
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function onSave() {
    setSaving(true);
    try {
      // 1) jei pakeistas vardas – atnaujinam AUTH
      if (user && name && name !== (user.name || '')) {
        const u = await updateMe({ name });
        window.dispatchEvent(new CustomEvent('auth:updated', { detail: { name } }));
        setUser(u);
      }

      // 2) jei įkeltas avataro failas – upload į PROFILES
      if (avatarFile) {
        const { url } = await uploadCoachAvatar(avatarFile); // grįžta { url }
        update('avatar_path', url);
        // pranešam header’iui, kad atsinaujintų avataras
        window.dispatchEvent(new CustomEvent('profile:updated', { detail: { avatar: url } }));
      }

      // 3) išsaugom coach profilį
      const payload = { ...form };
      const res = await saveCoachProfile(payload); // PUT /profiles/api/coach/profile
      setForm((f) => ({ ...f, ...res }));
      setAvatarFile(null);

      notifications.show({ color: 'green', message: 'Profile saved' });
    } catch (e) {
      notifications.show({ color: 'red', message: e.message || 'Save failed' });
    } finally {
      setSaving(false);
    }

  }
  
  function clearAvatar() {
    setAvatarFile(null);
    update('avatar_path', '');
    window.dispatchEvent(new CustomEvent('profile:updated', { detail: { avatar: '' } }));
  }

  const avatarPreview = avatarFile ? URL.createObjectURL(avatarFile) : (form.avatar_path || undefined);

  return (
    <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
      <LoadingOverlay visible={loading} zIndex={10} />
      <Group justify="space-between" mb="md">
        <Title order={2}>Coach profile</Title>
      </Group>
      <Divider mb="lg" />

      <Grid gutter="xl" align="start">
        {/* Kairė kolona – Avatar + asmeniniai laukai */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            <Stack gap="xs" align="center">
              <Avatar
                src={avatarPreview}
                size={140}
                radius={999}
                styles={{ root: { boxShadow: '0 8px 24px rgba(0,0,0,.10)' }, image: { objectFit: 'cover' } }}
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
              <Text c="dimmed" size="sm">Square image looks best (min ~400×400).</Text>
            </Stack>

            {/* Vardas – iš AUTH */}
            <TextInput
              label="Name"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
            />

            <TextInput
              label="City"
              placeholder="e.g. Vilnius"
              value={form.city}
              onChange={(e) => update('city', e.currentTarget.value)}
            />

            <Textarea
              label="Availability note"
              placeholder="e.g. Weekdays after 18:00, Saturdays 9–12"
              minRows={3}
              value={form.availability_note}
              onChange={(e) => update('availability_note', e.currentTarget.value)}
            />
          </Stack>
        </Grid.Col>

        {/* Dešinė kolona */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="lg">
            <Textarea
              label="Bio"
              placeholder="Tell about your coaching style, certifications, achievements..."
              minRows={4}
              value={form.bio}
              onChange={(e) => update('bio', e.currentTarget.value)}
            />

            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Experience (years)"
                  min={0}
                  value={form.experience_years}
                  onChange={(v) => update('experience_years', Number(v || 0))}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <NumberInput
                  label="Price per session"
                  min={0}
                  value={form.price_per_session}
                  onChange={(v) => update('price_per_session', Number(v || 0))}
                  leftSection="€"
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label="Specializations"
              placeholder="e.g. weight loss, strength, mobility, post-injury"
              value={form.specializations}
              onChange={(e) => update('specializations', e.currentTarget.value)}
            />

            <Group justify="flex-end">
              <Button onClick={onSave} loading={saving} size="md">Save</Button>
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>
    </div>
  );
}