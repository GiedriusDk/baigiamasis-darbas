import { Modal, Stack, Text, Image, Badge, Group } from "@mantine/core";

function join(value) {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export default function AdminExerciseViewModal({ opened, onClose, exercise }) {
  if (!exercise) {
    return (
      <Modal opened={opened} onClose={onClose} title="Exercise" centered>
        <Text c="dimmed">No exercise selected.</Text>
      </Modal>
    );
  }

  return (
    <Modal opened={opened} onClose={onClose} title={`Exercise #${exercise.id}`} centered>
      <Stack gap="xs">
        <Text fw={600}>{exercise.name}</Text>

        {exercise.image_url && (
          <Image
            src={exercise.image_url}
            alt={exercise.name}
            radius="md"
            fit="contain"
            mah={240}
          />
        )}

        <Group gap="xs">
          {exercise.primary_muscle && (
            <Badge>{exercise.primary_muscle}</Badge>
          )}
          {exercise.equipment && <Badge variant="outline">{exercise.equipment}</Badge>}
        </Group>

        {exercise.tags && exercise.tags.length > 0 && (
          <Text size="sm">
            <Text span fw={500}>
              Tags:
            </Text>{" "}
            {join(exercise.tags)}
          </Text>
        )}

        {exercise.body_parts && exercise.body_parts.length > 0 && (
          <Text size="sm">
            <Text span fw={500}>
              Body parts:
            </Text>{" "}
            {join(exercise.body_parts)}
          </Text>
        )}

        {exercise.target_muscles && exercise.target_muscles.length > 0 && (
          <Text size="sm">
            <Text span fw={500}>
              Target muscles:
            </Text>{" "}
            {join(exercise.target_muscles)}
          </Text>
        )}

        {exercise.secondary_muscles && exercise.secondary_muscles.length > 0 && (
          <Text size="sm">
            <Text span fw={500}>
              Secondary muscles:
            </Text>{" "}
            {join(exercise.secondary_muscles)}
          </Text>
        )}

        {exercise.instructions && exercise.instructions.length > 0 && (
          <Stack gap={2}>
            <Text fw={500} size="sm">
              Instructions:
            </Text>
            {exercise.instructions.map((step, i) => (
              <Text key={i} size="sm">
                {i + 1}. {step}
              </Text>
            ))}
          </Stack>
        )}
      </Stack>
    </Modal>
  );
}