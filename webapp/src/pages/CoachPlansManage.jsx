import { useEffect, useMemo, useState } from "react";
import {
  Container,
  Title,
  Card,
  Grid,
  TextInput,
  Textarea,
  Switch,
  Button,
  Group,
  Stack,
  Loader,
  Alert,
  NumberInput,
  Select,
  Image,
  ActionIcon,
  Tooltip,
  Text,
  Divider,
  Modal,
  Checkbox,
  ScrollArea,
  Badge,
  AspectRatio,
} from "@mantine/core";
import { IconArrowUp, IconArrowDown } from "@tabler/icons-react";
import PlanCard from "../components/PlanCard";
import { myProducts, createProduct, updateProduct, archiveProduct, reorderProducts } from "../api/payments";
import { listCoachExercises } from "../api/profiles";
import { getProductExercises, setProductExercises } from "../api/payments";

const empty = {
  title: "",
  description: "",
  price: "",
  currency: "EUR",
  type: "online",
  gym_name: "",
  gym_address: "",
  duration_weeks: "",
  sessions_per_week: "",
  access_days: "",
  includes_chat: true,
  includes_calls: false,
  level: "",
  thumbnail_url: "",
  is_active: true,
};

function getYoutubeId(url = "") {
  try {
    const regExp = /(?:youtube\.com\/(?:.*v=|v\/|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,12})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function isVideoUrl(url = "") {
  const lower = (url || "").toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.includes("vimeo.com");
}

function MediaThumb({ url, onOpen }) {
  if (!url) return null;
  const ytId = getYoutubeId(url);
  const commonStyle = {
    borderRadius: 12,
    width: "100%",
    height: 140,
    objectFit: "cover",
    cursor: "pointer",
  };
  if (ytId) {
    const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return (
      <div style={{ position: "relative" }} onClick={onOpen}>
        <img src={thumb} alt="YouTube" style={commonStyle} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: 700,
            fontSize: 22,
            textShadow: "0 2px 6px rgba(0,0,0,.6)",
          }}
        >
          ▶
        </div>
      </div>
    );
  }
  if (isVideoUrl(url)) {
    return (
      <div onClick={onOpen}>
        <div
          style={{
            borderRadius: 12,
            height: 140,
            width: "100%",
            background: "rgba(0,0,0,0.06)",
          }}
        />
      </div>
    );
  }
  return <img src={url} alt="Preview" style={commonStyle} onClick={onOpen} />;
}

function MediaViewer({ url, opened, onClose }) {
  const ytId = getYoutubeId(url || "");
  const isFile = isVideoUrl(url || "");
  return (
    <Modal opened={opened} onClose={onClose} size="lg" radius="md" withCloseButton>
      <AspectRatio ratio={16 / 9}>
        {ytId ? (
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
            title="YouTube"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ border: 0, width: "100%", height: "100%" }}
          />
        ) : isFile ? (
          <video src={url} controls style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 12 }} />
        ) : (
          <img src={url || ""} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 12 }} />
        )}
      </AspectRatio>
    </Modal>
  );
}

export default function CoachPlansManage() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [manageOpen, setManageOpen] = useState(false);
  const [manageProduct, setManageProduct] = useState(null);
  const [allExercises, setAllExercises] = useState([]);
  const [selIds, setSelIds] = useState([]);
  const [loadingManage, setLoadingManage] = useState(false);
  const [savingManage, setSavingManage] = useState(false);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await myProducts();
      setPlans(res?.data || []);
    } catch (e) {
      setErr(e.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function openManageExercises(product) {
    setManageProduct(product);
    setManageOpen(true);
    setLoadingManage(true);
    setErr("");
    try {
      const exList = await listCoachExercises();
      const list = Array.isArray(exList) ? exList : [];
      setAllExercises(list);
      const assignedResp = await getProductExercises(product.id);
      const assignedRaw =
        Array.isArray(assignedResp) ? assignedResp :
        Array.isArray(assignedResp?.data) ? assignedResp.data :
        [];
      const assignedIds = assignedRaw
        .map((x) => {
          if (typeof x === "number" || typeof x === "string") return Number(x);
          if (x && typeof x === "object") return Number(x.exercise_id ?? x.id);
          return NaN;
        })
        .filter(Number.isFinite);
      const uniqueIds = Array.from(new Set(assignedIds));

      setSelIds(uniqueIds);
    } catch (e) {
      setErr(e.message || "Failed to load exercises for product");
    } finally {
      setLoadingManage(false);
    }
  }

  async function saveManageExercises() {
    if (!manageProduct) return;
    setSavingManage(true);
    setErr("");
    try {
      await setProductExercises(manageProduct.id, selIds);
      await load();
      setManageOpen(false);
      setManageProduct(null);
      setSelIds([]);
    } catch (e) {
      setErr(e.message || "Failed to update product exercises");
    } finally {
      setSavingManage(false);
    }
  }

  async function movePlan(id, dir) {
    const prev = plans;
    const idx = prev.findIndex((p) => p.id === id);
    if (idx < 0) return;
    const arr = [...prev];
    const swapWith = dir === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= arr.length) return;
    [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];
    setPlans(arr);
    try {
      await reorderProducts(arr.map((p) => p.id));
    } catch (e) {
      setPlans(prev);
      setErr(e.message || "Reorder failed");
    }
  }

  function onChange(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      price: Math.round(parseFloat(String(form.price || "0").replace(",", ".")) * 100),
      currency: (form.currency || "EUR").toUpperCase(),
      type: form.type || "online",
      gym_name: form.gym_name || null,
      gym_address: form.gym_address || null,
      duration_weeks: form.duration_weeks !== "" ? Number(form.duration_weeks) : null,
      sessions_per_week: form.sessions_per_week !== "" ? Number(form.sessions_per_week) : null,
      access_days: form.access_days !== "" ? Number(form.access_days) : null,
      includes_chat: !!form.includes_chat,
      includes_calls: !!form.includes_calls,
      level: form.level || null,
      thumbnail_url: form.thumbnail_url || null,
      is_active: !!form.is_active,
    };
    try {
      if (editing) {
        await updateProduct(editing.id, payload);
      } else {
        await createProduct(payload);
      }
      setForm(empty);
      setEditing(null);
      await load();
    } catch (e2) {
      setErr(e2.message || "Save failed");
    }
  }

  function startEdit(p) {
    setEditing(p);
    setForm({
      title: p.title || "",
      description: p.description || "",
      price: (Number(p.price || 0) / 100).toFixed(2),
      currency: (p.currency || "EUR").toUpperCase(),
      type: p.type || "online",
      gym_name: p.gym_name || "",
      gym_address: p.gym_address || "",
      duration_weeks: p.duration_weeks ?? "",
      sessions_per_week: p.sessions_per_week ?? "",
      access_days: p.access_days ?? "",
      includes_chat: !!p.includes_chat,
      includes_calls: !!p.includes_calls,
      level: p.level || "",
      thumbnail_url: p.thumbnail_url || "",
      is_active: !!p.is_active,
    });
  }

  async function onArchive(p) {
    await archiveProduct(p.id);
    await load();
  }

  const thumb = form.thumbnail_url?.trim() ? form.thumbnail_url.trim() : "";
  const filteredExercises = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allExercises;
    return allExercises.filter((i) => {
      const t = (i?.title || "").toLowerCase();
      const pm = (i?.primary_muscle || "").toLowerCase();
      const df = (i?.difficulty || "").toLowerCase();
      return t.includes(q) || pm.includes(q) || df.includes(q);
    });
  }, [allExercises, search]);

  return (
    <Container size="lg" p="md">
      <Title order={2} mb="md">{editing ? "Edit plan" : "Create plan"}</Title>
      <Card withBorder radius="lg" shadow="sm" mb="lg" component="form" onSubmit={onSubmit}>
        <Stack gap="md">
          {err && <Alert color="red">{err}</Alert>}
          <Grid>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <TextInput label="Title" placeholder="Premium Coaching Plan (12 weeks)" value={form.title} onChange={(e) => onChange("title", e.currentTarget.value)} required />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 2 }}>
              <TextInput label="Price" placeholder="49.99" value={form.price} onChange={(e) => onChange("price", e.currentTarget.value)} required />
            </Grid.Col>
            <Grid.Col span={{ base: 6, md: 2 }}>
              <TextInput label="Currency" placeholder="EUR" value={form.currency} onChange={(e) => onChange("currency", e.currentTarget.value.toUpperCase())} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select label="Plan type" data={[{ value: "online", label: "Online" }, { value: "in_person", label: "In person" }, { value: "hybrid", label: "Hybrid" }]} value={form.type} onChange={(v) => onChange("type", v || "online")} required />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput label="Duration (weeks)" min={1} max={52} allowDecimal={false} value={form.duration_weeks === "" ? "" : Number(form.duration_weeks)} onChange={(v) => onChange("duration_weeks", v ?? "")} placeholder="12" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput label="Sessions per week" min={1} max={14} allowDecimal={false} value={form.sessions_per_week === "" ? "" : Number(form.sessions_per_week)} onChange={(v) => onChange("sessions_per_week", v ?? "")} placeholder="3" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput label="Access days" min={1} max={365} allowDecimal={false} value={form.access_days === "" ? "" : Number(form.access_days)} onChange={(v) => onChange("access_days", v ?? "")} placeholder="90" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select label="Level" data={[{ value: "beginner", label: "Beginner" }, { value: "intermediate", label: "Intermediate" }, { value: "advanced", label: "Advanced" }]} value={form.level || null} onChange={(v) => onChange("level", v || "")} clearable />
            </Grid.Col>
            {thumb && (
              <Grid.Col span={12}>
                <Image src={thumb} h={140} fit="cover" radius="md" />
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput label="Gym name" placeholder="If in person" value={form.gym_name} onChange={(e) => onChange("gym_name", e.currentTarget.value)} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput label="Gym address" placeholder="Street, city, country" value={form.gym_address} onChange={(e) => onChange("gym_address", e.currentTarget.value)} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Switch label="Includes chat" checked={!!form.includes_chat} onChange={(e) => onChange("includes_chat", e.currentTarget.checked)} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Switch label="Includes calls" checked={!!form.includes_calls} onChange={(e) => onChange("includes_calls", e.currentTarget.checked)} />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea label="Description" placeholder="Weekly check-ins, video calls..." minRows={3} value={form.description} onChange={(e) => onChange("description", e.currentTarget.value)} />
            </Grid.Col>
            <Grid.Col span={12}>
              <Group justify="space-between">
                <Switch checked={!!form.is_active} onChange={(e) => onChange("is_active", e.currentTarget.checked)} label="Active" />
                <Group>
                  {editing && (
                    <Button variant="default" onClick={() => { setEditing(null); setForm(empty); }}>
                      Cancel
                    </Button>
                  )}
                  <Button type="submit">{editing ? "Save" : "Create"}</Button>
                </Group>
              </Group>
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>

      <Title order={4} mb="sm">My plans</Title>
      {loading ? (
        <Group justify="center" p="lg">
          <Loader />
        </Group>
      ) : plans.length === 0 ? (
        <Card withBorder radius="lg" p="lg">
          <Text c="dimmed" ta="center">No plans yet. Create your first plan above.</Text>
        </Card>
      ) : (
        <Grid>
          {plans.map((p, i) => (
            <Grid.Col key={p.id} span={{ base: 12, sm: 6, md: 4 }}>
              <Card withBorder radius="lg" p="sm">
                <PlanCard plan={p} onEdit={startEdit} onArchive={onArchive} />
                <Group justify="space-between" mt="sm">
                  <Button variant="light" onClick={() => openManageExercises(p)}>
                    Manage exercises
                  </Button>
                  <Group>
                    <Tooltip label="Move up">
                      <ActionIcon variant="light" disabled={i === 0} onClick={() => movePlan(p.id, "up")}>
                        <IconArrowUp size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Move down">
                      <ActionIcon variant="light" disabled={i === plans.length - 1} onClick={() => movePlan(p.id, "down")}>
                        <IconArrowDown size={18} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                  <Text size="xs" c="dimmed">Order: {i + 1}</Text>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}

      <Modal
        opened={manageOpen}
        onClose={() => {
          setManageOpen(false);
          setManageProduct(null);
          setViewerUrl(null);
          setSearch("");
        }}
        title={manageProduct ? `Exercises for: ${manageProduct.title}` : "Exercises"}
        size="lg"
        centered
      >
        {loadingManage ? (
          <Group justify="center" p="lg"><Loader /></Group>
        ) : (
          <Stack gap="md">
            <Text size="sm" c="dimmed">Pažymėk pratimus, kurie turi būti įtraukti į šį planą.</Text>
            <TextInput placeholder="Search by title, muscle, difficulty" value={search} onChange={(e) => setSearch(e.currentTarget.value)} />
            <ScrollArea h={420} type="auto">
              <Stack gap="xs">
                {filteredExercises.length === 0 ? (
                  <Text c="dimmed">No exercises yet.</Text>
                ) : filteredExercises.map((ex) => {
                  const checked = selIds.includes(Number(ex.id));
                  const thumb = ex.media_url || ex.thumbnail_url || ex.image_url || null;
                  return (
                    <Card
                      key={ex.id}
                      withBorder
                      radius="md"
                      p="sm"
                    >
                      <Grid align="center" gutter="md">
                        <Grid.Col span={{ base: 12, sm: 5 }}>
                          {thumb ? (
                            <MediaThumb url={thumb} onOpen={() => setViewerUrl(thumb)} />
                          ) : (
                            <div style={{ width: "100%", height: 140, borderRadius: 12, background: "var(--mantine-color-gray-2)" }} />
                          )}
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 7 }}>
                          <Stack gap={6}>
                            <Group justify="space-between" wrap="nowrap">
                              <Text fw={600} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.title}</Text>
                              <Checkbox
                                checked={checked}
                                onChange={(e) => {
                                  const isOn = e.currentTarget.checked;
                                  const exId = Number(ex.id);
                                  setSelIds((prev) =>
                                    isOn ? [...prev, exId] : prev.filter((id) => id !== exId)
                                  );
                                }}
                              />
                            </Group>
                            <Group gap={6}>
                              {ex.primary_muscle && <Badge variant="light">{ex.primary_muscle}</Badge>}
                              {ex.difficulty && <Badge variant="dot">{ex.difficulty}</Badge>}
                            </Group>
                          </Stack>
                        </Grid.Col>
                      </Grid>
                    </Card>
                  );
                })}
              </Stack>
            </ScrollArea>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => setManageOpen(false)}>Cancel</Button>
              <Button loading={savingManage} onClick={saveManageExercises}>Save</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <MediaViewer url={viewerUrl} opened={!!viewerUrl} onClose={() => setViewerUrl(null)} />
      <Divider mt="xl" />
    </Container>
  );
}