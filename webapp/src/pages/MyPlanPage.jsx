import { useEffect, useMemo, useState } from "react";
import {
  Paper, Title, Text, Group, Badge, Divider, Grid, Card, Image, Stack,
  Alert, Skeleton, Button, Modal, Tabs, TextInput, ActionIcon, ScrollArea
} from "@mantine/core";
import { IconInfoCircle, IconArrowsExchange, IconSearch } from "@tabler/icons-react";
import ExerciseDetailsModal from "../components/ExerciseDetailsModal.jsx";


export default function MyPlanPage() {
  const [plan, setPlan] = useState(null);
  const [err, setErr] = useState("");
  const [swap, setSwap] = useState({ open: false, workoutId: null, order: null });
  const token = useMemo(() => localStorage.getItem("auth_token") || "", []);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsEx, setDetailsEx]   = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logWorkout, setLogWorkout] = useState(null); 


  useEffect(() => {
    let mounted = true;
    async function load() {
      setErr("");
      try {
        const res = await fetch("/api/planner/plans/latest", {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (!mounted) return;

        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { throw new Error("Gateway returned HTML. Check /api prefix in nginx/vite."); }

        if (!res.ok) throw new Error(data.message || "Failed to load plan");
        setPlan(data);
      } catch (e) {
        setErr(e.message || "Unexpected error");
      }
    }
    load();
    return () => { mounted = false; };
  }, [token]);

  function openSwap(workoutId, order) {
    setSwap({ open: true, workoutId, order });
  }

  // kai sėkmingai pakeitėm — atnaujinam UI vietoje:
  function applySwapToState(newExercise) {
    setPlan((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const w = next.workouts.find((x) => x.id === swap.workoutId);
      if (!w) return prev;
      const ex = w.exercises.find((x) => x.order === swap.order);
      if (!ex) return prev;
      ex.exercise_id = newExercise.id;
      ex.exercise_name = newExercise.name;
      // Išsaugom ir „catalog_exercise“ kad iškart matytųsi paveiksliukas/pavadinimas
      ex.catalog_exercise = newExercise;
      return next;
    });
    setSwap({ open: false, workoutId: null, order: null });
  }

  if (err) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} color="red" variant="light">
        {err} • <a href="/plans">Generate a plan</a>
      </Alert>
    );
  }

  if (!plan) {
    return (
      <Grid>
        {[...Array(3)].map((_, i) => (
          <Grid.Col key={i} span={{ base: 12, md: 4 }}>
            <Card withBorder radius="lg" p="lg"><Skeleton height={220} /></Card>
          </Grid.Col>
        ))}
      </Grid>
    );
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>My plan</Title>
        <Text c="dimmed">Your latest generated plan.</Text>
      </div>

      <Paper withBorder p="lg" radius="lg">
        <Group justify="space-between" align="center" mb="xs">
          <Title order={3}>Plan #{plan.id}</Title>
          <Badge variant="light">Total days: {plan.workouts?.length || 0}</Badge>
        </Group>
        <Text size="sm" c="dimmed" mb="sm">
          <b>Goal:</b> {toTitle(plan.goal)} •
          <b>Sessions:</b> {plan.sessions_per_week} •
          <b>Start:</b> {plan.start_date} •
          <b>Equipment:</b> {plan.equipment || '—'} •
          <b>Session duration:</b> {plan.session_minutes} •
          <b>Injuries:</b> {(plan.injuries?.length ? plan.injuries.join(', ') : 'none')}
        </Text>
        <Divider my="sm" />

        <Grid gutter="lg">
          {plan.workouts?.map((w) => (
            <Grid.Col key={w.id} span={{ base: 12, md: 4 }}>
              <Card withBorder radius="lg" p="lg">
                {/* ... */}
                <Stack gap="md" mt="xs">
                  {w.exercises?.map((ex) => {
                    const c = ex.catalog_exercise || {};
                    const img = c.image_url || "";
                    return (
                        <Group
                        key={`${w.id}-${ex.order}`}
                        align="flex-start"
                        wrap="nowrap"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                            if (c?.id) {
                            setDetailsEx(c);
                            setDetailsOpen(true);
                            } else if (ex.exercise_id) {
                            setDetailsEx({ id: ex.exercise_id });
                            setDetailsOpen(true);
                            }
                        }}
                        >
                        <Image src={img || undefined} w={80} h={80} radius="md" fit="contain" />

                        <div style={{ flex: 1 }}>
                            <Text fw={600} size="sm">
                            #{ex.order}. {c.name ? c.name : `Exercise #${ex.exercise_id}`}
                            </Text>
                            <Text size="sm" c="dimmed">
                            {ex.sets}× {ex.rep_min}–{ex.rep_max} • rest {ex.rest_sec}s
                            </Text>
                            <Text size="xs" c="dimmed" mt={4}>
                            {c.primary_muscle ? toTitle(c.primary_muscle) : ""} {c.equipment ? `• ${toTitle(c.equipment)}` : ""}
                            </Text>
                        </div>

                        {/* SWAP mygtukas dešinėje */}
                        <Button
                            size="xs"
                            variant="light"
                            leftSection={<IconArrowsExchange size={14} />}
                            onClick={(e) => {
                            e.stopPropagation();            // <-- labai svarbu, kad neatsidarytų modalas
                            openSwap(w.id, ex.order);
                            }}
                        >
                            Swap
                        </Button>
                        </Group>
                    );
                  })}
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      </Paper>

      <ExerciseDetailsModal
        opened={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        exercise={detailsEx?.name ? detailsEx : null}
        exerciseId={!detailsEx?.name ? detailsEx?.id : null}
      />

      <SwapModal
        opened={swap.open}
        workoutId={swap.workoutId}
        order={swap.order}
        onClose={() => setSwap({ open: false, workoutId: null, order: null })}
        onPicked={(ex) => applySwapToState(ex)}
        token={token}
      />
    </Stack>
  );
}

function toTitle(v) {
  if (!v) return '';
  return v.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

/* ------------ Swap Modal ------------- */

function SwapModal({ opened, onClose, workoutId, order, onPicked, token }) {
  const [loading, setLoading] = useState(false);
  const [suggested, setSuggested] = useState([]);
  const [current, setCurrent] = useState(null);

  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!opened || !workoutId || !order) return;
    (async () => {
      setLoading(true);
      try {
        const u = new URL(`/api/planner/workouts/${workoutId}/exercises/${order}/alternatives`, window.location.origin);
        const r = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
        const j = await r.json();
        if (!r.ok) throw new Error(j.message || "Failed to load alternatives");
        setSuggested(j.data || []);
        setCurrent(j.current || null);
      } catch (e) {
        // tyliai
      } finally {
        setLoading(false);
      }
    })();
  }, [opened, workoutId, order, token]);

  async function doSearch() {
    setLoading(true);
    try {
      const u = new URL(`/api/planner/exercises/search`, window.location.origin);
      if (q) u.searchParams.set('q', q);
      const r = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || "Search failed");
      setResults(j.data || []);
    } catch (e) {
      // tyliai
    } finally {
      setLoading(false);
    }
  }

  async function swapTo(ex) {
    setLoading(true);
    try {
      const r = await fetch(`/api/planner/workouts/${workoutId}/exercises/${order}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ exercise_id: ex.id }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.message || "Swap failed");
      onPicked(ex); // optimistinis atnaujinimas
    } catch (e) {
      // gali parodyti toast
    } finally {
      setLoading(false);
    }
  }


  
  function List({ items }) {
    return (
      <ScrollArea.Autosize mah={400} type="always" offsetScrollbars>
        <Stack gap="sm">
          {items.map((ex) => (
            <Card key={ex.id} withBorder radius="md" p="sm">
              <Group justify="space-between" align="center" wrap="nowrap">
                <Group wrap="nowrap">
                  <Image src={ex.image_url || undefined} w={48} h={48} radius="sm" fit="contain" />
                  <div>
                    <Text fw={600} size="sm">{ex.name}</Text>
                    <Text size="xs" c="dimmed">
                      {toTitle(ex.primary_muscle)} {ex.equipment ? `• ${toTitle(ex.equipment)}` : ''}
                    </Text>
                  </div>
                </Group>
                <Button size="xs" onClick={() => swapTo(ex)} loading={loading}>Choose</Button>
              </Group>
            </Card>
          ))}
          {!items.length && <Text size="sm" c="dimmed">Nothing found.</Text>}
        </Stack>
      </ScrollArea.Autosize>
    );
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Swap exercise" size="lg" radius="lg">
      {current && (
        <Card withBorder radius="md" p="sm" mb="sm">
          <Text size="sm" c="dimmed">Current exercise</Text>
          <Group mt={6} gap="sm">
            <Image src={current.image_url || undefined} w={40} h={40} radius="sm" fit="contain" />
            <div>
              <Text fw={600} size="sm">{current.name}</Text>
              <Text size="xs" c="dimmed">{toTitle(current.primary_muscle)} {current.equipment ? `• ${toTitle(current.equipment)}` : ''}</Text>
            </div>
          </Group>
        </Card>
      )}

      <Tabs defaultValue="suggested" keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="suggested">Suggested</Tabs.Tab>
          <Tabs.Tab value="search" leftSection={<IconSearch size={14} />}>Search</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="suggested" pt="sm">
          <List items={suggested} />
        </Tabs.Panel>

        <Tabs.Panel value="search" pt="sm">
          <Group mb="sm" wrap="nowrap">
            <TextInput
              placeholder="Search exercises…"
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <ActionIcon variant="filled" onClick={doSearch} loading={loading} aria-label="search">
              <IconSearch size={16} />
            </ActionIcon>
          </Group>
          <List items={results} />
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}