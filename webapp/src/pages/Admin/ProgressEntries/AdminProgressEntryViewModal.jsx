import { useEffect, useState } from "react";
import { Modal, Loader, Alert, Text, Group, Stack, Code } from "@mantine/core";
import { adminGetProgressEntry } from "../../../api/progress";

export default function AdminProgressEntryViewModal({
  opened,
  onClose,
  entryId,
}) {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!opened || !entryId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await adminGetProgressEntry(entryId);
        if (!cancelled) {
          setEntry(res.data || res || null);
        }
      } catch (e) {
        if (!cancelled) setErr(e.message || "Failed to load entry");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [opened, entryId]);

  function handleClose() {
    setEntry(null);
    setErr(null);
    onClose?.();
  }

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={entry ? `Progress entry #${entry.id}` : "Progress entry"}
      centered
      size="lg"
    >
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

      {!loading && !err && entry && (
        <Stack gap="xs">
          <Group gap="md">
            <Text size="sm">
              <strong>ID:</strong> {entry.id}
            </Text>
            <Text size="sm">
              <strong>User ID:</strong> {entry.user_id}
            </Text>
            <Text size="sm">
              <strong>Metric ID:</strong> {entry.metric_id}
            </Text>
          </Group>

          <Text size="sm">
            <strong>Value:</strong>{" "}
            {entry.value != null ? entry.value : "—"}
          </Text>

          {entry.value_json && (
            <div>
              <Text size="sm" fw={500}>
                Value JSON:
              </Text>
              <Code block fz="xs">
                {JSON.stringify(entry.value_json, null, 2)}
              </Code>
            </div>
          )}

          <Text size="sm">
            <strong>Source:</strong> {entry.source || "—"}
          </Text>

          <Text size="sm">
            <strong>Recorded at:</strong>{" "}
            {entry.recorded_at
              ? new Date(entry.recorded_at).toLocaleString()
              : entry.date || "—"}
          </Text>

          <Text size="sm" c="dimmed">
            Created:{" "}
            {entry.created_at
              ? new Date(entry.created_at).toLocaleString()
              : "—"}
          </Text>

          <Text size="sm" c="dimmed">
            Updated:{" "}
            {entry.updated_at
              ? new Date(entry.updated_at).toLocaleString()
              : "—"}
          </Text>

          <Text size="sm">
            <strong>Note:</strong>{" "}
            {entry.note ? entry.note : <span>—</span>}
          </Text>
        </Stack>
      )}
    </Modal>
  );
}