import { useEffect, useState } from "react";
import {
  Title,
  Text,
  Table,
  Loader,
  Alert,
  Group,
  Badge,
  Stack,
  Button,
  Pagination,
} from "@mantine/core";
import { IconEye, IconPencil, IconTrash } from "@tabler/icons-react";

import {
  adminListProfiles,
  adminDeleteProfile,
  adminListCoachProfiles,
} from "../../../api/profiles";
import { adminListAuthUsers } from "../../../api/auth"; 

import AdminProfileEditModal from "./AdminProfileEditModal";
import AdminProfileViewModal from "./AdminProfileViewModal";

const PER_PAGE = 20;

export default function AdminProfilesSection() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewProfile, setViewProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);

  const [authUsersById, setAuthUsersById] = useState({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const [profilesRes, coachProfilesRes, authUsersRes] = await Promise.all([
        adminListProfiles(),
        adminListCoachProfiles(),
        adminListAuthUsers(),
      ]);

      const allProfiles = (profilesRes?.data ?? profilesRes ?? []) || [];
      const coachProfiles =
        (coachProfilesRes?.data ?? coachProfilesRes ?? []) || [];
      const authUsers = (authUsersRes?.data ?? authUsersRes ?? []) || [];

      const coachUserIds = new Set(
        coachProfiles
          .map((cp) => cp.user_id || cp.id)
          .filter((id) => id != null)
      );

      const onlyUsers = allProfiles.filter(
        (p) => !coachUserIds.has(p.user_id || p.id)
      );

      const usersMap = {};
      authUsers.forEach((u) => {
        if (!u) return;
        const id = u.id;
        if (id == null) return;
        usersMap[id] = u;
      });

      setAuthUsersById(usersMap);
      setProfiles(onlyUsers);
      setPage(1);
    } catch (e) {
      setErr(e.message || "Failed to load profiles");
    } finally {
      setLoading(false);
    }
  }

  function getUserDisplayName(profile) {
    const userId = profile.user_id || profile.id;
    const authUser = authUsersById[userId];

    if (authUser) {
      const fn = authUser.first_name || "";
      const ln = authUser.last_name || "";
      const full = `${fn} ${ln}`.trim();
      if (full) return full;
      if (authUser.name) return authUser.name;
      if (authUser.email) return authUser.email;
    }

    if (profile.first_name || profile.last_name) {
      return `${profile.first_name || ""} ${
        profile.last_name || ""
      }`.trim();
    }

    return profile.email || `User #${userId}`;
  }

  function applyUpdatedProfile(updated) {
    if (!updated) return;
    setProfiles((prev) =>
      prev.map((p) =>
        (p.user_id || p.id) === (updated.user_id || updated.id)
          ? updated
          : p
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

  const totalPages = Math.max(1, Math.ceil(profiles.length / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const visibleProfiles = profiles.slice(start, start + PER_PAGE);

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>User profiles</Title>
        <Text c="dimmed" size="sm" mt={4}>
          View and manage user profiles, their goals and training preferences.
        </Text>
      </div>

      {err && <Alert color="red">{err}</Alert>}

      {loading && (
        <Group justify="center" my="lg">
          <Loader />
        </Group>
      )}

      {!loading && !err && profiles.length === 0 && (
        <Alert color="yellow">No profiles yet.</Alert>
      )}

      {!loading && !err && profiles.length > 0 && (
        <>
          <Table
            highlightOnHover
            striped
            withRowBorders
            verticalSpacing="sm"
            horizontalSpacing="lg"
            w="100%"
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>User ID</Table.Th>
                <Table.Th>User</Table.Th>
                <Table.Th>Goal</Table.Th>
                <Table.Th>Sessions / week</Table.Th>
                <Table.Th>Activity</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th style={{ width: 260 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {visibleProfiles.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>{p.id}</Table.Td>
                  <Table.Td>{p.user_id}</Table.Td>
                  <Table.Td>
                    {getUserDisplayName(p)}
                    {authUsersById[p.user_id] &&
                      authUsersById[p.user_id].email && (
                        <Text c="dimmed" fz="xs">
                          {authUsersById[p.user_id].email}
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
                    <Group gap={6} justify="flex-start">
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconEye size={14} />}
                        onClick={() => setViewProfile(p)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        leftSection={<IconPencil size={14} />}
                        onClick={() => setEditingProfile(p)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="subtle"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleDelete(p)}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Group justify="center" mt="md">
            <Pagination
              total={totalPages}
              value={page}
              onChange={setPage}
            />
          </Group>
        </>
      )}

      <AdminProfileViewModal
        opened={!!viewProfile}
        profile={viewProfile}
        onClose={() => setViewProfile(null)}
      />

      <AdminProfileEditModal
        opened={!!editingProfile}
        profile={editingProfile}
        onClose={() => setEditingProfile(null)}
        onUpdated={applyUpdatedProfile}
      />
    </Stack>
  );
}