import { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container, Group, Stack, Title, Text, Button, Card, Grid, Badge, Modal,
  TextInput, Textarea, ScrollArea, Checkbox, Loader, Alert, Divider, Avatar, ActionIcon, Tabs, Pagination
} from "@mantine/core";
import { IconPlayerPlayFilled, IconArrowUp, IconArrowDown, IconTrash } from "@tabler/icons-react";
import { listCoachExercises, importExerciseFromCatalog } from "../api/profiles";
import {
  getPlanByProduct, createWeek, createDay, deleteWeek, deleteDay,
  getDayExercises, setDayExercises, updateWeek, updateDay
} from "../api/plans";
import { useAuth } from "../auth/useAuth";
import { getPublicPlan } from "../api/plans"; 
import { searchCatalogExercises } from "../api/catalog";

function ytId(url = "") {
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|v\/|embed\/|shorts\/))([A-Za-z0-9_-]{6,12})/);
  return m ? m[1] : null;
}
function pickThumb(ex) {
  const url = ex?.media_path || ex?.external_url || ex?.media_url || ex?.image_url || ex?.thumbnail_url || ex?.gif_url || ex?.video_url || ex?.youtube_url || "";
  const id = ytId(url);
  if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
  return (ex?.thumbnail_url || ex?.image_url || ex?.media_url || ex?.gif_url || ex?.media_path || ex?.external_url || null );
}
function Thumb({ ex }) {
  const src = pickThumb(ex);
  return (
    <Avatar src={src || undefined} alt={ex?.title || ""} radius="sm" size={42} variant={src ? "filled" : "light"}>
      {!src && <IconPlayerPlayFilled size={18} />}
    </Avatar>
  );
}

function DayExercisesPicker({ opened, onClose, productId, day, onSaved }) {
  const [tab, setTab] = useState("my");
  const [myItems, setMyItems] = useState([]);
  const [sel, setSel] = useState(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [shared, setShared] = useState([]);
  const [sharedMeta, setSharedMeta] = useState({ page: 1, lastPage: 1, total: 0 });
  const [sharedQ, setSharedQ] = useState("");
  const [sharedPage, setSharedPage] = useState(1);
  const [sharedSel, setSharedSel] = useState(new Set());
  const [importedTitles, setImportedTitles] = useState({});
  const perPage = 24;

  useEffect(() => {
    if (!opened || !productId || !day?.id) return;
    setLoading(true);
    setErr("");
    (async () => {
      try {
        const all = await listCoachExercises({ only_custom: 1 });
        const have = await getDayExercises(Number(productId), Number(day.id));
        setMyItems(Array.isArray(all) ? all : []);
        const ids = Array.isArray(have?.data)
          ? have.data.map((x) => Number(x.exercise_id ?? x.id))
          : [];
        setSel(new Set(ids));
        const map = {};
        (have?.data || []).forEach((x) => {
          const id = Number(x.exercise_id ?? x.id);
          if (x.custom_title) map[id] = x.custom_title;
        });
        setImportedTitles(map);
      } catch (e) {
        setErr(e.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [opened, productId, day?.id]);

  useEffect(() => {
    if (!opened || tab !== "shared") return;
    (async () => {
      try {
        const { data, meta } = await searchCatalogExercises({
          q: sharedQ,
          page: sharedPage,
          per_page: perPage,
        });
        setShared(data || []);
        setSharedMeta({
          page: meta?.page ?? 1,
          lastPage: meta?.lastPage ?? 1,
          total: meta?.total ?? 0,
        });
      } catch {
        setShared([]);
        setSharedMeta({ page: 1, lastPage: 1, total: 0 });
      }
    })();
  }, [opened, tab, sharedQ, sharedPage]);

  const filteredMy = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q
      ? (myItems || []).filter((i) => {
          const t = (i.title || "").toLowerCase();
          const m = (i.primary_muscle || "").toLowerCase();
          const d = (i.difficulty || "").toLowerCase();
          return t.includes(q) || m.includes(q) || d.includes(q);
        })
      : myItems || [];
    return [...base].sort(
      (a, b) => Number(sel.has(Number(b.id))) - Number(sel.has(Number(a.id)))
    );
  }, [myItems, search, sel]);

  const filteredShared = useMemo(() => {
    return [...(shared || [])].sort(
      (a, b) => Number(sharedSel.has(Number(b.id))) - Number(sharedSel.has(Number(a.id)))
    );
  }, [shared, sharedSel]);

  const toggleMy = (id) => {
    const n = Number(id);
    setSel((prev) => {
      const s = new Set(prev);
      if (s.has(n)) s.delete(n);
      else s.add(n);
      return s;
    });
  };

  const toggleShared = async (catalogId) => {
    const n = Number(catalogId);
    if (sharedSel.has(n)) {
      setSharedSel((prev) => {
        const s = new Set(prev);
        s.delete(n);
        return s;
      });
      return;
    }
    setSharedSel((prev) => new Set([...prev, n]));
    try {
      const ex = await importExerciseFromCatalog(n);
      const newId = Number(ex?.id ?? ex?.data?.id);

      if (newId) {
        const picked = (shared || []).find((x) => Number(x.id) === n);

        setImportedTitles((prev) => ({
          ...prev,
          [newId]: picked?.name || picked?.title || `Exercise ${newId}`,
        }));

        setSel((prev) => new Set([...prev, newId]));

        const all = await listCoachExercises({ only_custom: 1 });
        setMyItems(Array.isArray(all) ? all : []);
      }
    } catch (e) {
      setErr(e.message || "Import failed");
      setSharedSel((prev) => {
        const s = new Set(prev);
        s.delete(n);
        return s;
      });
    }
  };

  const save = async () => {
    setSaving(true);
    setErr("");
    try {
      const ordered = Array.from(sel).map((eid, i) => {
        const ex = (myItems || []).find((x) => Number(x.id) === Number(eid));
        return {
          exercise_id: Number(eid),
          order: i,
          custom_title: ex?.title ?? importedTitles[Number(eid)] ?? null,
        };
      });
      await setDayExercises(Number(productId), Number(day.id), ordered);
      await onSaved?.(); 
      onClose();
    } catch (e) {
      setErr(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} size="lg" title={`Exercises: ${day?.title || ""}`}>
      <Stack gap="sm">
        {err && <Alert color="red">{err}</Alert>}

        <Tabs value={tab} onChange={setTab}>
          <Tabs.List>
            <Tabs.Tab value="my">My exercises</Tabs.Tab>
            <Tabs.Tab value="shared">Shared catalog</Tabs.Tab>
          </Tabs.List>

        <Tabs.Panel value="my" pt="sm">
          <TextInput
            placeholder="Search my exercises..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            mb="sm"
          />
          {loading ? (
            <Group justify="center" py="lg">
              <Loader />
            </Group>
          ) : (
            <ScrollArea h={460}>
              <Stack gap="xs">
                {filteredMy.map((e) => (
                  <Card key={e.id} withBorder radius="md" p="sm">
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="sm" wrap="nowrap">
                        <Thumb ex={e} />
                        <div>
                          <Text fw={600}>{e.title}</Text>
                          <Group gap={6} mt={4}>
                            {e.primary_muscle && (
                              <Badge variant="light">{e.primary_muscle}</Badge>
                            )}
                            {e.difficulty && <Badge variant="dot">{e.difficulty}</Badge>}
                          </Group>
                        </div>
                      </Group>
                      <Checkbox
                        checked={sel.has(Number(e.id))}
                        onChange={() => toggleMy(e.id)}
                      />
                    </Group>
                  </Card>
                ))}
                {filteredMy.length === 0 && <Text c="dimmed">No exercises.</Text>}
              </Stack>
            </ScrollArea>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="shared" pt="sm">
          <Group align="end" mb="sm" grow>
            <TextInput
              label="Search in catalog"
              placeholder="Search…"
              value={sharedQ}
              onChange={(e) => {
                setSharedQ(e.currentTarget.value);
                setSharedPage(1);
              }}
            />
          </Group>
          <ScrollArea h={420}>
            <Stack gap="xs">
              {filteredShared.map((e) => (
                <Card key={e.id} withBorder radius="md" p="sm">
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      <Avatar src={e.image_url || undefined} radius="sm" size={42} />
                      <div>
                        <Text fw={600}>{e.name}</Text>
                        <Group gap={6} mt={4}>
                          {e.primary_muscle && (
                            <Badge variant="light">{e.primary_muscle}</Badge>
                          )}
                          {e.equipment && <Badge variant="outline">{e.equipment}</Badge>}
                        </Group>
                      </div>
                    </Group>
                    <Checkbox
                      checked={sharedSel.has(Number(e.id))}
                      onChange={() => toggleShared(e.id)}
                    />
                  </Group>
                </Card>
              ))}
              {filteredShared.length === 0 && <Text c="dimmed">No results.</Text>}
            </Stack>
          </ScrollArea>
          <Group justify="center" mt="sm">
            <Pagination
              total={sharedMeta.lastPage || 1}
              value={sharedPage}
              onChange={setSharedPage}
            />
          </Group>
        </Tabs.Panel>
        </Tabs>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

export default function CoachPlanEditor() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [plan, setPlan] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [daysByWeek, setDaysByWeek] = useState({});
  const [pickerDay, setPickerDay] = useState(null);
  const [publicPlan, setPublicPlan] = useState(null);
  const [coachEx, setCoachEx] = useState([]);
  const [dayItems, setDayItems] = useState({});

  const ownerCoachId = Number(plan?.coach_id || 0);

  const [weekEditOpen, setWeekEditOpen] = useState(false);
  const [weekEdit, setWeekEdit] = useState(null);
  const [weekForm, setWeekForm] = useState({ title: "", notes: "" });
  const [savingWeek, setSavingWeek] = useState(false);
  const [dayEditOpen, setDayEditOpen] = useState(false);
  const [dayEdit, setDayEdit] = useState(null);
  const [dayForm, setDayForm] = useState({ title: "", notes: "" });
  const [savingDay, setSavingDay] = useState(false);

  const exById = useMemo(() => {
    const m = new Map();
    coachEx.forEach((e) => m.set(Number(e.id), e));
    return m;
  }, [coachEx]);

  const loadDayItems = useCallback(async (pid, dayId) => {
    const res = await getDayExercises(pid, dayId);
    const ids = Array.isArray(res?.data) ? res.data.map((x) => Number(x.exercise_id ?? x.id)) : [];
    setDayItems((p) => ({ ...p, [dayId]: ids }));
  }, []);

useEffect(() => {
  let cancelled = false;
  setLoading(true);
  setErr("");

  (async () => {
    try {
      const res = await getPlanByProduct(Number(productId));
      if (cancelled) return;

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

      await Promise.all(ds.map((d) => loadDayItems(Number(productId), d.id)));

      const pub = await getPublicPlan(Number(productId));
      const pubPayload = pub?.data ?? pub ?? null;
      if (!cancelled) setPublicPlan(pubPayload || null);

    } catch (e) {
      if (!cancelled) setErr(e.message || "Failed to load plan");
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();

  return () => { cancelled = true; };
}, [productId, loadDayItems]);

  useEffect(() => {
    let cancelled = false;
    if (!ownerCoachId) return;
    (async () => {
      try {
        const ex = await listCoachExercises({ only_custom: 0 });
        if (!cancelled) setCoachEx(Array.isArray(ex) ? ex : []);
      } catch {
        if (!cancelled) setCoachEx([]);
      }
    })();
    return () => { cancelled = true; };
  }, [ownerCoachId]);

  const addWeek = async () => {
    const next = (weeks[weeks.length - 1]?.week_number || 0) + 1;
    const res = await createWeek(plan.id, { week_number: next, title: `Week ${next}` });
    const w = res?.data || res;
    setWeeks((prev) => [...prev, w]);
    setDaysByWeek((p) => ({ ...p, [next]: [] }));
  };

  const removeWeek = async (w) => {
    await deleteWeek(w.id);
    setWeeks((prev) => prev.filter((x) => x.id !== w.id));
    setDaysByWeek((prev) => {
      const cp = { ...prev };
      delete cp[w.week_number];
      return cp;
    });
  };

  const addDay = async (w) => {
    const list = daysByWeek[w.week_number] || [];
    const next = (list[list.length - 1]?.day_number || 0) + 1;
    const res = await createDay(plan.id, { week_number: w.week_number, day_number: next, title: `Day ${next}` });
    const d = res?.data || res;
    setDaysByWeek((prev) => ({ ...prev, [w.week_number]: [...(prev[w.week_number] || []), d] }));
    await loadDayItems(Number(productId), d.id);
  };

  const removeDay = async (w, d) => {
    await deleteDay(d.id);
    setDaysByWeek((prev) => ({ ...prev, [w.week_number]: (prev[w.week_number] || []).filter((x) => x.id !== d.id) }));
    setDayItems((p) => {
      const cp = { ...p };
      delete cp[d.id];
      return cp;
    });
  };

  const bumpOrder = async (dayId, idx, dir) => {
    const list = dayItems[dayId] || [];
    const i2 = idx + dir;
    if (i2 < 0 || i2 >= list.length) return;
    const next = [...list];
    [next[idx], next[i2]] = [next[i2], next[idx]];
    setDayItems((p) => ({ ...p, [dayId]: next }));
    const payload = next.map((eid, i) => {
      const ex = exById.get(Number(eid));
      return {
        exercise_id: Number(eid),
        order: i,
        custom_title: ex?.title ?? importedTitles[Number(eid)] ?? null,
      };
    });
    await setDayExercises(Number(productId), dayId, payload);
  };

  function openWeekEdit(w) {
    setWeekEdit(w);
    setWeekForm({
      title: w.title || `Week ${w.week_number}`,
      notes: w.notes || "",
    });
    setWeekEditOpen(true);
  }

  async function saveWeekEdit() {
    if (!weekEdit) return;
    try {
      setSavingWeek(true);
      const res = await updateWeek(Number(weekEdit.id), {
        title: weekForm.title?.trim() || null,
        notes: weekForm.notes?.trim() || "",
      });
      const updated = res?.data || res;
      setWeeks(prev => prev.map(x => x.id === updated.id ? { ...x, ...updated } : x));
      setWeekEditOpen(false);
      setWeekEdit(null);
    } catch (e) {
      alert(e.message || "Failed to save week");
    } finally {
      setSavingWeek(false);
    }
  }

  function openDayEdit(day) {
    setDayEdit(day);
    setDayForm({
        title: day.title || `Day ${day.day_number}`,
        notes: day.notes || "",
    });
    setDayEditOpen(true);
    }

  async function saveDayEdit() {
    if (!dayEdit) return;
    try {
        setSavingDay(true);
        const res = await updateDay(Number(dayEdit.id), {
        title: dayForm.title?.trim() || null,
        notes: dayForm.notes?.trim() || "",
        });
        const updated = res?.data || res;
        setDaysByWeek(prev => {
        const copy = { ...prev };
        const wk = Number(updated.week_number);
        copy[wk] = (copy[wk] || []).map(d => d.id === updated.id ? { ...d, ...updated } : d);
        return copy;
        });

        setDayEditOpen(false);
        setDayEdit(null);
    } catch (e) {
        alert(e.message || "Failed to save day");
    } finally {
        setSavingDay(false);
    }
    }

  if (loading) return <Group justify="center" py="xl"><Loader /></Group>;
  if (err) return <Container p="md"><Alert color="red">{err}</Alert></Container>;
  if (!plan) return <Container p="md"><Alert color="yellow">Plan not found</Alert></Container>;

  return (
    <Container size="xl" p="md">
      <Group justify="space-between" mb="md">
        <Title order={2}>
          {publicPlan?.plan?.title || plan?.title || `Plan for product #${productId}`}
        </Title>
        {(publicPlan?.plan?.description || plan?.description) && (
          <Text c="dimmed" size="sm">
            {publicPlan?.plan?.description || plan?.description}
          </Text>
        )}
        <Button variant="default" onClick={() => navigate(-1)}>Back</Button>
      </Group>
      <Divider mb="md" />

      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={4}>Weeks</Title>
          <Button size="xs" onClick={addWeek}>Add week</Button>
        </Group>

        <Stack gap="md">
          {weeks.map((w) => (
            <Card key={w.id} withBorder radius="lg" p="md">
              <Group justify="space-between" mb="sm">
                <Group gap="sm">
                  <Badge variant="light">Week {w.week_number}</Badge>
                  <Text fw={600}>{w.title}</Text>
                </Group>
                <Group gap="xs">
                  <Button size="xs" variant="default" onClick={() => openWeekEdit(w)}>Edit</Button>
                  <Button size="xs" variant="light" onClick={() => addDay(w)}>Add day</Button>
                  <Button size="xs" color="red" variant="subtle" onClick={() => removeWeek(w)}>Delete week</Button>
                </Group>
              </Group>

              <Text c="dimmed" size="sm" mb="sm">{w.notes?.trim() ? w.notes : "No week notes"}</Text>

              <Grid>
                {(daysByWeek[w.week_number] || []).map((d) => (
                  <Grid.Col key={d.id} span={{ base: 12, sm: 6, md: 4 }}>
                    <Card withBorder radius="md" p="md">
                      <Stack gap="xs">
                        <Group justify="space-between">
                        <Group gap="sm">
                            <Badge variant="outline">Day {d.day_number}</Badge>
                            <Text fw={600}>{d.title}</Text>
                        </Group>
                        <Group gap="xs">
                            <Button size="xs" variant="default" onClick={() => openDayEdit(d)}>Edit</Button>
                            <Button size="xs" color="red" variant="subtle" onClick={() => removeDay(w, d)}>Delete</Button>
                        </Group>
                        </Group>

                        <Text c="dimmed" size="sm">{d.notes || "No notes"}</Text>

                        <Stack gap="xs">
                          {(dayItems[d.id] || []).map((eid, idx) => {
                            const ex = exById.get(Number(eid));
                            return (
                              <Card key={`${d.id}-${eid}-${idx}`} p="xs" radius="md" withBorder>
                                <Group justify="space-between" wrap="nowrap">
                                  <Group gap="sm" wrap="nowrap">
                                    <Text fw={600} size="sm">#{idx + 1}</Text>
                                    <Thumb ex={ex} />
                                    <div>
                                      <Text fw={600} size="sm">{ex?.title || `Exercise ${eid}`}</Text>
                                      <Group gap={6} mt={2}>
                                        {ex?.primary_muscle && <Badge size="xs" variant="light">{ex.primary_muscle}</Badge>}
                                        {ex?.difficulty && <Badge size="xs" variant="dot">{ex.difficulty}</Badge>}
                                        {(ex?.youtube_url || ytId(ex?.media_url)) && <Badge size="xs" variant="outline" leftSection={<IconPlayerPlayFilled size={10} />}>YouTube</Badge>}
                                      </Group>
                                    </div>
                                  </Group>
                                  <Group gap={6} wrap="nowrap">
                                    <ActionIcon variant="subtle" onClick={() => bumpOrder(d.id, idx, -1)} title="Move up">
                                      <IconArrowUp size={16} />
                                    </ActionIcon>
                                    <ActionIcon variant="subtle" onClick={() => bumpOrder(d.id, idx, +1)} title="Move down">
                                      <IconArrowDown size={16} />
                                    </ActionIcon>
                                    <ActionIcon
                                      color="red"
                                      variant="subtle"
                                      title="Remove"
                                      onClick={async () => {
                                        const filtered = (dayItems[d.id] || []).filter((x, i) => i !== idx);
                                        setDayItems((p) => ({ ...p, [d.id]: filtered }));
                                        const payload = filtered.map((eid2, i) => {
                                          const ex = exById.get(Number(eid2));
                                          return {
                                            exercise_id: Number(eid2),
                                            order: i,
                                            custom_title: ex?.title ?? importedTitles[Number(eid)] ?? null,
                                          };
                                        });
                                        await setDayExercises(Number(productId), d.id, payload);
                                      }}
                                    >
                                      <IconTrash size={16} />
                                    </ActionIcon>
                                  </Group>
                                </Group>
                              </Card>
                            );
                          })}
                          {(dayItems[d.id] || []).length === 0 && (
                            <Text c="dimmed" size="sm">No exercises yet.</Text>
                          )}
                        </Stack>

                        <Group justify="flex-end" mt="xs">
                          <Button size="xs" onClick={() => setPickerDay(d)}>Manage exercises</Button>
                        </Group>
                      </Stack>
                    </Card>
                  </Grid.Col>
                ))}
                {(daysByWeek[w.week_number] || []).length === 0 && (
                  <Grid.Col span={12}><Text c="dimmed">No days in this week.</Text></Grid.Col>
                )}
              </Grid>
            </Card>
          ))}
          {weeks.length === 0 && <Card withBorder radius="lg" p="lg"><Text c="dimmed">No weeks yet. Create the first one.</Text></Card>}
        </Stack>
      </Stack>

      <DayExercisesPicker
        opened={!!pickerDay}
        onClose={() => setPickerDay(null)}
        productId={Number(productId)}
        day={pickerDay}
        coachId={ownerCoachId}
        onSaved={async () => {
          if (!pickerDay?.id) return;
          await loadDayItems(Number(productId), pickerDay.id);
          const ex = await listCoachExercises({ only_custom: 0 });
          setCoachEx(Array.isArray(ex) ? ex : []);
        }}
      />

      <Modal opened={weekEditOpen} onClose={() => setWeekEditOpen(false)} title="Edit week" size="md">
        <Stack>
          <TextInput
            label="Week title"
            placeholder="Week 1, Upper Body, Deload week…"
            value={weekForm.title}
            onChange={(e) => setWeekForm({ ...weekForm, title: e.currentTarget.value })}
          />
          <Textarea
            label="Week notes"
            minRows={4}
            placeholder="General guidance for this week..."
            value={weekForm.notes}
            onChange={(e) => setWeekForm({ ...weekForm, notes: e.currentTarget.value })}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setWeekEditOpen(false)}>Cancel</Button>
            <Button onClick={saveWeekEdit} loading={savingWeek}>Save</Button>
          </Group>
        </Stack>
      </Modal>


      <Modal opened={dayEditOpen} onClose={() => setDayEditOpen(false)} title="Edit day" size="md">
        <Stack>
            <TextInput
            label="Day title"
            placeholder="Day 1, Push, Cardio…"
            value={dayForm.title}
            onChange={(e) => setDayForm({ ...dayForm, title: e.currentTarget.value })}
            />
            <Textarea
            label="Day notes"
            minRows={4}
            placeholder="Notes for this day…"
            value={dayForm.notes}
            onChange={(e) => setDayForm({ ...dayForm, notes: e.currentTarget.value })}
            />
            <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setDayEditOpen(false)}>Cancel</Button>
            <Button onClick={saveDayEdit} loading={savingDay}>Save</Button>
            </Group>
        </Stack>
        </Modal>
    </Container>
  );
}