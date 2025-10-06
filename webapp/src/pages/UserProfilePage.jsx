// webapp/src/pages/UserProfilePage.jsx
import { useEffect, useState } from 'react';
import {
  Title, Grid, Stack, Textarea, NumberInput, TextInput,
  Group, Button, Avatar, FileButton, ActionIcon, Tooltip,
  LoadingOverlay, Divider, Select
} from '@mantine/core';
import { IconUpload, IconTrash } from '@tabler/icons-react';
import { getUserProfile, saveUserProfile, uploadUserAvatar } from '../api/profiles';
import { notifications } from '@mantine/notifications';

export default function UserProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    sex: '',
    birth_date: '',
    height_cm: null,
    weight_kg: null,
    goal: '',
    activity_level: '',
    sessions_per_week: 0,
    available_minutes: 0,
    injuries_note: '',
    avatar_path: '',
  });

  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await getUserProfile();
        if (p) setForm(f => ({ ...f, ...p }));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function update(k, v) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function onSave() {
    setSaving(true);
    try {
      let newAvatarPath = form.avatar_path;

      if (avatarFile) {
        const { url } = await uploadUserAvatar(avatarFile); // turi grąžinti pilną URL per gateway
        newAvatarPath = url;
      }

      const payload = { ...form, avatar_path: newAvatarPath };
      const res = await saveUserProfile(payload);

      setForm(f => ({ ...f, ...res, avatar_path: newAvatarPath }));
      setAvatarFile(null);

      // pranešk header’iui, kad perpieštų avatarą
      window.dispatchEvent(new CustomEvent('profile:updated', { detail: { avatar: newAvatarPath } }));

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
    <div style={{ width: '100%', maxWidth: 1000, margin: '0 auto', position: 'relative' }}>
      <LoadingOverlay visible={loading} zIndex={10} />

      <Group justify="space-between" mb="md">
        <Title order={2}>My profile</Title>
      </Group>

      <Divider mb="lg" />

      <Grid gutter="xl" align="start">
        {/* Left: avatar + personal */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            <Stack gap="xs" align="center">
              <Avatar
                src={avatarPreview}
                size={140}
                radius={999}
                styles={{ root: { boxShadow: '0 8px 24px rgba(0,0,0,.1)' }, image: { objectFit: 'cover' } }}
              />
              <Group gap="xs">
                <FileButton onChange={setAvatarFile} accept="image/*">
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

            <Select
              label="Sex"
              data={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
              value={form.sex}
              onChange={(v) => update('sex', v)}
            />

            <TextInput
              label="Birth date"
              placeholder="yyyy-mm-dd"
              value={form.birth_date || ''}
              onChange={(e) => update('birth_date', e.currentTarget.value)}
            />

            <NumberInput
              label="Height (cm)"
              value={form.height_cm ?? ''}
              onChange={(v) => update('height_cm', v)}
            />

            <NumberInput
              label="Weight (kg)"
              value={form.weight_kg ?? ''}
              onChange={(v) => update('weight_kg', v)}
            />
          </Stack>
        </Grid.Col>

        {/* Right: goals */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="lg">
            <Select
              label="Goal"
              data={[
                { value: 'fat_loss', label: 'Fat loss' },
                { value: 'muscle_gain', label: 'Muscle gain' },
                { value: 'performance', label: 'Performance' },
                { value: 'general_fitness', label: 'General fitness' },
              ]}
              value={form.goal}
              onChange={(v) => update('goal', v)}
            />

            <Select
              label="Activity level"
              data={[
                { value: 'sedentary', label: 'Sedentary' },
                { value: 'light', label: 'Light' },
                { value: 'moderate', label: 'Moderate' },
                { value: 'active', label: 'Active' },
                { value: 'very_active', label: 'Very active' },
              ]}
              value={form.activity_level}
              onChange={(v) => update('activity_level', v)}
            />

            <NumberInput
              label="Sessions per week"
              value={form.sessions_per_week ?? 0}
              onChange={(v) => update('sessions_per_week', v)}
            />

            <NumberInput
              label="Available minutes per workout"
              value={form.available_minutes ?? 0}
              onChange={(v) => update('available_minutes', v)}
            />

            <Textarea
              label="Injuries / Notes"
              minRows={3}
              value={form.injuries_note || ''}
              onChange={(e) => update('injuries_note', e.currentTarget.value)}
            />

            <Group justify="flex-end">
              <Button onClick={onSave} loading={saving}>Save</Button>
            </Group>
          </Stack>
        </Grid.Col>
      </Grid>
    </div>
  );
}