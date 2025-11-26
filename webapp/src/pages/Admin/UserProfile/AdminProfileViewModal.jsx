import {
  Modal,
  Text,
  Stack,
  Group,
  Badge,
  Divider,
} from "@mantine/core";

function joinArray(value) {
  if (!value) return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function formatDate(d) {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleString();
}

export default function AdminProfileViewModal({ opened, profile, onClose }) {
  if (!profile) {
    return (
      <Modal opened={opened} onClose={onClose} title="Profilis" centered>
        <Text c="dimmed">Profilio duomenų nėra.</Text>
      </Modal>
    );
  }

  const userLabel =
    profile.first_name || profile.last_name
      ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
      : profile.email || `User #${profile.user_id || profile.id}`;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Profilis – user #${profile.user_id || profile.id}`}
      centered
      size="lg"
    >
      <Stack gap="xs">
        <Text fw={600}>{userLabel}</Text>
        {profile.email && (
          <Text c="dimmed" fz="sm">
            {profile.email}
          </Text>
        )}

        <Divider my="sm" />

        <Text fw={600} fz="sm">
          Tikslai ir aktyvumas
        </Text>
        <Group gap="xs">
          {profile.goal && (
            <Badge size="sm" variant="light">
              {profile.goal}
            </Badge>
          )}
          {profile.activity_level && (
            <Badge size="sm" variant="outline">
              {profile.activity_level}
            </Badge>
          )}
        </Group>
        <Text>
          <b>Treniruotės per savaitę:</b>{" "}
          {profile.sessions_per_week ?? "—"}
        </Text>
        <Text>
          <b>Minutės vienai sesijai:</b>{" "}
          {profile.available_minutes ?? "—"}
        </Text>
        <Text>
          <b>Lytis:</b> {profile.sex || "—"}
        </Text>

        <Divider my="sm" />

        <Text fw={600} fz="sm">
          Kūno duomenys
        </Text>
        <Text>
          <b>Ūgis:</b> {profile.height_cm ?? "—"} cm
        </Text>
        <Text>
          <b>Svoris:</b> {profile.weight_kg ?? "—"} kg
        </Text>
        <Text>
          <b>Gimimo data:</b> {profile.birth_date || "—"}
        </Text>

        <Divider my="sm" />

        <Text fw={600} fz="sm">
          Įranga ir apribojimai
        </Text>
        <Text>
          <b>Įranga:</b> {joinArray(profile.equipment)}
        </Text>
        <Text>
          <b>Preferencijos:</b> {joinArray(profile.preferences)}
        </Text>
        <Text>
          <b>Traumos:</b> {joinArray(profile.injuries)}
        </Text>

        <Divider my="sm" />

        <Text fw={600} fz="sm">
          Meta
        </Text>
        <Text>
          <b>Sukurta:</b> {formatDate(profile.created_at)}
        </Text>
        <Text>
          <b>Atnaujinta:</b> {formatDate(profile.updated_at)}
        </Text>
      </Stack>
    </Modal>
  );
}