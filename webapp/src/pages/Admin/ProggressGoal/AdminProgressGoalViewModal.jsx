import { Modal, Text, Group, Stack, Badge, Divider } from "@mantine/core";

export default function AdminProgressGoalViewModal({ opened, onClose, goal }) {
  if (!goal) {
    return (
      <Modal opened={opened} onClose={onClose} title="Progress goal" centered>
        <Text c="dimmed">Nothing selected.</Text>
      </Modal>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Progress goal #${goal.id}`}
      centered
      size="lg"
    >
      <Stack>
        <Group>
          <Text><b>ID:</b> {goal.id}</Text>
          <Text><b>User:</b> {goal.user_id}</Text>
        </Group>

        <Divider />

        <Text><b>Type:</b> {goal.goal_type || "—"}</Text>
        <Text>
          <b>Target:</b> {goal.target_value ?? "—"} {goal.unit || ""}
        </Text>
        <Text>
          <b>Deadline:</b>{" "}
          {goal.deadline_date
            ? new Date(goal.deadline_date).toLocaleDateString()
            : "—"}
        </Text>

        <Group>
          <Badge color={goal.is_active ? "green" : "gray"}>
            {goal.is_active ? "Active" : "Inactive"}
          </Badge>
          <Badge color={goal.is_completed ? "blue" : "gray"}>
            {goal.is_completed ? "Completed" : "Pending"}
          </Badge>
        </Group>

        {goal.notes && (
          <>
            <Divider />
            <Text><b>Notes:</b></Text>
            <Text c="dimmed">{goal.notes}</Text>
          </>
        )}

        <Divider />

        <Text c="dimmed" size="xs">
          <b>Created:</b>{" "}
          {goal.created_at ? new Date(goal.created_at).toLocaleString() : "—"}
        </Text>
        <Text c="dimmed" size="xs">
          <b>Updated:</b>{" "}
          {goal.updated_at ? new Date(goal.updated_at).toLocaleString() : "—"}
        </Text>
      </Stack>
    </Modal>
  );
}