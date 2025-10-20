// webapp/src/pages/CoachExercisesPage.jsx
import { useEffect, useState } from 'react';
import {
  Title, Text, Grid, Paper, Group, Stack, TextInput, Textarea, Select,
  Button, Badge, Image, Card, ActionIcon, FileButton, Divider, Loader,
  Alert, Modal, Tooltip, Switch
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconTrash, IconUpload, IconPhoto, IconMovie, IconPencil,
  IconArrowUp, IconArrowDown, IconLock
} from '@tabler/icons-react';

import {
  listCoachExercises,
  createCoachExercise,
  updateCoachExercise,
  deleteCoachExercise,
  reorderCoachExercises,
} from '../api/profiles';
import { MultiSelect } from "@mantine/core";
import { myProducts, getProductExercises, setProductExercises } from "../api/payments";

/* ----------------------- Helpers ----------------------- */
const difficulties = [
  { value: 'easy',   label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard',   label: 'Hard' },
];

// Palaiko watch?v=, youtu.be/, embed/, shorts/ + papildomus query
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

/* -------------------- MediaThumb ----------------------- */
function MediaThumb({ url, blurred = false }) {
  const [opened, setOpened] = useState(false);

  if (!url) return <IconPhoto size={48} color="var(--mantine-color-dimmed)" />;

  const commonStyle = {
    filter: blurred ? 'blur(8px) brightness(0.8)' : 'none',
    userSelect: 'none',
    borderRadius: 12,
    display: 'block',
    width: '100%',
  };

  // YouTube – thumbnail
  const ytId = getYoutubeId(url);
  if (ytId) {
    const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return blurred ? (
      <Image src={thumb} alt="YouTube" height={160} fit="cover" radius="md" style={commonStyle} />
    ) : (
      <a href={url} target="_blank" rel="noreferrer" style={{ position: 'relative', display: 'block' }}>
        <Image src={thumb} alt="YouTube" height={160} fit="cover" radius="md" style={commonStyle} />
        <IconMovie
          size={32}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', color: 'white', opacity: 0.9
          }}
        />
      </a>
    );
  }
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return (
      <Group h={160} justify="center" align="center" style={{ ...commonStyle, background: 'rgba(0,0,0,.05)' }}>
        <IconMovie />
        {!blurred && (
          <Button component="a" href={url} target="_blank" variant="subtle" size="xs">
            Open
          </Button>
        )}
      </Group>
    );
  }

  // mp4 / webm
  if (isVideoUrl(url)) {
    return (
      <video
        src={url}
        height={160}
        controls={!blurred}
        style={{ ...commonStyle, maxWidth: '100%' }}
      />
    );
  }

  // Image / GIF
if (isGifUrl(url) || isImageUrl(url)) {
  if (blurred) {
    return (
      <div style={{ position: 'relative', height: 160 }}>
        <Image
          src={url}
          alt=""
          height={160}
          fit="contain"
          radius="md"
          style={{
            filter: 'blur(10px) brightness(0.6)', // stipresnis blur + patamsinimas
            pointerEvents: 'none', // kad nebūtų klikų
            objectFit: 'cover',
            width: '100%',
            height: '100%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,.9)',
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(0,0,0,.2)',
            }}
          >
            🔒 Paid
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Image
        src={url}
        alt=""
        height={160}
        fit="contain"
        radius="md"
        style={{ cursor: 'zoom-in' }}
        onClick={() => setOpened(true)}
      />
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
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
          style={{ maxWidth: '90vw', maxHeight: '80vh' }}
        />
      </Modal>
    </>
  );
}

  return (
    <Group h={160} justify="center" align="center" style={{ ...commonStyle, background: 'rgba(0,0,0,.05)' }}>
      <IconPhoto />
    </Group>
  );
}

export default function CoachExercisesPage() {

  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errList, setErrList] = useState(null);
  const [plansForAssign, setPlansForAssign] = useState([]);
  const [selectedPlanIds, setSelectedPlanIds] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [assigning, setAssigning] = useState(false);

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
  const [creating, setCreating] = useState(false);

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

  useEffect(() => {
  let active = true;
  (async () => {
    try {
      setLoadingPlans(true);
      const res = await myProducts();
      const list = Array.isArray(res?.data) ? res.data : [];
      if (active) {
        setPlansForAssign(list.map(p => ({ value: String(p.id), label: p.title })));
      }
    } finally {
      setLoadingPlans(false);
    }
  })();
  return () => { active = false; };
}, []);

  /* ---------------- Create ---------------- */
  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      notifications.show({ color: 'red', message: 'Title is required' });
      return;
    }
    if (selectedPlanIds.length > 0) {
      try {
        setAssigning(true);
        for (const pidStr of selectedPlanIds) {
          const productId = Number(pidStr);

          const got = await getProductExercises(productId);
          const raw = Array.isArray(got?.data) ? got.data : Array.isArray(got) ? got : [];
          const currentIds = raw
            .map(x => {
              if (typeof x === "number" || typeof x === "string") return Number(x);
              if (x && typeof x === "object") return Number(x.exercise_id ?? x.id);
              return NaN;
            })
            .filter(Number.isFinite);

          const next = Array.from(new Set([...currentIds, Number(newExerciseId)]));
          await setProductExercises(productId, next);
        }
      } finally {
        setAssigning(false);
      }
    }
    setCreating(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        equipment: form.equipment.trim() || undefined,
        primary_muscle: form.primary_muscle.trim() || undefined,
        difficulty: form.difficulty || 'easy',
        is_paid: !!form.is_paid,
        tags: form.tagsLine
          ? form.tagsLine.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
        media_url: mediaFile ? undefined : (form.media_url.trim() || undefined),
      };
      const created = await createCoachExercise(payload, mediaFile || undefined);
      setItems(prev => [...prev, created]);
      setForm({
        title: '', description: '', equipment: '', primary_muscle: '',
        difficulty: 'easy', tagsLine: '', media_url: '', is_paid: false,
      });
      setMediaFile(null);
      notifications.show({ color: 'green', message: 'Exercise created' });
    } catch (e) {
      notifications.show({ color: 'red', message: e.message || 'Create failed' });
    } finally {
      setCreating(false);
    }
  }

  /* ---------------- Edit ---------------- */
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
        is_paid: !!editItem.is_paid,
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

  /* ---------------- Delete ---------------- */
  async function handleDelete(id) {
    try {
      await deleteCoachExercise(id);
      setItems(prev => prev.filter(x => x.id !== id));
      notifications.show({ color: 'green', message: 'Exercise deleted' });
    } catch (e) {
      notifications.show({ color: 'red', message: e.message || 'Delete failed' });
    }
  }

  /* ---------------- Reorder ---------------- */
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
      setItems(prev); // restore
      notifications.show({ color: 'red', message: `Reorder failed: ${e.message || ''}` });
    }
  }

  /* ---------------- Render ---------------- */
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
 
                      {mediaFile && (
                        <Button ml="xs" variant="subtle" color="red" onClick={() => setMediaFile(null)}>
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
                    <MultiSelect
                        label="Priskirti planams (nebūtina)"
                        placeholder="Pasirink planus"
                        data={plansForAssign}
                        value={selectedPlanIds}
                        onChange={setSelectedPlanIds}
                        searchable
                        clearable
                        rightSection={loadingPlans ? <Loader size="xs" /> : null}
                      />
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Switch
                    label="Paid (hidden preview)"
                    checked={form.is_paid}
                    onChange={(e) => setForm({ ...form, is_paid: e.currentTarget.checked })}
                  />
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
            {items.map((ex, i) => {
              const mediaUrl = ex.media_path || ex.external_url || ex.media_url || '';
              const isPaid = !!ex.is_paid;
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
                      <MediaThumb url={mediaUrl} blurred={isPaid} />
                      {isPaid && (
                        <Badge
                          leftSection={<IconLock size={14} />}
                          radius="lg"
                          variant="white"
                          style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: 'translate(-50%,-50%)',
                            boxShadow: '0 8px 24px rgba(0,0,0,.15)'
                          }}
                        >
                          Paid
                        </Badge>
                      )}
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
            <Switch
              label="Paid (hidden preview)"
              checked={!!editItem.is_paid}
              onChange={(e) => setEditItem({ ...editItem, is_paid: e.currentTarget.checked })}
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