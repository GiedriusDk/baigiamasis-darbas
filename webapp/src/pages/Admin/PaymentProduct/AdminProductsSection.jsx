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
  adminListProducts,
  adminDeleteProduct,
} from "../../../api/payments";

import AdminProductViewModal from "./AdminProductViewModal";
import AdminProductEditModal from "./AdminProductEditModal";

export default function AdminProductsSection() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewOpen, setViewOpen] = useState(false);
  const [viewProduct, setViewProduct] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await adminListProducts();
      const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setProducts(rows);
    } catch (e) {
      setErr(e.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openView(p) {
    setViewProduct(p);
    setViewOpen(true);
  }

  function closeView() {
    setViewOpen(false);
    setViewProduct(null);
  }

  function openEdit(p) {
    setEditProduct(p);
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditProduct(null);
  }

  function applyUpdatedProduct(updated) {
    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
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
                <Table.Th>Coach ID</Table.Th>
                <Table.Th>Title</Table.Th>
                <Table.Th>Price</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Active</Table.Th>
                <Table.Th>Created at</Table.Th>
                <Table.Th style={{ width: 190 }}>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {products.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>{p.id}</Table.Td>
                  <Table.Td>{p.coach_id}</Table.Td>
                  <Table.Td>
                    <Text fw={500}>{p.title || "—"}</Text>
                    {p.slug && (
                      <Text c="dimmed" fz="xs">
                        {p.slug}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {p.price != null ? (
                      <>
                        {p.price}{" "}
                        <Text span c="dimmed" fz="xs">
                          {p.currency || "EUR"}
                        </Text>
                      </>
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

              {!products.length && (
                <Table.Tr>
                  <Table.Td colSpan={8}>
                    <Text c="dimmed" ta="center">
                      No products yet.
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <AdminProductViewModal
        opened={viewOpen}
        onClose={closeView}
        product={viewProduct}
      />

      <AdminProductEditModal
        opened={editOpen}
        onClose={closeEdit}
        product={editProduct}
        onUpdated={applyUpdatedProduct}
      />
    </>
  );
}