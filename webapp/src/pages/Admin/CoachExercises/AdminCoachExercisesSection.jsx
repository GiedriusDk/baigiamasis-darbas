import { useEffect, useState, useMemo } from "react";
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
import {
  adminListCoachExercises,
  adminDeleteCoachExercise,
} from "../../../api/profiles";
import { adminListUsers } from "../../../api/auth";
import AdminCoachExerciseEditModal from "./AdminCoachExerciseEditModal";
import AdminCoachExerciseViewModal from "./AdminCoachExerciseViewModal";
import { IconEye, IconPencil, IconTrash } from "@tabler/icons-react";

const PER_PAGE = 20;

export default function AdminCoachExercisesSection() {
  const [items, setItems] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);

  const [page, setPage] = useState(1);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [exRes, usersRes] = await Promise.all([
        adminListCoachExercises(),
        adminListUsers().catch(() => null),
      ]);

      const exData = exRes?.data ?? exRes ?? [];
      setItems(Array.isArray(exData) ? exData : []);

      if (usersRes) {
        const uData = usersRes?.data ?? usersRes ?? [];
        const map = {};
        (Array.isArray(uData) ? uData : []).forEach((u) => {
          if (u?.id != null) map[u.id] = u;
        });
        setUsersById(map);
      }
    } catch (e) {
      setErr(e.message || "Failed to load exercises");
    } finally {
      setLoading(false);
    }
  }

  function applyUpdated(updated) {
    if (!updated) return;
    setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  }

  async function handleDelete(item) {
    const ok = window.confirm(`Ištrinti pratimą "${item.title}"?`);
    if (!ok) return;

    try {
      await adminDeleteCoachExercise(item.id);
      setItems((p) => p.filter((x) => x.id !== item.id));
    } catch (e) {
      alert(e.message || "Nepavyko ištrinti");
    }
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE));

  const pageSafe = Math.min(page, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (pageSafe - 1) * PER_PAGE;
    return items.slice(start, start + PER_PAGE);
  }, [items, pageSafe]);

  function renderCoachCell(ex) {
    const user = usersById[ex.user_id];

    if (!user) {
      return (
        <Text fw={500}>
          User #{ex.user_id ?? "—"}
        </Text>
      );
    }

    const fullName =
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.email ||
      `User #${user.id}`;

    return (
      <>
        <Text fw={500}>{fullName}</Text>
        <Text c="dimmed" fz="xs">
          ID: {user.id}
          {user.email ? ` • ${user.email}` : ""}
        </Text>
      </>
    );
  }

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Coaches exercises</Title>
        <Text c="dimmed" size="sm" mt={4}>
          View and manage custom exercises created by coaches.
        </Text>
      </div>

      {err && <Alert color="red">{err}</Alert>}

      {loading && (
        <Group justify="center" my="lg">
          <Loader />
        </Group>
      )}

      {!loading && !err && items.length === 0 && (
        <Alert color="yellow">No exercises yet.</Alert>
      )}

      {!loading && !err && items.length > 0 && (
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
                <Table.Th>Coach</Table.Th>
                <Table.Th>Title</Table.Th>
                <Table.Th>Muscle</Table.Th>
                <Table.Th>Difficulty</Table.Th>
                <Table.Th>Created at</Table.Th>
                <Table.Th style={{ width: 300 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {paginatedItems.map((e) => (
                <Table.Tr key={e.id}>
                  <Table.Td>{e.id}</Table.Td>

                  {/* Coach name + ID + email viename stulpelyje */}
                  <Table.Td>{renderCoachCell(e)}</Table.Td>

                  <Table.Td>{e.title}</Table.Td>
                  <Table.Td>{e.primary_muscle || "—"}</Table.Td>
                  <Table.Td>
                    {e.difficulty ? (
                      <Badge size="sm" variant="light">
                        {e.difficulty}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </Table.Td>
                  <Table.Td>
                    {e.created_at
                      ? new Date(e.created_at).toLocaleString()
                      : "—"}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6} justify="flex-start">
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconEye size={14} />}
                        onClick={() => setViewItem(e)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        leftSection={<IconPencil size={14} />}
                        onClick={() => setEditItem(e)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="subtle"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleDelete(e)}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <Group justify="flex-end" mt="md">
              <Pagination
                total={totalPages}
                value={pageSafe}
                onChange={setPage}
                size="sm"
              />
            </Group>
          )}
        </>
      )}

      <AdminCoachExerciseViewModal
        opened={!!viewItem}
        onClose={() => setViewItem(null)}
        item={viewItem}
      />

      <AdminCoachExerciseEditModal
        opened={!!editItem}
        onClose={() => setEditItem(null)}
        item={editItem}
        onUpdated={applyUpdated}
      />
    </Stack>
  );
}