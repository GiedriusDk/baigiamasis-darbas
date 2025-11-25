import { useEffect, useMemo, useState } from "react";
import {
  Title,
  Text,
  Grid,
  Stack,
  Group,
  Badge,
  Image,
  Card,
  Loader,
  Alert,
  TextInput,
  Button,
  Paper,
  Modal,
  Avatar,
  Divider,
} from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { getCoachClients, getCoachClientProfile } from "../api/chat";

function computeAge(birthDateStr) {
  if (!birthDateStr) return null;
  const d = new Date(birthDateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

export default function CoachClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [q, setQ] = useState("");
  const [city, setCity] = useState("");

  const [dq] = useDebouncedValue(q, 350);
  const [dcity] = useDebouncedValue(city, 350);

  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const res = await getCoachClients();
      const userIds = res?.user_ids || res?.data?.user_ids || [];
      const ids = [...new Set(userIds.map(Number).filter(Boolean))];

      const profiles = await Promise.all(
        ids.map(async (id) => {
          try {
            const d = await getCoachClientProfile(id);
            return d?.data || d || null;
          } catch {
            return null;
          }
        })
      );

      setClients(profiles.filter(Boolean));
    } catch (e) {
      setErr(e.message || "Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function clearAll() {
    setQ("");
    setCity("");
  }

  const filtered = useMemo(() => {
    let list = clients.slice();
    if (dq) {
      const qLower = dq.toLowerCase();
      list = list.filter((c) => {
        const name = `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase();
        const goal = String(c.goal || "").toLowerCase();
        return name.includes(qLower) || goal.includes(qLower);
      });
    }
    if (dcity) {
      const cLower = dcity.toLowerCase();
      list = list.filter((c) =>
        String(c.city || "").toLowerCase().includes(cLower)
      );
    }
    return list;
  }, [clients, dq, dcity]);

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={2}>My clients</Title>
          <Button variant="light" size="xs" onClick={load}>
            Refresh
          </Button>
        </Group>

        <Paper withBorder p="md" radius="lg">
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <TextInput
                label="Search"
                placeholder="Name, goal…"
                value={q}
                onChange={(e) => setQ(e.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <TextInput
                label="City"
                placeholder="Vilnius"
                value={city}
                onChange={(e) => setCity(e.currentTarget.value)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 2 }}>
              <Button
                fullWidth
                mt={{ base: "sm", md: "lg" }}
                variant="light"
                onClick={clearAll}
              >
                Clear
              </Button>
            </Grid.Col>
          </Grid>
        </Paper>

        {loading ? (
          <Group justify="center">
            <Loader />
          </Group>
        ) : err ? (
          <Alert color="red">{err}</Alert>
        ) : (
          <Grid gutter="lg">
            {filtered.map((c) => {
              const uid = c.user_id || c.id;
              const avatar = c.avatar_path || c.avatar_url || c.avatar || null;
              const name =
                `${c.first_name || ""} ${c.last_name || ""}`.trim() ||
                `User #${uid}`;
              const age = c.age ?? computeAge(c.birth_date);
              const goal = c.goal || c.goal_name || "";
              const gender = c.sex || c.gender || "";

              return (
                <Grid.Col
                  key={uid}
                  span={{ base: 12, sm: 6, md: 4, lg: 3 }}
                >
                  <Card
                    withBorder
                    radius="lg"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(c)}
                  >
                    <div
                      style={{
                        height: 160,
                        overflow: "hidden",
                        borderRadius: 12,
                        background: "#fff",
                      }}
                    >
                      {avatar ? (
                        <Image src={avatar} alt="" height={160} fit="contain" />
                      ) : (
                        <div
                          style={{
                            height: 160,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#999",
                          }}
                        >
                          <Text>no photo</Text>
                        </div>
                      )}
                    </div>

                    <Stack gap={6} mt="sm">
                      <Text fw={700}>{name}</Text>

                      <Group gap={6} wrap="wrap">
                        {age && <Badge variant="outline">{age} y/o</Badge>}
                        {gender && <Badge variant="outline">{gender}</Badge>}
                        {c.city && <Badge variant="outline">{c.city}</Badge>}
                      </Group>

                      <Group gap={6} wrap="wrap">
                        {goal && <Badge variant="light">{goal}</Badge>}
                        {c.current_plan_title && (
                          <Badge variant="light" color="blue">
                            Plan: {c.current_plan_title}
                          </Badge>
                        )}
                      </Group>
                    </Stack>
                  </Card>
                </Grid.Col>
              );
            })}

            {!filtered.length && (
              <Grid.Col span={12}>
                <Text c="dimmed" ta="center">
                  You don&apos;t have any clients yet.
                </Text>
              </Grid.Col>
            )}
          </Grid>
        )}
      </Stack>

      <Modal
        opened={!!selected}
        onClose={() => setSelected(null)}
        title="Client profile"
        centered
        radius="lg"
        size="lg"
      >
        {selected && (
          <Stack gap="md">
            <Group justify="center">
              <Avatar
                src={
                  selected.avatar_path ||
                  selected.avatar_url ||
                  selected.avatar ||
                  undefined
                }
                radius="xl"
                size={120}
              >
                {(
                  selected.first_name?.[0] ||
                  selected.last_name?.[0] ||
                  "U"
                ).toUpperCase()}
              </Avatar>
            </Group>

            <Text fw={700} ta="center" fz="lg">
              {[selected.first_name, selected.last_name]
                .filter(Boolean)
                .join(" ") || `User #${selected.user_id || selected.id}`}
            </Text>

            <Group gap="xs" justify="center" wrap="wrap">
              {(selected.age ?? computeAge(selected.birth_date)) && (
                <Badge variant="outline">
                  {selected.age ?? computeAge(selected.birth_date)} y/o
                </Badge>
              )}
              {(selected.sex || selected.gender) && (
                <Badge variant="outline">
                  {selected.sex || selected.gender}
                </Badge>
              )}
              {selected.city && (
                <Badge variant="outline">{selected.city}</Badge>
              )}
              {(selected.goal || selected.goal_name) && (
                <Badge variant="light" color="blue">
                  {selected.goal || selected.goal_name}
                </Badge>
              )}
            </Group>

            <Divider />

            <Stack gap={4} fz="sm">
              {selected.birth_date && (
                <Text>
                  <b>Birth date:</b>{" "}
                  {new Date(selected.birth_date).toLocaleDateString()}
                </Text>
              )}
              {(selected.height_cm || selected.height) && (
                <Text>
                  <b>Height:</b> {selected.height_cm || selected.height} cm
                </Text>
              )}
              {(selected.weight_kg || selected.weight) && (
                <Text>
                  <b>Weight:</b> {selected.weight_kg || selected.weight} kg
                </Text>
              )}
              {selected.activity_level && (
                <Text>
                  <b>Activity level:</b> {selected.activity_level}
                </Text>
              )}
              {selected.sessions_per_week && (
                <Text>
                  <b>Sessions per week:</b> {selected.sessions_per_week}
                </Text>
              )}
              {selected.available_minutes && (
                <Text>
                  <b>Time per session:</b> {selected.available_minutes} min
                </Text>
              )}
              {selected.equipment && Array.isArray(selected.equipment) && (
                <Text>
                  <b>Equipment:</b> {selected.equipment.join(", ")}
                </Text>
              )}
              {selected.preferences &&
                (Array.isArray(selected.preferences) ? (
                  <Text>
                    <b>Preferences:</b>{" "}
                    {selected.preferences.join(", ")}
                  </Text>
                ) : (
                  <Text>
                    <b>Preferences:</b> {selected.preferences}
                  </Text>
                ))}
              {selected.injuries &&
                (Array.isArray(selected.injuries) ? (
                  <Text>
                    <b>Injuries:</b> {selected.injuries.join(", ")}
                  </Text>
                ) : (
                  <Text>
                    <b>Injuries:</b> {selected.injuries}
                  </Text>
                ))}
              {selected.current_plan_title && (
                <Text>
                  <b>Current plan:</b> {selected.current_plan_title}
                </Text>
              )}
            </Stack>
          </Stack>
        )}
      </Modal>
    </>
  );
}