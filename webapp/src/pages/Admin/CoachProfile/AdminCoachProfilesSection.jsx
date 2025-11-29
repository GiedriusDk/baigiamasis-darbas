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
  adminListCoachProfiles,
  adminDeleteCoachProfile,
} from "../../../api/profiles";
import { adminListUsers } from "../../../api/auth";
import AdminCoachProfileEditModal from "./AdminCoachProfileEditModal";
import AdminCoachProfileViewModal from "./AdminCoachProfileViewModal";

const ITEMS_PER_PAGE = 10;

function normalizeList(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

export default function AdminCoachProfilesSection() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewProfile, setViewProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(null);

  const [page, setPage] = useState(1);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);

    try {
      const [coachRes, authRes] = await Promise.all([
        adminListCoachProfiles(),
        adminListUsers(),
      ]);

      const coachRows = normalizeList(coachRes);
      const authRows = normalizeList(authRes);

      const authById = {};
      authRows.forEach((u) => {
        if (!u || typeof u !== "object") return;
        authById[u.id] = u;
      });

      const merged = coachRows.map((p) => {
        const auth = authById[p.user_id];

        const firstName = auth?.first_name ?? p.first_name ?? "";
        const lastName = auth?.last_name ?? p.last_name ?? "";
        const email = auth?.email ?? p.email ?? null;
        const fullName = `${firstName} ${lastName}`.trim() || null;

        return {
          ...p,
          _auth: auth || null,
          _fullName: fullName,
          _email: email,
          _role: auth?.role ?? null,
        };
      });

      const onlyCoaches = merged.filter((p) => {
        if (!p._role) return true;
        return p._role === "coach";
      });

      setProfiles(onlyCoaches);
      setPage(1);
    } catch (e) {
      setErr(e.message || "Failed to load coach profiles");
    } finally {
      setLoading(false);
    }
  }

  function applyUpdatedProfile(updated) {
    if (!updated) return;
    setProfiles((prev) =>
      prev.map((p) =>
        (p.user_id || p.id) === (updated.user_id || updated.id)
          ? { ...p, ...updated }
          : p
      )
    );
  }

  async function handleDelete(p) {
    const userId = p.user_id || p.id;
    const ok = window.confirm(
      `Ar tikrai nori ištrinti trenerio profilį (user #${userId})?`
    );
    if (!ok) return;

    try {
      await adminDeleteCoachProfile(userId);
      setProfiles((prev) =>
        prev.filter((x) => (x.user_id || x.id) !== userId)
      );
    } catch (e) {
      alert(e.message || "Nepavyko ištrinti trenerio profilio");
    }
  }

  const totalPages =
    profiles.length > 0 ? Math.ceil(profiles.length / ITEMS_PER_PAGE) : 1;
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const pageItems = profiles.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Coach profiles</Title>
        <Text c="dimmed" size="sm" mt={4}>
          View and manage coach profiles and their basic information.
        </Text>
      </div>

      {err && <Alert color="red">{err}</Alert>}

      {loading && (
        <Group justify="center" my="lg">
          <Loader />
        </Group>
      )}

      {!loading && !err && profiles.length === 0 && (
        <Alert color="yellow">No coach profiles yet.</Alert>
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
                <Table.Th>Coach</Table.Th>
                <Table.Th>City / Country</Table.Th>
                <Table.Th>Experience (y.)</Table.Th>
                <Table.Th>Specializations</Table.Th>
                <Table.Th>Created at</Table.Th>
                <Table.Th style={{ width: 260 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pageItems.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>{p.id}</Table.Td>
                  <Table.Td>{p.user_id ?? "—"}</Table.Td>
                  <Table.Td>
                    {p._fullName || "—"}
                    {p._email && (
                      <Text c="dimmed" fz="xs">
                        {p._email}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {p.city || p.country
                      ? [p.city, p.country].filter(Boolean).join(", ")
                      : "—"}
                  </Table.Td>
                  <Table.Td>{p.experience_years ?? "—"}</Table.Td>
                  <Table.Td>
                    {Array.isArray(p.specializations) &&
                    p.specializations.length ? (
                      <Group gap={4} wrap="wrap">
                        {p.specializations.map((s) => (
                          <Badge key={s} size="sm" variant="light">
                            {s}
                          </Badge>
                        ))}
                      </Group>
                    ) : (
                      "—"
                    )}
                  </Table.Td>
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

          {profiles.length > ITEMS_PER_PAGE && (
            <Group justify="flex-end">
              <Pagination
                value={page}
                onChange={setPage}
                total={totalPages}
              />
            </Group>
          )}
        </>
      )}

      <AdminCoachProfileViewModal
        opened={!!viewProfile}
        onClose={() => setViewProfile(null)}
        profile={viewProfile}
      />

      <AdminCoachProfileEditModal
        opened={!!editingProfile}
        onClose={() => setEditingProfile(null)}
        profile={editingProfile}
        onUpdated={applyUpdatedProfile}
      />
    </Stack>
  );
}