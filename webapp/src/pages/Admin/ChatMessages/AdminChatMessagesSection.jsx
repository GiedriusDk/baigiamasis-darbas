// src/pages/Admin/ChatMessages/AdminChatMessagesSection.jsx
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
  adminListChatMessages,
  adminUpdateChatMessage,
  adminDeleteChatMessage,
} from "../../../api/chat"

import AdminChatMessageViewModal from "./AdminChatMessageViewModal";
import AdminChatMessageEditModal from "./AdminChatMessageEditModal";

function preview(text, max = 80) {
  if (!text) return "—";
  const t = String(text);
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export default function AdminChatMessagesSection() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewMessage, setViewMessage] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminListChatMessages();
      setMessages(res.data || []);
    } catch (e) {
      setErr(e.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openView(m) {
    setViewMessage(m);
    setViewOpen(true);
  }

  function closeView() {
    setViewOpen(false);
    setViewMessage(null);
  }

  function openEdit(m) {
    setEditingMessage(m);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditingMessage(null);
  }

  function applyUpdatedMessage(updated) {
    setMessages((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );
  }

  function formatMessagePreview(m) {
  if (m.message && m.message.trim().length > 0) {
    const max = 80;
    return m.message.length > max ? m.message.slice(0, max) + "…" : m.message;
  }

  if (m.attachment_url) {
    const url = m.attachment_url.toLowerCase();
    if (url.endsWith(".jpg") || url.endsWith(".jpeg") || url.endsWith(".png") || url.endsWith(".gif") || url.endsWith(".webp")) {
      return "[picture]";
    }
    if (url.endsWith(".mp4") || url.endsWith(".mov") || url.endsWith(".avi")) {
      return "[video]";
    }
    return "[file]";
  }
  return "—";
}

  async function handleDelete(m) {
    const ok = window.confirm(`Are you sure you want to delete message #${m.id}?`);
    if (!ok) return;

    try {
      await adminDeleteChatMessage(m.id);
      setMessages((prev) => prev.filter((x) => x.id !== m.id));
    } catch (e) {
      alert(e.message || "Failed to delete message");
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
                <Table.Th>Room</Table.Th>
                <Table.Th>Sender</Table.Th>
                <Table.Th>Message</Table.Th>
                <Table.Th>Read</Table.Th>
                <Table.Th>Created at</Table.Th>
                <Table.Th style={{ width: 190 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {messages.map((m) => (
                <Table.Tr key={m.id}>
                  <Table.Td>{m.id}</Table.Td>
                  <Table.Td>{m.room_id}</Table.Td>
                  <Table.Td>{m.sender_id}</Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatMessagePreview(m)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" color={m.is_read ? "green" : "gray"}>
                      {m.is_read ? "Read" : "Unread"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {m.created_at
                      ? new Date(m.created_at).toLocaleString()
                      : "—"}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => openView(m)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => openEdit(m)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(m)}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}

              {!messages.length && (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text c="dimmed" ta="center">
                      No messages found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <AdminChatMessageViewModal
        opened={viewOpen}
        onClose={closeView}
        message={viewMessage}
      />

      <AdminChatMessageEditModal
        opened={editOpen}
        onClose={closeEdit}
        message={editingMessage}
        onUpdated={applyUpdatedMessage}
        onSaveApi={adminUpdateChatMessage}
      />
    </>
  );
}