import { useEffect, useState } from "react";
import {
  Modal,
  Loader,
  Alert,
  Text,
  Group,
  Stack,
  Badge,
  Table,
} from "@mantine/core";
import { adminGetPlan } from "../../../api/plans";

export default function AdminPlanViewModal({ opened, onClose, planId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!opened || !planId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await adminGetPlan(planId);
        if (!cancelled) {
          setData(res.data || res || null);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load plan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [opened, planId]);

  function handleClose() {
    setData(null);
    setErr(null);
    onClose?.();
  }

  const plan = data;

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={plan ? `Plan #${plan.id}` : "Plan details"}
      size="xl"
      centered
    >
      {loading && (
        <Group justify="center" my="lg">
          <Loader />
        </Group>
      )}

      {err && (
        <Alert color="red" mb="md">
          {err}
        </Alert>
      )}

      {!loading && !err && plan && (
        <Stack gap="sm">
          <Group gap="md">
            <Text size="sm">
              <strong>ID:</strong> {plan.id}
            </Text>
            <Text size="sm">
              <strong>Product ID:</strong> {plan.product_id}
            </Text>
            <Text size="sm">
              <strong>Coach ID:</strong> {plan.coach_id}
            </Text>
          </Group>

          <Text size="sm" c="dimmed">
            Created:{" "}
            {plan.created_at
              ? new Date(plan.created_at).toLocaleString()
              : "—"}
          </Text>

          {(plan.weeks || []).length === 0 && (
            <Text c="dimmed" size="sm">
              No weeks in this plan.
            </Text>
          )}

          {(plan.weeks || []).map((w) => (
            <Stack key={w.id} gap="xs" mt="sm">
              <Group gap="xs">
                <Badge size="sm" variant="light">
                  Week {w.week_number}
                </Badge>
                {w.title && (
                  <Text size="sm">
                    <strong>{w.title}</strong>
                  </Text>
                )}
              </Group>

              {w.notes && (
                <Text size="xs" c="dimmed">
                  {w.notes}
                </Text>
              )}

              {(w.days || []).length === 0 ? (
                <Text size="xs" c="dimmed" ml="lg">
                  No days.
                </Text>
              ) : (
                (w.days || []).map((d) => (
                  <Stack key={d.id} gap={4} ml="lg">
                    <Group gap="xs">
                      <Badge size="xs" variant="outline">
                        Day {d.day_number}
                      </Badge>
                      {d.title && (
                        <Text size="sm">
                          <strong>{d.title}</strong>
                        </Text>
                      )}
                    </Group>

                    {d.notes && (
                      <Text size="xs" c="dimmed">
                        {d.notes}
                      </Text>
                    )}

                    {(d.exercises || []).length === 0 ? (
                      <Text size="xs" c="dimmed" ml="lg">
                        No exercises.
                      </Text>
                    ) : (
                      <Table
                        withRowBorders={false}
                        highlightOnHover
                        mt={4}
                        ml="lg"
                      >
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>#</Table.Th>
                            <Table.Th>Exercise ID</Table.Th>
                            <Table.Th>Title</Table.Th>
                            <Table.Th>Sets</Table.Th>
                            <Table.Th>Reps</Table.Th>
                            <Table.Th>Rest (s)</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {d.exercises.map((ex) => (
                            <Table.Tr key={ex.id}>
                              <Table.Td>{ex.order ?? "—"}</Table.Td>
                              <Table.Td>{ex.exercise_id}</Table.Td>
                              <Table.Td>{ex.custom_title || "—"}</Table.Td>
                              <Table.Td>{ex.sets ?? "—"}</Table.Td>
                              <Table.Td>{ex.reps ?? "—"}</Table.Td>
                              <Table.Td>
                                {ex.rest_seconds ?? ex.rest ?? "—"}
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Stack>
                ))
              )}
            </Stack>
          ))}
        </Stack>
      )}
    </Modal>
  );
}