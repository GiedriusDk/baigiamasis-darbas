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
  Pagination,
  Button,
} from "@mantine/core";
import { IconEye, IconPencil } from "@tabler/icons-react";

import {
  adminListOrders,
  adminUpdateOrder,
  adminListProducts,
} from "../../../api/payments";
import { adminListUsers } from "../../../api/auth";

import AdminOrderViewModal from "./AdminOrderViewModal";
import AdminOrderEditModal from "./AdminOrderEditModal";

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

const PAGE_SIZE = 15;

export default function AdminOrdersSection() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewOrder, setViewOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  const [usersById, setUsersById] = useState({});
  const [productsById, setProductsById] = useState({});

  const [page, setPage] = useState(1);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [ordersRes, usersRes, productsRes] = await Promise.all([
        adminListOrders(),
        adminListUsers(),
        adminListProducts(),
      ]);

      const ordersData = ordersRes?.data ?? ordersRes ?? [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);

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
      setErr(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  function applyUpdatedOrder(updated) {
    if (!updated) return;
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const paginatedOrders = orders.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

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

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Orders</Title>
        <Text c="dimmed" size="sm" mt={4}>
          View and manage user orders and their payment status.
        </Text>
      </div>

      {err && <Alert color="red">{err}</Alert>}

      {loading && (
        <Group justify="center" my="lg">
          <Loader />
        </Group>
      )}

      {!loading && !err && orders.length === 0 && (
        <Alert color="yellow">No orders yet.</Alert>
      )}

      {!loading && !err && orders.length > 0 && (
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
                <Table.Th>Product</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Paid at</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th style={{ width: 220 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedOrders.map((o) => (
                <Table.Tr key={o.id}>
                  <Table.Td>{o.id}</Table.Td>
                  <Table.Td>{renderUserCell(o.user_id)}</Table.Td>
                  <Table.Td>{renderProductCell(o.product_id)}</Table.Td>
                  <Table.Td>
                    {o.amount} {o.currency}
                  </Table.Td>
                  <Table.Td>
                    <Badge size="sm" variant="light">
                      {o.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatDate(o.paid_at)}</Table.Td>
                  <Table.Td>{formatDate(o.created_at)}</Table.Td>
                  <Table.Td>
                    <Group gap={6} justify="flex-start">
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconEye size={14} />}
                        onClick={() => setViewOrder(o)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        leftSection={<IconPencil size={14} />}
                        onClick={() => setEditingOrder(o)}
                      >
                        Edit
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

      <AdminOrderViewModal
        opened={!!viewOrder}
        onClose={() => setViewOrder(null)}
        order={viewOrder}
      />

      <AdminOrderEditModal
        opened={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        order={editingOrder}
        onUpdated={applyUpdatedOrder}
        onSaveApi={adminUpdateOrder}
      />
    </Stack>
  );
}