import { useEffect, useState } from "react";
import {
  Title,
  Text,
  Table,
  Group,
  Button,
  Alert,
  Loader,
  Badge,
} from "@mantine/core";
import {
  adminListWorkouts,
  adminUpdateWorkout,
  adminDeleteWorkout,
} from "../../../api/planner";
import AdminWorkoutViewModal from "./AdminWorkoutViewModal";
import AdminWorkoutEditModal from "./AdminWorkoutEditModal";
import { IconEye, IconPencil, IconTrash } from "@tabler/icons-react";

export default function AdminWorkoutsSection() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewWorkout, setViewWorkout] = useState(null);
  const [editWorkout, setEditWorkout] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminListWorkouts();
      const data = res?.data ?? res ?? [];
      setWorkouts(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Failed to load workouts");
    } finally {
      setLoading(false);
    }
  }

  function handleUpdated(updated) {
    if (!updated) return;
    setWorkouts((prev) =>
      prev.map((w) => (w.id === updated.id ? updated : w))
    );
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this workout?")) {
      return;
    }
    try {
      await adminDeleteWorkout(id);
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
    } catch (e) {
      alert(e.message || "Failed to delete workout");
    }
  }

  return (
    <div>
      <Title order={3} mb="xs">
        Planner workouts
      </Title>
      <Text c="dimmed" size="sm" mb="md">
        View user-generated workouts with their exercises.
      </Text>

      {err && (
        <Alert color="red" mb="md">
          {err}
        </Alert>
      )}

      {loading && (
        <Group justify="center" my="lg">
          <Loader />
        </Group>
      )}

      {!loading && !err && workouts.length === 0 && (
        <Text c="dimmed" size="sm">
          No workouts found.
        </Text>
      )}

      {!loading && !err && workouts.length > 0 && (
        <Table striped highlightOnHover withRowBorders={false} mt="sm">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Plan ID</Table.Th>
              <Table.Th>Day index</Table.Th>
              <Table.Th>Name</Table.Th>
              <Table.Th>Exercises</Table.Th>
              <Table.Th>Created at</Table.Th>
              <Table.Th style={{ width: 160 }}>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {workouts.map((w) => (
              <Table.Tr key={w.id}>
                <Table.Td>{w.id}</Table.Td>
                <Table.Td>{w.plan_id}</Table.Td>
                <Table.Td>{w.day_index}</Table.Td>
                <Table.Td>{w.name || <Text c="dimmed">—</Text>}</Table.Td>
                <Table.Td>
                  <Badge variant="light" size="sm">
                    {(w.exercises || []).length}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {w.created_at
                    ? new Date(w.created_at).toLocaleString()
                    : "—"}
                </Table.Td>
                <Table.Td>
                  <Group gap={6} justify="flex-start">
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconEye size={14} />}
                      onClick={() => setViewWorkout(w)}
                    >
                      View
                    </Button>
                    <Button
                      size="xs"
                      variant="subtle"
                      leftSection={<IconPencil size={14} />}
                      onClick={() => setEditWorkout(w)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="xs"
                      color="red"
                      variant="subtle"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => handleDelete(w.id)}
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

      <AdminWorkoutViewModal
        opened={!!viewWorkout}
        onClose={() => setViewWorkout(null)}
        workout={viewWorkout}
      />

      <AdminWorkoutEditModal
        opened={!!editWorkout}
        onClose={() => setEditWorkout(null)}
        workout={editWorkout}
        onUpdated={handleUpdated}
        onSaveApi={adminUpdateWorkout}
      />
    </div>
  );
}