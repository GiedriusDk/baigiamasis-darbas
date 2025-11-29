import { useEffect, useState, useMemo } from "react";
import {
  Title,
  Text,
  Table,
  Group,
  Button,
  Alert,
  Loader,
  Badge,
  Stack,
  Pagination,
} from "@mantine/core";
import {
  adminListChatRooms,
  adminDeleteChatRoom,
  adminUpdateChatRoom,
} from "../../../api/chat";
import { adminListUsers } from "../../../api/auth";
import AdminChatRoomViewModal from "./AdminChatRoomViewModal";
import AdminChatRoomEditModal from "./AdminChatRoomEditModal";
import { IconEye, IconPencil, IconTrash } from "@tabler/icons-react";

const PAGE_SIZE = 20;

export default function AdminChatRoomsSection() {
  const [rooms, setRooms] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewRoom, setViewRoom] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);

  const [page, setPage] = useState(1);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [roomsRes, usersRes] = await Promise.all([
        adminListChatRooms(),
        adminListUsers().catch(() => null),
      ]);

      const roomsData = roomsRes?.data ?? roomsRes ?? [];
      setRooms(Array.isArray(roomsData) ? roomsData : []);

      if (usersRes) {
        const uData = usersRes?.data ?? usersRes ?? [];
        const map = {};
        (Array.isArray(uData) ? uData : []).forEach((u) => {
          if (u?.id != null) map[u.id] = u;
        });
        setUsersById(map);
      }
    } catch (e) {
      setErr(e.message || "Failed to load chat rooms");
    } finally {
      setLoading(false);
    }
  }

  function applyUpdated(room) {
    if (!room) return;
    setRooms((prev) => prev.map((r) => (r.id === room.id ? room : r)));
  }

  async function handleDelete(room) {
    const ok = window.confirm(
      `Are you sure you want to delete chat room #${room.id}?`
    );
    if (!ok) return;

    try {
      await adminDeleteChatRoom(room.id);
      setRooms((prev) => prev.filter((r) => r.id !== room.id));
    } catch (e) {
      alert(e.message || "Failed to delete room");
    }
  }

  function renderUserCell(userId, fallbackLabel = "User") {
    if (!userId) {
      return (
        <Text c="dimmed" fz="sm">
          —
        </Text>
      );
    }

    const user = usersById[userId];

    if (!user) {
      return (
        <Text fw={500}>
          {fallbackLabel} #{userId}
        </Text>
      );
    }

    const fullName =
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.email ||
      `${fallbackLabel} #${user.id}`;

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

  const totalPages = Math.max(1, Math.ceil(rooms.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);

  const paginatedRooms = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return rooms.slice(start, start + PAGE_SIZE);
  }, [rooms, pageSafe]);

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Chat rooms</Title>
        <Text c="dimmed" size="sm" mt={4}>
          View and manage all chat rooms between users and coaches.
        </Text>
      </div>

      {err && <Alert color="red">{err}</Alert>}

      {loading && (
        <Group justify="center" my="lg">
          <Loader />
        </Group>
      )}

      {!loading && !err && rooms.length === 0 && (
        <Alert color="yellow">No chat rooms found.</Alert>
      )}

      {!loading && !err && rooms.length > 0 && (
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
                <Table.Th>User</Table.Th>
                <Table.Th>Plan ID</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Title</Table.Th>
                <Table.Th>Created at</Table.Th>
                <Table.Th style={{ width: 280 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedRooms.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>{r.id}</Table.Td>

                  {/* Coach */}
                  <Table.Td>{renderUserCell(r.coach_id, "Coach")}</Table.Td>

                  {/* User */}
                  <Table.Td>{renderUserCell(r.user_id, "User")}</Table.Td>

                  <Table.Td>{r.plan_id ?? "—"}</Table.Td>
                  <Table.Td>
                    {r.type ? (
                      <Badge size="sm" variant="light">
                        {r.type}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </Table.Td>
                  <Table.Td>{r.title || "—"}</Table.Td>
                  <Table.Td>
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString()
                      : "—"}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6} justify="flex-start">
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconEye size={14} />}
                        onClick={() => setViewRoom(r)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        leftSection={<IconPencil size={14} />}
                        onClick={() => setEditingRoom(r)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="subtle"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleDelete(r)}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

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

      <AdminChatRoomViewModal
        opened={!!viewRoom}
        onClose={() => setViewRoom(null)}
        room={viewRoom}
      />

      <AdminChatRoomEditModal
        opened={!!editingRoom}
        onClose={() => setEditingRoom(null)}
        room={editingRoom}
        onUpdated={applyUpdated}
        onSaveApi={adminUpdateChatRoom}
      />
    </Stack>
  );
}