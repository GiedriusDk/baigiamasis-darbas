import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Group,
  Stack,
  Title,
  Text,
  Button,
  Card,
  TextInput,
  Textarea,
  NumberInput,
  Modal,
  ScrollArea,
  Badge,
  Loader,
  Alert,
  ActionIcon,
} from "@mantine/core";
import { IconPlus, IconTrash, IconCirclePlus, IconSearch } from "@tabler/icons-react";

import {
  createPlan,
  getLatestPlan,
  listWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  listWorkoutExercises,
  createWorkoutExercise,
  updateWorkoutExercise,
  deleteWorkoutExercise,
  searchExercises,
} from "../../../api/planner";

function ExerciseSearchModal({ opened, onClose, onSelect }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchExercises(params = {}) {
    setLoading(true);
    try {
      const res = await searchExercises({
        q: params.q ?? "",
        per_page: 30,
        page: 1,
      });

      let rows = Array.isArray(res?.data) ? res.data : [];
      rows = [...rows].sort(() => Math.random() - 0.5);
      setResults(rows);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!opened) return;
    setQ("");
    fetchExercises({ q: "" });
  }, [opened]);

  useEffect(() => {
    if (!opened) return;
    const handle = setTimeout(() => fetchExercises({ q }), 300);
    return () => clearTimeout(handle);
  }, [q, opened]);

  return (
    <Modal opened={opened} onClose={onClose} size="lg" title="Pick exercise">
      <Stack gap="sm">
        <Group align="flex-end">
          <TextInput
            label="Search in catalog"
            placeholder="Bench press, squat…"
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button leftSection={<IconSearch size={16} />} onClick={() => fetchExercises({ q })}>
            Search
          </Button>
        </Group>

        <ScrollArea h={360}>
          {loading && (
            <Group justify="center" py="md">
              <Loader />
            </Group>
          )}

          {!loading && results.length === 0 && (
            <Text c="dimmed" size="sm">
              No results yet.
            </Text>
          )}

          <Stack gap="xs">
            {results.map((ex) => (
              <Card
                key={ex.id}
                withBorder
                radius="md"
                p="sm"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  onSelect?.(ex);
                  onClose();
                }}
              >
                <Group align="flex-start" gap="md">
                  {ex.image_url && (
                    <img
                      src={ex.image_url}
                      alt={ex.name}
                      style={{
                        width: 72,
                        height: 72,
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  )}
                  <div>
                    <Text fw={600}>{ex.name}</Text>
                    <Group gap={6} mt={4}>
                      {ex.primary_muscle && (
                        <Badge variant="light" size="xs">
                          {ex.primary_muscle}
                        </Badge>
                      )}
                      {ex.equipment && (
                        <Badge variant="outline" size="xs">
                          {ex.equipment}
                        </Badge>
                      )}
                    </Group>
                  </div>
                </Group>
              </Card>
            ))}
          </Stack>
        </ScrollArea>
      </Stack>
    </Modal>
  );
}

export default function UserPlanBuilder() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [workouts, setWorkouts] = useState([]);
  const [exercisesByWorkout, setExercisesByWorkout] = useState({});
  const [creating, setCreating] = useState(false);
  const [exercisePickerWorkoutId, setExercisePickerWorkoutId] = useState(null);

  const workoutsById = useMemo(() => {
    const m = new Map();
    for (const w of workouts) m.set(w.id, w);
    return m;
  }, [workouts]);

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      let p = null;

      try {
        const res = await getLatestPlan();
        p = res?.data ?? res ?? null;
      } catch (e) {
        const msg = String(e && e.message ? e.message : "");
        if (msg.includes("No plan")) p = null;
        else throw e;
      }

      if (!p) {
        setPlan(null);
        setWorkouts([]);
        setExercisesByWorkout({});
        return;
      }

      setPlan(p);

      const wRes = await listWorkouts(p.id);
      const ws = Array.isArray(wRes?.data) ? wRes.data : Array.isArray(wRes) ? wRes : [];
      ws.sort((a, b) => (a.day_index ?? 0) - (b.day_index ?? 0));
      setWorkouts(ws);

      const exMap = {};
      for (const w of ws) {
        const eRes = await listWorkoutExercises(w.id);
        const rows = Array.isArray(eRes?.data) ? eRes.data : Array.isArray(eRes) ? eRes : [];
        exMap[w.id] = rows;
      }
      setExercisesByWorkout(exMap);
    } catch (e) {
      console.error(e);
      setError(e && e.message ? e.message : "Failed to load plan");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreateManualPlan() {
    setCreating(true);
    setError("");
    try {
      const res = await createPlan({ source: "manual" });
      const p = res?.data ?? res;
      setPlan(p);
      setWorkouts([]);
      setExercisesByWorkout({});
    } catch (e) {
      console.error(e);
      setError(e && e.message ? e.message : "Failed to create plan");
    } finally {
      setCreating(false);
    }
  }

  async function handleAddWorkout() {
    if (!plan) return;

    const nextIndex =
      workouts.length === 0 ? 0 : Math.max(...workouts.map((w) => w.day_index ?? 0)) + 1;

    const payload = { day_index: nextIndex, name: `Day ${nextIndex + 1}`, notes: "" };
    const res = await createWorkout(plan.id, payload);
    const w = res?.data ?? res;

    setWorkouts((prev) =>
      [...prev, w].sort((a, b) => (a.day_index ?? 0) - (b.day_index ?? 0))
    );
    setExercisesByWorkout((prev) => ({ ...prev, [w.id]: [] }));
  }

  async function handleUpdateWorkout(workoutId, fields) {
    const res = await updateWorkout(workoutId, fields);
    const updated = res?.data ?? res;
    setWorkouts((prev) => prev.map((w) => (w.id === updated.id ? { ...w, ...updated } : w)));
  }

  async function handleDeleteWorkout(workoutId) {
    if (!window.confirm("Delete this day and all its exercises?")) return;
    await deleteWorkout(workoutId);
    setWorkouts((prev) => prev.filter((w) => w.id !== workoutId));
    setExercisesByWorkout((prev) => {
      const cp = { ...prev };
      delete cp[workoutId];
      return cp;
    });
  }

  async function handleAddExercise(workoutId, exFromCatalog) {
    const list = exercisesByWorkout[workoutId] || [];
    const order = list.length === 0 ? 0 : Math.max(...list.map((e) => e.order ?? 0)) + 1;

    const payload = {
      exercise_id: exFromCatalog.id,
      order,
      sets: 3,
      rep_min: 8,
      rep_max: 12,
      rest_sec: 60,
    };

    const res = await createWorkoutExercise(workoutId, payload);
    const created = res?.data ?? res;

    setExercisesByWorkout((prev) => ({
      ...prev,
      [workoutId]: [...(prev[workoutId] || []), created].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      ),
    }));
  }

  async function handleUpdateExercise(workoutId, exRowId, fields) {
    const res = await updateWorkoutExercise(workoutId, exRowId, fields);
    const updated = res?.data ?? res;

    setExercisesByWorkout((prev) => {
      const list = prev[workoutId] || [];
      return {
        ...prev,
        [workoutId]: list.map((e) => (e.id === updated.id ? { ...e, ...updated } : e)),
      };
    });
  }

  async function handleDeleteExercise(workoutId, exRowId) {
    await deleteWorkoutExercise(workoutId, exRowId);
    setExercisesByWorkout((prev) => {
      const list = prev[workoutId] || [];
      return { ...prev, [workoutId]: list.filter((e) => e.id !== exRowId) };
    });
  }

  function updateExerciseLocal(workoutId, exRowId, patch) {
    setExercisesByWorkout((prev) => {
      const list = prev[workoutId] || [];
      return {
        ...prev,
        [workoutId]: list.map((e) => (e.id === exRowId ? { ...e, ...patch } : e)),
      };
    });
  }

  async function commitExercise(workoutId, exRowId) {
    const list = exercisesByWorkout[workoutId] || [];
    const row = list.find((x) => x.id === exRowId);
    if (!row) return;

    const fields = {
      sets: Number(row.sets ?? 0),
      rep_min: Number(row.rep_min ?? 0),
      rep_max: Number(row.rep_max ?? 0),
      rest_sec: Number(row.rest_sec ?? 0),
    };

    await handleUpdateExercise(workoutId, exRowId, fields);
  }

  const hasPlan = !!plan;

  if (loading) {
    return (
      <Container size="md" p="md">
        <Group justify="center" py="xl">
          <Loader />
        </Group>
      </Container>
    );
  }

  if (!hasPlan) {
    return (
      <Container size="sm" p="md">
        <Stack gap="md">
          <Title order={3}>Your training plan</Title>
          {error && <Alert color="red">{error}</Alert>}
          <Text c="dimmed" size="sm">
            You do not have any plan yet. Create a manual plan and then add days and exercises
            from the catalog.
          </Text>
          <Button
            onClick={handleCreateManualPlan}
            loading={creating}
            leftSection={<IconPlus size={16} />}
          >
            Create manual plan
          </Button>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="lg" p="md">
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Title order={2}>{plan.title || "My training plan"}</Title>
            <Text c="dimmed" size="sm">
              Goal: {plan.goal || "general_fitness"} • Sessions per week: {plan.sessions_per_week}
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={handleAddWorkout}>
            Add day
          </Button>
        </Group>

        {error && <Alert color="red">{error}</Alert>}

        {workouts.length === 0 && (
          <Card withBorder radius="lg" p="lg">
            <Text c="dimmed" size="sm">
              No days in this plan yet. Add the first one.
            </Text>
          </Card>
        )}

        <Stack gap="md">
          {workouts.map((w) => {
            const list = exercisesByWorkout[w.id] || [];
            const currentWorkout = workoutsById.get(w.id) || w;

            return (
              <Card key={w.id} withBorder radius="lg" p="md">
                <Stack gap="sm">
                  <Group justify="space-between" align="flex-start">
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Group gap="sm">
                        <Badge variant="light">Day {(currentWorkout.day_index ?? 0) + 1}</Badge>
                        <TextInput
                          value={currentWorkout.name ?? ""}
                          onChange={(e) => {
                            const val = e.currentTarget.value;
                            setWorkouts((prev) =>
                              prev.map((x) => (x.id === w.id ? { ...x, name: val } : x))
                            );
                          }}
                          onBlur={() => {
                            const val = String(currentWorkout.name ?? "").trim();
                            handleUpdateWorkout(w.id, { name: val === "" ? "" : val });
                          }}
                          style={{ maxWidth: 260 }}
                        />
                      </Group>

                      <Textarea
                        minRows={2}
                        placeholder="Notes for this day…"
                        value={currentWorkout.notes ?? ""}
                        onChange={(e) => {
                          const val = e.currentTarget.value;
                          setWorkouts((prev) =>
                            prev.map((x) => (x.id === w.id ? { ...x, notes: val } : x))
                          );
                        }}
                        onBlur={() => {
                          const val = String(currentWorkout.notes ?? "").trim();
                          handleUpdateWorkout(w.id, { notes: val === "" ? null : val });
                        }}
                      />
                    </Stack>

                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => handleDeleteWorkout(w.id)}
                    >
                      Delete day
                    </Button>
                  </Group>

                  <Stack gap="xs" mt="xs">
                    {list.map((row) => {
                      const catalog = row?.catalog_exercise || {};
                      const title =
                        catalog?.name || row?.exercise_name || `Exercise #${row?.exercise_id ?? "?"}`;
                      const primaryMuscle = catalog?.primary_muscle;
                      const equipment = catalog?.equipment;
                      const imageUrl = catalog?.image_url || row?.image_url;

                      const setsVal = Number.isFinite(Number(row?.sets)) ? Number(row.sets) : 3;
                      const repMinVal = Number.isFinite(Number(row?.rep_min)) ? Number(row.rep_min) : 8;
                      const repMaxVal = Number.isFinite(Number(row?.rep_max)) ? Number(row.rep_max) : 12;
                      const restVal = Number.isFinite(Number(row?.rest_sec)) ? Number(row.rest_sec) : 60;

                      return (
                        <Card
                          key={row.id}
                          withBorder
                          radius="md"
                          p="sm"
                          style={{ background: "var(--mantine-color-gray-0)" }}
                        >
                          <Group align="flex-start" justify="space-between">
                            <Group align="flex-start" gap="md" style={{ flex: 1 }}>
                              {imageUrl && (
                                <div
                                  style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: 10,
                                    overflow: "hidden",
                                    background: "#f3f4f6",
                                  }}
                                >
                                  <img
                                    src={imageUrl}
                                    alt={title}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                </div>
                              )}

                              <div style={{ flex: 1 }}>
                                <Text fw={600} size="sm">
                                  {title}
                                </Text>

                                <Group gap={6} mt={4}>
                                  {primaryMuscle && (
                                    <Badge size="xs" variant="light">
                                      {primaryMuscle}
                                    </Badge>
                                  )}
                                  {equipment && (
                                    <Badge size="xs" variant="outline">
                                      {equipment}
                                    </Badge>
                                  )}
                                </Group>

                                <Group gap="xs" mt="sm" wrap="wrap">
                                  <NumberInput
                                    label="Sets"
                                    value={setsVal}
                                    min={1}
                                    max={10}
                                    w={90}
                                    onChange={(v) => updateExerciseLocal(w.id, row.id, { sets: v ?? 0 })}
                                    onBlur={() => commitExercise(w.id, row.id)}
                                  />

                                  <NumberInput
                                    label="Rep min"
                                    value={repMinVal}
                                    min={1}
                                    max={50}
                                    w={110}
                                    onChange={(v) =>
                                      updateExerciseLocal(w.id, row.id, { rep_min: v ?? 0 })
                                    }
                                    onBlur={() => commitExercise(w.id, row.id)}
                                  />

                                  <NumberInput
                                    label="Rep max"
                                    value={repMaxVal}
                                    min={1}
                                    max={50}
                                    w={110}
                                    onChange={(v) =>
                                      updateExerciseLocal(w.id, row.id, { rep_max: v ?? 0 })
                                    }
                                    onBlur={() => commitExercise(w.id, row.id)}
                                  />

                                  <NumberInput
                                    label="Rest (sec)"
                                    value={restVal}
                                    min={10}
                                    max={600}
                                    w={120}
                                    onChange={(v) =>
                                      updateExerciseLocal(w.id, row.id, { rest_sec: v ?? 0 })
                                    }
                                    onBlur={() => commitExercise(w.id, row.id)}
                                  />
                                </Group>
                              </div>
                            </Group>

                            <ActionIcon
                              color="red"
                              variant="subtle"
                              radius="xl"
                              onClick={() => handleDeleteExercise(w.id, row.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Card>
                      );
                    })}

                    {list.length === 0 && (
                      <Text c="dimmed" size="sm">
                        No exercises yet for this day.
                      </Text>
                    )}
                  </Stack>

                  <Group justify="flex-end" mt="xs">
                    <Button
                      size="xs"
                      leftSection={<IconCirclePlus size={16} />}
                      onClick={() => setExercisePickerWorkoutId(w.id)}
                    >
                      Add exercise from catalog
                    </Button>
                  </Group>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </Stack>

      <ExerciseSearchModal
        opened={!!exercisePickerWorkoutId}
        onClose={() => setExercisePickerWorkoutId(null)}
        onSelect={(ex) => {
          if (exercisePickerWorkoutId) handleAddExercise(exercisePickerWorkoutId, ex);
        }}
      />
    </Container>
  );
}