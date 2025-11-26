
import { Modal, Text, Stack, Group, Badge } from "@mantine/core";

export default function AdminChatRoomViewModal({ opened, onClose, room }) {
  if (!room) {
    return (
      <Modal opened={opened} onClose={onClose} title="Chat room" centered>
        <Text>No room selected.</Text>
      </Modal>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Chat room #${room.id}`}
      centered
      size="lg"
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Text fw={500}>Type</Text>
          {room.type ? (
            <Badge>{room.type}</Badge>
          ) : (
            <Text c="dimmed">—</Text>
          )}
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Title</Text>
          <Text>{room.title || "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Coach ID</Text>
          <Text>{room.coach_id ?? "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>User ID</Text>
          <Text>{room.user_id ?? "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Plan ID</Text>
          <Text>{room.plan_id ?? "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Slug</Text>
          <Text>{room.slug || "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Created at</Text>
          <Text>
            {room.created_at
              ? new Date(room.created_at).toLocaleString()
              : "—"}
          </Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Updated at</Text>
          <Text>
            {room.updated_at
              ? new Date(room.updated_at).toLocaleString()
              : "—"}
          </Text>
        </Group>
      </Stack>
    </Modal>
  );
}