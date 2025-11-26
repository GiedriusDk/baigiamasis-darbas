import { useEffect, useState } from "react";
import {
  Modal,
  TextInput,
  NumberInput,
  Group,
  Button,
  Alert,
} from "@mantine/core";

export default function AdminChatRoomEditModal({
  opened,
  onClose,
  room,
  onUpdated,
  onSaveApi, // adminUpdateChatRoom
}) {
  const [form, setForm] = useState({
    type: "",
    title: "",
    slug: "",
    plan_id: null,
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!room) return;
    setForm({
      type: room.type || "",
      title: room.title || "",
      slug: room.slug || "",
      plan_id: room.plan_id ?? null,
    });
    setErr(null);
  }, [room]);

  function resetAndClose() {
    setErr(null);
    setSaving(false);
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!room) return;

    setSaving(true);
    setErr(null);

    try {
      const payload = {
        type: form.type || null,
        title: form.title || null,
        slug: form.slug || null,
        plan_id:
          form.plan_id === null || form.plan_id === ""
            ? null
            : Number(form.plan_id),
      };

      const res = await onSaveApi(room.id, payload);
      const updated = res.data || res;

      onUpdated?.(updated);
      resetAndClose();
    } catch (e) {
      setErr(e.message || "Failed to save chat room");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={resetAndClose}
      title={room ? `Edit chat room #${room.id}` : "Edit chat room"}
      centered
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Group grow mb="sm">
          <TextInput
            label="Type"
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({ ...f, type: e.currentTarget.value }))
            }
          />
          <NumberInput
            label="Plan ID"
            value={form.plan_id}
            onChange={(value) =>
              setForm((f) => ({ ...f, plan_id: value }))
            }
            min={0}
          />
        </Group>

        <TextInput
          label="Title"
          value={form.title}
          onChange={(e) =>
            setForm((f) => ({ ...f, title: e.currentTarget.value }))
          }
          mb="sm"
        />

        <TextInput
          label="Slug"
          value={form.slug}
          onChange={(e) =>
            setForm((f) => ({ ...f, slug: e.currentTarget.value }))
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