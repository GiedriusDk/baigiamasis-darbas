import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Group,
  Loader,
  NumberInput,
  Stack,
  Table,
  Text,
  Textarea,
  Title,
  FileInput,
  TextInput,
  Select,
  ActionIcon,
  Modal,
} from "@mantine/core";
import { useParams, useNavigate } from "react-router-dom";
import {
  createEntry,
  getMetric,
  listEntries,
  uploadPhoto,
  listEntryPhotos,
  listGoals,
  createGoal,
  updateGoal,
  deletePhoto,
} from "../../api/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  IconArrowLeft,
  IconArrowRight,
  IconTrash,
} from "@tabler/icons-react";

import { getUserProfile } from "../../api/profiles";
import { getBmiSnapshot } from "../../utils/bmi";

export default function MetricDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const metricId = Number(id);

  const [metric, setMetric] = useState(null);
  const [entries, setEntries] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [bmiSnap, setBmiSnap] = useState(null);
  const [bmiLoading, setBmiLoading] = useState(false);

  const [value, setValue] = useState(null);
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);

  const [goal, setGoal] = useState(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalValue, setGoalValue] = useState(null);
  const [goalDirection, setGoalDirection] = useState("at_most");
  const [savingGoal, setSavingGoal] = useState(false);

  const [previewPhoto, setPreviewPhoto] = useState(null);

  const loadBmi = async () => {
    setBmiLoading(true);
    try {
      const profRes = await getUserProfile();
      const prof = profRes?.data ?? profRes;

      const snap = await getBmiSnapshot({
        profileHeightCm: prof?.height_cm,
        profileWeightKg: prof?.weight_kg,
      });

      setBmiSnap(snap);
    } catch (e) {
      console.error("BMI load error:", e);
      setBmiSnap(null);
    } finally {
      setBmiLoading(false);
    }
  };

  const movePhoto = (photoId, direction) => {
    setPhotos((prev) => {
      const idx = prev.findIndex((p) => p.id === photoId);
      if (idx === -1) return prev;
      const newIndex = idx + direction;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(newIndex, 0, item);
      return copy;
    });
  };

  const handleDeletePhoto = async (photoId) => {
    const ok = window.confirm("Delete this photo?");
    if (!ok) return;
    await deletePhoto(photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const chartData = useMemo(() => {
    const arr = [...entries];
    arr.sort((a, b) =>
      (a.recorded_at || "").localeCompare(b.recorded_at || "")
    );
    return arr.map((e) => ({
      date: (e.recorded_at || "").slice(0, 10),
      value: e.value,
      goalValue: goal?.target_value ?? null,
    }));
  }, [entries, goal]);

  const yDomain = useMemo(() => {
    if (!chartData.length) return ["auto", "auto"];
    const values = chartData
      .map((p) => Number(p.value))
      .filter((v) => !Number.isNaN(v));
    if (!values.length) return ["auto", "auto"];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min;
    const padding =
      span === 0
        ? Math.max(1, Math.abs(max || 1) * 0.1)
        : span * 0.2;
    const lower = min - padding;
    const upper = max + padding;
    return [lower, upper];
  }, [chartData]);

  const load = async () => {
    setLoading(true);
    try {
      const m = await getMetric(metricId, { include_latest: 1 });
      const metricData = m?.data ?? m;
      const e = await listEntries({ paginate: 0, metric_id: metricId });
      const entriesData = e?.data ?? e ?? [];
      const first = entriesData[0];
      const p = first
        ? await listEntryPhotos(first.id).catch(() => ({ data: [] }))
        : { data: [] };
      const g = await listGoals({ metric_id: metricId }).catch(() => ({
        data: [],
      }));
      const activeGoal = (g?.data ?? g ?? [])[0] ?? null;

      setMetric(metricData);
      setEntries(entriesData);
      setPhotos(p?.data ?? []);
      setGoal(activeGoal);

      if (activeGoal) {
        setGoalTitle(activeGoal.title || "");
        setGoalValue(activeGoal.target_value ?? null);
        setGoalDirection(activeGoal.direction || "at_most");
      } else {
        setGoalTitle(
          metricData?.name ? `My ${metricData.name} goal` : "My goal"
        );
        setGoalValue(null);
        setGoalDirection("at_most");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadBmi();
  }, [id]);

  const addEntry = async () => {
    const payload = {
      metric_id: metricId,
      value: value != null ? Number(value) : null,
      recorded_at: date || null,
      note: note || null,
      source: "manual",
    };
    const res = await createEntry(payload);
    const created = res?.data ?? res;
    setEntries((prev) => [created, ...prev]);
    setValue(null);
    setNote("");
    await loadBmi();
    
  };

  const onUpload = async () => {
    if (!file) return;
    const e = entries?.[0];
    if (!e?.id) return;
    await uploadPhoto(e.id, file);
    const p = await listEntryPhotos(e.id);
    setPhotos(p?.data ?? []);
    setFile(null);
  };

  const saveGoal = async () => {
    if (goalValue == null || goalDirection == null) return;
    setSavingGoal(true);
    try {
      const payload = {
        metric_id: metricId,
        title:
          goalTitle ||
          (metric?.name ? `My ${metric.name} goal` : "My goal"),
        target_value: Number(goalValue),
        unit: metric?.unit || null,
        direction: goalDirection,
        is_active: true,
      };

      let res;
      if (goal && goal.id) {
        res = await updateGoal(goal.id, payload);
      } else {
        res = await createGoal(payload);
      }
      const updated = res?.data ?? res;
      setGoal(updated);
      setGoalTitle(updated.title || "");
      setGoalValue(updated.target_value ?? null);
      setGoalDirection(updated.direction || "at_most");
    } finally {
      setSavingGoal(false);
    }
  };

  if (loading) return <Loader />;

  const currentValue = entries[0]?.value ?? null;
  let goalText = "";
  if (goal && goal.target_value != null) {
    const unit = metric?.unit || "";
    if (currentValue != null) {
      const diff = currentValue - goal.target_value;
      if (goal.direction === "at_most") {
        goalText =
          diff <= 0
            ? `Goal reached: ${currentValue}${unit ? " " + unit : ""} (target ≤ ${
                goal.target_value
              }${unit ? " " + unit : ""})`
            : `Left to goal: ${diff.toFixed(1)}${unit ? " " + unit : ""}`;
      } else if (goal.direction === "at_least") {
        const remain = goal.target_value - currentValue;
        goalText =
          remain <= 0
            ? `Goal reached: ${currentValue}${unit ? " " + unit : ""} (target ≥ ${
                goal.target_value
              }${unit ? " " + unit : ""})`
            : `Left to goal: ${remain.toFixed(1)}${unit ? " " + unit : ""}`;
      }
    } else {
      goalText = `Target: ${goal.target_value}${unit ? " " + unit : ""}`;
    }
  }

  return (
    <Stack>
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Button variant="light" onClick={() => navigate("/progress")}>
            Back
          </Button>
          <Title order={2}>{metric?.name}</Title>
        </Group>
        <Text c="dimmed">
          #{metric?.id} • {metric?.slug}
        </Text>
      </Group>

      <Card withBorder>
        <Title order={4} mb="sm">
          Add entry
        </Title>
        <Group align="end" wrap="wrap">
          <NumberInput
            label={`Value (${metric?.unit || ""})`}
            value={value}
            onChange={setValue}
            w={160}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                padding: "8px 10px",
                borderRadius: 4,
                border: "1px solid #ced4da",
                fontSize: 14,
              }}
            />
          </div>
          <Textarea
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            w={320}
          />
          <Button onClick={addEntry}>Save</Button>
        </Group>
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          Goal
        </Title>
        <Stack gap="sm">
          <Group grow align="flex-end">
            <TextInput
              label="Title"
              placeholder="My goal"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
            />
            <NumberInput
              label={`Target (${metric?.unit || ""})`}
              value={goalValue}
              onChange={setGoalValue}
              min={0}
            />
            <Select
              label="Direction"
              data={[
                { value: "at_most", label: "Reach at most" },
                { value: "at_least", label: "Reach at least" },
              ]}
              value={goalDirection}
              onChange={setGoalDirection}
            />
            <Button onClick={saveGoal} loading={savingGoal}>
              Save goal
            </Button>
          </Group>
          {goalText && (
            <Text size="sm" c="dimmed">
              {goalText}
            </Text>
          )}
        </Stack>
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">BMI</Title>

        {bmiLoading ? (
          <Loader size="sm" />
        ) : !bmiSnap ? (
          <Text c="dimmed" size="sm">Failed to calculate.</Text>
        ) : !bmiSnap.ok ? (
          <Text size="sm" c="dimmed">
            {bmiSnap.missing.includes("height") && "Enter height in profile to see BMI."}
            {bmiSnap.missing.includes("weight") && "Enter weight in Progress to see BMI."}
          </Text>
        ) : (
          <Stack gap={6}>
            <Text>
              <b>{bmiSnap.bmi}</b> — {bmiSnap.info?.label}
            </Text>
            <Text size="sm" c="dimmed">{bmiSnap.info?.hint}</Text>
            <Text size="xs" c="dimmed">
              Used: height {bmiSnap.heightCm} cm, weight {bmiSnap.weightKg} kg
            </Text>
          </Stack>
        )}
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          Trend
        </Title>
        {chartData.length === 0 ? (
          <Text size="sm" c="dimmed">
            No data yet
          </Text>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={yDomain} />
                <Tooltip />
                <Line type="monotone" dataKey="value" name={metric?.name} />
                {goal && goal.target_value != null && (
                  <Line
                    type="monotone"
                    dataKey="goalValue"
                    name="Goal"
                    stroke="#f1c40f"
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          Entries
        </Title>
        <Table withTableBorder withColumnBorders highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th>Value</Table.Th>
              <Table.Th>Note</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {entries.map((e) => (
              <Table.Tr key={e.id}>
                <Table.Td>{(e.recorded_at || "").slice(0, 10)}</Table.Td>
                <Table.Td>
                  <b>{e.value}</b> {metric?.unit || ""}
                </Table.Td>
                <Table.Td>{e.note || "—"}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      <Card withBorder>
        <Title order={4} mb="sm">
          Progress photos
        </Title>

        <Group align="end">
          <FileInput
            value={file}
            onChange={setFile}
            label="Upload photo"
            placeholder="Choose image…"
            accept="image/*"
          />
          <Button onClick={onUpload} disabled={!file}>
            Upload
          </Button>
        </Group>

        <Group mt="md" align="flex-start">
          {photos.map((p, index) => {
            const dateStr = (() => {
              const raw = p.taken_at || p.created_at;
              if (!raw) return "";
              const d = new Date(raw);
              if (Number.isNaN(d.getTime())) return "";
              return d.toLocaleDateString();
            })();

            const canMoveLeft = index > 0;
            const canMoveRight = index < photos.length - 1;

            return (
              <Card
                key={p.id}
                withBorder
                shadow="sm"
                radius="md"
                style={{ width: 180 }}
              >
                <img
                  src={p.url}
                  alt=""
                  onClick={() => setPreviewPhoto(p)}
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    borderRadius: 10,
                    marginBottom: 8,
                    cursor: "pointer",
                  }}
                />

                <Group justify="space-between" align="center" mb={4}>
                  <Text size="xs" c="dimmed">
                    {dateStr || "—"}
                  </Text>
                  <Group gap={4}>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      onClick={() => movePhoto(p.id, -1)}
                      disabled={!canMoveLeft}
                    >
                      <IconArrowLeft size={14} />
                    </ActionIcon>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      onClick={() => movePhoto(p.id, +1)}
                      disabled={!canMoveRight}
                    >
                      <IconArrowRight size={14} />
                    </ActionIcon>
                    <ActionIcon
                      size="xs"
                      variant="subtle"
                      color="red"
                      onClick={() => handleDeletePhoto(p.id)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Group>
                </Group>
              </Card>
            );
          })}

          {photos.length === 0 && (
            <Text size="sm" c="dimmed">
              No photos yet.
            </Text>
          )}
        </Group>
      </Card>

      <Modal
        opened={!!previewPhoto}
        onClose={() => setPreviewPhoto(null)}
        title="Photo preview"
        size="lg"
        centered
      >
        {previewPhoto && (
          <img
            src={previewPhoto.url}
            alt=""
            style={{
              width: "100%",
              height: "auto",
              borderRadius: 12,
            }}
          />
        )}
      </Modal>
    </Stack>
  );
}