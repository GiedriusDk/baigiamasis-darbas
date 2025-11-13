import { useEffect, useState } from "react";
import {
  Anchor,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { Link } from "react-router-dom";
import { listMetrics, listEntries } from "../../api/progress";

export default function ProgressHome() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState([]);
  const [latest, setLatest] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const m = await listMetrics({ include_latest: 1 });
        const e = await listEntries({ paginate: 0, per_page: 20 });

        if (!mounted) return;

        setMetrics(m?.data ?? m ?? []);
        setLatest(e?.data ?? e ?? []);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <Loader />;

  const metricById = (id) => metrics.find((m) => m.id === id);

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Progress</Title>
        <Group>
          <Button component={Link} to="/progress/metrics" variant="light">
            Manage metrics
          </Button>
          <Button component={Link} to="/progress/metrics?new=1">
            Add category
          </Button>
        </Group>
      </Group>

      {metrics.length > 0 && (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          {metrics.map((m) => {
            // Paskutinis įrašas šiai metrikai iš listEntries
            const lastEntry = (latest ?? []).find(
              (e) => e.metric_id === m.id
            );
            const unit = lastEntry?.unit || m.unit || "";
            const date = lastEntry?.recorded_at
              ? lastEntry.recorded_at.slice(0, 10)
              : "";

            return (
              <Card key={m.id} padding="md" withBorder>
                <Group justify="space-between" mb="xs">
                  <Text fw={600}>{m.name}</Text>
                  <Badge variant="light">{m.kind?.toUpperCase()}</Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  Slug: {m.slug}
                </Text>

                {lastEntry ? (
                  <Stack gap={4} mt="sm">
                    <Text size="sm">
                      Latest:{" "}
                      <b>
                        {lastEntry.value}
                        {unit ? ` ${unit}` : ""}
                      </b>
                    </Text>
                    <Text size="xs" c="dimmed">
                      {date}
                    </Text>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed" mt="sm">
                    No entries yet
                  </Text>
                )}

                <Group mt="md">
                  <Button
                    component={Link}
                    to={`/progress/metric/${m.id}`}
                    size="xs"
                  >
                    Open
                  </Button>
                </Group>
              </Card>
            );
          })}
        </SimpleGrid>
      )}

      <Card withBorder>
        <Group justify="space-between" mb="xs">
          <Title order={4}>Recent entries</Title>
          <Anchor component={Link} to="/progress/metrics">
            All metrics
          </Anchor>
        </Group>

        {latest.length === 0 ? (
          <Text size="sm" c="dimmed">
            You don&apos;t have any entries yet.
          </Text>
        ) : (
          <Table withTableBorder withColumnBorders highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Metric</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th>Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(latest ?? []).slice(0, 10).map((e) => {
                const m = metricById(e.metric_id);
                const unit = e.unit || m?.unit || "";
                const date = e.recorded_at?.slice(0, 10) || "";

                return (
                  <Table.Tr key={e.id}>
                    <Table.Td>{m?.name || `#${e.metric_id}`}</Table.Td>
                    <Table.Td>
                      <b>{e.value}</b> {unit}
                    </Table.Td>
                    <Table.Td>{date}</Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}