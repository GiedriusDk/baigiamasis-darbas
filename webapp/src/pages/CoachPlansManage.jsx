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
  Text,
  NumberInput,
  Select,
  Divider,
  Collapse,
} from "@mantine/core";
import { myProducts, createProduct, updateProduct, archiveProduct } from "../api/payments";
import PlanCard from "../components/PlanCard";

const empty = { title: "", description: "", price: "", currency: "EUR", is_active: true, metadata: "{}" };

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
  }, [weeks, level, video, notes, advanced]);

  useEffect(() => {
    if (!advanced) return;
    setRaw(value || "{}");
  }, [advanced]);

  function saveRaw(v) {
    setRaw(v);
    try {
      JSON.parse(v || "{}");
      setJsonErr("");
      onChange(v || "{}");
    } catch (e) {
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
        Šie metaduomenys bus išsaugoti JSON formatu ir gali būti naudojami planų rodymui (pvz., ženkleliui „12 weeks“).
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
      title: form.title,
      description: form.description || null,
      price: Math.round(parseFloat(String(form.price || "0").replace(",", ".")) * 100),
      currency: (form.currency || "EUR").toUpperCase(),
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
      is_active: !!p.is_active,
      metadata: stringifyMeta(p.metadata || {}),
    });
  }

  async function onArchive(p) {
    await archiveProduct(p.id);
    await load();
  }
  

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
          {plans.map((p) => (
            <Grid.Col key={p.id} span={{ base: 12, sm: 6, md: 4 }}>
              <PlanCard plan={p} onEdit={startEdit} onArchive={onArchive} />
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Container>
  );
}