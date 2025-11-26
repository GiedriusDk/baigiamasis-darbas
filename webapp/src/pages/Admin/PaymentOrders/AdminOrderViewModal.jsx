// webapp/src/pages/Admin/Payments/AdminOrderViewModal.jsx
import { Modal, Text, Stack, Group, Badge } from "@mantine/core";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

export default function AdminOrderViewModal({ opened, onClose, order }) {
  if (!order) return null;

  const meta =
    order.metadata != null
      ? JSON.stringify(order.metadata, null, 2)
      : "—";

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Order #${order.id}`}
      centered
      size="lg"
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            User ID
          </Text>
          <Text size="sm">{order.user_id}</Text>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Product ID
          </Text>
          <Text size="sm">{order.product_id}</Text>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Public ID
          </Text>
          <Text size="sm">{order.public_id || "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Amount
          </Text>
          <Text size="sm">
            {order.amount} {order.currency}
          </Text>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Status
          </Text>
          <Badge size="sm" variant="light">
            {order.status}
          </Badge>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Paid at
          </Text>
          <Text size="sm">{formatDate(order.paid_at)}</Text>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Expires at
          </Text>
          <Text size="sm">{formatDate(order.expires_at)}</Text>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Created at
          </Text>
          <Text size="sm">{formatDate(order.created_at)}</Text>
        </Group>

        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Updated at
          </Text>
          <Text size="sm">{formatDate(order.updated_at)}</Text>
        </Group>

        <div>
          <Text size="sm" c="dimmed" mb={4}>
            Metadata
          </Text>
          <pre
            style={{
              background: "#f5f5f5",
              padding: "8px 10px",
              borderRadius: 8,
              maxHeight: 250,
              overflow: "auto",
              fontSize: 12,
            }}
          >
            {meta}
          </pre>
        </div>
      </Stack>
    </Modal>
  );
}