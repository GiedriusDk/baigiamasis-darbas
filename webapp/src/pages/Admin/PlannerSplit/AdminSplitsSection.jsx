// src/pages/Admin/PlannerSplit/AdminSplitsSection.jsx
import { useEffect, useState } from "react";
import {
  Title,
  Text,
  Table,
  Group,
  ActionIcon,
  Loader,
  Alert,
  Badge,
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
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await adminListSplits();
        if (!cancelled) {
          setSplits(res.data || res || []);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load splits");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
    <>
      <Title order={3} mb="xs">
        Planner splits
      </Title>
      <Text c="dimmed" mb="md" size="sm">
        View user workout splits with days and slots.
      </Text>

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

      {!loading && !err && !hasData && (
        <Text c="dimmed" size="sm">
          No splits found.
        </Text>
      )}

      {!loading && !err && hasData && (
        <Table
          highlightOnHover
          withTableBorder
          withColumnBorders
          mt="sm"
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>User ID</Table.Th>
              <Table.Th>Title</Table.Th>
              <Table.Th>Days</Table.Th>
              <Table.Th>Created</Table.Th>
              <Table.Th style={{ width: 140 }}>Actions</Table.Th>
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
                    ? new Date(s.created_at).toLocaleDateString()
                    : "—"}
                </Table.Td>
                <Table.Td>
                  <Group gap={4} justify="flex-start">
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => setViewSplit(s)}
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      onClick={() => setEditSplit(s)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon
                      size="sm"
                      variant="subtle"
                      color="red"
                      onClick={() => handleDelete(s)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
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
    </>
  );
}