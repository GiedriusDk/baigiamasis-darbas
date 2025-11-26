// src/pages/Admin/CoachExercises/AdminCoachExerciseViewModal.jsx
import { Modal, Text, Stack, Badge, Divider } from "@mantine/core";

export default function AdminCoachExerciseViewModal({ opened, onClose, item }) {
  if (!item) return null;

  return (
    <Modal opened={opened} onClose={onClose} title="Pratimo informacija" centered size="lg">
      <Stack gap="xs">
        <Text><b>Pavadinimas:</b> {item.title}</Text>

        {item.description && (
          <Text><b>Aprašymas:</b> {item.description}</Text>
        )}

        <Divider />

        <Text><b>Raumuo:</b> {item.primary_muscle || "—"}</Text>
        <Text><b>Įranga:</b> {item.equipment || "—"}</Text>

        <Text>
          <b>Sunkumas:</b>{" "}
          {item.difficulty ? <Badge>{item.difficulty}</Badge> : "—"}
        </Text>

        <Text><b>Žymės:</b> {Array.isArray(item.tags) ? item.tags.join(", ") : "—"}</Text>

        <Text>
          <b>Media:</b>{" "}
          {item.media_path ? (
            <a href={item.media_path} target="_blank" rel="noopener noreferrer">
              Peržiūrėti
            </a>
          ) : "—"}
        </Text>

        <Divider />

        <Text><b>Sukurta:</b> {new Date(item.created_at).toLocaleString()}</Text>
      </Stack>
    </Modal>
  );
}