// src/pages/Admin/CoachPlans/AdminPlansSection.jsx
import { useEffect, useState } from "react";
import {
  Text,
  Table,
  Loader,
  Alert,
  Group,
  Paper,
  Button,
} from "@mantine/core";

import {
  adminListPlans,
  adminDeletePlan,
} from "../../../api/plans";
import AdminPlanViewModal from "./AdminPlanViewModal";
import AdminPlanEditModal from "./AdminPlanEditModal";

export default function AdminPlansSection() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewId, setViewId] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminListPlans();
      // tikimės { data: [...] }
      setPlans(res.data || res || []);
    } catch (e) {
      setErr(e.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openView(plan) {
    setViewId(plan.id);
    setViewOpen(true);
  }

  function closeView() {
    setViewOpen(false);
    setViewId(null);
  }

  function openEdit(plan) {
    setEditingPlan(plan);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditingPlan(null);
  }

  function applyUpdatedPlan(updated) {
    setPlans((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
  }

  async function handleDelete(plan) {
    const ok = window.confirm(
      `Are you sure you want to delete plan #${plan.id}?`
    );
    if (!ok) return;

    try {
      await adminDeletePlan(plan.id);
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
    } catch (e) {
      alert(e.message || "Failed to delete plan");
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
                <Table.Th>Product ID</Table.Th>
                <Table.Th>Coach ID</Table.Th>
                <Table.Th>Created at</Table.Th>
                <Table.Th style={{ width: 190 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {plans.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>{p.id}</Table.Td>
                  <Table.Td>{p.product_id}</Table.Td>
                  <Table.Td>{p.coach_id}</Table.Td>
                  <Table.Td>
                    {p.created_at
                      ? new Date(p.created_at).toLocaleString()
                      : "—"}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => openView(p)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => openEdit(p)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        color="red"
                        onClick={() => handleDelete(p)}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}

              {!plans.length && (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text c="dimmed" ta="center">
                      No plans found.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <AdminPlanViewModal
        opened={viewOpen}
        onClose={closeView}
        planId={viewId}
      />

      <AdminPlanEditModal
        opened={editOpen}
        onClose={closeEdit}
        plan={editingPlan}
        onUpdated={applyUpdatedPlan}
      />
    </>
  );
}