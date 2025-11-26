// src/pages/Admin/ChatMessages/AdminChatMessageEditModal.jsx
import { useEffect, useState } from "react";
import {
  Modal,
  TextInput,
  Checkbox,
  Group,
  Button,
  Alert,
} from "@mantine/core";

export default function AdminChatMessageEditModal({
  opened,
  onClose,
  message,
  onUpdated,
  onSaveApi,
}) {
  const [form, setForm] = useState({
    message: "",
    attachment_url: "",
    is_read: false,
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!message) return;
    setForm({
      message: message.message || "",
      attachment_url: message.attachment_url || "",
      is_read: !!message.is_read,
    });
    setErr(null);
  }, [message]);

  function resetAndClose() {
    setErr(null);
    setSaving(false);
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message) return;

    setSaving(true);
    setErr(null);

    try {
      const payload = {
        message: form.message || null,
        attachment_url: form.attachment_url || null,
        is_read: !!form.is_read,
      };

      const res = await onSaveApi(message.id, payload);
      const updated = res.data || res;

      onUpdated?.(updated);
      resetAndClose();
    } catch (e) {
      setErr(e.message || "Failed to save message");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={resetAndClose}
      title={message ? `Edit message #${message.id}` : "Edit message"}
      centered
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <TextInput
          label="Message"
          value={form.message}
          onChange={(e) =>
            setForm((f) => ({ ...f, message: e.currentTarget.value }))
          }
          mb="sm"
        />

        <TextInput
          label="Attachment URL"
          value={form.attachment_url}
          onChange={(e) =>
            setForm((f) => ({ ...f, attachment_url: e.currentTarget.value }))
          }
          mb="sm"
        />

        <Checkbox
          label="Is read"
          checked={form.is_read}
          onChange={(e) =>
            setForm((f) => ({ ...f, is_read: e.currentTarget.checked }))
          }
          mb="sm"
        />

        {err && (
          <Alert color="red" mb="sm">
            {err}
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save
          </Button>
        </Group>
      </form>
    </Modal>
  );
}