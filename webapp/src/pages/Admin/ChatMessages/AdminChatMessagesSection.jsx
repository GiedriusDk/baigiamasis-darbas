import { useEffect, useState, useMemo } from "react";
import {
  Title,
  Text,
  Table,
  Group,
  Button,
  Alert,
  Loader,
  Stack,
  Pagination,
} from "@mantine/core";
import {
  adminListChatMessages,
  adminUpdateChatMessage,
  adminDeleteChatMessage,
} from "../../../api/chat";
import { adminListUsers } from "../../../api/auth";
import AdminChatMessageViewModal from "./AdminChatMessageViewModal";
import AdminChatMessageEditModal from "./AdminChatMessageEditModal";
import { IconEye, IconPencil, IconTrash } from "@tabler/icons-react";

const PAGE_SIZE = 20;

function formatMessagePreview(m) {
  if (m.message && m.message.trim().length > 0) {
    const max = 80;
    return m.message.length > max ? m.message.slice(0, max) + "…" : m.message;
  }

  if (m.attachment_url) {
    const url = m.attachment_url.toLowerCase();
    if (
      url.endsWith(".jpg") ||
      url.endsWith(".jpeg") ||
      url.endsWith(".png") ||
      url.endsWith(".gif") ||
      url.endsWith(".webp")
    ) {
      return "[picture]";
    }
    if (url.endsWith(".mp4") || url.endsWith(".mov") || url.endsWith(".avi")) {
      return "[video]";
    }
    return "[file]";
  }

  return "—";
}

export default function AdminChatMessagesSection() {
  const [messages, setMessages] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewMessage, setViewMessage] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);

  const [page, setPage] = useState(1);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [msgRes, usersRes] = await Promise.all([
        adminListChatMessages(),
        adminListUsers().catch(() => null),
      ]);

      const data = msgRes?.data ?? msgRes ?? [];
      setMessages(Array.isArray(data) ? data : []);

      if (usersRes) {
        const uData = usersRes?.data ?? usersRes ?? [];
        const map = {};
        (Array.isArray(uData) ? uData : []).forEach((u) => {
          if (u?.id != null) map[u.id] = u;
        });
        setUsersById(map);
      }

      setPage(1);
    } catch (e) {
      setErr(e.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

  function applyUpdatedMessage(updated) {
    if (!updated) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );
  }

  async function handleDelete(m) {
    const ok = window.confirm(
      `Are you sure you want to delete message #${m.id}?`
    );
    if (!ok) return;

    try {
      await adminDeleteChatMessage(m.id);
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
    } catch (e) {
      alert(e.message || "Failed to delete message");
    }
  }

  function renderSenderCell(senderId) {
    if (!senderId) {
      return (
        <Text c="dimmed" fz="sm">
          —
        </Text>
      );
    }

    const u = usersById[senderId];

    if (!u) {
      return (
        <Text fw={500}>
          User #{senderId}
        </Text>
      );
    }

    const fullName =
      [u.first_name, u.last_name].filter(Boolean).join(" ") ||
      u.email ||
      `User #${u.id}`;

    return (
      <>
        <Text fw={500}>{fullName}</Text>
        <Text c="dimmed" fz="xs">
          ID: {u.id}
          {u.email ? ` • ${u.email}` : ""}
        </Text>
      </>
    );
  }

  const totalPages = Math.max(1, Math.ceil(messages.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);

  const paginatedMessages = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return messages.slice(start, start + PAGE_SIZE);
  }, [messages, pageSafe]);

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Chat messages</Title>
        <Text c="dimmed" size="sm" mt={4}>
          View and manage messages sent in chat rooms.
        </Text>
      </div>

      {err && <Alert color="red">{err}</Alert>}

      {loading && (
        <Group justify="center" my="lg">
          <Loader />
        </Group>
      )}

      {!loading && !err && messages.length === 0 && (
        <Alert color="yellow">No messages found.</Alert>
      )}

      {!loading && !err && messages.length > 0 && (
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
                <Table.Th>Room</Table.Th>
                <Table.Th>Sender</Table.Th>
                <Table.Th>Message</Table.Th>
                <Table.Th>Created at</Table.Th>
                <Table.Th style={{ width: 300 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedMessages.map((m) => (
                <Table.Tr key={m.id}>
                  <Table.Td>{m.id}</Table.Td>
                  <Table.Td>{m.room_id}</Table.Td>
                  <Table.Td>{renderSenderCell(m.sender_id)}</Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatMessagePreview(m)}</Text>
                  </Table.Td>
                  <Table.Td>
                    {m.created_at
                      ? new Date(m.created_at).toLocaleString()
                      : "—"}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6} justify="flex-start">
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconEye size={14} />}
                        onClick={() => setViewMessage(m)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        leftSection={<IconPencil size={14} />}
                        onClick={() => setEditingMessage(m)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="subtle"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleDelete(m)}
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

      <AdminChatMessageViewModal
        opened={!!viewMessage}
        onClose={() => setViewMessage(null)}
        message={viewMessage}
      />

      <AdminChatMessageEditModal
        opened={!!editingMessage}
        onClose={() => setEditingMessage(null)}
        message={editingMessage}
        onUpdated={applyUpdatedMessage}
        onSaveApi={adminUpdateChatMessage}
      />
    </Stack>
  );
}