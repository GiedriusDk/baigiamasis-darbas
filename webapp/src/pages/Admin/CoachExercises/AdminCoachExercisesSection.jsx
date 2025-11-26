// src/pages/Admin/CoachExercises/AdminCoachExercisesSection.jsx
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
  adminListCoachExercises,
  adminDeleteCoachExercise,
} from "../../../api/profiles";

import AdminCoachExerciseEditModal from "./AdminCoachExerciseEditModal";
import AdminCoachExerciseViewModal from "./AdminCoachExerciseViewModal";

export default function AdminCoachExercisesSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminListCoachExercises();
      setItems(res.data || []);
    } catch (e) {
      setErr(e.message || "Failed to load exercises");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openView(item) {
    setViewItem(item);
    setViewOpen(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setEditOpen(true);
  }

  function closeView() {
    setViewItem(null);
    setViewOpen(false);
  }

  function closeEdit() {
    setEditItem(null);
    setEditOpen(false);
  }

  function applyUpdated(updated) {
    setItems((prev) =>
      prev.map((x) => (x.id === updated.id ? updated : x))
    );
  }

  async function handleDelete(item) {
    const ok = window.confirm(`Ištrinti pratimą "${item.title}"?`);
    if (!ok) return;

    try {
      await adminDeleteCoachExercise(item.id);
      setItems((p) => p.filter((x) => x.id !== item.id));
    } catch (e) {
      alert(e.message || "Nepavyko ištrinti");
    }
  }

  return (
    <>
      <Paper withBorder radius="lg" p="md" mt="lg">
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
                <Table.Th>Coach ID</Table.Th>
                <Table.Th>Title</Table.Th>
                <Table.Th>Muscle</Table.Th>
                <Table.Th>Difficulty</Table.Th>
                <Table.Th>Created at</Table.Th>
                <Table.Th style={{ width: 180 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {items.map((e) => (
                <Table.Tr key={e.id}>
                  <Table.Td>{e.id}</Table.Td>
                  <Table.Td>{e.user_id || "—"}</Table.Td>
                  <Table.Td>{e.title}</Table.Td>
                  <Table.Td>{e.primary_muscle || "—"}</Table.Td>
                  <Table.Td>
                    {e.difficulty ? (
                      <Badge size="sm" variant="light">{e.difficulty}</Badge>
                    ) : "—"}
                  </Table.Td>
                  <Table.Td>
                    {e.created_at
                      ? new Date(e.created_at).toLocaleString()
                      : "—"}
                  </Table.Td>

                  <Table.Td>
                    <Group gap="xs">
                      <Button size="xs" variant="subtle" onClick={() => openView(e)}>
                        View
                      </Button>
                      <Button size="xs" variant="subtle" onClick={() => openEdit(e)}>
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

              {!items.length && (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text c="dimmed" ta="center">Nėra pratimų.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <AdminCoachExerciseViewModal
        opened={viewOpen}
        onClose={closeView}
        item={viewItem}
      />

      <AdminCoachExerciseEditModal
        opened={editOpen}
        onClose={closeEdit}
        item={editItem}
        onUpdated={applyUpdated}
      />
    </>
  );
}