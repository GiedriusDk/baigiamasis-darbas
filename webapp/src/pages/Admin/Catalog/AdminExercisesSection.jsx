import { useState, useEffect } from "react";
import {
  Table,
  Title,
  Alert,
  Button,
  Group,
  Loader,
  TextInput,
  Stack,
  Pagination,
} from "@mantine/core";
import {
  adminListExercises,
  adminUpdateExercise,
  adminDeleteExercise,
} from "../../../api/catalog";

import { IconPencil, IconTrash, IconSearch } from "@tabler/icons-react";
import AdminExerciseEditModal from "./AdminExerciseEditModal";
import AdminExerciseViewModal from "./AdminExerciseViewModal";

export default function AdminExercisesSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({
    total: 0,
    per_page: 50,
    current_page: 1,
    last_page: 1,
  });

  async function load(opts = {}) {
    const nextPage = opts.page ?? page;
    const q = opts.q ?? search;

    setLoading(true);
    setErr(null);

    try {
      const r = await adminListExercises({
        page: nextPage,
        perPage: 50,
        q,
      });

      setItems(r.data || []);
      if (r.meta) {
        setMeta(r.meta);
      } else {
        setMeta((m) => ({
          ...m,
          current_page: nextPage,
        }));
      }
      setPage(nextPage);
    } catch (e) {
      setErr(e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(id) {
    if (!window.confirm("Are you sure?")) return;

    try {
      await adminDeleteExercise(id);
      await load({ page });
    } catch (e) {
      alert(e.message);
    }
  }

  async function handleSaved(payload) {
    if (!editItem) return;

    await adminUpdateExercise(editItem.id, payload);
    setEditItem(null);
    await load({ page });
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    load({ page: 1, q: search });
  }

  return (
    <Stack>
      <Title order={3}>Exercises</Title>

      <form onSubmit={handleSearchSubmit}>
        <TextInput
          placeholder="Search by name..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </form>

      {err && <Alert color="red">{err}</Alert>}
      {loading && <Loader />}

      {!loading && items.length === 0 && !err && (
        <Alert color="yellow">No exercises found.</Alert>
      )}

      {!loading && items.length > 0 && (
        <>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Primary Muscle</Table.Th>
                <Table.Th>Equipment</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>

            <Table.Tbody>
              {items.map((x) => (
                <Table.Tr key={x.id}>
                  <Table.Td>{x.id}</Table.Td>
                  <Table.Td>{x.name}</Table.Td>
                  <Table.Td>{x.primary_muscle}</Table.Td>
                  <Table.Td>{x.equipment}</Table.Td>

                  <Table.Td>
                    <Group gap="xs" justify="flex-end">
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => setViewItem(x)}
                        leftSection={<IconPencil size={14} />}
                      >
                        View
                      </Button>

                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => setEditItem(x)}
                      >
                        Edit
                      </Button>

                      <Button
                        size="xs"
                        color="red"
                        variant="light"
                        onClick={() => handleDelete(x.id)}
                        leftSection={<IconTrash size={14} />}
                      >
                        Delete
                      </Button>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Group justify="center" mt="md">
            <Pagination
              total={meta.last_page || 1}
              value={page}
              onChange={(p) => load({ page: p })}
            />
          </Group>
        </>
      )}

      <AdminExerciseViewModal
        opened={!!viewItem}
        onClose={() => setViewItem(null)}
        exercise={viewItem}
      />

      <AdminExerciseEditModal
        opened={!!editItem}
        onClose={() => setEditItem(null)}
        exercise={editItem}
        onSave={handleSaved}
      />
    </Stack>
  );
}