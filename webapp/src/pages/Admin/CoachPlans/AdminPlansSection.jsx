import { useEffect, useState, useMemo } from "react";
import {
  Title,
  Text,
  Table,
  Loader,
  Alert,
  Group,
  Stack,
  Button,
  Pagination,
} from "@mantine/core";
import { IconEye, IconPencil, IconTrash } from "@tabler/icons-react";

import { adminListPlans, adminDeletePlan } from "../../../api/plans";
import { adminListProducts } from "../../../api/payments";
import { adminListUsers } from "../../../api/auth";

import AdminPlanViewModal from "./AdminPlanViewModal";
import AdminPlanEditModal from "./AdminPlanEditModal";

const PAGE_SIZE = 15;

export default function AdminPlansSection() {
  const [plans, setPlans] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [productsById, setProductsById] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewPlanId, setViewPlanId] = useState(null);
  const [editPlan, setEditPlan] = useState(null);

  const [page, setPage] = useState(1);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [plansRes, usersRes, productsRes] = await Promise.all([
        adminListPlans(),
        adminListUsers(),
        adminListProducts(),
      ]);

      const data = plansRes?.data ?? plansRes ?? [];
      setPlans(Array.isArray(data) ? data : []);

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

      const productsRaw = Array.isArray(productsRes?.data)
        ? productsRes.data
        : Array.isArray(productsRes)
        ? productsRes
        : [];
      const productsMap = {};
      productsRaw.forEach((p) => {
        if (!p || p.id == null) return;
        productsMap[p.id] = p;
      });
      setProductsById(productsMap);

      setPage(1);
    } catch (e) {
      setErr(e.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }

  function applyUpdatedPlan(updated) {
    if (!updated) return;
    setPlans((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
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

  function renderCoachCell(coachId) {
    if (!coachId) return "—";

    const u = usersById[coachId];
    if (!u) {
      return (
        <div>
          <Text size="sm" fw={500}>
            Coach #{coachId}
          </Text>
          <Text size="xs" c="dimmed">
            ID: {coachId}
          </Text>
        </div>
      );
    }

    const fullName =
      `${u.first_name || ""} ${u.last_name || ""}`.trim() ||
      u.email ||
      `Coach #${u.id}`;

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

  function renderProductCell(productId) {
    if (!productId) return "—";

    const p = productsById[productId];
    if (!p) {
      return (
        <div>
          <Text size="sm" fw={500}>
            Product #{productId}
          </Text>
          <Text size="xs" c="dimmed">
            ID: {productId}
          </Text>
        </div>
      );
    }

    return (
      <div>
        <Text size="sm" fw={500}>
          {p.title || `Product #${p.id}`}
        </Text>
        <Text size="xs" c="dimmed">
          ID: {p.id}
        </Text>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(plans.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);

  const paginatedPlans = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return plans.slice(start, start + PAGE_SIZE);
  }, [plans, pageSafe]);

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Plans</Title>
        <Text c="dimmed" size="sm" mt={4}>
          View and manage coach training plans.
        </Text>
      </div>

      {err && <Alert color="red">{err}</Alert>}

      {loading && (
        <Group justify="center" my="lg">
          <Loader />
        </Group>
      )}

      {!loading && !err && plans.length === 0 && (
        <Alert color="yellow">No plans found.</Alert>
      )}

      {!loading && !err && plans.length > 0 && (
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
                <Table.Th>Product</Table.Th>
                <Table.Th>Coach</Table.Th>
                <Table.Th>Created at</Table.Th>
                <Table.Th style={{ width: 260 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedPlans.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>{p.id}</Table.Td>
                  <Table.Td>{renderProductCell(p.product_id)}</Table.Td>
                  <Table.Td>{renderCoachCell(p.coach_id)}</Table.Td>
                  <Table.Td>
                    {p.created_at
                      ? new Date(p.created_at).toLocaleString()
                      : "—"}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={6} justify="flex-start">
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconEye size={14} />}
                        onClick={() => setViewPlanId(p.id)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        leftSection={<IconPencil size={14} />}
                        onClick={() => setEditPlan(p)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="xs"
                        color="red"
                        variant="subtle"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleDelete(p)}
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
                value={pageSafe}
                onChange={setPage}
                size="sm"
                radius="xl"
              />
            </Group>
          )}
        </>
      )}

      <AdminPlanViewModal
        opened={!!viewPlanId}
        onClose={() => setViewPlanId(null)}
        planId={viewPlanId}
      />

      <AdminPlanEditModal
        opened={!!editPlan}
        onClose={() => setEditPlan(null)}
        plan={editPlan}
        onUpdated={applyUpdatedPlan}
      />
    </Stack>
  );
}