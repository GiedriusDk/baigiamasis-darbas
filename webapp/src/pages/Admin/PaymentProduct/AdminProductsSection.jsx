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
  adminListProducts,
  adminDeleteProduct,
} from "../../../api/payments";
import { adminListUsers } from "../../../api/auth";

import AdminProductViewModal from "./AdminProductViewModal";
import AdminProductEditModal from "./AdminProductEditModal";

const PAGE_SIZE = 15;

export default function AdminProductsSection() {
  const [products, setProducts] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewProduct, setViewProduct] = useState(null);
  const [editProduct, setEditProduct] = useState(null);

  const [page, setPage] = useState(1);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [productsRes, usersRes] = await Promise.all([
        adminListProducts(),
        adminListUsers(),
      ]);

      const rows = productsRes?.data ?? productsRes ?? [];
      setProducts(Array.isArray(rows) ? rows : []);

      const usersRaw = Array.isArray(usersRes?.data)
        ? usersRes.data
        : Array.isArray(usersRes)
        ? usersRes
        : [];
      const map = {};
      usersRaw.forEach((u) => {
        if (!u || u.id == null) return;
        map[u.id] = u;
      });
      setUsersById(map);

      setPage(1);
    } catch (e) {
      setErr(e.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  function applyUpdatedProduct(updated) {
    if (!updated) return;
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  async function handleDelete(p) {
    const ok = window.confirm(
      `Are you sure you want to delete product #${p.id}?`
    );
    if (!ok) return;

    try {
      await adminDeleteProduct(p.id);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
    } catch (e) {
      alert(e.message || "Failed to delete product");
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

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const paginatedProducts = products.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <Stack gap="md">
      <div>
        <Title order={3}>Products</Title>
        <Text c="dimmed" size="sm" mt={4}>
          View and manage coach products and their pricing.
        </Text>
      </div>

      {err && <Alert color="red">{err}</Alert>}

      {loading && (
        <Group justify="center" my="lg">
          <Loader />
        </Group>
      )}

      {!loading && !err && products.length === 0 && (
        <Alert color="yellow">No products yet.</Alert>
      )}

      {!loading && !err && products.length > 0 && (
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
                <Table.Th>Coach</Table.Th>
                <Table.Th>Title</Table.Th>
                <Table.Th>Price</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Active</Table.Th>
                <Table.Th>Created at</Table.Th>
                <Table.Th style={{ width: 260 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedProducts.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>{p.id}</Table.Td>
                  <Table.Td>{renderCoachCell(p.coach_id)}</Table.Td>
                  <Table.Td>
                    <Text fw={500}>{p.title || "—"}</Text>
                    {p.slug && (
                      <Text c="dimmed" fz="xs">
                        
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {p.price != null ? (
                        (() => {
                        const valueInEur = Number(p.price) / 100;
                        const formatted = valueInEur.toFixed(2);

                        return (
                            <>
                            {formatted}{" "}
                            <Text span c="dimmed" fz="xs">
                                {p.currency || "EUR"}
                            </Text>
                            </>
                        );
                        })()
                    ) : (
                        "—"
                    )}
                    </Table.Td>
                  <Table.Td>{p.type || "—"}</Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      color={p.is_active ? "green" : "red"}
                      variant="light"
                    >
                      {p.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Table.Td>
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
                        onClick={() => setViewProduct(p)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="subtle"
                        leftSection={<IconPencil size={14} />}
                        onClick={() => setEditProduct(p)}
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
                value={page}
                onChange={setPage}
                size="sm"
                radius="xl"
              />
            </Group>
          )}
        </>
      )}

      <AdminProductViewModal
        opened={!!viewProduct}
        onClose={() => setViewProduct(null)}
        product={viewProduct}
      />

      <AdminProductEditModal
        opened={!!editProduct}
        onClose={() => setEditProduct(null)}
        product={editProduct}
        onUpdated={applyUpdatedProduct}
      />
    </Stack>
  );
}