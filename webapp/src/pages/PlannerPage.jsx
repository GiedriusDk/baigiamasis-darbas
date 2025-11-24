
import { useEffect, useMemo, useState } from "react";
import {
  Paper, Title, Text, Group, Button, Select, NumberInput, Stack,
  SegmentedControl, Badge, Divider, Alert, Skeleton, Grid, Card, Image, MultiSelect, Checkbox } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { createPlan, getPlan } from "../api/planner";
import { notifications } from "@mantine/notifications";


async function fetchProfileDefaults(token) {
  const r = await fetch("/api/profiles/user/profile", {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (!r.ok) return null;
  return r.json();
}

const EQUIPMENTS = [
  { value: "gym", label: "Full gym" },
  { value: "dumbbell", label: "Dumbbells" },
  { value: "barbell", label: "Barbell" },
  { value: "cable", label: "Cables" },
  { value: "body weight", label: "Body weight" },
  { value: "kettlebell", label: "Kettlebell" },
];

const DURATION_OPTS = [
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "60 min" },
  { value: "75", label: "1 h 15 min" },
  { value: "90", label: "1 h 30 min" },
];

const INJURIES = [
  { value: "arms", label: "Arms" },
  { value: "shoulders", label: "Shoulders" },
  { value: "back", label: "Back" },
  { value: "chest", label: "Chest" },
  { value: "abs", label: "Abs / Core" },
  { value: "legs", label: "Legs (general)" },
  { value: "quads", label: "Quads" },
  { value: "hamstrings", label: "Hamstrings" },
  { value: "glutes", label: "Glutes" },
  { value: "calves", label: "Calves" },
  { value: "knees", label: "Knees" },
  { value: "ankles", label: "Ankles" },
  { value: "hips", label: "Hips" },
  { value: "neck", label: "Neck" },
  { value: "elbows", label: "Elbows" },
  { value: "wrists", label: "Wrists" },
];

// paima {data: {...}} arba {...}
const unwrap = (x) => (x && x.data) ? x.data : x;

export default function PlannerPage() {
  const [goal, setGoal] = useState("muscle_gain");
  const [sessions, setSessions] = useState(3);
  const [equipment, setEquipment] = useState("gym");
  const [weeks, setWeeks] = useState(8);
  const [sessionMin, setSessionMin] = useState(60);
  const [injuries, setInjuries] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [plan, setPlan] = useState(null);
  const [soloOnly, setSoloOnly] = useState(true);

  const token = useMemo(() => localStorage.getItem("auth_token") || "", []);

  // UI prefill iš profilio (pasirinktinai)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!token) return;
      try {
        const p = await fetchProfileDefaults(token);
        if (!alive || !p) return;
        if (p.goal) setGoal(p.goal);
        if (p.sessions_per_week) setSessions(p.sessions_per_week);
        if (p.available_minutes) setSessionMin(p.available_minutes);
        if (Array.isArray(p.equipment) && p.equipment.length) {
          setEquipment(p.equipment[0]);
        }
        if (Array.isArray(p.injuries)) {
          setInjuries(p.injuries);
        }
      } catch { /* ignore UI prefill errors */ }
    })();
    return () => { alive = false; };
  }, [token]);

  async function onGenerate(e) {
    e?.preventDefault?.();
    setErr("");
    setLoading(true);
    try {
      const created = unwrap(
      await createPlan({
       goal,
       sessions_per_week: sessions,
       equipment,
       weeks,
       session_minutes: sessionMin,
       injuries,
       solo_only: soloOnly ? 1 : 0,
     })
   );
   if (!created?.id) throw new Error("Failed to create plan");
   const full = unwrap(await getPlan(created.id));
   setPlan(full);
    } catch (e) {
      setPlan(null);
      setErr(e.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  async function onSaveAsDefaults(e) {
    e?.preventDefault?.();
    setErr("");
    setLoading(true);
    try {
      await createPlan({
        goal,
        sessions_per_week: sessions,
        equipment,
        weeks,
        session_minutes: sessionMin,
        injuries,
        save_as_defaults: true,
        solo_only: soloOnly ? 1 : 0,
      });

      setPlan(null);
      notifications.show({ color: "green", message: "Defaults saved to your profile" });
    } catch (e) {
      setErr(e.message || "Failed to save defaults");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Planner</Title>
        <Text c="dimmed">Build a plan based on your goal and equipment.</Text>
      </div>

      <Paper withBorder p="lg" radius="lg">


        <Grid gutter="lg">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              label="Goal"
              data={[
                { value: "muscle_gain", label: "Muscle gain" },
                { value: "fat_loss", label: "Fat loss" },
                { value: "performance", label: "Performance" },
                { value: "general_fitness", label: "General fitness" },
              ]}
              value={goal}
              onChange={setGoal}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <div>
              <Text size="sm" fw={500} mb={6}>Sessions / week</Text>
              <SegmentedControl
                value={String(sessions)}
                onChange={(v) => setSessions(Number(v))}
                data={[
                  { label: "2", value: "2" },
                  { label: "3", value: "3" },
                  { label: "4", value: "4" },
                ]}
              />
              <Text size="xs" c="dimmed" mt={6}>Currently supported: 2, 3 or 4.</Text>
            </div>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              label="Equipment"
              data={EQUIPMENTS}
              value={equipment}
              onChange={setEquipment}
            />
          </Grid.Col>
            {/* <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label="Weeks"
              min={4}
              max={24}
              value={weeks}
              onChange={setWeeks}
            />
          </Grid.Col> */}
          

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              label="Session duration"
              data={DURATION_OPTS}
              value={String(sessionMin)}
              onChange={(v) => setSessionMin(Number(v))}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 8 }}>
            <MultiSelect
              label="Injuries (areas to avoid)"
              data={INJURIES}
              value={injuries}
              onChange={setInjuries}
              searchable
              clearable
              placeholder="Select all that apply"
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Checkbox
              mt="lg"
              label="Solo only (avoid assisted exercises)"
              checked={soloOnly}
              onChange={(e) => setSoloOnly(e.currentTarget.checked)}
            />
          </Grid.Col>
        </Grid>

        <Group mt="lg">
          <Button onClick={onGenerate} loading={loading}>Generate my plan</Button>
          <Button variant="outline" onClick={onSaveAsDefaults} loading={loading}>
            Save as defaults
          </Button>
        </Group>

        {err && (
          <Alert mt="md" icon={<IconInfoCircle size={16} />} color="red" variant="light">
            {err}
          </Alert>
        )}
      </Paper>

      {loading && (
        <Grid>
          {[...Array(3)].map((_, i) => (
            <Grid.Col key={i} span={{ base: 12, md: 4 }}>
              <Card withBorder radius="lg" p="lg"><Skeleton height={180} /></Card>
            </Grid.Col>
          ))}
        </Grid>
      )}

      {plan && <MiniPlan plan={plan} />}
    </Stack>
  );
}

function MiniPlan({ plan }) {
  if (!plan || !Array.isArray(plan.workouts) || plan.workouts.length === 0) {
    return null;
  }

  return (
    <Paper withBorder p="lg" radius="lg">
      <Group justify="space-between" align="center" mb="xs">
        <Title order={3} c="blue">Plan #{plan.id}</Title>
        <Badge variant="light">Total days: {plan.workouts.length}</Badge>
      </Group>
      <Text size="sm" c="dimmed" mb="md">
        <b>Goal:</b> {plan.goal} • <b>Weeks:</b> {plan.weeks} • <b>Duration:</b> {plan.session_minutes} min • <b>Start:</b> {plan.start_date}
      </Text>

      <Grid gutter="lg">
        {plan.workouts.map((w) => (
          <Grid.Col key={w.id} span={{ base: 12, md: 4 }}>
            <Card withBorder radius="lg" p="lg">
              <Group justify="space-between" mb="xs">
                <Text fw={600}>{w.name || `Day ${Number(w.day_index) + 1}`}</Text>
                <Badge size="sm" variant="light">Day {Number(w.day_index) + 1}</Badge>
              </Group>
              <Divider my="xs" />

              {!Array.isArray(w.exercises) || w.exercises.length === 0 ? (
                <Text size="sm" c="dimmed">No exercises stored.</Text>
              ) : (
                <Stack gap="sm">
                  {w.exercises.slice(0, 4).map((ex) => {
                    const title =
                      ex.exercise_name ||
                      ex?.catalog_exercise?.name ||
                      `Exercise #${ex.exercise_id}`;

                    const img =
                      ex.image_url ||
                      ex?.catalog_exercise?.image_url ||
                      "";

                    return (
                      <Group key={`${w.id}-${ex.order}`} gap="sm" align="center">
                        {img ? (
                          <Image
                            src={img}
                            w={28}
                            h={28}
                            radius="sm"
                            fit="contain"
                            alt=""
                          />
                        ) : (
                          <div
                            style={{
                              width: 28, height: 28, borderRadius: 6,
                              background: "#f1f3f5", display: "flex",
                              alignItems: "center", justifyContent: "center",
                              fontSize: 12, color: "#666",
                            }}
                            title={title}
                          >
                            {String(title).slice(0, 1).toUpperCase()}
                          </div>
                        )}

                        <div style={{ lineHeight: 1.2 }}>
                          <div style={{ fontWeight: 600 }}>
                            #{ex.order} – {title}
                          </div>
                          <div style={{ color: "#666" }}>
                            {ex.sets}×{ex.rep_min}–{ex.rep_max}, rest {ex.rest_sec}s
                          </div>
                        </div>
                      </Group>
                    );
                  })}
                  {w.exercises.length > 4 && (
                    <Text size="xs" c="dimmed">
                      …and {w.exercises.length - 4} more
                    </Text>
                  )}
                </Stack>
              )}

              
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Paper>
  );
}