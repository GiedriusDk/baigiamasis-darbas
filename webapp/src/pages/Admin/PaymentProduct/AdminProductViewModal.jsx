import {
  Modal,
  Text,
  Group,
  Stack,
  Badge,
} from "@mantine/core";

export default function AdminProductViewModal({ opened, onClose, product }) {
  if (!product) {
    return (
      <Modal opened={opened} onClose={onClose} title="Product details" centered>
        <Text>No product selected.</Text>
      </Modal>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Product #${product.id}`}
      centered
      size="lg"
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Text fw={500}>Title</Text>
          <Text>{product.title || "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Slug</Text>
          <Text>{product.slug || "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Coach ID</Text>
          <Text>{product.coach_id ?? "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Price</Text>
          <Text>
            {product.price != null ? `${product.price} ${product.currency || "EUR"}` : "—"}
          </Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Type</Text>
          <Text>{product.type || "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Level</Text>
          <Text>{product.level || "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Duration (weeks)</Text>
          <Text>{product.duration_weeks ?? "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Sessions / week</Text>
          <Text>{product.sessions_per_week ?? "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Access days</Text>
          <Text>{product.access_days ?? "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Includes chat</Text>
          <Badge color={product.includes_chat ? "green" : "gray"} variant="light">
            {product.includes_chat ? "Yes" : "No"}
          </Badge>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Includes calls</Text>
          <Badge color={product.includes_calls ? "green" : "gray"} variant="light">
            {product.includes_calls ? "Yes" : "No"}
          </Badge>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Gym name</Text>
          <Text>{product.gym_name || "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Gym address</Text>
          <Text>{product.gym_address || "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Thumbnail URL</Text>
          <Text>{product.thumbnail_url || "—"}</Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Active</Text>
          <Badge color={product.is_active ? "green" : "red"} variant="light">
            {product.is_active ? "Active" : "Inactive"}
          </Badge>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Created at</Text>
          <Text>
            {product.created_at
              ? new Date(product.created_at).toLocaleString()
              : "—"}
          </Text>
        </Group>

        <Group justify="space-between">
          <Text fw={500}>Updated at</Text>
          <Text>
            {product.updated_at
              ? new Date(product.updated_at).toLocaleString()
              : "—"}
          </Text>
        </Group>

        {product.description && (
          <>
            <Text fw={500}>Description</Text>
            <Text>{product.description}</Text>
          </>
        )}
      </Stack>
    </Modal>
  );
}