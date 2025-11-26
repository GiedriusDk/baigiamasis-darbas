import {
  Modal,
  Stack,
  Text,
  Group,
  Badge,
  Divider,
  Avatar,
} from "@mantine/core";

function joinArray(value) {
  if (!value) return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export default function AdminCoachProfileViewModal({
  opened,
  onClose,
  profile,
}) {
  if (!profile) {
    return (
      <Modal opened={opened} onClose={onClose} title="Trenerio profilis">
        <Text c="dimmed">Profilis nerastas.</Text>
      </Modal>
    );
  }

  const avatar = profile.avatar_path || null;
  const name =
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.email ||
    `User #${profile.user_id || profile.id}`;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="lg"
      title="Trenerio profilis"
    >
      <Stack gap="sm">
        <Group gap="md" align="center">
          <Avatar radius="xl" size={64} src={avatar || undefined}>
            {name[0]?.toUpperCase?.() || "C"}
          </Avatar>
          <div>
            <Text fw={600}>{name}</Text>
            {profile.city || profile.country ? (
              <Text c="dimmed" fz="sm">
                {[profile.city, profile.country].filter(Boolean).join(", ")}
              </Text>
            ) : null}
          </div>
        </Group>

        <Group gap="xs" wrap="wrap">
          {profile.experience_years != null && (
            <Badge variant="light">
              Patirtis: {profile.experience_years} m.
            </Badge>
          )}
          {profile.timezone && (
            <Badge variant="outline">{profile.timezone}</Badge>
          )}
          {profile.gym_name && (
            <Badge variant="outline" color="blue">
              {profile.gym_name}
            </Badge>
          )}
        </Group>

        <Divider />

        <Text fw={600}>Kontaktai</Text>
        <Text>
          <b>El. paštas:</b> {profile.email || "—"}
        </Text>
        <Text>
          <b>Telefonas:</b> {profile.phone || "—"}
        </Text>
        <Text>
          <b>Svetainė:</b> {profile.website_url || "—"}
        </Text>
        <Text>
          <b>Sporto salė:</b> {profile.gym_name || "—"}
        </Text>
        <Text>
          <b>Sporto salės adresas:</b> {profile.gym_address || "—"}
        </Text>

        <Divider />

        <Text fw={600}>Profilio informacija</Text>
        <Text>
          <b>Bio:</b> {profile.bio || "—"}
        </Text>
        <Text>
          <b>Pasiekiamumas:</b> {profile.availability_note || "—"}
        </Text>
        <Text>
          <b>Specializacijos:</b> {joinArray(profile.specializations)}
        </Text>
        <Text>
          <b>Socialiniai tinklai:</b> {joinArray(profile.socials)}
        </Text>
        <Text>
          <b>Kalbos:</b> {joinArray(profile.languages)}
        </Text>
        <Text>
          <b>Sertifikatai:</b> {joinArray(profile.certifications)}
        </Text>

        <Divider />

        <Text c="dimmed" fz="xs">
          Sukurta:{" "}
          {profile.created_at
            ? new Date(profile.created_at).toLocaleString()
            : "—"}
          {" · "}
          Atnaujinta:{" "}
          {profile.updated_at
            ? new Date(profile.updated_at).toLocaleString()
            : "—"}
        </Text>
      </Stack>
    </Modal>
  );
}