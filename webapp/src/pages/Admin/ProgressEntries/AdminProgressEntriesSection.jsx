import { useEffect, useState } from "react";
import {
  Title,
  Text,
  Table,
  Loader,
  Alert,
  Group,
  Stack,
  Button,
  Pagination,
} from "@mantine/core";
import { IconEye, IconPencil, IconTrash } from "@tabler/icons-react";

import {
  adminListProgressEntries,
  adminDeleteProgressEntry,
  adminListProgressMetrics,
} from "../../../api/progress";
import { adminListUsers } from "../../../api/auth";

import AdminProgressEntryViewModal from "./AdminProgressEntryViewModal";
import AdminProgressEntryEditModal from "./AdminProgressEntryEditModal";

const PAGE_SIZE = 15;

export default function AdminProgressEntriesSection() {
  const [entries, setEntries] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [metricsById, setMetricsById] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewEntryId, setViewEntryId] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [entriesRes, usersRes, metricsRes] = await Promise.all([
        adminListProgressEntries(),
        adminListUsers(),
        adminListProgressMetrics(),
      ]);

      let list = [];
      if (Array.isArray(entriesRes)) list = entriesRes;
      else if (Array.isArray(entriesRes?.data)) list = entriesRes.data;
      else if (Array.isArray(entriesRes?.data?.data))
        list = entriesRes.data.data;
      setEntries(list);

      const usersRaw = Array.isArray(usersRes?.data)
        ? usersRes.data
        : Array.isArray(usersRes)
        ? usersRes
        : [];
      const usersMap = {};
      usersRaw.forEach((u) => {
        if (!u || u.id == null) return;
        usersMap[u.id] = u;
      });
      setUsersById(usersMap);

      const metricsRaw = Array.isArray(metricsRes?.data)
        ? metricsRes.data
        : Array.isArray(metricsRes)
        ? metricsRes
        : [];
      const metricsMap = {};
      metricsRaw.forEach((m) => {
        if (!m || m.id == null) return;
        metricsMap[m.id] = m;
      });
      setMetricsById(metricsMap);

      setPage(1);
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

  function renderUserCell(userId) {
    if (!userId) return "—";

    const u = usersById[userId];
    if (!u) {
      return (
        <div>
          <Text size="sm" fw={500}>
            User #{userId}
          </Text>
          <Text size="xs" c="dimmed">
            ID: {userId}
          </Text>
        </div>
      );
    }

    const fullName =
      `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
      u.email ||
      `User #${u.id}`;

    return (
      <div>
        <Text size="sm" fw={500}>
          {fullName}
        </Text>
        <Text size="xs" c="dimmed">
          ID: {u.id}
          {u.email ? ` • ${u.email}` : ""}
        </Text>
      </div>
    );
  }

  function renderMetricCell(metricId) {
    if (!metricId) return "—";

    const m = metricsById[metricId];
    if (!m) {
      return (
        <div>
          <Text size="sm" fw={500}>
            Metric #{metricId}
          </Text>
          <Text size="xs" c="dimmed">
            ID: {metricId}
          </Text>
        </div>
      );
    }

    const title = m.name || m.slug || `Metric #${m.id}`;

    return (
      <div>
        <Text size="sm" fw={500}>
          {title}
        </Text>
        <Text size="xs" c="dimmed">
          ID: {m.id}
          {m.slug ? ` • ${m.slug}` : ""}
        </Text>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const paginatedEntries = entries.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Progress entries</Title>
        <Text c="dimmed" size="sm" mt={4}>
          View and manage user progress entries.
        </Text>
      </div>

      {err && <Alert color="red">{err}</Alert>}

      {loading && (
        <Group justify="center" my="lg">
          <Loader />
        </Group>
      )}

      {!loading && !err && entries.length === 0 && (
        <Alert color="yellow">No progress entries yet.</Alert>
      )}

      {!loading && !err && entries.length > 0 && (
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
                <Table.Th>User</Table.Th>
                <Table.Th>Metric</Table.Th>
                <Table.Th>Value</Table.Th>
                <Table.Th>Source</Table.Th>
                <Table.Th>Recorded at</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th style={{ width: 260 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {paginatedEntries.map((e) => {
                const unit = metricsById[e.metric_id]?.unit || "";

                return (
                  <Table.Tr key={e.id}>
                    <Table.Td>{e.id}</Table.Td>
                    <Table.Td>{renderUserCell(e.user_id)}</Table.Td>
                    <Table.Td>{renderMetricCell(e.metric_id)}</Table.Td>
                    <Table.Td>
                      {e.value != null ? (
                        <Text size="sm" fw={500}>
                          {e.value}
                          {unit && (
                            <Text
                              component="span"
                              size="sm"
                              fw={400}
                              c="dimmed"
                              ml={6}
                            >
                              {unit}
                            </Text>
                          )}
                        </Text>
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
                      <Group gap={6} justify="flex-start">
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconEye size={14} />}
                          onClick={() => openView(e)}
                        >
                          View
                        </Button>
                        <Button
                          size="xs"
                          variant="subtle"
                          leftSection={<IconPencil size={14} />}
                          onClick={() => openEdit(e)}
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
                );
              })}
            </Table.Tbody>
          </Table>

          {totalPages > 1 && (
            <Group justify="flex-end" mt="md">
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
                size="sm"
                radius="xl"
              />
            </Group>
          )}
        </>
      )}

      <AdminProgressEntryViewModal
        opened={viewOpen}
        onClose={closeView}
        entryId={viewEntryId}
      />

      <AdminProgressEntryEditModal
        opened={editOpen}
        onClose={closeEdit}
        entry={editingEntry}
        onUpdated={applyUpdatedEntry}
      />
    </Stack>
  );
}