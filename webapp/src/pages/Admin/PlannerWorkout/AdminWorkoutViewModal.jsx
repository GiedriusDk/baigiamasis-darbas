import { Modal, Text, Group, Stack, Table, Badge } from "@mantine/core";

export default function AdminWorkoutViewModal({ opened, onClose, workout }) {
  if (!workout) {
    return (
      <Modal opened={opened} onClose={onClose} title="Workout details" centered>
        <Text c="dimmed" size="sm">
          No workout selected.
        </Text>
      </Modal>
    );
  }

  const exercises = workout.exercises || [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Workout #${workout.id}`}
      size="xl"
      centered
    >
      <Stack gap="sm">
        <Group gap="md">
          <Text size="sm">
            <strong>ID:</strong> {workout.id}
          </Text>
          <Text size="sm">
            <strong>Plan ID:</strong> {workout.plan_id}
          </Text>
          <Text size="sm">
            <strong>Day index:</strong> {workout.day_index}
          </Text>
        </Group>

        <Text size="sm">
          <strong>Name:</strong>{" "}
          {workout.name || <Text component="span" c="dimmed">—</Text>}
        </Text>

        {workout.notes && (
          <Text size="sm">
            <strong>Notes:</strong> {workout.notes}
          </Text>
        )}

        <Text size="sm" c="dimmed">
          Created:{" "}
          {workout.created_at
            ? new Date(workout.created_at).toLocaleString()
            : "—"}
        </Text>

        <Group gap="xs">
          <Text size="sm">
            <strong>Exercises:</strong>
          </Text>
          <Badge size="sm" variant="light">
            {exercises.length}
          </Badge>
        </Group>

        {exercises.length === 0 ? (
          <Text c="dimmed" size="sm">
            No exercises in this workout.
          </Text>
        ) : (
          <Table striped highlightOnHover withRowBorders={false} mt="xs">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Exercise ID</Table.Th>
                <Table.Th>Sets</Table.Th>
                <Table.Th>Rep min</Table.Th>
                <Table.Th>Rep max</Table.Th>
                <Table.Th>Rest (s)</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {exercises.map((ex) => (
                <Table.Tr key={ex.id}>
                  <Table.Td>{ex.order ?? "—"}</Table.Td>
                  <Table.Td>{ex.exercise_id}</Table.Td>
                  <Table.Td>{ex.sets ?? "—"}</Table.Td>
                  <Table.Td>{ex.rep_min ?? "—"}</Table.Td>
                  <Table.Td>{ex.rep_max ?? "—"}</Table.Td>
                  <Table.Td>{ex.rest_sec ?? "—"}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>
    </Modal>
  );
}