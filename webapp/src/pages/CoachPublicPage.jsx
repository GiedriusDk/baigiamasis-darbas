// webapp/src/pages/CoachPublicPage.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Title, Text, Grid, Stack, Group, Badge, Image, Card,
  Loader, Alert, Divider, Button
} from '@mantine/core';
import { getPublicCoach, getPublicCoachExercises } from '../api/profiles';
import { listProducts, createOrder, checkout } from '../api/payments';
import { useAuth } from '../auth/useAuth';

function getYoutubeId(url = '') {
  const m = url.match(/(?:youtube\.com.*(?:\?|&)v=|youtu\.be\/)([^&#]+)/i);
  return m ? m[1] : null;
}
function isVideoUrl(u = '') {
  const x = u.toLowerCase();
  return x.endsWith('.mp4') || x.endsWith('.webm') || x.includes('vimeo.com');
}
function MediaThumb({ url, blurred }) {
  if (!url) return null;
  const commonStyle = blurred ? { filter: 'blur(10px) brightness(0.7)', pointerEvents: 'none', userSelect: 'none' } : {};
  const ytId = getYoutubeId(url);
  if (ytId) {
    const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return (
      <a href={blurred ? undefined : url} target={blurred ? undefined : '_blank'} rel="noreferrer" style={{ position: 'relative', display: 'block' }}>
        <Image src={thumb} alt="YouTube" height={160} fit="cover" radius="md" style={commonStyle} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 28, textShadow: '0 2px 6px rgba(0,0,0,.5)' }}>
          {blurred ? 'Locked' : '▶'}
        </div>
      </a>
    );
  }
  if (isVideoUrl(url)) {
    return blurred ? (
      <div style={{ height: 160, borderRadius: 12, background: 'rgba(0,0,0,.06)', position: 'relative' }}>
        <div style={{ ...commonStyle, position: 'absolute', inset: 0, background: 'rgba(0,0,0,.06)', borderRadius: 12 }} />
      </div>
    ) : (
      <video src={url} height={160} controls style={{ borderRadius: 12, display: 'block', maxWidth: '100%' }} />
    );
  }
  return <Image src={url} alt="" height={160} fit="cover" radius="md" style={commonStyle} />;
}

export default function CoachPublicPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [coach, setCoach] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [err, setErr] = useState(null);
  const [buyingId, setBuyingId] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setErr(null);
      try {
        const c = await getPublicCoach(id);
        setCoach(c);
        const e = await getPublicCoachExercises(id);
        setExercises(Array.isArray(e) ? e : []);
      } catch (e) {
        setErr(e.message || 'Failed to load coach');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!coach) return;
    (async () => {
      setLoadingPlans(true);
      try {
        const all = await listProducts();
        const list = Array.isArray(all?.data) ? all.data : Array.isArray(all) ? all : [];
        setPlans(list.filter(p => Number(p.coach_id) === Number(coach.id) && p.is_active));
      } catch {
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    })();
  }, [coach]);

  async function handleBuy(productId) {
    if (!ready || !user) {
      navigate('/login', { replace: true, state: { from: `/coaches/${id}` } });
      return;
    }
    try {
      setBuyingId(productId);
      const order = await createOrder(productId, 1);
      const url = await checkout(order.data?.id || order.id);
      const checkoutUrl = url?.checkout_url || url?.url || url;
      if (checkoutUrl) window.location.href = checkoutUrl;
    } catch (e) {
      alert(e.message || 'Purchase failed');
    } finally {
      setBuyingId(null);
    }
  }

  if (loading) return <Group justify="center"><Loader /></Group>;
  if (err) return <Alert color="red">{err}</Alert>;
  if (!coach) return null;

  return (
    <Stack gap="md">
      <Group gap="lg" align="start">
        <Image src={coach.avatar_path || undefined} alt="" radius="xl" w={120} h={120} />
        <Stack gap={2}>
          <Title order={2}>{coach.name || 'Coach'}</Title>
          <Text c="dimmed">{coach.city || '—'}</Text>
          <Group gap={8}>
            {coach.experience_years ? <Badge variant="dot">{coach.experience_years} years</Badge> : null}
            {coach.price_per_session ? <Badge variant="outline">€{coach.price_per_session} / session</Badge> : null}
          </Group>
          <Group gap={6} wrap="wrap">
            {Array.isArray(coach.specializations) && coach.specializations.map((s, i) => (
              <Badge key={i} variant="light">{s}</Badge>
            ))}
          </Group>
        </Stack>
      </Group>

      {coach.bio && (
        <>
          <Divider />
          <Text>{coach.bio}</Text>
        </>
      )}

      <Divider label="Plans" />
      {loadingPlans ? (
        <Group justify="center"><Loader /></Group>
      ) : (
        <Grid gutter="lg">
          {plans.map(p => (
            <Grid.Col key={p.id} span={{ base: 12, sm: 6, md: 4 }}>
              <Card withBorder radius="lg" padding="md">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Title order={4} style={{ lineHeight: 1.2 }}>{p.title}</Title>
                    <Badge size="lg" variant="light">€{(p.price ?? p.price_cents / 100) || 0}</Badge>
                  </Group>
                  {p.description ? <Text c="dimmed" lineClamp={3}>{p.description}</Text> : null}
                  <Group gap="xs" wrap="wrap">
                    {p.currency ? <Badge variant="outline">{String(p.currency).toUpperCase()}</Badge> : null}
                    {'metadata' in p && p.metadata?.weeks ? <Badge variant="dot">{p.metadata.weeks} weeks</Badge> : null}
                  </Group>
                  <Button
                    fullWidth
                    onClick={() => handleBuy(p.id)}
                    loading={buyingId === p.id}
                  >
                    Buy
                  </Button>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
          {plans.length === 0 && (
            <Grid.Col span={12}><Text c="dimmed" ta="center">No plans from this coach yet.</Text></Grid.Col>
          )}
        </Grid>
      )}

      <Divider label="Exercises" />
      <Grid gutter="lg">
        {exercises.map(e => (
          <Grid.Col key={e.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
            <Card withBorder radius="lg" padding="sm">
              <div style={{ height: 160, overflow: 'hidden', borderRadius: 12, background: '#fff' }}>
                <MediaThumb url={e.media_url} blurred={!!e.is_paid} />
              </div>
              <Stack gap={4} mt="sm">
                <Text fw={600} lineClamp={2}>
                  {e.title} {e.is_paid ? '🔒' : ''}
                </Text>
                <Group gap={6}>
                  {e.primary_muscle && <Badge variant="light">{e.primary_muscle}</Badge>}
                  {e.difficulty && <Badge variant="dot">{e.difficulty}</Badge>}
                </Group>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
        {exercises.length === 0 && (
          <Grid.Col span={12}><Text c="dimmed" ta="center">No exercises yet.</Text></Grid.Col>
        )}
      </Grid>
    </Stack>
  );
}