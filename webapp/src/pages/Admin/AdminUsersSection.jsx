// src/pages/Admin/AdminUsersSection.jsx
import { useEffect, useState } from "react";
import {
  Text,
  Table,
  Loader,
  Alert,
  Badge,
  Group,
  Paper,
  Button,
  Modal,
  TextInput,
  MultiSelect,
} from "@mantine/core";
import {
  adminListUsers,
  adminUpdateUser,
  adminDeleteUser,
} from "../../api/auth";

const ALL_ROLES = [
  { value: "user", label: "User" },
  { value: "coach", label: "Coach" },
  { value: "admin", label: "Admin" },
];

export default function AdminUsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    roles: [],
  });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminListUsers();
      setUsers(res.data || []);
    } catch (e) {
      setErr(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openEdit(user) {
    setEditingUser(user);
    setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      roles: user.roles || [],
    });
    setFormErr(null);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditingUser(null);
    setFormErr(null);
  }

  async function handleSave() {
    if (!editingUser) return;
    setSaving(true);
    setFormErr(null);
    try {
      const payload = {
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        email: form.email,
        roles: form.roles,
      };
      const res = await adminUpdateUser(editingUser.id, payload);
      const updated = res.data || res;

      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? updated : u))
      );
      closeEdit();
    } catch (e) {
      setFormErr(e.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user) {
    const ok = window.confirm(
      `Ar tikrai nori ištrinti vartotoją "${user.email}" (ID: ${user.id})?`
    );
    if (!ok) return;

    try {
      await adminDeleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (e) {
      alert(e.message || "Nepavyko ištrinti vartotojo");
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
                <Table.Th>Vardas</Table.Th>
                <Table.Th>El. paštas</Table.Th>
                <Table.Th>Rolės</Table.Th>
                <Table.Th>Sukurta</Table.Th>
                <Table.Th style={{ width: 150 }}>Veiksmai</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((u) => (
                <Table.Tr key={u.id}>
                  <Table.Td>{u.id}</Table.Td>
                  <Table.Td>
                    {u.first_name || u.last_name
                      ? `${u.first_name || ""} ${
                          u.last_name || ""
                        }`.trim()
                      : "—"}
                  </Table.Td>
                  <Table.Td>{u.email}</Table.Td>
                  <Table.Td>
                    <Group gap={4} wrap="wrap">
                      {(u.roles || []).map((r) => (
                        <Badge
                          key={r}
                          variant={r === "admin" ? "filled" : "light"}
                          color={r === "admin" ? "red" : "blue"}
                          size="sm"
                        >
                          {r}
                        </Badge>
                      ))}
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {u.created_at
                      ? new Date(u.created_at).toLocaleString()
                      : "—"}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => openEdit(u)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(u)}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}

              {!users.length && (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text c="dimmed" ta="center">
                      Kol kas nėra vartotojų.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Modal
        opened={editOpen}
        onClose={closeEdit}
        title={
          editingUser
            ? `Redaguoti vartotoją #${editingUser.id}`
            : "Redaguoti vartotoją"
        }
        centered
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
        >
          <TextInput
            label="Vardas"
            value={form.first_name}
            onChange={(e) =>
              setForm((f) => ({ ...f, first_name: e.currentTarget.value }))
            }
            mb="sm"
          />
          <TextInput
            label="Pavardė"
            value={form.last_name}
            onChange={(e) =>
              setForm((f) => ({ ...f, last_name: e.currentTarget.value }))
            }
            mb="sm"
          />
          <TextInput
            label="El. paštas"
            required
            value={form.email}
            onChange={(e) =>
              setForm((f) => ({ ...f, email: e.currentTarget.value }))
            }
            mb="sm"
          />
          <MultiSelect
            label="Rolės"
            data={ALL_ROLES}
            value={form.roles}
            onChange={(value) =>
              setForm((f) => ({ ...f, roles: value }))
            }
            mb="sm"
          />

          {formErr && (
            <Alert color="red" mb="sm">
              {formErr}
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={closeEdit}>
              Atšaukti
            </Button>
            <Button type="submit" loading={saving}>
              Išsaugoti
            </Button>
          </Group>
        </form>
      </Modal>
    </>
  );
}