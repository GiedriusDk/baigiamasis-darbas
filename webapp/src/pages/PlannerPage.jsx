// src/pages/PlannerPage.jsx
import { useMemo, useState } from "react";
import {
  Paper, Title, Text, Group, Button, Select, NumberInput, Stack,
  SegmentedControl, Badge, Divider, Alert, Skeleton, Grid, Card, Image
} from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { createPlan } from "../api/planner";

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

export default function PlannerPage() {
  const [goal, setGoal] = useState("muscle_gain");
  const [sessions, setSessions] = useState(3);
  const [equipment, setEquipment] = useState("gym");
  const [weeks, setWeeks] = useState(8);
  const [sessionMin, setSessionMin] = useState(60);       // <— nauja
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [plan, setPlan] = useState(null);

  const token = useMemo(() => localStorage.getItem("auth_token") || "", []);

  async function onGenerate(e) {
    e?.preventDefault?.();
    setErr("");
    setLoading(true);
    try {
      const created = await createPlan({
        goal,
        sessions_per_week: sessions,
        equipment,
        weeks,
        session_minutes: sessionMin,                     // <— svarbu
      });

      const enriched = await fetch(`/api/planner/plans/${created.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.message || "Failed to load created plan");
        return j;
      });

      setPlan(enriched);
    } catch (e) {
      setErr(e.message || "Unexpected error");
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
        <Group justify="space-between" align="center" mb="md">
          <Badge size="sm" variant="light">MVP — 2–4 sessions/week</Badge>
        </Group>

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
                data={[{ label: "2", value: "2" }, { label: "3", value: "3" }, { label: "4", value: "4" }]}
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

          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label="Weeks"
              min={4}
              max={24}
              value={weeks}
              onChange={setWeeks}
            />
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              label="Session duration"
              data={DURATION_OPTS}
              value={String(sessionMin)}
              onChange={(v) => setSessionMin(Number(v))}   // <— paversk į skaičių
            />
          </Grid.Col>
        </Grid>

        <Group mt="lg">
          <Button onClick={onGenerate} loading={loading}>Generate my plan</Button>
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
  return (
    <Paper withBorder p="lg" radius="lg">
      <Group justify="space-between" align="center" mb="xs">
        <Title order={3} c="blue">Plan #{plan.id}</Title>
        <Badge variant="light">Total days: {plan.workouts?.length || 0}</Badge>
      </Group>
      <Text size="sm" c="dimmed" mb="md">
        <b>Goal:</b> {plan.goal} • <b>Weeks:</b> {plan.weeks} • <b>Duration:</b> {plan.session_minutes} min • <b>Start:</b> {plan.start_date}
      </Text>

      <Grid gutter="lg">
        {(plan.workouts || []).map((w) => (
          <Grid.Col key={w.id} span={{ base: 12, md: 4 }}>
            <Card withBorder radius="lg" p="lg">
              <Group justify="space-between" mb="xs">
                <Text fw={600}>{w.name}</Text>
                <Badge size="sm" variant="light">Day {w.day_index + 1}</Badge>
              </Group>
              <Divider my="xs" />

              {(!w.exercises || w.exercises.length === 0) ? (
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
                            {title.slice(0, 1).toUpperCase()}
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