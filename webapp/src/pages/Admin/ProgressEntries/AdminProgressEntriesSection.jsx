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
  adminListProgressEntries,
  adminDeleteProgressEntry,
} from "../../../api/progress";

import AdminProgressEntryViewModal from "./AdminProgressEntryViewModal";
import AdminProgressEntryEditModal from "./AdminProgressEntryEditModal";

export default function AdminProgressEntriesSection() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewEntryId, setViewEntryId] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminListProgressEntries();

      let list = [];
      if (Array.isArray(res)) list = res;
      else if (Array.isArray(res?.data)) list = res.data;
      else if (Array.isArray(res?.data?.data)) list = res.data.data;

      setEntries(list);
    } catch (e) {
      setErr(e.message || "Failed to load progress entries");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openView(entry) {
    setViewEntryId(entry.id);
    setViewOpen(true);
  }

  function closeView() {
    setViewOpen(false);
    setViewEntryId(null);
  }

  function openEdit(entry) {
    setEditingEntry(entry);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditingEntry(null);
  }

  function applyUpdatedEntry(updated) {
    setEntries((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
  }

  async function handleDelete(entry) {
    const ok = window.confirm(
      `Are you sure you want to delete progress entry #${entry.id}?`
    );
    if (!ok) return;

    try {
      await adminDeleteProgressEntry(entry.id);
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } catch (e) {
      alert(e.message || "Failed to delete entry");
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
                <Table.Th>Metric ID</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th>Source</Table.Th>
                <Table.Th>Recorded at</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th style={{ width: 200 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {(Array.isArray(entries) ? entries : []).map((e) => (
                <Table.Tr key={e.id}>
                  <Table.Td>{e.id}</Table.Td>
                  <Table.Td>{e.user_id}</Table.Td>
                  <Table.Td>{e.metric_id}</Table.Td>
                  <Table.Td>
                    {e.value != null ? (
                      <Badge size="sm" variant="light">
                        {e.value}
                      </Badge>
                    ) : e.value_json ? (
                      <Text fz="xs" c="dimmed">
                        JSON
                      </Text>
                    ) : (
                      "—"
                    )}
                  </Table.Td>
                  <Table.Td>{e.source || "—"}</Table.Td>
                  <Table.Td>
                    {e.recorded_at
                      ? new Date(e.recorded_at).toLocaleString()
                      : e.date || "—"}
                  </Table.Td>
                  <Table.Td>
                    {e.created_at
                      ? new Date(e.created_at).toLocaleString()
                      : "—"}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => openView(e)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => openEdit(e)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(e)}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}

              {!entries.length && (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Text c="dimmed" ta="center">
                      No progress entries yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* View modal */}
      <AdminProgressEntryViewModal
        opened={viewOpen}
        onClose={closeView}
        entryId={viewEntryId}
      />

      {/* Edit modal */}
      <AdminProgressEntryEditModal
        opened={editOpen}
        onClose={closeEdit}
        entry={editingEntry}
        onUpdated={applyUpdatedEntry}
      />
    </>
  );
}