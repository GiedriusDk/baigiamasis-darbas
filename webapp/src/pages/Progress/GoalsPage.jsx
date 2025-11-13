// webapp/src/pages/Progress/GoalsPage.jsx
import { useEffect, useState } from "react";
import {
  Badge,
  Card,
  Group,
  Loader,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { listGoals } from "../../api/progress";

export default function GoalsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const g = await listGoals();
      setRows(g?.data ?? g ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Loader />;

  if (rows.length === 0) {
    return (
      <Stack>
        <Title order={2}>Goals</Title>
        <Text size="sm" c="dimmed">
          You don&apos;t have any goals yet. Set a goal on a specific metric
          page (for example &quot;Weight&quot; or &quot;Arm&quot;).
        </Text>
      </Stack>
    );
  }

  return (
    <Stack>
      <Title order={2}>Goals</Title>

      <Card withBorder>
        <Table withTableBorder withColumnBorders highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Metric</Table.Th>
              <Table.Th>Title</Table.Th>
              <Table.Th>Target</Table.Th>
              <Table.Th>Direction</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((g) => {
              const metricName =
                g.metric?.name || g.metric_name || `#${g.metric_id}`;
              const unit = g.unit || g.metric?.unit || "";
              const dir =
                g.direction === "at_least"
                  ? "Reach at least"
                  : g.direction === "at_most"
                  ? "Reach at most"
                  : g.direction || "—";

              return (
                <Table.Tr key={g.id}>
                  <Table.Td>{metricName}</Table.Td>
                  <Table.Td>{g.title || "Goal"}</Table.Td>
                  <Table.Td>
                    {g.target_value != null ? (
                      <>
                        <b>{g.target_value}</b> {unit}
                      </>
                    ) : (
                      "—"
                    )}
                  </Table.Td>
                  <Table.Td>{dir}</Table.Td>
                  <Table.Td>
                    {g.is_active === false ? (
                      <Badge color="gray" variant="light">
                        Inactive
                      </Badge>
                    ) : (
                      <Badge color="teal" variant="light">
                        Active
                      </Badge>
                    )}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}