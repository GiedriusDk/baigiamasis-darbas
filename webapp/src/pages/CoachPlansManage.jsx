import { useEffect, useState } from "react";
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
  Badge,
} from "@mantine/core";
import { IconArrowUp, IconArrowDown } from "@tabler/icons-react";
import PlanCard from "../components/PlanCard";
import { myProducts, createProduct, updateProduct, archiveProduct, reorderProducts } from "../api/payments";

const currencies = [
  { value: "EUR", label: "EUR (€)" },
  { value: "USD", label: "USD ($)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "PLN", label: "PLN (zł)" },
  { value: "NOK", label: "NOK (kr)" },
  { value: "SEK", label: "SEK (kr)" },
];

const empty = {
  title: "",
  description: "",
  price: "",
  currency: "EUR",
  type: "online",
  duration_weeks: "",
  sessions_per_week: "",
  access_days: "",
  includes_chat: true,
  level: "",
  thumbnail_url: "",
  is_active: true,
};

export default function CoachPlansManage() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

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
      duration_weeks: form.duration_weeks !== "" ? Number(form.duration_weeks) : null,
      sessions_per_week: form.sessions_per_week !== "" ? Number(form.sessions_per_week) : null,
      access_days: form.access_days !== "" ? Number(form.access_days) : null,
      includes_chat: !!form.includes_chat,
      level: form.level || null,
      thumbnail_url: form.thumbnail_url || null,
      is_active: !!form.is_active,
    };
    try {
      if (editing) await updateProduct(editing.id, payload);
      else await createProduct(payload);
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
      duration_weeks: p.duration_weeks ?? "",
      sessions_per_week: p.sessions_per_week ?? "",
      access_days: p.access_days ?? "",
      includes_chat: !!p.includes_chat,
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
              <Select label="Currency" data={currencies} value={form.currency} onChange={(v) => onChange("currency", v || "EUR")} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                label="Plan type"
                data={[
                  { value: "online", label: "Online" },
                  { value: "in_person", label: "In person" },
                  { value: "hybrid", label: "Hybrid" },
                ]}
                value={form.type}
                onChange={(v) => onChange("type", v || "online")}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput label="Duration (weeks)" min={1} max={52} value={form.duration_weeks === "" ? "" : Number(form.duration_weeks)} onChange={(v) => onChange("duration_weeks", v ?? "")} placeholder="12" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput label="Sessions per week" min={1} max={14} value={form.sessions_per_week === "" ? "" : Number(form.sessions_per_week)} onChange={(v) => onChange("sessions_per_week", v ?? "")} placeholder="3" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput label="Access days" min={1} max={365} value={form.access_days === "" ? "" : Number(form.access_days)} onChange={(v) => onChange("access_days", v ?? "")} placeholder="90" />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Select
                label="Level"
                data={[
                  { value: "beginner", label: "Beginner" },
                  { value: "intermediate", label: "Intermediate" },
                  { value: "advanced", label: "Advanced" },
                ]}
                value={form.level || null}
                onChange={(v) => onChange("level", v || "")}
                clearable
              />
            </Grid.Col>
            {thumb && (
              <Grid.Col span={12}>
                <Image src={thumb} h={140} fit="cover" radius="md" />
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Switch label="Includes chat" checked={!!form.includes_chat} onChange={(e) => onChange("includes_chat", e.currentTarget.checked)} />
            </Grid.Col>
            <Grid.Col span={12}>
              <Textarea label="Description" placeholder="Weekly check-ins, video calls..." minRows={3} value={form.description} onChange={(e) => onChange("description", e.currentTarget.value)} />
            </Grid.Col>
            <Grid.Col span={12}>
              <Group justify="space-between">
                <Switch checked={!!form.is_active} onChange={(e) => onChange("is_active", e.currentTarget.checked)} label="Active" />
                <Group>
                  {editing && <Button variant="default" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</Button>}
                  <Button type="submit">{editing ? "Save" : "Create"}</Button>
                </Group>
              </Group>
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>

      <Title order={4} mb="sm">My plans</Title>
      {loading ? (
        <Group justify="center" p="lg"><Loader /></Group>
      ) : plans.length === 0 ? (
        <Card withBorder radius="lg" p="lg"><Text c="dimmed" ta="center">No plans yet. Create your first plan above.</Text></Card>
      ) : (
        <Grid>
          {plans.map((p, i) => (
            <Grid.Col key={p.id} span={{ base: 12, sm: 6, md: 4 }}>
              <Card withBorder radius="lg" p="sm">
                <PlanCard plan={p} onEdit={startEdit} onArchive={onArchive} />
                <Group justify="space-between" mt="sm">
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
                  <Group gap="xs">
                    <Badge variant="light" color={p.is_active ? "green" : "red"}>
                      {p.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Text size="xs" c="dimmed">Order: {i + 1}</Text>
                  </Group>
                </Group>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Container>
  );
}