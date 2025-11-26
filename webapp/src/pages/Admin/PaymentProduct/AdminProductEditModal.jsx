import { useEffect, useState } from "react";
import {
  Modal,
  TextInput,
  NumberInput,
  Textarea,
  Group,
  Button,
  Alert,
  Switch,
  Stack,
} from "@mantine/core";
import { adminUpdateProduct } from "../../../api/payments";

export default function AdminProductEditModal({
  opened,
  onClose,
  product,
  onUpdated,
}) {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    price: null,
    currency: "EUR",
    type: "",
    duration_weeks: null,
    sessions_per_week: null,
    access_days: null,
    level: "",
    includes_chat: true,
    includes_calls: false,
    gym_name: "",
    gym_address: "",
    thumbnail_url: "",
    is_active: true,
    description: "",
  });

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!product) return;
    setForm({
      title: product.title || "",
      slug: product.slug || "",
      price: product.price ?? null,
      currency: product.currency || "EUR",
      type: product.type || "",
      duration_weeks: product.duration_weeks ?? null,
      sessions_per_week: product.sessions_per_week ?? null,
      access_days: product.access_days ?? null,
      level: product.level || "",
      includes_chat: !!product.includes_chat,
      includes_calls: !!product.includes_calls,
      gym_name: product.gym_name || "",
      gym_address: product.gym_address || "",
      thumbnail_url: product.thumbnail_url || "",
      is_active: !!product.is_active,
      description: product.description || "",
    });
    setErr(null);
  }, [product]);

  function resetAndClose() {
    setSaving(false);
    setErr(null);
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!product) return;

    setSaving(true);
    setErr(null);

    try {
      const payload = {
        title: form.title || null,
        slug: form.slug || null,
        price:
          form.price === null || form.price === ""
            ? null
            : Number(form.price),
        currency: form.currency || "EUR",
        type: form.type || null,
        duration_weeks:
          form.duration_weeks === null || form.duration_weeks === ""
            ? null
            : Number(form.duration_weeks),
        sessions_per_week:
          form.sessions_per_week === null || form.sessions_per_week === ""
            ? null
            : Number(form.sessions_per_week),
        access_days:
          form.access_days === null || form.access_days === ""
            ? null
            : Number(form.access_days),
        level: form.level || null,
        includes_chat: !!form.includes_chat,
        includes_calls: !!form.includes_calls,
        gym_name: form.gym_name || null,
        gym_address: form.gym_address || null,
        thumbnail_url: form.thumbnail_url || null,
        is_active: !!form.is_active,
        description: form.description || null,
      };

      const res = await adminUpdateProduct(product.id, payload);
      const updated = res.data || res;

      onUpdated?.(updated);
      resetAndClose();
    } catch (e) {
      setErr(e.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={resetAndClose}
      title={product ? `Edit product #${product.id}` : "Edit product"}
      centered
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Group grow>
            <TextInput
              label="Title"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.currentTarget.value }))
              }
            />
            <TextInput
              label="Slug"
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({ ...f, slug: e.currentTarget.value }))
              }
            />
          </Group>

          <Group grow>
            <NumberInput
              label="Price"
              value={form.price}
              onChange={(value) =>
                setForm((f) => ({ ...f, price: value }))
              }
              min={0}
            />
            <TextInput
              label="Currency"
              value={form.currency}
              onChange={(e) =>
                setForm((f) => ({ ...f, currency: e.currentTarget.value }))
              }
            />
            <TextInput
              label="Type"
              value={form.type}
              onChange={(e) =>
                setForm((f) => ({ ...f, type: e.currentTarget.value }))
              }
            />
          </Group>

          <Group grow>
            <NumberInput
              label="Duration (weeks)"
              value={form.duration_weeks}
              onChange={(value) =>
                setForm((f) => ({ ...f, duration_weeks: value }))
              }
              min={0}
            />
            <NumberInput
              label="Sessions / week"
              value={form.sessions_per_week}
              onChange={(value) =>
                setForm((f) => ({ ...f, sessions_per_week: value }))
              }
              min={0}
            />
            <NumberInput
              label="Access days"
              value={form.access_days}
              onChange={(value) =>
                setForm((f) => ({ ...f, access_days: value }))
              }
              min={0}
            />
          </Group>

          <Group grow>
            <TextInput
              label="Level"
              value={form.level}
              onChange={(e) =>
                setForm((f) => ({ ...f, level: e.currentTarget.value }))
              }
            />
            <TextInput
              label="Gym name"
              value={form.gym_name}
              onChange={(e) =>
                setForm((f) => ({ ...f, gym_name: e.currentTarget.value }))
              }
            />
            <TextInput
              label="Gym address"
              value={form.gym_address}
              onChange={(e) =>
                setForm((f) => ({ ...f, gym_address: e.currentTarget.value }))
              }
            />
          </Group>

          <TextInput
            label="Thumbnail URL"
            value={form.thumbnail_url}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                thumbnail_url: e.currentTarget.value,
              }))
            }
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.currentTarget.value }))
            }
            minRows={3}
          />

          <Group>
            <Switch
              label="Includes chat"
              checked={form.includes_chat}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  includes_chat: e.currentTarget.checked,
                }))
              }
            />
            <Switch
              label="Includes calls"
              checked={form.includes_calls}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  includes_calls: e.currentTarget.checked,
                }))
              }
            />
            <Switch
              label="Active"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  is_active: e.currentTarget.checked,
                }))
              }
            />
          </Group>

          {err && (
            <Alert color="red">
              {err}
            </Alert>
          )}

          <Group justify="flex-end" mt="sm">
            <Button variant="subtle" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}