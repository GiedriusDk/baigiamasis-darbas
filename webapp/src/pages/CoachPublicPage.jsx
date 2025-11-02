import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Title, Text, Grid, Stack, Group, Badge, Image, Card,
  Loader, Alert, Divider, Button, Modal, AspectRatio, ActionIcon, Anchor
} from "@mantine/core";
import { IconBrandInstagram, IconBrandFacebook, IconBrandYoutube, IconBrandLinkedin } from "@tabler/icons-react";
import { getPublicCoach, getPublicCoachExercises, getSharedExerciseById } from "../api/profiles";
import { listProducts, createOrder, checkout, getProductExerciseIdsPublic, getMyAccess } from "../api/payments";
import { getPublicUser } from "../api/auth";
import { useAuth } from "../auth/useAuth";
import PlanCard from "../components/PlanCard";
import ExerciseDetailsModal from "../components/ExerciseDetailsModal.jsx";

function getYoutubeId(url = "") {
  try {
    const re = /(?:youtube\.com\/(?:.*v=|v\/|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,12})/;
    const m = String(url).match(re);
    return m ? m[1] : null;
  } catch { return null; }
}

function isVideoUrl(url = "") {
  const u = String(url).toLowerCase();
  return u.endsWith(".mp4") || u.endsWith(".webm") || u.includes("vimeo.com");
}

function normalizeList(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (!v) return [];
  return String(v).split(",").map(s => s.trim()).filter(Boolean);
}

function MediaThumb({ url, blurred, onOpenImage, onOpenVideo, onOpenYouTube }) {
  if (!url) return null;
  const ytId = getYoutubeId(url);
  const clickable = !blurred;
  const wrapperStyle = { position: "relative", borderRadius: 12, width: "100%", height: 160, overflow: "hidden", cursor: clickable ? "pointer" : "default" };
  const mediaStyle = { width: "100%", height: "100%", objectFit: "contain", filter: blurred ? "blur(8px) brightness(0.7)" : "none", pointerEvents: blurred ? "none" : "auto", userSelect: "none", display: "block" };
  const Overlay = ({ children }) => (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, letterSpacing: 0.3, textShadow: "0 2px 8px rgba(0,0,0,.45)", fontSize: 22, pointerEvents: "none" }}>{children}</div>
  );
  const handleClick = (e) => {
    e.stopPropagation();
    if (!clickable) return;
    if (ytId && onOpenYouTube) return onOpenYouTube(ytId);
    if (isVideoUrl(url) && onOpenVideo) return onOpenVideo(url);
    if (onOpenImage) return onOpenImage(url);
  };
  if (ytId) {
    const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
    return (
      <div style={wrapperStyle} onClick={handleClick}>
        <img src={thumb} alt="YouTube preview" style={mediaStyle} />
        <Overlay>{blurred ? "Locked" : "▶"}</Overlay>
      </div>
    );
  }
  if (isVideoUrl(url)) {
    return (
      <div style={wrapperStyle} onClick={handleClick}>
        <video src={url} style={mediaStyle} />
        <Overlay>{blurred ? "Locked" : "▶"}</Overlay>
      </div>
    );
  }
  return (
    <div style={wrapperStyle} onClick={handleClick}>
      <img src={url} alt="Preview" style={mediaStyle} />
      {blurred && <Overlay>Locked</Overlay>}
    </div>
  );
}

function MediaViewer({ imageUrl, videoUrl, opened, onClose }) {
  const yt = getYoutubeId(videoUrl || "");
  return (
    <Modal opened={opened} onClose={onClose} size="lg" radius="md" withCloseButton>
      <AspectRatio ratio={16 / 9}>
        {imageUrl ? (
          <img src={imageUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 12 }} />
        ) : yt ? (
          <iframe
            src={`https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`}
            title="YouTube video"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ border: 0, width: "100%", height: "100%" }}
          />
        ) : videoUrl ? (
          <video src={videoUrl} controls style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: 12 }} />
        ) : null}
      </AspectRatio>
    </Modal>
  );
}


export default function CoachPublicPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalExercise, setModalExercise] = useState(null);
  const [modalExerciseId, setModalExerciseId] = useState(null);
  const [coach, setCoach] = useState(null);
  const [coachUser, setCoachUser] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [plans, setPlans] = useState([]);
  const [exercisePlanTitles, setExercisePlanTitles] = useState({});
  const [exerciseToProductIds, setExerciseToProductIds] = useState({});
  const [access, setAccess] = useState({ product_ids: [], exercise_ids: [] });
  const [loading, setLoading] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [err, setErr] = useState(null);
  const [buyingId, setBuyingId] = useState(null);

  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState(null);
  const [viewerVideo, setViewerVideo] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const c = await getPublicCoach(id);
        setCoach(c);
        const e = await getPublicCoachExercises(id);
        setExercises(Array.isArray(e) ? e : []);
        const uid = Number(c?.user_id || c?.coach_user_id || c?.id);
        const u = uid ? await getPublicUser(uid).catch(() => null) : null;
        setCoachUser(u || null);
      } catch (e) {
        setErr(e.message || "Failed to load coach");
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
        const coachIds = [Number(coach.id), Number(coach.user_id), Number(coach.coach_id)].filter(Boolean);
        const filtered = list.filter(p => coachIds.includes(Number(p.coach_id)) && p.is_active !== false);
        setPlans(filtered);
        const pairs = await Promise.all(filtered.map(async (p) => {
          try {
            const ids = await getProductExerciseIdsPublic(p.id);
            return { productId: p.id, title: p.title, ids };
          } catch {
            return { productId: p.id, title: p.title, ids: [] };
          }
        }));
        const titlesMap = {};
        const exToProd = {};
        for (const { productId, title, ids } of pairs) {
          for (const eid of ids) {
            if (!titlesMap[eid]) titlesMap[eid] = [];
            titlesMap[eid].push(title);
            if (!exToProd[eid]) exToProd[eid] = [];
            exToProd[eid].push(Number(productId));
          }
        }
        setExercisePlanTitles(titlesMap);
        setExerciseToProductIds(exToProd);
      } finally {
        setLoadingPlans(false);
      }
    })();
  }, [coach]);

  useEffect(() => {
    if (!ready || !user?.id) return;
    getMyAccess()
      .then((a) => setAccess({
        product_ids: Array.isArray(a?.product_ids) ? a.product_ids.map(Number) : [],
        exercise_ids: Array.isArray(a?.exercise_ids) ? a.exercise_ids.map(Number) : [],
      }))
      .catch(() => setAccess({ product_ids: [], exercise_ids: [] }));
  }, [ready, user?.id]);

  useEffect(() => {
    function onFocus() {
      getMyAccess()
        .then((a) => setAccess({
          product_ids: (a.product_ids || []).map(Number),
          exercise_ids: (a.exercise_ids || []).map(Number),
        }))
        .catch(() => {});
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  async function handleBuy(productId) {
    if (!ready || !user?.id) {
      navigate("/login", { replace: true });
      return;
    }
    try {
      setBuyingId(productId);
      const order = await createOrder(productId, 1);
      const cs = await checkout(order.data?.id || order.id);
      const url = cs?.checkout_url || cs?.url || cs;
      if (url) window.location.href = url;
    } catch (e) {
      alert(e.message || "Purchase failed");
    } finally {
      setBuyingId(null);
    }
  }

  const displayName = useMemo(() => {
    const fn = coachUser?.first_name || coach?.first_name || coach?.name || "Coach";
    const ln = coachUser?.last_name || coach?.last_name || "";
    return `${fn}${ln ? " " + ln : ""}`.trim();
  }, [coachUser, coach]);

  const ownedProducts = useMemo(
    () => new Set((access.product_ids || []).map(Number)),
    [access.product_ids]
  );

  const hasAccessToExercise = (e) => {
    const prodIds = (exerciseToProductIds[e.id] || []).map(Number);
    const ownsAnyPlanWithThis = prodIds.some(pid => ownedProducts.has(pid));
    const isCatalog = Boolean(e.catalog_id ?? e.is_catalog);
    const needsPlan = isCatalog ? !ownsAnyPlanWithThis : (!!e.is_paid && !ownsAnyPlanWithThis);
    return !needsPlan;
  };

  async function openExerciseDetails(e) {
    if (!hasAccessToExercise(e)) return;

    if (e.catalog_id) {
      setModalExercise(null);
      setModalExerciseId(Number(e.catalog_id));
    } else {
      setModalExercise({
        id: e.id,
        name: e.title || e.name || "Exercise",
        image_url: e.image_url || (isVideoUrl(e.media_url) ? null : e.media_url),
        video_url: e.media_url, // <-- svarbu
        instructions: e.instructions ?? e.description ?? "",
        primary_muscle: e.primary_muscle,
        equipment: e.equipment,
      });
      setModalExerciseId(null);
    }

    setModalOpen(true);
  }

  if (loading) return <Group justify="center"><Loader /></Group>;
  if (err) return <Alert color="red">{err}</Alert>;
  if (!coach) return null;

  const specs = normalizeList(coach.specializations);
  const certs = normalizeList(coach.certifications);
  const langs = normalizeList(coach.languages);

  return (
    <Stack gap="lg">
      <Group align="start" gap="lg" wrap="nowrap">
        <Image src={coach.avatar_path || undefined} alt="" radius="xl" w={120} h={120} />
        <Stack gap="xs" style={{ flex: 1 }}>
          <Group justify="space-between" align="start">
            <div>
              <Title order={2}>{displayName}</Title>
              <Text c="dimmed">{coach.city || "—"}</Text>
            </div>
            <Group gap="xs">
              {coach.instagram && (
                <ActionIcon component="a" href={coach.instagram} target="_blank" variant="light" radius="xl">
                  <IconBrandInstagram size={18} />
                </ActionIcon>
              )}
              {coach.facebook && (
                <ActionIcon component="a" href={coach.facebook} target="_blank" variant="light" radius="xl">
                  <IconBrandFacebook size={18} />
                </ActionIcon>
              )}
              {coach.youtube && (
                <ActionIcon component="a" href={coach.youtube} target="_blank" variant="light" radius="xl">
                  <IconBrandYoutube size={18} />
                </ActionIcon>
              )}
              {coach.linkedin && (
                <ActionIcon component="a" href={coach.linkedin} target="_blank" variant="light" radius="xl">
                  <IconBrandLinkedin size={18} />
                </ActionIcon>
              )}
            </Group>
          </Group>

          {coach.bio && <Text mt={4}>{coach.bio}</Text>}

          <Grid gutter="md" mt="xs">
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Stack gap={6}>
                <Text c="dimmed" size="sm">Experience</Text>
                <Text>{coach.experience_years || 0} years</Text>
                {coach.availability_note && <Text size="sm">{coach.availability_note}</Text>}
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
              <Stack gap={6}>
                <Text c="dimmed" size="sm">Languages</Text>
                {langs.length ? (
                  <Group gap={6} wrap="wrap">{langs.map((l, i) => <Badge key={i} variant="light">{l}</Badge>)}</Group>
                ) : <Text>—</Text>}
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 12, md: 4 }}>
              <Stack gap={6}>
                <Text c="dimmed" size="sm">Location</Text>
                <Text size="sm">{coach.city || "—"}</Text>
                <Text size="sm">{coach.country || ""} {coach.timezone ? `• ${coach.timezone}` : ""}</Text>
              </Stack>
            </Grid.Col>
          </Grid>

          <Grid gutter="md" mt="xs">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap={14}>
                <div>
                  <Text c="dimmed" size="sm">Contacts</Text>
                  <Group gap="md">
                    <Text size="sm">{coach.phone}</Text>
                    {coach.website && (
                      <Anchor href={/^https?:\/\//i.test(coach.website) ? coach.website : `https://${coach.website}`} target="_blank" rel="noopener" size="sm">
                        {coach.website}
                      </Anchor>
                    )}
                  </Group>
                </div>
                <div>
                  <Text c="dimmed" size="sm">Social</Text>
                  <Group gap="md">
                    {coach.instagram && <Anchor c="dimmed" href={coach.instagram} target="_blank" rel="noopener">Instagram</Anchor>}
                    {coach.facebook  && <Anchor c="dimmed" href={coach.facebook}  target="_blank" rel="noopener">Facebook</Anchor>}
                    {coach.youtube   && <Anchor c="dimmed" href={coach.youtube}   target="_blank" rel="noopener">YouTube</Anchor>}
                    {coach.linkedin  && <Anchor c="dimmed" href={coach.linkedin}  target="_blank" rel="noopener">LinkedIn</Anchor>}
                    {coach.tiktok    && <Anchor c="dimmed" href={coach.tiktok}    target="_blank" rel="noopener">TikTok</Anchor>}
                    {coach.other     && <Anchor c="dimmed" href={coach.other}     target="_blank" rel="noopener">Other</Anchor>}
                  </Group>
                </div>
                <div>
                  <Text c="dimmed" size="sm">Certifications</Text>
                  {normalizeList(coach.certifications).length ? (
                    <Group gap={6} wrap="wrap">
                      {normalizeList(coach.certifications).map((c, i) => (
                        <Badge key={i} color="teal" variant="light">{c}</Badge>
                      ))}
                    </Group>
                  ) : <Text>—</Text>}
                </div>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap={14}>
                <div>
                  <Text c="dimmed" size="sm">Specializations</Text>
                  {specs.length ? (
                    <Group gap={6} wrap="wrap">
                      {specs.map((s, i) => <Badge key={i} variant="outline">{s}</Badge>)}
                    </Group>
                  ) : <Text>—</Text>}
                </div>
                {coach.gym_name && (
                  <div>
                    <Text c="dimmed" size="sm">Gym</Text>
                    <Text size="sm">{coach.gym_name}</Text>
                    {coach.gym_address && <Text size="sm">{coach.gym_address}</Text>}
                  </div>
                )}
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Group>

      <Divider label="Plans" />
      {loadingPlans ? (
        <Group justify="center"><Loader /></Group>
      ) : (
        <Grid gutter="lg">
          {plans.map(p => {
            const owned = ownedProducts.has(Number(p.id));
            return (
              <Grid.Col key={p.id} span={{ base: 12, sm: 6, md: 4 }}>
                <PlanCard plan={p} owned={owned} onBuy={() => handleBuy(p.id)} />
                {buyingId === p.id && <Button loading fullWidth mt="xs">Processing…</Button>}
              </Grid.Col>
            );
          })}
          {plans.length === 0 && (
            <Grid.Col span={12}><Text c="dimmed" ta="center">No plans from this coach yet.</Text></Grid.Col>
          )}
        </Grid>
      )}

      <Divider label="Exercises" />
      <Grid gutter="lg">
        {exercises.map(e => {
          const prodIds = (exerciseToProductIds[e.id] || []).map(Number);
          const isCatalog = Boolean(e.catalog_id ?? e.is_catalog);
          const ownsAnyPlanWithThis = prodIds.some(pid => ownedProducts.has(pid));
          const blurred = isCatalog ? !ownsAnyPlanWithThis : (!!e.is_paid && !ownsAnyPlanWithThis);
          const canOpen = Boolean(e.media_url) && !blurred;

          return (
            <Grid.Col key={e.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
              <Card withBorder radius="lg" padding="sm" onClick={() => openExerciseDetails(e)} style={{ cursor: hasAccessToExercise(e) ? "pointer" : "default" }}>
                <MediaThumb
                  url={e.media_url}
                  blurred={blurred}
                  onOpenImage={canOpen ? (u => { setViewerVideo(null); setViewerImage(u); setViewerOpen(true); }) : undefined}
                  onOpenVideo={canOpen ? (u => { setViewerImage(null); setViewerVideo(u); setViewerOpen(true); }) : undefined}
                  onOpenYouTube={canOpen ? (yt => window.open(`https://www.youtube.com/watch?v=${yt}`, "_blank", "noopener,noreferrer")) : undefined}
                />
                <Stack gap={4} mt="sm">
                  <Text fw={600}>{e.title} {blurred ? "🔒" : ""}</Text>
                  <Group gap={6}>
                    {isCatalog && <Badge size="xs" variant="outline" color="gray">From catalog</Badge>}
                    {e.primary_muscle && <Badge variant="light">{e.primary_muscle}</Badge>}
                    {e.difficulty && <Badge variant="dot">{e.difficulty}</Badge>}
                  </Group>
                  {(exercisePlanTitles[e.id]?.length ?? 0) > 0 && (
                    <Group gap={4} mt={4}>
                      {exercisePlanTitles[e.id].map((t, i) => (
                        <Badge key={i} color="blue" variant="outline" size="xs">{t}</Badge>
                      ))}
                    </Group>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          );
        })}
        {exercises.length === 0 && (
          <Grid.Col span={12}><Text c="dimmed" ta="center">No exercises yet.</Text></Grid.Col>
        )}
      </Grid>

      <MediaViewer
        imageUrl={viewerImage}
        videoUrl={viewerVideo}
        opened={viewerOpen}
        onClose={() => { setViewerOpen(false); setViewerImage(null); setViewerVideo(null); }}
      />

      <ExerciseDetailsModal
        opened={modalOpen}
        onClose={() => { setModalOpen(false); setModalExercise(null); setModalExerciseId(null); }}
        exercise={modalExercise}
        exerciseId={modalExerciseId}
      />
    </Stack>
  );
}