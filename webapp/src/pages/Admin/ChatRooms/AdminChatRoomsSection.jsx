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
import {
  adminListChatRooms,
  adminDeleteChatRoom,
  adminUpdateChatRoom,
} from "../../../api/chat";
import AdminChatRoomViewModal from "./AdminChatRoomViewModal";
import AdminChatRoomEditModal from "./AdminChatRoomEditModal";

export default function AdminChatRoomsSection() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewRoom, setViewRoom] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminListChatRooms();
      setRooms(res.data || []);
    } catch (e) {
      setErr(e.message || "Failed to load chat rooms");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openView(room) {
    setViewRoom(room);
    setViewOpen(true);
  }

  function closeView() {
    setViewOpen(false);
    setViewRoom(null);
  }

  function openEdit(room) {
    setEditingRoom(room);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditingRoom(null);
  }

  function applyUpdated(room) {
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? room : r))
    );
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
                <Table.Th>Coach ID</Table.Th>
                <Table.Th>User ID</Table.Th>
                <Table.Th>Plan ID</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Title</Table.Th>
                <Table.Th>Created at</Table.Th>
                <Table.Th style={{ width: 190 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rooms.map((r) => (
                <Table.Tr key={r.id}>
                  <Table.Td>{r.id}</Table.Td>
                  <Table.Td>{r.coach_id ?? "—"}</Table.Td>
                  <Table.Td>{r.user_id ?? "—"}</Table.Td>
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
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => openView(r)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => openEdit(r)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(r)}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}

              {!rooms.length && (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Text c="dimmed" ta="center">
                      No chat rooms found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <AdminChatRoomViewModal
        opened={viewOpen}
        onClose={closeView}
        room={viewRoom}
      />

      <AdminChatRoomEditModal
        opened={editOpen}
        onClose={closeEdit}
        room={editingRoom}
        onUpdated={applyUpdated}
        onSaveApi={adminUpdateChatRoom}
      />
    </>
  );
}