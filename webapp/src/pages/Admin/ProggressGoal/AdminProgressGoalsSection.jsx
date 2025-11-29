import { useEffect, useState } from "react";
import {
  Title,
  Text,
  Table,
  Loader,
  Alert,
  Group,
  Badge,
  Stack,
  Button,
  Pagination,
} from "@mantine/core";
import { IconEye, IconPencil, IconTrash } from "@tabler/icons-react";

import {
  adminListProgressGoals,
  adminDeleteProgressGoal,
} from "../../../api/progress";
import { adminListUsers } from "../../../api/auth";

import AdminProgressGoalViewModal from "./AdminProgressGoalViewModal";
import AdminProgressGoalEditModal from "./AdminProgressGoalEditModal";

const PAGE_SIZE = 15;

export default function AdminProgressGoalsSection() {
  const [goals, setGoals] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewGoal, setViewGoal] = useState(null);
  const [editingGoal, setEditingGoal] = useState(null);

  const [page, setPage] = useState(1);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [goalsRes, usersRes] = await Promise.all([
        adminListProgressGoals(),
        adminListUsers(),
      ]);

      let list = [];
      if (Array.isArray(goalsRes)) {
        list = goalsRes;
      } else if (Array.isArray(goalsRes?.data)) {
        list = goalsRes.data;
      } else if (Array.isArray(goalsRes?.data?.data)) {
        list = goalsRes.data.data;
      }
      setGoals(list);

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

      setPage(1);
    } catch (e) {
      setErr(e.message || "Failed to load progress goals");
    } finally {
      setLoading(false);
    }
  }

  function applyUpdatedGoal(updated) {
    if (!updated) return;
    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  }

  async function handleDelete(goal) {
    const ok = window.confirm(`Delete progress goal #${goal.id}?`);
    if (!ok) return;

    try {
      await adminDeleteProgressGoal(goal.id);
      setGoals((prev) => prev.filter((g) => g.id !== goal.id));
    } catch (e) {
      alert(e.message || "Failed to delete");
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

  const totalPages = Math.max(1, Math.ceil(goals.length / PAGE_SIZE));
  const paginatedGoals = goals.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Progress goals</Title>
        <Text c="dimmed" size="sm" mt={4}>
          View and manage user progress goals.
        </Text>
      </div>

      {err && <Alert color="red">{err}</Alert>}

      {loading && (
        <Group justify="center" my="lg">
          <Loader />
        </Group>
      )}

      {!loading && !err && goals.length === 0 && (
        <Alert color="yellow">No progress goals.</Alert>
      )}

      {!loading && !err && goals.length > 0 && (
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
                <Table.Th>Type</Table.Th>
                <Table.Th>Target</Table.Th>
                <Table.Th>Deadline</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th style={{ width: 260 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {paginatedGoals.map((goal) => (
                <Table.Tr key={goal.id}>
                  <Table.Td>{goal.id}</Table.Td>
                  <Table.Td>{renderUserCell(goal.user_id)}</Table.Td>
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
                      <Badge
                        size="sm"
                        color={goal.is_active ? "green" : "gray"}
                        variant="light"
                      >
                        {goal.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge
                        size="sm"
                        color={goal.is_completed ? "blue" : "gray"}
                        variant="light"
                      >
                        {goal.is_completed ? "Done" : "Pending"}
                      </Badge>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6} justify="flex-start">
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconEye size={14} />}
                        onClick={() => setViewGoal(goal)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        leftSection={<IconPencil size={14} />}
                        onClick={() => setEditingGoal(goal)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="subtle"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleDelete(goal)}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
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

      <AdminProgressGoalViewModal
        opened={!!viewGoal}
        onClose={() => setViewGoal(null)}
        goal={viewGoal}
      />

      <AdminProgressGoalEditModal
        opened={!!editingGoal}
        onClose={() => setEditingGoal(null)}
        goal={editingGoal}
        onUpdated={applyUpdatedGoal}
      />
    </Stack>
  );
}