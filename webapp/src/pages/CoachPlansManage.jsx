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
} from "@mantine/core";
import { myProducts, createProduct, updateProduct, archiveProduct, reorderProducts } from "../api/payments";
import PlanCard from "../components/PlanCard";
import { IconArrowUp, IconArrowDown } from "@tabler/icons-react";
import { listCoachExercises } from '../api/profiles';
import { getProductExercises, setProductExercises } from '../api/payments';
import { Modal, Checkbox, ScrollArea } from '@mantine/core';

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
    try {
      // 1) parsinešam VISUS trenerio pratimus iš profiles serviso
      const exList = await listCoachExercises();
      setAllExercises(Array.isArray(exList) ? exList : []);

      // 2) parsinešam plano priskirtus pratimų ID iš payments serviso
      const assigned = await getProductExercises(product.id); // tikimės [{id: number, ...}, ...] arba [ids]
      // palaikyk abu atvejus:
      const assignedIds = Array.isArray(assigned)
        ? assigned.map(x => (typeof x === 'number' ? x : x.id))
        : [];
      setSelIds(assignedIds);
    } catch (e) {
      setErr(e.message || 'Failed to load exercises for product');
    } finally {
      setLoadingManage(false);
    }
  }

  async function saveManageExercises() {
    if (!manageProduct) return;
    setSavingManage(true);
    try {
      await setProductExercises(manageProduct.id, selIds);
      // neprivaloma: persikraunam planų sąrašą, jei rodai kokį skaičių ar pan.
      await load();
      setManageOpen(false);
      setManageProduct(null);
      setSelIds([]);
    } catch (e) {
      setErr(e.message || 'Failed to update product exercises');
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
          onClose={() => { setManageOpen(false); setManageProduct(null); }}
          title={manageProduct ? `Exercises for: ${manageProduct.title}` : "Exercises"}
          size="lg"
          centered
        >
          {loadingManage ? (
            <Group justify="center" p="lg"><Loader /></Group>
          ) : (
            <Stack gap="md">
              <Text size="sm" c="dimmed">Pažymėk pratimus, kurie turi būti įtraukti į šį planą.</Text>
              <ScrollArea h={360} type="auto">
                <Stack gap="xs">
                  {allExercises.length === 0 ? (
                    <Text c="dimmed">No exercises yet.</Text>
                  ) : allExercises.map(ex => {
                      // Paimam thumbnail ar fallback
                      const thumb = ex.media_url || ex.thumbnail_url || ex.image_url || null;
                      return (
                        <Card
                          key={ex.id}
                          withBorder
                          radius="md"
                          p="sm"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setSelIds(prev =>
                              prev.includes(ex.id)
                                ? prev.filter(id => id !== ex.id)
                                : [...prev, ex.id]
                            );
                          }}
                        >
                          <Group align="center" gap="md" wrap="nowrap">
                            {/* jei turi thumbnail, rodome mažą paveiksliuką */}
                            {thumb ? (
                              <Image
                                src={thumb}
                                alt={ex.title}
                                height={160}
                                radius="md"
                                fit="contain"
                                style={{ cursor: 'zoom-in' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 60,
                                  height: 60,
                                  borderRadius: 8,
                                  background: 'var(--mantine-color-gray-2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--mantine-color-dimmed)',
                                  fontSize: 12,
                                }}
                              >
                                No img
                              </div>
                            )}

                            {/* checkbox ir pavadinimas */}
                            <Stack gap={2} style={{ flex: 1 }}>
                              <Checkbox
                                label={
                                  <div style={{ fontWeight: 500 }}>
                                    {ex.title}
                                  </div>
                                }
                                checked={selIds.includes(ex.id)}
                                onChange={(e) => {
                                  const checked = e.currentTarget.checked;
                                  setSelIds(prev =>
                                    checked
                                      ? [...prev, ex.id]
                                      : prev.filter(id => id !== ex.id)
                                  );
                                }}
                              />
                              {ex.primary_muscle && (
                                <Text size="xs" c="dimmed">
                                  {ex.primary_muscle}
                                </Text>
                              )}
                            </Stack>
                          </Group>
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
    </Container>
  );
}
