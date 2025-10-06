// webapp/src/pages/CoachesListPage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Title, Text, Grid, Stack, Group, Badge, Image, Card, Loader, Alert, TextInput, Button,
} from '@mantine/core';
import { getPublicCoaches } from '../api/profiles';

export default function CoachesListPage() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load(params = {}) {
    setLoading(true); setErr(null);
    try {
      const res = await getPublicCoaches(params);
      setItems(res?.data || []);
    } catch (e) {
      setErr(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="end">
        <Title order={2}>Coaches</Title>
        <Group>
          <TextInput
            placeholder="Search…"
            value={q}
            onChange={(e) => setQ(e.currentTarget.value)}
          />
          <Button onClick={() => load(q ? { q } : {})}>Search</Button>
        </Group>
      </Group>

      {loading ? (
        <Group justify="center"><Loader /></Group>
      ) : err ? (
        <Alert color="red">{err}</Alert>
      ) : (
        <Grid gutter="lg">
          {items.map((c) => (
            <Grid.Col key={c.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <Card withBorder radius="lg" component={Link} to={`/coaches/${c.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ height: 160, overflow: 'hidden', borderRadius: 12, background: '#fff' }}>
                  {c.avatar_path ? (
                    <Image src={c.avatar_path} alt="" height={160} fit="contain" />
                  ) : (
                    <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                      <Text>no photo</Text>
                    </div>
                  )}
                </div>
                <Stack gap={4} mt="sm">
                  <Text fw={700}>{c.first_name || 'Coach'}</Text> {/* Vardas iš AUTH per backend */}
                  <Group gap={6} wrap="wrap">
                    {Array.isArray(c.specializations) && c.specializations.slice(0,3).map((s, i) => (
                      <Badge key={i} variant="light">{s}</Badge>
                    ))}
                    {c.experience_years ? <Badge variant="dot">{c.experience_years} y</Badge> : null}
                    {c.price_per_session ? <Badge variant="outline">€{c.price_per_session}</Badge> : null}
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
          {!items.length && (
            <Grid.Col span={12}><Text c="dimmed" ta="center">No coaches found.</Text></Grid.Col>
          )}
        </Grid>
      )}
    </Stack>
  );
}