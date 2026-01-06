import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Title, Text, Grid, Stack, Group, Badge, Image, Card, Loader, Alert,
  TextInput, Button, Paper
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { getPublicCoaches } from "../../api/profiles";
import { getPublicUser } from "../../api/auth";

export default function CoachesListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [gym, setGym] = useState("");

  const [dq] = useDebouncedValue(q, 350);
  const [dcity] = useDebouncedValue(city, 350);
  const [dgym] = useDebouncedValue(gym, 350);

  async function load(params = {}) {
    setLoading(true);
    setErr(null);
    try {
      const res = await getPublicCoaches(params);
      const list = res?.data || [];
      const withNames = await Promise.all(
        list.map(async (c) => {
          const uid = Number(c?.user_id || c?.coach_user_id || c?.id);
          if (uid) {
            try {
              const u = await getPublicUser(uid);
              return { ...c, first_name: u.first_name, last_name: u.last_name };
            } catch {
              return c;
            }
          }
          return c;
        })
      );
      setItems(withNames);
    } catch (e) {
      setErr(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  const apiParams = useMemo(() => {
    const p = {};
    if (dq) p.q = dq;
    if (dcity) p.city = dcity;
    if (dgym) p.gym = dgym;
    return p;
  }, [dq, dcity, dgym]);

  useEffect(() => {
    load(apiParams);
  }, [JSON.stringify(apiParams)]);

  function clearAll() {
    setQ("");
    setCity("");
    setGym("");
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="end">
        <Title order={2}>Coaches</Title>
      </Group>

      <Paper withBorder p="md" radius="lg">
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <TextInput label="Search" placeholder="Name, bio, specialization…" value={q} onChange={(e) => setQ(e.currentTarget.value)} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 3 }}>
            <TextInput label="City" placeholder="Vilnius" value={city} onChange={(e) => setCity(e.currentTarget.value)} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <TextInput label="Gym" placeholder="Gym name or address" value={gym} onChange={(e) => setGym(e.currentTarget.value)} />
          </Grid.Col>

          <Grid.Col span={12}>
            <Group justify="flex-end">
              <Button variant="light" onClick={clearAll}>Clear</Button>
            </Group>
          </Grid.Col>
        </Grid>
      </Paper>

      {loading ? (
        <Group justify="center"><Loader /></Group>
      ) : err ? (
        <Alert color="red">{err}</Alert>
      ) : (
        <Grid gutter="lg">
          {items.map((c) => {
            const name = [c.first_name, c.last_name].filter(Boolean).join(" ").trim() || "Coach";
            const specs = Array.isArray(c.specializations) ? c.specializations : [];
            return (
              <Grid.Col key={c.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                <Card withBorder radius="lg" component={Link} to={`/coaches/${c.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ height: 160, overflow: "hidden", borderRadius: 12, background: "#fff" }}>
                    {c.avatar_path ? (
                      <Image src={c.avatar_path} alt="" height={160} fit="contain" />
                    ) : (
                      <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
                        <Text>no photo</Text>
                      </div>
                    )}
                  </div>
                  <Stack gap={6} mt="sm">
                    <Text fw={700}>{name}</Text>
                    <Group gap={6} wrap="wrap">
                      {c.city && <Badge variant="outline">{c.city}</Badge>}
                      {c.gym_name && <Badge variant="outline">{c.gym_name}</Badge>}
                    </Group>
                    <Group gap={6} wrap="wrap">
                      {specs.slice(0, 3).map((s, i) => (
                        <Badge key={i} variant="light">{s}</Badge>
                      ))}
                    </Group>
                  </Stack>
                </Card>
              </Grid.Col>
            );
          })}
          {!items.length && (
            <Grid.Col span={12}>
              <Text c="dimmed" ta="center">No coaches found.</Text>
            </Grid.Col>
          )}
        </Grid>
      )}
    </Stack>
  );
}