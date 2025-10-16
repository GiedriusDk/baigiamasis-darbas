// webapp/src/pages/PlanPreview.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Container, Group, Title, Card, Grid, Text, Badge, Loader, Alert, Button, Avatar
} from "@mantine/core";
import { IconPlayerPlayFilled } from "@tabler/icons-react";
import { getPublicPlan, getPublicDayExercises } from "../api/plans";
import { getPublicCoachExercises } from "../api/profiles";

function ytId(url = "") {
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|v\/|embed\/|shorts\/))([A-Za-z0-9_-]{6,12})/);
  return m ? m[1] : null;
}
function pickThumb(ex) {
  const url = ex?.media_url || ex?.image_url || ex?.thumbnail_url || ex?.gif_url || ex?.video_url || ex?.youtube_url || "";
  const id = ytId(url);
  if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  return (ex?.thumbnail_url || ex?.image_url || ex?.media_url || ex?.gif_url) || null;
}
function Thumb({ ex }) {
  const src = pickThumb(ex);
  return (
    <Avatar src={src || undefined} alt={ex?.title || ""} radius="sm" size={40} variant={src ? "filled" : "light"}>
      {!src && <IconPlayerPlayFilled size={16} />}
    </Avatar>
  );
}

export default function PlanPreview() {
  const { productId } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [plan, setPlan] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [daysByWeek, setDaysByWeek] = useState({});
  const [exByDay, setExByDay] = useState({});

  // coach’o pratimų meta (pavadinimai, thumbnail’ai ir t.t.)
  const [coachExercises, setCoachExercises] = useState([]);
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
          setCoachExercises(Array.isArray(list?.data) ? list.data : (Array.isArray(list) ? list : []));
        }
      } catch (e) {
        setErr(e.message || "Failed to load plan");
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  async function loadDayExercises(day) {
    try {
      const res = await getPublicDayExercises(Number(productId), day.id);
      const rows = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      const enriched = rows.map((it, idx) => {
        const meta = exMetaById.get(Number(it.exercise_id)) || null;
        return {
          ...it,
          order: typeof it.order === "number" ? it.order : idx,
          meta,
        };
      });
      setExByDay((prev) => ({ ...prev, [day.id]: enriched }));
    } catch (e) {
      // jei nepavyko – paliekam tuščią
      setExByDay((prev) => ({ ...prev, [day.id]: [] }));
    }
  }

  if (loading) return <Group justify="center" py="xl"><Loader /></Group>;
  if (err) return <Container p="md"><Alert color="red">{err}</Alert></Container>;
  if (!plan) return <Container p="md"><Alert color="yellow">Plan not found</Alert></Container>;

  return (
    <Container size="xl" p="md">
      <Group justify="space-between" mb="md">
        <Title order={2}>{plan.title || `Plan #${productId}`}</Title>
      </Group>

      <Grid>
        {weeks.map((w) => (
          <Grid.Col key={w.id} span={12}>
            <Card withBorder radius="lg" p="md">
              <Group gap="sm" mb="sm">
                <Badge variant="light">Week {w.week_number}</Badge>
                <Text fw={600}>{w.title}</Text>
              </Group>

              {(daysByWeek[w.week_number] || []).map((d) => (
                <Card key={d.id} withBorder radius="md" p="md" mb="xs">
                  <Group gap="sm" mb="xs">
                    <Badge variant="outline">Day {d.day_number}</Badge>
                    <Text fw={600}>{d.title}</Text>
                  </Group>
                  <Text c="dimmed" size="sm" mb="sm">{d.notes || "No notes"}</Text>

                  {!exByDay[d.id] ? (
                    <Button size="xs" variant="light" onClick={() => loadDayExercises(d)}>Show exercises</Button>
                  ) : exByDay[d.id].length === 0 ? (
                    <Text c="dimmed" size="sm">No exercises yet.</Text>
                  ) : (
                    <Grid>
                      {exByDay[d.id].map((it) => {
                        const meta = it.meta;
                        return (
                          <Grid.Col key={`${d.id}-${it.exercise_id}-${it.order}`} span={{ base: 12, md: 6 }}>
                            <Card withBorder radius="md" p="sm">
                              <Group justify="space-between" align="center" wrap="nowrap">
                                <Group gap="sm" wrap="nowrap">
                                  <Badge>{(it.order ?? 0) + 1}</Badge>
                                  <Thumb ex={meta} />
                                  <div>
                                    <Text fw={600}>
                                      {it.custom_title || meta?.title || `#${it.exercise_id}`}
                                    </Text>
                                    <Group gap={6} mt={2}>
                                      {meta?.primary_muscle && <Badge size="xs" variant="light">{meta.primary_muscle}</Badge>}
                                      {meta?.difficulty && <Badge size="xs" variant="dot">{meta.difficulty}</Badge>}
                                      {(meta?.youtube_url || ytId(meta?.media_url)) && (
                                        <Badge size="xs" variant="outline" leftSection={<IconPlayerPlayFilled size={10} />}>YouTube</Badge>
                                      )}
                                    </Group>
                                  </div>
                                </Group>
                              </Group>
                            </Card>
                          </Grid.Col>
                        );
                      })}
                    </Grid>
                  )}
                </Card>
              ))}
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
}