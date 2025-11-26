// src/pages/Admin/ChatMessages/AdminChatMessageViewModal.jsx
import { Modal, Text, Group, Badge, Stack, Anchor } from "@mantine/core";

export default function AdminChatMessageViewModal({ opened, onClose, message }) {
  if (!message) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Message #${message.id}`}
      centered
      size="lg"
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Room ID:
          </Text>
          <Text size="sm">{message.room_id}</Text>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Sender ID:
          </Text>
          <Text size="sm">{message.sender_id}</Text>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Is read:
          </Text>
          <Badge color={message.is_read ? "green" : "gray"} size="sm">
            {message.is_read ? "Read" : "Unread"}
          </Badge>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Created at:
          </Text>
          <Text size="sm">
            {message.created_at
              ? new Date(message.created_at).toLocaleString()
              : "—"}
          </Text>
        </Group>

        <Text size="sm" c="dimmed" mt="sm">
          Message:
        </Text>
        <Text size="sm">{message.message || "—"}</Text>

        <Text size="sm" c="dimmed" mt="sm">
          Attachment:
        </Text>
        {message.attachment_url ? (
          <Anchor
            href={message.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
          >
            {message.attachment_url}
          </Anchor>
        ) : (
          <Text size="sm">—</Text>
        )}
      </Stack>
    </Modal>
  );
}