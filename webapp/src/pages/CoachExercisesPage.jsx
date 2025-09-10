import { useEffect, useState } from 'react';
import {
  Title, Text, Grid, Paper, Group, Stack, TextInput, Textarea, Select, NumberInput,
  Button, Badge, Image, Card, ActionIcon, FileButton, Divider, Loader, Alert, Modal, Tooltip
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconTrash, IconUpload, IconPhoto, IconMovie, IconPencil, IconArrowUp, IconArrowDown
} from '@tabler/icons-react';

import { useDisclosure } from '@mantine/hooks';

import {
  listCoachExercises,
  createCoachExercise,
  updateCoachExercise,
  deleteCoachExercise,
  reorderCoachExercises,
} from '../api/profiles';


const difficulties = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

function getYoutubeId(url = '') {
  const m = url.match(/(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&#]+)/i);
  return m ? m[1] : null;
}
function isVideoUrl(u = '') {
  const x = u.toLowerCase();
  return x.endsWith('.mp4') || x.endsWith('.webm') || x.includes('vimeo.com');
}
function isGifUrl(u=''){ return u.toLowerCase().endsWith('.gif'); }

// NAUJAS MediaThumb
function MediaThumb({ url }) {
  const [opened, { open, close }] = useDisclosure(false);

  if (!url) return <IconPhoto size={48} color="var(--mantine-color-dimmed)" />;

  // 1) YouTube – rodom thumbnail, klik – atidaro YouTube naujame lange
  const ytId = getYoutubeId(url);
  if (ytId) {
    const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return (
      <a href={url} target="_blank" rel="noreferrer" style={{ position: 'relative', display: 'block' }}>
        <Image src={thumb} alt="YouTube" height={160} fit="cover" radius="md" />
        <IconMovie
          size={32}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', color: 'white', opacity: 0.85
          }}
        />
      </a>
    );
  }

  // 2) .mp4/.webm (ir pan.) – rodom HTML5 video player
  if (isVideoUrl(url)) {
    return (
      <video
        src={url}
        height={160}
        controls
        style={{ borderRadius: 12, display: 'block', maxWidth: '100%' }}
      />
    );
  }

  // 3) Paveikslai/GIF – rodom, o paspaudus atidarom pilno ekrano modal
  return (
    <>
      <Image
        src={url}
        alt=""
        height={160}
        fit="contain"
        radius="md"
        style={{ cursor: 'zoom-in' }}
        onClick={open}
      />
      <Modal
        opened={opened}
        onClose={close}
        centered
        withCloseButton
        padding={0}
        radius="md"
        size="auto"
      >
        <Image
          src={url}
          alt=""
          fit="contain"
          // Mantine v7: galite naudoti style, kad apribot max dydį
          style={{ maxWidth: '90vw', maxHeight: '80vh' }}
        />
      </Modal>
    </>
  );
}

export default function CoachExercisesPage() {
  // sąrašas
  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errList, setErrList] = useState(null);

  // kūrimo forma
  const [form, setForm] = useState({
    title: '',
    description: '',
    equipment: '',
    primary_muscle: '',
    difficulty: 'easy',
    tagsLine: '',
    media_url: '',
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [creating, setCreating] = useState(false);

  // modalinis redagavimas
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);

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

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      notifications.show({ color: 'red', message: 'Title is required' });
      return;
    }
    setCreating(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        equipment: form.equipment.trim() || undefined,
        primary_muscle: form.primary_muscle.trim() || undefined,
        difficulty: form.difficulty || 'easy',
        tags: form.tagsLine
          ? form.tagsLine.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        media_url: mediaFile ? undefined : (form.media_url.trim() || undefined),
      };

      const created = await createCoachExercise(payload, mediaFile || undefined);
      setItems((prev) => [...prev, created]);
      setForm({
        title: '', description: '', equipment: '', primary_muscle: '',
        difficulty: 'easy', tagsLine: '', media_url: '',
      });
      setMediaFile(null);

      notifications.show({ color: 'green', message: 'Exercise created' });
    } catch (e) {
      notifications.show({ color: 'red', message: e.message || 'Create failed' });
    } finally {
      setCreating(false);
    }
  }

  function openEdit(ex) {
    setEditItem({
      ...ex,
      tagsLine: Array.isArray(ex.tags) ? ex.tags.join(', ') : '',
    });
    setEditFile(null);
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editItem) return;
    setSavingEdit(true);
    try {
      const payload = {
        title: editItem.title?.trim(),
        description: editItem.description?.trim() || undefined,
        equipment: editItem.equipment?.trim() || undefined,
        primary_muscle: editItem.primary_muscle?.trim() || undefined,
        difficulty: editItem.difficulty || undefined,
        tags: editItem.tagsLine
          ? editItem.tagsLine.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      };

      const updated = await updateCoachExercise(editItem.id, payload, editFile || undefined);
      setItems(prev => prev.map(x => x.id === updated.id ? updated : x));
      setEditOpen(false);
      setEditItem(null);
      setEditFile(null);
      notifications.show({ color: 'green', message: 'Exercise updated' });
    } catch (e) {
      notifications.show({ color: 'red', message: e.message || 'Update failed' });
    } finally {
      setSavingEdit(false);
    }
  }

  async function clearMediaOnEdit() {
    if (!editItem) return;
    try {
      const updated = await updateCoachExercise(editItem.id, { media_url: '' });
      setItems(prev => prev.map(x => x.id === updated.id ? updated : x));
      setEditItem(updated);
      setEditFile(null);
      notifications.show({ color: 'green', message: 'Media removed' });
    } catch (e) {
      notifications.show({ color: 'red', message: e.message || 'Failed to remove media' });
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCoachExercise(id);
      setItems(prev => prev.filter(x => x.id !== id));
      notifications.show({ color: 'green', message: 'Exercise deleted' });
    } catch (e) {
      notifications.show({ color: 'red', message: e.message || 'Delete failed' });
    }
  }

  async function move(id, dir) {
    // lokaliai perkeliu
    const idx = items.findIndex(x => x.id === id);
    if (idx < 0) return;
    const newArr = [...items];
    const swapWith = dir === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= newArr.length) return;
    [newArr[idx], newArr[swapWith]] = [newArr[swapWith], newArr[idx]];
    setItems(newArr);

    try {
      await reorderCoachExercises(newArr.map(x => x.id));
    } catch (e) {
    // jei backend nesuveikė – grąžinam buvusią būseną
    notifications.show({
      color: 'red',
      title: 'Reorder failed',
      message: e.message || 'Unknown error',
    });
    setItems(items);
  }
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="start">
        <div>
          <Title order={2}>Add exercise</Title>
          <Text c="dimmed" size="sm">Create your own exercise and attach media (image, gif, or video link/upload).</Text>
        </div>
      </Group>

      <Grid gutter="xl">
        <Grid.Col span={{ base: 12 }}>
          <Paper p="lg" radius="lg" withBorder>
            <form onSubmit={handleCreate}>
              <Grid gutter="lg">
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

                <Grid.Col span={{ base: 12 }}>
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
                      {mediaFile && (
                        <Button
                          ml="xs"
                          variant="subtle"
                          color="red"
                          onClick={() => setMediaFile(null)}
                        >
                          Clear selected
                        </Button>
                      )}
                    </div>
                  </Group>

                  {(mediaFile || form.media_url) && (
                    <Paper mt="md" p="sm" withBorder radius="md">
                      <Text size="sm" c="dimmed" mb={6}>Preview</Text>
                      <Group wrap="wrap" gap="md">
                        <MediaThumb url={mediaFile ? mediaFile.name : form.media_url} />
                      </Group>
                    </Paper>
                  )}
                </Grid.Col>

                <Grid.Col span={{ base: 12 }}>
                  <Button type="submit" fullWidth loading={creating} leftSection={<IconPlus size={18} />}>
                    Create
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
            {items.map((ex, i) => (
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
                    }}
                  >
                    <MediaThumb url={ex.media_url || ex.media_path} />
                  </div>

                  <Group justify="space-between" mt="sm" align="start">
                    <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                      <Text fw={600} lineClamp={2}>{ex.title}</Text>
                      <Group gap={6}>
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
                        <ActionIcon variant="subtle" onClick={() => openEdit(ex)}>
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
            ))}

            {items.length === 0 && (
              <Grid.Col span={12}>
                <Text c="dimmed" ta="center">No exercises yet.</Text>
              </Grid.Col>
            )}
          </Grid>
        </>
      )}

      {/* Edit modal */}
      <Modal opened={editOpen} onClose={() => setEditOpen(false)} title="Edit exercise" size="lg">
        {editItem && (
          <Stack>
            <TextInput
              label="Title"
              value={editItem.title || ''}
              onChange={(e) => setEditItem({ ...editItem, title: e.currentTarget.value })}
            />
            <Textarea
              label="Description"
              minRows={3}
              value={editItem.description || ''}
              onChange={(e) => setEditItem({ ...editItem, description: e.currentTarget.value })}
            />
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Equipment"
                  value={editItem.equipment || ''}
                  onChange={(e) => setEditItem({ ...editItem, equipment: e.currentTarget.value })}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Primary muscle"
                  value={editItem.primary_muscle || ''}
                  onChange={(e) => setEditItem({ ...editItem, primary_muscle: e.currentTarget.value })}
                />
              </Grid.Col>
            </Grid>
            <Select
              label="Difficulty"
              data={difficulties}
              value={editItem.difficulty || null}
              onChange={(v) => setEditItem({ ...editItem, difficulty: v || '' })}
            />
            <TextInput
              label="Tags (comma-separated)"
              value={editItem.tagsLine || ''}
              onChange={(e) => setEditItem({ ...editItem, tagsLine: e.currentTarget.value })}
            />

            <Group>
              <FileButton onChange={setEditFile} accept="image/*,video/*">
                {(props) => <Button leftSection={<IconUpload size={16} />} {...props}>Upload new media</Button>}
              </FileButton>
              <Button variant="subtle" color="red" onClick={clearMediaOnEdit}>Remove media</Button>
            </Group>

            <Group justify="flex-end" mt="sm">
              <Button onClick={saveEdit} loading={savingEdit}>Save</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}