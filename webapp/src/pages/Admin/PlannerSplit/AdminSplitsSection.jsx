import { useEffect, useState } from "react";
import {
  Title,
  Text,
  Table,
  Group,
  Loader,
  Alert,
  Badge,
  Stack,
  Button,
} from "@mantine/core";
import { IconEye, IconPencil, IconTrash } from "@tabler/icons-react";

import {
  adminListSplits,
  adminUpdateSplit,
  adminDeleteSplit,
} from "../../../api/planner";

import AdminSplitViewModal from "./AdminSplitViewModal";
import AdminSplitEditModal from "./AdminSplitEditModal";

export default function AdminSplitsSection() {
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewSplit, setViewSplit] = useState(null);
  const [editSplit, setEditSplit] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminListSplits();
      const data = res?.data ?? res ?? [];
      setSplits(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load splits");
    } finally {
      setLoading(false);
    }
  }

  function handleUpdated(updated) {
    if (!updated) return;
    setSplits((items) =>
      items.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
    );
  }

  async function handleDelete(split) {
    if (!split) return;
    if (!window.confirm(`Delete split #${split.id}?`)) return;

    try {
      await adminDeleteSplit(split.id);
      setSplits((items) => items.filter((s) => s.id !== split.id));
    } catch (e) {
      alert(e.message || "Failed to delete split");
    }
  }

  const hasData = (splits || []).length > 0;

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Planner splits</Title>
        <Text c="dimmed" size="sm" mt={4}>
          View user workout splits with days and slots.
        </Text>
      </div>

      {loading && (
        <Group justify="center" my="lg">
          <Loader />
        </Group>
      )}

      {err && <Alert color="red">{err}</Alert>}

      {!loading && !err && !hasData && (
        <Alert color="yellow">No splits found.</Alert>
      )}

      {!loading && !err && hasData && (
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
              <Table.Th>Title</Table.Th>
              <Table.Th>Days</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th style={{ width: 220 }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {splits.map((s) => (
              <Table.Tr key={s.id}>
                <Table.Td>{s.id}</Table.Td>
                <Table.Td>{s.user_id}</Table.Td>
                <Table.Td>
                  {s.title ? s.title : <Text c="dimmed">Untitled</Text>}
                </Table.Td>
                <Table.Td>
                  <Badge size="sm" variant="light">
                    {(s.days || []).length}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {s.created_at
                    ? new Date(s.created_at).toLocaleString()
                    : "—"}
                </Table.Td>
                <Table.Td>
                  <Group gap={6} justify="flex-start">
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEye size={14} />}
                      onClick={() => setViewSplit(s)}
                    >
                      View
                    </Button>
                    <Button
                      size="xs"
                      variant="subtle"
                      leftSection={<IconPencil size={14} />}
                      onClick={() => setEditSplit(s)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => handleDelete(s)}
                    >
                      Delete
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <AdminSplitViewModal
        opened={!!viewSplit}
        onClose={() => setViewSplit(null)}
        split={viewSplit}
      />

      <AdminSplitEditModal
        opened={!!editSplit}
        onClose={() => setEditSplit(null)}
        split={editSplit}
        onUpdated={handleUpdated}
        onSaveApi={adminUpdateSplit}
      />
    </Stack>
  );
}