import { useEffect, useState } from "react";
import {
  Anchor,
  Button,
  Card,
  Drawer,
  Group,
  Loader,
  Select,
  Stack,
  Switch,
  Table,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, useSearchParams } from "react-router-dom";
import { createMetric, listMetrics, listEntries } from "../../api/progress";

function slugify(str) {
  return String(str || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function MetricsPage() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState([]);
  const [entries, setEntries] = useState([]);
  const [opened, { open, close }] = useDisclosure(false);

  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [kind, setKind] = useState("numeric");
  const [isPublic, setIsPublic] = useState(true);

  const [searchParams] = useSearchParams();

  const load = async () => {
    setLoading(true);
    try {
      const resMetrics = await listMetrics({ include_latest: 1 });
      const resEntries = await listEntries({ paginate: 0, per_page: 200 });
      setMetrics(resMetrics?.data ?? resMetrics ?? []);
      setEntries(resEntries?.data ?? resEntries ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      open();
    }
  }, [searchParams, open]);

  const onCreate = async () => {
    const payload = {
      name: name.trim(),
      unit: unit.trim() || null,
      kind,
      is_public: !!isPublic,
    };
    if (!payload.name) return;

    const created = await createMetric(payload);
    const m = created?.data ?? created;
    setMetrics((prev) => [...prev, m]);
    setName("");
    setUnit("");
    setKind("numeric");
    setIsPublic(true);
    close();
  };

  if (loading) return <Loader />;

  const latestForMetric = (metricId) =>
    entries
      .filter((e) => e.metric_id === metricId)
      .sort(
        (a, b) =>
          new Date(b.recorded_at || 0) - new Date(a.recorded_at || 0)
      )[0];

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Group gap="xs">
          <Anchor component={Link} to="/progress" size="sm">
            ← Back
          </Anchor>
          <Title order={2}>Metrics</Title>
        </Group>
        <Button onClick={open}>New metric</Button>
      </Group>

      <Card withBorder>
        <Table withTableBorder withColumnBorders highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Slug</Table.Th>
              <Table.Th>Kind</Table.Th>
              <Table.Th>Unit</Table.Th>
              <Table.Th>Public</Table.Th>
              <Table.Th>Latest</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {metrics.map((m) => {
              const latest = latestForMetric(m.id);
              return (
                <Table.Tr key={m.id}>
                  <Table.Td>{m.name}</Table.Td>
                  <Table.Td>{m.slug}</Table.Td>
                  <Table.Td>{m.kind}</Table.Td>
                  <Table.Td>{m.unit || "—"}</Table.Td>
                  <Table.Td>{m.is_public ? "Yes" : "No"}</Table.Td>
                  <Table.Td>
                    {latest ? (
                      <>
                        <b>{latest.value}</b>
                        {m.unit ? ` ${m.unit}` : ""} (
                        {(latest.recorded_at || "").slice(0, 10)})
                      </>
                    ) : (
                      "—"
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Card>

      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        size="md"
        title="New metric"
      >
        <Stack gap="md">
          <TextInput
            label="Name *"
            placeholder="Weight, Arm, Waist…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextInput
            label="Unit"
            placeholder="kg, cm, %, …"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
          <Select
            label="Kind"
            data={[
              { value: "numeric", label: "Numeric" },
              { value: "text", label: "Text" },
            ]}
            value={kind}
            onChange={(v) => setKind(v || "numeric")}
          />
          <Switch
            label="Public (visible to coach)"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.currentTarget.checked)}
          />
          <Button onClick={onCreate}>Create</Button>
        </Stack>
      </Drawer>
    </Stack>
  );
}