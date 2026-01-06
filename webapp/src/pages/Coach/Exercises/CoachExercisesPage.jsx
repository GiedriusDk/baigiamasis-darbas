import { useEffect, useState } from 'react';
import {
  Title, Text, Grid, Paper, Group, Stack, TextInput, Textarea, Select,
  Button, Badge, Image, Card, ActionIcon, FileButton, Divider,
  Loader, Alert, Tooltip, Switch
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconTrash, IconUpload, IconPhoto, IconMovie,
  IconPencil, IconArrowUp, IconArrowDown
} from '@tabler/icons-react';

import {
  listCoachExercises,
  createCoachExercise,
  updateCoachExercise,
  deleteCoachExercise,
  reorderCoachExercises,
} from '../../../api/profiles';
import { myProducts } from "../../../api/payments";
import { useAuth } from "../../../auth/useAuth";

const difficulties = [
  { value: 'easy',   label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard',   label: 'Hard' },
];

function getYoutubeId(url = '') {
  const rx = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i;
  const m = url.match(rx);
  return m ? m[1] : null;
}
function isVideoUrl(u = '') {
  const x = u.toLowerCase();
  return x.endsWith('.mp4') || x.endsWith('.webm') || x.includes('vimeo.com');
}
function isGifUrl(u = '') {
  return /\/[^?]+\.(gif)(?:\?|$)/i.test(u);
}
function isImageUrl(u = '') {
  return /\/[^?]+\.(png|jpg|jpeg|webp|avif)(?:\?|$)/i.test(u);
}

function MediaThumb({ url, blurred = false, mimeType }) {
  if (!url) return <IconPhoto size={48} color="var(--mantine-color-dimmed)" />;

  const commonStyle = {
    filter: blurred ? 'blur(8px) brightness(0.8)' : 'none',
    userSelect: 'none',
    borderRadius: 12,
    display: 'block',
    width: '100%',
  };

  if (mimeType?.startsWith('video/')) {
    return <video src={url} height={160} controls={!blurred} style={{ ...commonStyle, maxWidth: '100%' }} />;
  }
  if (mimeType?.startsWith('image/')) {
    return (
      <Image
        src={url}
        alt=""
        height={160}
        fit="contain"
        radius="md"
        style={{ ...(blurred ? { filter: 'blur(10px) brightness(0.6)' } : {}), width: '100%' }}
      />
    );
  }

  const ytId = getYoutubeId(url);
  if (ytId) {
    const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return (
      <div style={{ position: 'relative' }}>
        <Image src={thumb} alt="YouTube" height={160} fit="cover" radius="md" style={commonStyle} />
        {!blurred && <IconMovie size={28} style={{ position: 'absolute', inset: 'calc(50% - 14px) auto auto calc(50% - 14px)', color: 'white' }} />}
      </div>
    );
  }
  if (isVideoUrl(url)) return <video src={url} height={160} controls={!blurred} style={{ ...commonStyle, maxWidth: '100%' }} />;
  if (isGifUrl(url) || isImageUrl(url)) return <Image src={url} alt="" height={160} fit="contain" radius="md" />;

  if (url.startsWith('blob:')) return <Image src={url} alt="" height={160} fit="contain" radius="md" />;

  return (
    <Group h={160} justify="center" align="center" style={{ ...commonStyle, background: 'rgba(0,0,0,.05)' }}>
      <IconPhoto />
    </Group>
  );
}

export default function CoachExercisesPage() {
  const { user } = useAuth();
  const isCoachOwner = true;

  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errList, setErrList] = useState(null);

  const [plansForAssign, setPlansForAssign] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    equipment: '',
    primary_muscle: '',
    difficulty: 'easy',
    tagsLine: '',
    media_url: '',
    is_paid: false,
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const isEditing = editingId !== null;
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!mediaFile) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(mediaFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [mediaFile]);

  useEffect(() => {
    (async () => {
      setLoadingList(true); setErrList(null);
      try {
        const data = await listCoachExercises();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        setErrList(e.message || 'Failed to load');
      } finally {
        setLoadingList(false);
      }
    })();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoadingPlans(true);
        const res = await myProducts();
        const list = Array.isArray(res?.data) ? res.data : [];
        if (active) setPlansForAssign(list.map(p => ({ value: String(p.id), label: p.title })));
      } finally {
        setLoadingPlans(false);
      }
    })();
    return () => { active = false; };
  }, []);

  function resetForm() {
    setForm({
      title: '',
      description: '',
      equipment: '',
      primary_muscle: '',
      difficulty: 'easy',
      tagsLine: '',
      media_url: '',
      is_paid: false,
    });
    setMediaFile(null);
    setPreviewUrl('');
    setEditingId(null);
    setSavingEdit(false);
    setCreating(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      notifications.show({ color: 'red', message: 'Title is required' });
      return;
    }

    const basePayload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      equipment: form.equipment.trim() || undefined,
      primary_muscle: form.primary_muscle.trim() || undefined,
      difficulty: form.difficulty || 'easy',
      is_paid: !!form.is_paid,
      tags: form.tagsLine
        ? form.tagsLine.split(',').map(s => s.trim()).filter(Boolean)
        : [],
      media_url: mediaFile ? undefined : (form.media_url.trim() || undefined),
    };

    if (isEditing) {
      setSavingEdit(true);
      try {
        const updated = await updateCoachExercise(editingId, basePayload, mediaFile || undefined);
        setItems(prev => prev.map(x => x.id === updated.id ? updated : x));
        notifications.show({ color: 'green', message: 'Exercise updated' });
        resetForm();
      } catch (e) {
        notifications.show({ color: 'red', message: e.message || 'Update failed' });
        setSavingEdit(false);
      }
      return;
    }

    setCreating(true);
    try {
      const created = await createCoachExercise(basePayload, mediaFile || undefined);
      setItems(prev => [...prev, created]);
      notifications.show({ color: 'green', message: 'Exercise created' });
      resetForm();
    } catch (e) {
      notifications.show({ color: 'red', message: e.message || 'Create failed' });
      setCreating(false);
    }
  }

  function loadForEdit(ex) {
    setEditingId(ex.id);
    setForm({
      title: ex.title || '',
      description: ex.description || '',
      equipment: ex.equipment || '',
      primary_muscle: ex.primary_muscle || '',
      difficulty: ex.difficulty || 'easy',
      tagsLine: Array.isArray(ex.tags) ? ex.tags.join(', ') : '',
      media_url: ex.media_path || ex.external_url || ex.media_url || '',
      is_paid: !!ex.is_paid,
    });
    setMediaFile(null);
    setPreviewUrl('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function clearMediaWhileEditing() {
    if (!isEditing) return;
    try {
      const updated = await updateCoachExercise(editingId, { media_url: '' });
      setItems(prev => prev.map(x => x.id === updated.id ? updated : x));
      setForm(f => ({ ...f, media_url: '' }));
      setMediaFile(null);
      notifications.show({ color: 'green', message: 'Media removed' });
    } catch (e) {
      notifications.show({ color: 'red', message: e.message || 'Failed to remove media' });
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCoachExercise(id);
      setItems(prev => prev.filter(x => x.id !== id));
      if (editingId === id) resetForm();
      notifications.show({ color: 'green', message: 'Exercise deleted' });
    } catch (e) {
      notifications.show({ color: 'red', message: e.message || 'Delete failed' });
    }
  }

  async function move(id, dir) {
    const prev = items;
    const idx = prev.findIndex(x => x.id === id);
    if (idx < 0) return;
    const arr = [...prev];
    const swapWith = dir === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= arr.length) return;
    [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];
    setItems(arr);
    try {
      await reorderCoachExercises(arr.map(x => x.id));
    } catch (e) {
      setItems(prev);
      notifications.show({ color: 'red', message: `Reorder failed: ${e.message || ''}` });
    }
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="start">
        <div>
          <Title order={2}>{isEditing ? 'Edit exercise' : 'Add exercise'}</Title>
          <Text c="dimmed" size="sm">
            {isEditing
              ? 'Update your exercise details and media below.'
              : 'Create your own exercise and attach media (image, gif, or video link/upload).'}
          </Text>
        </div>
        {isEditing && (
          <Button variant="subtle" onClick={resetForm}>
            Cancel editing
          </Button>
        )}
      </Group>

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12 }}>
          <Paper p="lg" radius="lg" withBorder>
            <form onSubmit={handleSubmit}>
              <Grid gutter="lg" align="end">
                <Grid.Col span={{ base: 12 }}>
                  <TextInput
                    label="Title"
                    placeholder="e.g. Barbell close-grip bench press"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.currentTarget.value })}
                    required
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12 }}>
                  <Textarea
                    label="Description"
                    placeholder="Coaching cues, safety tips, etc."
                    minRows={3}
                    autosize
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.currentTarget.value })}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput
                    label="Equipment"
                    placeholder="e.g. barbell, dumbbell…"
                    value={form.equipment}
                    onChange={(e) => setForm({ ...form, equipment: e.currentTarget.value })}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput
                    label="Primary muscle"
                    placeholder="e.g. triceps, quads…"
                    value={form.primary_muscle}
                    onChange={(e) => setForm({ ...form, primary_muscle: e.currentTarget.value })}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Select
                    label="Difficulty"
                    data={difficulties}
                    value={form.difficulty}
                    onChange={(v) => setForm({ ...form, difficulty: v || 'easy' })}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 3 }}>
                  <TextInput
                    label="Tags (comma-separated)"
                    placeholder="e.g. triceps, strength"
                    value={form.tagsLine}
                    onChange={(e) => setForm({ ...form, tagsLine: e.currentTarget.value })}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Group wrap="wrap" gap="md" align="end">
                    <TextInput
                      style={{ flexGrow: 1, minWidth: 260 }}
                      label="Media URL (image/gif/video)"
                      placeholder="https://…"
                      value={form.media_url}
                      onChange={(e) => setForm({ ...form, media_url: e.currentTarget.value })}
                      leftSection={<IconPhoto size={18} />}
                    />
                    <div>
                      <FileButton onChange={setMediaFile} accept="image/*,video/*">
                        {(props) => (
                          <Button leftSection={<IconUpload size={18} />} {...props} variant="light">
                            Upload file
                          </Button>
                        )}
                      </FileButton>
                      {(mediaFile || isEditing || form.media_url) && (
                        <Button ml="xs" variant="subtle" color="red"
                                onClick={isEditing ? clearMediaWhileEditing : () => { setMediaFile(null); setForm(f => ({ ...f, media_url: '' })); }}>
                          {isEditing ? 'Remove current media' : 'Clear selected'}
                        </Button>
                      )}
                    </div>
                  </Group>

                  {(mediaFile || form.media_url) && (
                    <Paper mt="md" p="sm" withBorder radius="md">
                      <Text size="sm" c="dimmed" mb={6}>Preview</Text>
                      <Group wrap="wrap" gap="md">
                        <MediaThumb url={mediaFile ? previewUrl : form.media_url} mimeType={mediaFile?.type} />
                      </Group>
                    </Paper>
                  )}
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Switch
                    label="Paid (hidden preview)"
                    checked={form.is_paid}
                    onChange={(e) => setForm({ ...form, is_paid: e.currentTarget.checked })}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12 }}>
                  <Button
                    type="submit"
                    fullWidth
                    loading={isEditing ? savingEdit : creating}
                    leftSection={<IconPlus size={18} />}
                  >
                    {isEditing ? 'Save changes' : 'Create'}
                  </Button>
                </Grid.Col>
              </Grid>
            </form>
          </Paper>
        </Grid.Col>
      </Grid>

      <Divider label="My exercises" />

      {loadingList ? (
        <Group justify="center" mt="lg"><Loader /></Group>
      ) : errList ? (
        <Alert color="red">{errList}</Alert>
      ) : (
        <>
          <Text c="dimmed" size="sm" mb="sm">Total: {items.length}</Text>
          <Grid gutter="lg">
            {items.map((ex, i) => {
              const mediaUrl = ex.media_path || ex.external_url || ex.media_url || '';
              const isPaid = !!ex.is_paid;
              const blurred = isPaid && !isCoachOwner;

              return (
                <Grid.Col key={ex.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card withBorder radius="lg" shadow="sm" padding="sm">
                    <div
                      style={{
                        height: 160,
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        borderRadius: 12,
                        position: 'relative',
                      }}
                    >
                      <MediaThumb url={mediaUrl} blurred={blurred} />
                    </div>

                    <Group justify="space-between" mt="sm" align="start">
                      <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={600} lineClamp={2}>{ex.title}</Text>
                        <Group gap={6} wrap="wrap">
                          {isPaid && <Badge color="red" variant="filled">PAID</Badge>}
                          {ex.primary_muscle && <Badge variant="light">{ex.primary_muscle}</Badge>}
                          {ex.equipment && <Badge variant="outline">{ex.equipment}</Badge>}
                          {ex.difficulty && <Badge variant="dot">{ex.difficulty}</Badge>}
                        </Group>
                      </Stack>
                      <Group gap={6}>
                        <Tooltip label="Move up">
                          <ActionIcon variant="subtle" onClick={() => move(ex.id, 'up')} disabled={i === 0}>
                            <IconArrowUp size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Move down">
                          <ActionIcon variant="subtle" onClick={() => move(ex.id, 'down')} disabled={i === items.length - 1}>
                            <IconArrowDown size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Edit">
                          <ActionIcon variant="subtle" onClick={() => loadForEdit(ex)}>
                            <IconPencil size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete">
                          <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(ex.id)}>
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  </Card>
                </Grid.Col>
              );
            })}

            {items.length === 0 && (
              <Grid.Col span={12}>
                <Text c="dimmed" ta="center">No exercises yet.</Text>
              </Grid.Col>
            )}
          </Grid>
        </>
      )}
    </Stack>
  );
}