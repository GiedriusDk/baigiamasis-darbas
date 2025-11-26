import {
  Modal,
  Text,
  Group,
  Stack,
  Badge,
  Table,
  ScrollArea,
} from "@mantine/core";

export default function AdminSplitViewModal({ opened, onClose, split }) {
  if (!split) {
    return (
      <Modal opened={opened} onClose={onClose} title="Split details" centered>
        <Text c="dimmed" size="sm">
          No split selected.
        </Text>
      </Modal>
    );
  }

  const days = split.days || [];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Split #${split.id}`}
      size="xl"
      centered
    >
      <Stack gap="sm">
        <Group gap="md">
          <Text size="sm">
            <strong>ID:</strong> {split.id}
          </Text>
          <Text size="sm">
            <strong>User ID:</strong> {split.user_id}
          </Text>
        </Group>

        <Text size="sm">
          <strong>Title:</strong> {split.title || "—"}
        </Text>

        {split.notes && (
          <Text size="sm">
            <strong>Notes:</strong> {split.notes}
          </Text>
        )}

        <Text size="xs" c="dimmed">
          Created:{" "}
          {split.created_at
            ? new Date(split.created_at).toLocaleString()
            : "—"}
        </Text>

        {days.length === 0 && (
          <Text c="dimmed" size="sm" mt="sm">
            No days in this split.
          </Text>
        )}

        {days.length > 0 && (
          <ScrollArea h={400} mt="sm">
            <Stack gap="md">
              {days.map((d) => {
                const slots = d.slots || [];
                return (
                  <Stack key={d.id} gap={4}>
                    <Group gap="xs">
                      <Badge size="sm" variant="light">
                        Day {d.day_index}
                      </Badge>
                      <Text size="sm">
                        <strong>{d.name || "Untitled day"}</strong>
                      </Text>
                    </Group>

                    {slots.length === 0 ? (
                      <Text size="xs" c="dimmed" ml="lg">
                        No slots for this day.
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
                            <Table.Th>Tag</Table.Th>
                            <Table.Th>Count</Table.Th>
                            <Table.Th>Min compounds</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {slots.map((s) => (
                            <Table.Tr key={s.id}>
                              <Table.Td>{s.tag || "—"}</Table.Td>
                              <Table.Td>{s.count ?? "—"}</Table.Td>
                              <Table.Td>{s.min_compound ?? "—"}</Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          </ScrollArea>
        )}
      </Stack>
    </Modal>
  );
}