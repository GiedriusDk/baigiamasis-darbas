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
  adminListProgressGoals,
  adminDeleteProgressGoal,
} from "../../../api/progress";

import AdminProgressGoalViewModal from "./AdminProgressGoalViewModal";
import AdminProgressGoalEditModal from "./AdminProgressGoalEditModal";

export default function AdminProgressGoalsSection() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewGoal, setViewGoal] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

    async function load() {
    setLoading(true);
    setErr(null);
    try {
        const res = await adminListProgressGoals();

        // Normalizuojam rezultatą į MASYVĄ
        let list = [];

        if (Array.isArray(res)) {
        list = res;
        } else if (Array.isArray(res?.data)) {
        list = res.data;
        } else if (Array.isArray(res?.data?.data)) {
        // jeigu būtų res.data.data (pvz. paginatorius)
        list = res.data.data;
        }

        setGoals(list);
    } catch (e) {
        setErr(e.message || "Failed to load progress goals");
    } finally {
        setLoading(false);
    }
    }

  useEffect(() => {
    load();
  }, []);

  function openView(goal) {
    setViewGoal(goal);
    setViewOpen(true);
  }

  function closeView() {
    setViewOpen(false);
    setViewGoal(null);
  }

  function openEdit(goal) {
    setEditingGoal(goal);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditingGoal(null);
  }

  function applyUpdatedGoal(updated) {
    setGoals(prev =>
      prev.map(g => (g.id === updated.id ? updated : g))
    );
  }

  async function handleDelete(goal) {
    const ok = window.confirm(`Delete progress goal #${goal.id}?`);
    if (!ok) return;

    try {
      await adminDeleteProgressGoal(goal.id);
      setGoals(prev => prev.filter(g => g.id !== goal.id));
    } catch (e) {
      alert(e.message || "Failed to delete");
    }
  }

  return (
    <>
      <Paper withBorder p="md" radius="lg" mt="lg">
        {loading && (
          <Group justify="center" my="lg"><Loader /></Group>
        )}

        {err && <Alert color="red">{err}</Alert>}

        {!loading && !err && (
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>User</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Target</Table.Th>
                <Table.Th>Deadline</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th style={{ width: 180 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {goals.map(goal => (
                <Table.Tr key={goal.id}>
                  <Table.Td>{goal.id}</Table.Td>
                  <Table.Td>{goal.user_id}</Table.Td>
                  <Table.Td>{goal.goal_type || "—"}</Table.Td>
                  <Table.Td>
                    {goal.target_value ?? "—"} {goal.unit || ""}
                  </Table.Td>
                  <Table.Td>
                    {goal.deadline_date
                      ? new Date(goal.deadline_date).toLocaleDateString()
                      : "—"}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <Badge color={goal.is_active ? "green" : "gray"}>
                        {goal.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge color={goal.is_completed ? "blue" : "gray"}>
                        {goal.is_completed ? "Done" : "Pending"}
                      </Badge>
                    </Group>
                  </Table.Td>

                  <Table.Td>
                    <Group gap="xs">
                      <Button size="xs" variant="subtle" onClick={() => openView(goal)}>
                        View
                      </Button>

                      <Button size="xs" variant="subtle" onClick={() => openEdit(goal)}>
                        Edit
                      </Button>

                      <Button size="xs" variant="subtle" color="red" onClick={() => handleDelete(goal)}>
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}

              {!goals.length && (
                <Table.Tr>
                  <Table.Td colSpan={7}>
                    <Text c="dimmed" ta="center">No progress goals.</Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* View modal */}
      <AdminProgressGoalViewModal opened={viewOpen} onClose={closeView} goal={viewGoal} />

      {/* Edit modal */}
      <AdminProgressGoalEditModal
        opened={editOpen}
        onClose={closeEdit}
        goal={editingGoal}
        onUpdated={applyUpdatedGoal}
      />
    </>
  );
}