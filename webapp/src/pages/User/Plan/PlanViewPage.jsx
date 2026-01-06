import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container, Group, Title, Card, Grid, Text, Badge, Loader, Alert, Avatar, Modal, AspectRatio, Stack, Divider
} from "@mantine/core";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import { getPublicPlan, getPublicDayExercises } from "../../../api/plans";
import { getPublicCoachExercises } from "../../../api/profiles";

function ytId(url = "") {
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|v\/|embed\/|shorts\/))([A-Za-z0-9_-]{6,12})/);
  return m ? m[1] : null;
}
function pickThumb(ex) {
  const url =
    ex?.media_url ||
    ex?.image_url ||
    ex?.thumbnail_url ||
    ex?.gif_url ||
    ex?.video_url ||
    ex?.youtube_url ||
    "";
  const id = ytId(url);
  if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  return ex?.thumbnail_url || ex?.image_url || ex?.media_url || ex?.gif_url || null;
}
function Thumb({ ex }) {
  const src = pickThumb(ex);
  return (
    <Avatar src={src || undefined} alt={ex?.title || ""} radius="sm" size={44} variant={src ? "filled" : "light"}>
      {!src && <IconPlayerPlayFilled size={16} />}
    </Avatar>
  );
}
function fmtSetLine(it) {
  const a = [];
  if (it.sets) a.push(`${it.sets}×`);
  if (it.rep_min || it.rep_max) {
    const reps =
      it.rep_min && it.rep_max && it.rep_min !== it.rep_max
        ? `${it.rep_min}–${it.rep_max}`
        : `${it.rep_min || it.rep_max}`;
    if (reps) a.push(reps);
  }
  if (it.time_sec) a.push(`${it.time_sec}s`);
  if (it.rest_sec) a.push(`• rest ${it.rest_sec}s`);
  return a.join(" ");
}

export default function PlanPreview() {
  const { productId } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [plan, setPlan] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [daysByWeek, setDaysByWeek] = useState({});
  const [exByDay, setExByDay] = useState({});
  const [coachExercises, setCoachExercises] = useState([]);
  const [openedEx, setOpenedEx] = useState(null);

  const exMetaById = useMemo(() => {
    const m = new Map();
    (coachExercises || []).forEach((e) => m.set(Number(e.id), e));
    return m;
  }, [coachExercises]);

  useEffect(() => {
    setLoading(true);
    setErr("");
    (async () => {
      try {
        const res = await getPublicPlan(Number(productId));
        const payload = res?.data ?? res;
        const p = payload?.plan ?? (payload?.id ? payload : null);
        const ws = Array.isArray(payload?.weeks) ? payload.weeks : [];
        const ds = Array.isArray(payload?.days) ? payload.days : [];
        setPlan(p);
        setWeeks(ws);
        const grouped = {};
        ds.forEach((d) => {
          const w = Number(d.week_number);
          if (!grouped[w]) grouped[w] = [];
          grouped[w].push(d);
        });
        Object.keys(grouped).forEach((k) =>
          grouped[k].sort((a, b) => (a.day_number || 0) - (b.day_number || 0))
        );
        setDaysByWeek(grouped);
        if (p?.coach_id) {
          const list = await getPublicCoachExercises(p.coach_id);
          setCoachExercises(Array.isArray(list?.data) ? list.data : Array.isArray(list) ? list : []);
        }
      } catch (e) {
        setErr(e.message || "Failed to load plan");
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  useEffect(() => {
    const allDays = Object.values(daysByWeek).flat();
    if (!allDays.length) return;
    (async () => {
      const pairs = await Promise.all(
        allDays.map(async (d) => {
          try {
            const res = await getPublicDayExercises(Number(productId), d.id);
            const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            const enriched = rows.map((it, idx) => {
              const meta = exMetaById.get(Number(it.exercise_id)) || null;
              return { ...it, order: typeof it.order === "number" ? it.order : idx, meta };
            });
            return [d.id, enriched];
          } catch {
            return [d.id, []];
          }
        })
      );
      setExByDay((prev) => {
        const next = { ...prev };
        pairs.forEach(([dayId, list]) => {
          next[dayId] = list;
        });
        return next;
      });
    })();
  }, [daysByWeek, exMetaById, productId]);

  if (loading) return <Group justify="center" py="xl"><Loader /></Group>;
  if (err) return <Container p="md"><Alert color="red">{err}</Alert></Container>;
  if (!plan) return <Container p="md"><Alert color="yellow">Plan not found</Alert></Container>;

  const totalDays = Object.values(daysByWeek).reduce((n, arr) => n + (arr?.length || 0), 0);

  return (
    <Container size="xl" p="md">
      <Card withBorder radius="xl" p="lg">
        <Title order={2}>{plan?.title ?? `Plan #${productId}`}</Title>
        {plan?.description ? (
          <Text c="dimmed" size="sm" mt={4}>{plan.description}</Text>
        ) : null}
      </Card>

      <Divider my="md" />

      {weeks.map((w) => (
        <Card key={w.id} withBorder radius="xl" p="md" mb="lg">
          <Group gap="sm" mb="xs">
            <Badge variant="light">Week {w.week_number}</Badge>
            <Text fw={700}>{w.title}</Text>
          </Group>
          <Text c="dimmed" size="sm" mb="md">
            {w.notes?.trim() ? w.notes : "No week notes"}
          </Text>

          <Grid gutter="lg">
            {(daysByWeek[w.week_number] || []).map((d) => (
              <Grid.Col key={d.id} span={{ base: 12, md: 6, lg: 4 }}>
                <Card withBorder radius="lg" p="md">
                  <Group justify="space-between" mb="xs">
                    <Text fw={700}>Day {d.day_number}</Text>
                    <Badge variant="outline">{(exByDay[d.id] || []).length} exercises</Badge>
                  </Group>
                  <Text c="dimmed" size="sm" mb="sm">
                    {d.title || "—"}
                  </Text>
                  {d.notes?.trim() && (
                    <Text c="dimmed" size="sm" mb="sm">
                      {d.notes}
                    </Text>
                  )}

                  <Stack gap="xs">
                    {(exByDay[d.id] || []).map((it) => {
                      const meta = it.meta || {};
                      const line = fmtSetLine(it);
                      const muscles = meta.primary_muscle || meta.muscle_group || "";
                      const equipment = meta.equipment || meta.tools || "";
                      return (
                        <Card
                          key={`${d.id}-${it.exercise_id}-${it.order}`}
                          withBorder
                          radius="md"
                          p="sm"
                          onClick={() => setOpenedEx({ it, meta })}
                          style={{ cursor: "pointer" }}
                        >
                          <Group align="flex-start" wrap="nowrap">
                            <Text fw={700} size="sm" mr={4}>
                              #{(it.order ?? 0) + 1}
                            </Text>
                            <Thumb ex={meta} />
                            <div style={{ minWidth: 0 }}>
                              <Text fw={700} lineClamp={2}>
                                {it.custom_title || meta.title || `#${it.exercise_id}`}
                              </Text>
                              {line && (
                                <Text size="sm" c="dimmed">
                                  {line}
                                </Text>
                              )}
                              <Text size="xs" c="dimmed">
                                {[muscles, equipment].filter(Boolean).join(" • ")}
                              </Text>
                            </div>
                          </Group>
                        </Card>
                      );
                    })}
                    {(exByDay[d.id] || []).length === 0 && (
                      <Text c="dimmed" size="sm">
                        No exercises yet.
                      </Text>
                    )}
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Card>
      ))}

      <ExerciseModal openedEx={openedEx} onClose={() => setOpenedEx(null)} />
    </Container>
  );
}

function ExerciseModal({ openedEx, onClose }) {
  if (!openedEx) return null;
  const { it, meta } = openedEx;
  const media = meta?.media_url || meta?.youtube_url || meta?.video_url || meta?.gif_url || meta?.image_url || "";
  const yid = ytId(media);
  const img = pickThumb(meta);
  const line = fmtSetLine(it);
  return (
    <Modal opened onClose={onClose} size="lg" title={it.custom_title || meta?.title || "Exercise"}>
      <Stack gap="md">
        <AspectRatio ratio={16 / 9}>
          {yid ? (
            <iframe
              src={`https://www.youtube.com/embed/${yid}?rel=0`}
              title="YouTube"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ border: 0, width: "100%", height: "100%" }}
            />
          ) : img ? (
            <img
              src={img}
              alt={meta?.title || ""}
              style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 12 }}
            />
          ) : (
            <div style={{ background: "rgba(0,0,0,0.05)", borderRadius: 12 }} />
          )}
        </AspectRatio>

        <div>
          <Text fw={700} size="lg">
            {it.custom_title || meta?.title || ""}
          </Text>
          {line && (
            <Text c="dimmed" size="sm" mt={4}>
              {line}
            </Text>
          )}
        </div>

        <Divider />

        <Grid>
          {meta?.primary_muscle && (
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text fw={600} size="sm">
                Primary muscle
              </Text>
              <Text c="dimmed" size="sm">
                {meta.primary_muscle}
              </Text>
            </Grid.Col>
          )}
          {meta?.secondary_muscles && (
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text fw={600} size="sm">
                Secondary muscles
              </Text>
              <Text c="dimmed" size="sm">
                {Array.isArray(meta.secondary_muscles) ? meta.secondary_muscles.join(", ") : meta.secondary_muscles}
              </Text>
            </Grid.Col>
          )}
          {meta?.difficulty && (
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text fw={600} size="sm">
                Difficulty
              </Text>
              <Text c="dimmed" size="sm">
                {meta.difficulty}
              </Text>
            </Grid.Col>
          )}
          {meta?.equipment && (
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Text fw={600} size="sm">
                Equipment
              </Text>
              <Text c="dimmed" size="sm">
                {meta.equipment}
              </Text>
            </Grid.Col>
          )}
        </Grid>

        {meta?.instructions && (
          <>
            <Divider />
            <Text fw={600} size="sm">
              Instructions
            </Text>
            <Text c="dimmed" size="sm" style={{ whiteSpace: "pre-wrap" }}>
              {meta.instructions}
            </Text>
          </>
        )}
      </Stack>
    </Modal>
  );
}