// src/pages/Admin/AdminCoachesSection.jsx
import { useEffect, useState } from "react";
import { Title, Button, Badge } from "@mantine/core";
import {
  adminListCoaches,
  adminDeleteCoach,
} from "../../api/admin";
import AdminTable from "../../components/admin/AdminTable";

export default function AdminCoachesSection() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await adminListCoaches();
      setCoaches(res.data || []);
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <Title order={3} mb="md">
        Treneriai
      </Title>

      <AdminTable
        loading={loading}
        data={coaches}
        page={1}
        setPage={() => {}}
        total={1}
        columns={[
          { key: "id", label: "ID" },
          { key: "user_id", label: "User ID" },
          { key: "title", label: "Pavadinimas" },
          { key: "city", label: "Miestas" },
          {
            key: "is_public",
            label: "Statusas",
            render: (row) =>
              row.is_public ? (
                <Badge color="green">Public</Badge>
              ) : (
                <Badge color="gray">Hidden</Badge>
              ),
          },
          {
            key: "actions",
            label: "Veiksmai",
            render: (row) => (
              <Button
                color="red"
                variant="subtle"
                size="xs"
                onClick={async () => {
                  if (confirm("Ištrinti trenerį?")) {
                    await adminDeleteCoach(row.id);
                    load();
                  }
                }}
              >
                Delete
              </Button>
            ),
          },
        ]}
      />
    </>
  );
}