// webapp/src/pages/Admin/Payments/AdminOrdersSection.jsx
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

import { adminListOrders, adminUpdateOrder } from "../../../api/payments";
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

export default function AdminOrdersSection() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminListOrders();
      setOrders(res.data || []);
    } catch (e) {
      setErr(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openView(order) {
    setViewOrder(order);
    setViewOpen(true);
  }

  function closeView() {
    setViewOrder(null);
    setViewOpen(false);
  }

  function openEdit(order) {
    setEditingOrder(order);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditingOrder(null);
    setEditOpen(false);
  }

  function applyUpdatedOrder(updated) {
    setOrders((prev) =>
      prev.map((o) => (o.id === updated.id ? updated : o))
    );
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
                <Table.Th>User ID</Table.Th>
                <Table.Th>Product ID</Table.Th>
                <Table.Th>Amount</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Paid at</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th style={{ width: 180 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {orders.map((o) => (
                <Table.Tr key={o.id}>
                  <Table.Td>{o.id}</Table.Td>
                  <Table.Td>{o.user_id}</Table.Td>
                  <Table.Td>{o.product_id}</Table.Td>
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
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => openView(o)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        onClick={() => openEdit(o)}
                      >
                        Edit
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}

              {!orders.length && (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Text c="dimmed" ta="center">
                      No orders yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <AdminOrderViewModal
        opened={viewOpen}
        onClose={closeView}
        order={viewOrder}
      />

      <AdminOrderEditModal
        opened={editOpen}
        onClose={closeEdit}
        order={editingOrder}
        onUpdated={applyUpdatedOrder}
        onSaveApi={adminUpdateOrder}
      />
    </>
  );
}