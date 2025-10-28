import { useEffect, useState } from 'react';
import {
  Title, Grid, Stack, Textarea, NumberInput, TextInput,
  Group, Button, Avatar, FileButton, ActionIcon, Tooltip,
  LoadingOverlay, Divider, Select, MultiSelect
} from '@mantine/core';
import { IconUpload, IconTrash } from '@tabler/icons-react';
import { getUserProfile, saveUserProfile, uploadUserAvatar } from '../api/profiles';
import { notifications } from '@mantine/notifications';

const EQUIPMENT_OPTS = [
  { value: 'gym',        label: 'Full gym' },
  { value: 'dumbbell',   label: 'Dumbbells' },
  { value: 'barbell',    label: 'Barbell' },
  { value: 'cable',      label: 'Cables' },
  { value: 'body weight',label: 'Body weight' },
  { value: 'kettlebell', label: 'Kettlebell' },
];

const INJURY_OPTIONS = [
  { value: 'arms', label: 'Arms' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'back', label: 'Back' },
  { value: 'knees', label: 'Knees' },
  { value: 'ankles', label: 'Ankles' },
  { value: 'legs', label: 'Legs' },
];

export default function UserProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    sex: null,
    birth_date: '',
    height_cm: null,
    weight_kg: null,
    goal: null,
    activity_level: null,
    sessions_per_week: null,
    available_minutes: null,
    equipment: [],
    injuries: [],
    avatar_path: '',
  });

  const [avatarFile, setAvatarFile] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await getUserProfile();
        if (p) {
          const toInt = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
          setForm(f => ({
            ...f,
            ...p,
            goal: p.goal ?? null,
            activity_level: p.activity_level ?? null,
            sessions_per_week: toInt(p.sessions_per_week),
            available_minutes: toInt(p.available_minutes),
            equipment: Array.isArray(p.equipment) ? p.equipment : [],
            injuries: Array.isArray(p.injuries) ? p.injuries : [],
            birth_date: p.birth_date || '',
          }));
        }
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
        const { url } = await uploadUserAvatar(avatarFile);
        newAvatarPath = url;
      }

      const payload = {
        ...form,
        avatar_path: newAvatarPath,
        sessions_per_week: form.sessions_per_week != null ? Number(form.sessions_per_week) : null,
        available_minutes: form.available_minutes != null ? Number(form.available_minutes) : null,
        height_cm: form.height_cm != null ? Number(form.height_cm) : null,
        weight_kg: form.weight_kg != null ? Number(form.weight_kg) : null,
        equipment: Array.isArray(form.equipment) ? form.equipment : [],
        injuries: Array.isArray(form.injuries) ? form.injuries : [],
      };

      const res = await saveUserProfile(payload);

      setForm(f => ({
        ...f,
        ...res,
        avatar_path: newAvatarPath,
        goal: res.goal ?? null,
        activity_level: res.activity_level ?? null,
        sessions_per_week: (res.sessions_per_week ?? null),
        available_minutes: (res.available_minutes ?? null),
        equipment: Array.isArray(res.equipment) ? res.equipment : [],
        injuries: Array.isArray(res.injuries) ? res.injuries : [],
        birth_date: res.birth_date || '',
      }));
      setAvatarFile(null);

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
              clearable
            />

            <TextInput
              label="Birth date"
              placeholder="yyyy-mm-dd"
              value={form.birth_date || ''}
              onChange={(e) => update('birth_date', e.currentTarget.value)}
            />

            <NumberInput
              label="Height (cm)"
              value={form.height_cm ?? undefined}
              onChange={(v) => update('height_cm', v == null ? null : Number(v))}
            />

            <NumberInput
              label="Weight (kg)"
              value={form.weight_kg ?? undefined}
              onChange={(v) => update('weight_kg', v == null ? null : Number(v))}
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
              clearable
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
              clearable
            />

            <NumberInput
              label="Sessions per week"
              value={form.sessions_per_week ?? undefined}
              onChange={(v) => update('sessions_per_week', v == null ? null : Number(v))}
              min={0}
              max={14}
            />

            <NumberInput
              label="Available minutes per workout"
              value={form.available_minutes ?? undefined}
              onChange={(v) => update('available_minutes', v == null ? null : Number(v))}
              min={0}
              max={300}
            />

            <MultiSelect
              label="Equipment"
              data={EQUIPMENT_OPTS}
              value={form.equipment ?? []}
              onChange={(vals) => update('equipment', vals)}
              searchable
              clearable
            />

            <MultiSelect
              label="Injuries"
              data={INJURY_OPTIONS}
              value={form.injuries ?? []}
              onChange={(vals) => update('injuries', vals)}
              searchable
              clearable
              placeholder="Select any areas to avoid"
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