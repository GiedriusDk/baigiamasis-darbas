import { useEffect, useState } from "react";
import {
  Text,
  Table,
  Loader,
  Alert,
  Group,
  Paper,
  Button,
  Badge,
} from "@mantine/core";

import { adminListProfiles, adminDeleteProfile } from "../../../api/profiles";  
import AdminProfileEditModal from "./AdminProfileEditModal";
import AdminProfileViewModal from "./AdminProfileViewModal";

export default function AdminProfilesSection() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewProfile, setViewProfile] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminListProfiles();
      setProfiles(res.data || []);
    } catch (e) {
      setErr(e.message || "Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openView(p) {
    setViewProfile(p);
    setViewOpen(true);
  }

  function closeView() {
    setViewOpen(false);
    setViewProfile(null);
  }

  function openEdit(p) {
    setEditingProfile(p);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditingProfile(null);
  }

  function applyUpdatedProfile(updated) {
    setProfiles((prev) =>
      prev.map((p) =>
        (p.user_id || p.id) === (updated.user_id || updated.id) ? updated : p
      )
    );
  }

  async function handleDelete(p) {
    const userId = p.user_id || p.id;
    const ok = window.confirm(
      `Ar tikrai nori ištrinti vartotojo (#${userId}) profilį?`
    );
    if (!ok) return;

    try {
      await adminDeleteProfile(userId);
      setProfiles((prev) =>
        prev.filter((x) => (x.user_id || x.id) !== userId)
      );
    } catch (e) {
      alert(e.message || "Nepavyko ištrinti profilio");
    }
  }

  return (
    <>
      <Paper withBorder p="md" radius="lg" mt="lg">
        {loading && (
          <Group justify="center" my="lg">
            <Loader />
          </Group>
        )}

        {err && (
          <Alert color="red" mb="md">
            {err}
          </Alert>
        )}

        {!loading && !err && (
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>User ID</Table.Th>
                <Table.Th>Vartotojas</Table.Th>
                <Table.Th>Tikslas</Table.Th>
                <Table.Th>Treniruotės / sav.</Table.Th>
                <Table.Th>Aktyvumas</Table.Th>
                <Table.Th>Sukurta</Table.Th>
                <Table.Th style={{ width: 190 }}>Veiksmai</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {profiles.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>{p.id}</Table.Td>
                  <Table.Td>{p.user_id}</Table.Td>
                  <Table.Td>
                    {p.first_name || p.last_name
                      ? `${p.first_name || ""} ${p.last_name || ""}`.trim()
                      : p.email || "—"}
                    {p.email && (
                      <Text c="dimmed" fz="xs">
                        {p.email}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {p.goal ? (
                      <Badge size="sm" variant="light">
                        {p.goal}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </Table.Td>
                  <Table.Td>{p.sessions_per_week ?? "—"}</Table.Td>
                  <Table.Td>{p.activity_level || "—"}</Table.Td>
                  <Table.Td>
                    {p.created_at
                      ? new Date(p.created_at).toLocaleString()
                      : "—"}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => openView(p)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => openEdit(p)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(p)}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}

              {!profiles.length && (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Text c="dimmed" ta="center">
                      Kol kas nėra profilių.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <AdminProfileViewModal
        opened={viewOpen}
        profile={viewProfile}
        onClose={closeView}
      />

      <AdminProfileEditModal
        opened={editOpen}
        profile={editingProfile}
        onClose={closeEdit}
        onUpdated={applyUpdatedProfile}
      />
    </>
  );
}