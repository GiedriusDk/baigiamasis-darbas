import { useEffect, useMemo, useState } from "react";
import { Container, Title, Card, Grid, TextInput, Textarea, Switch, Button, Group, Stack, Loader, Alert, Text, NumberInput, Select, Divider, Collapse, Image,
} from "@mantine/core";
import { myProducts, createProduct, updateProduct, archiveProduct } from "../api/payments";
import PlanCard from "../components/PlanCard";
import { reorderProducts } from '../api/payments';
import { ActionIcon, Tooltip } from '@mantine/core';
import { IconArrowUp, IconArrowDown } from '@tabler/icons-react';

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
  sort_order: 0,
  is_active: true,
  metadata: "{}",
};

function parseMetaStr(s) {
  try {
    const o = s ? JSON.parse(s) : {};
    return typeof o === "object" && o !== null ? o : {};
  } catch {
    return {};
  }
}

function stringifyMeta(o) {
  try {
    return JSON.stringify(o ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function MetadataEditor({ value, onChange }) {
  const metaObj = useMemo(() => parseMetaStr(value), [value]);
  const [weeks, setWeeks] = useState(Number(metaObj.weeks ?? "") || "");
  const [level, setLevel] = useState(String(metaObj.level ?? "") || "");
  const [video, setVideo] = useState(Boolean(metaObj.video_calls ?? false));
  const [notes, setNotes] = useState(String(metaObj.notes ?? "") || "");
  const [advanced, setAdvanced] = useState(false);
  const [raw, setRaw] = useState(stringifyMeta(metaObj));
  const [jsonErr, setJsonErr] = useState("");

  useEffect(() => {
    if (advanced) return;
    const next = {};
    if (weeks !== "" && !Number.isNaN(Number(weeks))) next.weeks = Number(weeks);
    if (level) next.level = level;
    if (video) next.video_calls = true;
    if (notes) next.notes = notes;
    onChange(stringifyMeta(next));
  }, [weeks, level, video, notes, advanced]); // eslint-disable-line

  useEffect(() => {
    if (!advanced) return;
    setRaw(value || "{}");
  }, [advanced, value]);

  function saveRaw(v) {
    setRaw(v);
    try {
      JSON.parse(v || "{}");
      setJsonErr("");
      onChange(v || "{}");
    } catch {
      setJsonErr("Invalid JSON");
    }
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <Text fw={600}>Metadata</Text>
        <Group gap="xs">
          <Text size="sm" c="dimmed">Advanced JSON</Text>
          <Switch checked={advanced} onChange={(e) => setAdvanced(e.currentTarget.checked)} />
        </Group>
      </Group>

      <Collapse in={!advanced}>
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <NumberInput
              label="Weeks"
              placeholder="12"
              value={weeks}
              onChange={setWeeks}
              min={1}
              allowDecimal={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Select
              label="Level"
              placeholder="Select"
              data={[
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
              ]}
              value={level || null}
              onChange={(v) => setLevel(v || "")}
              clearable
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Switch
              label="Includes video calls"
              checked={video}
              onChange={(e) => setVideo(e.currentTarget.checked)}
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <TextInput
              label="Notes"
              placeholder="Extra details"
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
            />
          </Grid.Col>
        </Grid>
      </Collapse>

      <Collapse in={advanced}>
        <Stack gap="xs">
          <Textarea
            autosize
            minRows={6}
            value={raw}
            onChange={(e) => saveRaw(e.currentTarget.value)}
            placeholder='{"weeks": 12, "level": "beginner", "video_calls": true}'
          />
          {jsonErr && <Alert color="red">{jsonErr}</Alert>}
        </Stack>
      </Collapse>

      <Divider />
      <Text size="xs" c="dimmed">
        Šie metaduomenys bus saugomi JSON formatu ir gali būti naudojami planų rodymui.
      </Text>
    </Stack>
  );
}

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

  async function movePlan(id, dir) {
    const prev = plans;
    const idx = prev.findIndex(p => p.id === id);
    if (idx < 0) return;
    const arr = [...prev];
    const swapWith = dir === 'up' ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= arr.length) return;

    [arr[idx], arr[swapWith]] = [arr[swapWith], arr[idx]];
    setPlans(arr);

    try {
      await reorderProducts(arr.map(p => p.id));
    } catch (e) {
      setPlans(prev); // atstatom, jei nepavyko
      setErr(e.message || 'Reorder failed');
    }
  }

  useEffect(() => {
    load();
  }, []);

  function onChange(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    let metadata = {};
    try {
      metadata = form.metadata ? JSON.parse(form.metadata) : {};
    } catch {
      setErr("Metadata must be valid JSON");
      return;
    }

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
      sort_order: Number.isFinite(Number(form.sort_order)) ? Number(form.sort_order) : 0,
      is_active: !!form.is_active,
      metadata,
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
      sort_order: p.sort_order ?? 0,
      is_active: !!p.is_active,
      metadata: stringifyMeta(p.metadata || {}),
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
              <TextInput
                label="Title"
                placeholder="Premium Coaching Plan (12 weeks)"
                value={form.title}
                onChange={(e) => onChange("title", e.currentTarget.value)}
                required
              />
            </Grid.Col>

            <Grid.Col span={{ base: 6, md: 2 }}>
              <TextInput
                label="Price"
                placeholder="49.99"
                value={form.price}
                onChange={(e) => onChange("price", e.currentTarget.value)}
                required
              />
            </Grid.Col>

            <Grid.Col span={{ base: 6, md: 2 }}>
              <TextInput
                label="Currency"
                placeholder="EUR"
                value={form.currency}
                onChange={(e) => onChange("currency", e.currentTarget.value.toUpperCase())}
              />
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
              <NumberInput
                label="Duration (weeks)"
                min={1}
                max={52}
                allowDecimal={false}
                value={form.duration_weeks === "" ? "" : Number(form.duration_weeks)}
                onChange={(v) => onChange("duration_weeks", v ?? "")}
                placeholder="12"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Sessions per week"
                min={1}
                max={14}
                allowDecimal={false}
                value={form.sessions_per_week === "" ? "" : Number(form.sessions_per_week)}
                onChange={(v) => onChange("sessions_per_week", v ?? "")}
                placeholder="3"
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Access days"
                min={1}
                max={365}
                allowDecimal={false}
                value={form.access_days === "" ? "" : Number(form.access_days)}
                onChange={(v) => onChange("access_days", v ?? "")}
                placeholder="90"
              />
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

            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                label="Thumbnail URL"
                placeholder="https://…"
                value={form.thumbnail_url}
                onChange={(e) => onChange("thumbnail_url", e.currentTarget.value)}
              />
            </Grid.Col>

            {thumb && (
              <Grid.Col span={12}>
                <Image src={thumb} h={140} fit="cover" radius="md" />
              </Grid.Col>
            )}

            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Gym name"
                placeholder="If in person"
                value={form.gym_name}
                onChange={(e) => onChange("gym_name", e.currentTarget.value)}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Gym address"
                placeholder="Street, city, country"
                value={form.gym_address}
                onChange={(e) => onChange("gym_address", e.currentTarget.value)}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Switch
                label="Includes chat"
                checked={!!form.includes_chat}
                onChange={(e) => onChange("includes_chat", e.currentTarget.checked)}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Switch
                label="Includes calls"
                checked={!!form.includes_calls}
                onChange={(e) => onChange("includes_calls", e.currentTarget.checked)}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Textarea
                label="Description"
                placeholder="Weekly check-ins, video calls..."
                minRows={3}
                value={form.description}
                onChange={(e) => onChange("description", e.currentTarget.value)}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <MetadataEditor
                value={form.metadata}
                onChange={(v) => onChange("metadata", v)}
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <NumberInput
                label="Sort order"
                value={Number(form.sort_order)}
                onChange={(v) => onChange("sort_order", Number(v ?? 0))}
                min={0}
                step={1}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Group justify="space-between">
                <Switch
                  checked={!!form.is_active}
                  onChange={(e) => onChange("is_active", e.currentTarget.checked)}
                  label="Active"
                />
                <Group>
                  {editing && (
                    <Button
                      variant="default"
                      onClick={() => {
                        setEditing(null);
                        setForm(empty);
                      }}
                    >
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
                  <Group>
                    <Tooltip label="Move up">
                      <ActionIcon variant="light" disabled={i === 0} onClick={() => movePlan(p.id, 'up')}>
                        <IconArrowUp size={18} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Move down">
                      <ActionIcon variant="light" disabled={i === plans.length - 1} onClick={() => movePlan(p.id, 'down')}>
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
    </Container>
  );
}