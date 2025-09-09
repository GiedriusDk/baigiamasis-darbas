import { useEffect, useMemo, useState } from 'react';
import {
  Title, Text, Grid, Paper, Group, Stack, TextInput, Textarea, Select,
  Button, Badge, Image, Card, ActionIcon, FileButton, Divider, Loader, Alert
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
  IconPlus, IconTrash, IconUpload, IconPhoto, IconMovie, IconX
} from '@tabler/icons-react';

import {
  listCoachExercises,
  createCoachExercise,
  deleteCoachExercise,
  uploadCoachAvatar as uploadCoachMedia, // naudosim kaip media upload
} from '../api/profiles';

const difficulties = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

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
    media_url: '',
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [creating, setCreating] = useState(false);
  const [errCreate, setErrCreate] = useState(null);

  // lokali „puslapiavimo“ būsena (frontend-only)
  const [page, setPage] = useState(1);
  const perPage = 8;
  const paged = useMemo(() => {
    const start = (page - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, page]);
  const lastPage = Math.max(1, Math.ceil(items.length / perPage));

  useEffect(() => {
    (async () => {
      setLoadingList(true); setErrList(null);
      try {
        const data = await listCoachExercises();
        // tikimės masyvo; jei backend grąžina paginaciją – adaptuok
        setItems(Array.isArray(data) ? data : (data?.data ?? []));
      } catch (e) {
        setErrList(e.message || 'Failed to load exercises');
      } finally {
        setLoadingList(false);
      }
    })();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setErrCreate(null);
    setCreating(true);

    try {
      let media_url = form.media_url?.trim() || '';
      if (mediaFile) {
        const res = await uploadCoachMedia(mediaFile);
        // tikimės { url: '...' }
        media_url = res?.url || media_url;
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        equipment: form.equipment.trim(),
        primary_muscle: form.primary_muscle.trim(),
        difficulty: form.difficulty || 'easy',
        media_url,
      };

      if (!payload.title) throw new Error('Title is required');

      const created = await createCoachExercise(payload);

      // įstatom į sąrašą viršuje
      setItems((prev) => [created, ...prev]);
      setPage(1);
      setForm({
        title: '',
        description: '',
        equipment: '',
        primary_muscle: '',
        difficulty: 'easy',
        media_url: '',
      });
      setMediaFile(null);

      notifications.show({ color: 'green', message: 'Exercise created' });
    } catch (e) {
      setErrCreate(e.message || 'Failed to create exercise');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCoachExercise(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      notifications.show({ color: 'green', message: 'Exercise deleted' });
    } catch (e) {
      notifications.show({ color: 'red', message: e.message || 'Delete failed' });
    }
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="start">
        <div>
          <Title order={2}>Add exercise</Title>
          <Text c="dimmed" size="sm">Create your own exercise and attach media (image or video link/upload).</Text>
        </div>
      </Group>

      {/* viršus – dviejų kolonų, pilno pločio, kortelės stiliaus blokai */}
      <Grid gutter="xl">
        <Grid.Col span={{ base: 12, md: 12, lg: 12 }}>
          <Paper p="lg" radius="lg" withBorder>
            {errCreate && <Alert color="red" mb="md">{errCreate}</Alert>}

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

                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Equipment"
                    placeholder="e.g. barbell, dumbbell…"
                    value={form.equipment}
                    onChange={(e) => setForm({ ...form, equipment: e.currentTarget.value })}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                  <TextInput
                    label="Primary muscle"
                    placeholder="e.g. triceps, quads…"
                    value={form.primary_muscle}
                    onChange={(e) => setForm({ ...form, primary_muscle: e.currentTarget.value })}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Select
                    label="Difficulty"
                    data={difficulties}
                    value={form.difficulty}
                    onChange={(v) => setForm({ ...form, difficulty: v || 'easy' })}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12 }}>
                  <Group wrap="wrap" gap="md" align="end">
                    <TextInput
                      style={{ flexGrow: 1, minWidth: 260 }}
                      label="Media (image/video) URL"
                      placeholder="https://…"
                      value={form.media_url}
                      onChange={(e) => setForm({ ...form, media_url: e.currentTarget.value })}
                      leftSection={<IconPhoto size={18} />}
                    />
                    <div>
                      <FileButton onChange={setMediaFile} accept="image/*,video/*">
                        {(props) => (
                          <Button leftSection={<IconUpload size={18} />} {...props} variant="light">
                            Upload
                          </Button>
                        )}
                      </FileButton>
                      {mediaFile && (
                        <Button
                          ml="xs"
                          variant="subtle"
                          color="red"
                          leftSection={<IconX size={16} />}
                          onClick={() => setMediaFile(null)}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </Group>

                  {/* peržiūra */}
                  {(mediaFile || form.media_url) && (
                    <Paper mt="md" p="sm" withBorder radius="md">
                      <Text size="sm" c="dimmed" mb={6}>Preview</Text>
                      <Group wrap="wrap" gap="md">
                        {previewNode(mediaFile, form.media_url)}
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

      {/* sąrašas */}
      {loadingList ? (
        <Group justify="center" mt="lg"><Loader /></Group>
      ) : errList ? (
        <Alert color="red">{errList}</Alert>
      ) : (
        <>
          <Text c="dimmed" size="sm" mb="sm">Total: {items.length}</Text>
          <Grid gutter="lg">
            {paged.map((ex) => (
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
                    {mediaThumb(ex.media_url)}
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
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(ex.id)}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Card>
              </Grid.Col>
            ))}
            {paged.length === 0 && (
              <Grid.Col span={12}>
                <Text c="dimmed" ta="center">No exercises yet.</Text>
              </Grid.Col>
            )}
          </Grid>

          {/* paprastas puslapiavimas */}
          <Group justify="center" mt="md">
            <Button
              variant="subtle"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <Badge variant="light">Page {page} / {lastPage}</Badge>
            <Button
              variant="subtle"
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page >= lastPage}
            >
              Next
            </Button>
          </Group>
        </>
      )}
    </Stack>
  );
}

function isVideo(url = '') {
  const u = url.toLowerCase();
  return u.endsWith('.mp4') || u.includes('youtube.com') || u.includes('youtu.be') || u.includes('vimeo.com');
}

function mediaThumb(url) {
  if (!url) return <IconPhoto size={48} color="var(--mantine-color-dimmed)" />;
  if (isVideo(url)) {
    return (
      <Group gap={6} align="center">
        <IconMovie size={18} />
        <Text size="sm" c="dimmed" lineClamp={2}>{url}</Text>
      </Group>
    );
  }
  return <Image src={url} alt="" height={160} fit="contain" />;
}

function previewNode(file, url) {
  // jei įkeltas failas – rodome failo pavadinimą, jei URL – pagal tipą
  if (file) {
    return (
      <Group gap={6}>
        <IconUpload size={18} />
        <Text size="sm">{file.name}</Text>
      </Group>
    );
  }
  if (url) {
    return mediaThumb(url);
  }
  return null;
}