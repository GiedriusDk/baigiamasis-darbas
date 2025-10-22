import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Title, Text, Grid, Stack, Group, Badge, Image, Card,
  Loader, Alert, Divider, Button, Modal, AspectRatio
} from "@mantine/core";
import { getPublicCoach, getPublicCoachExercises } from "../api/profiles";
import {
  listProducts, createOrder, checkout,
  getProductExerciseIdsPublic, getMyAccess
} from "../api/payments";
import { getPublicUser } from "../api/auth";
import { useAuth } from "../auth/useAuth";
import PlanCard from "../components/PlanCard";

function getYoutubeId(url = "") {
  try {
    const regExp = /(?:youtube\.com\/(?:.*v=|v\/|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,12})/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function isVideoUrl(url = "") {
  const lower = url.toLowerCase();
  return lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.includes("vimeo.com");
}

function MediaThumb({ url, blurred, onOpenImage, onOpenVideo, onOpenYouTube }) {
  if (!url) return null;

  const ytId = getYoutubeId(url);
  const clickable = !blurred;

  const wrapperStyle = {
    position: "relative",
    borderRadius: 12,
    width: "100%",
    height: 160,
    overflow: "hidden",
    cursor: clickable ? "pointer" : "default",
  };

  const mediaStyle = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    filter: blurred ? "blur(8px) brightness(0.7)" : "none",
    pointerEvents: blurred ? "none" : "auto",
    userSelect: "none",
    display: "block",
  };

  const Overlay = ({ children }) => (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 800,
        letterSpacing: 0.3,
        textShadow: "0 2px 8px rgba(0,0,0,.45)",
        fontSize: 22,
        pointerEvents: "none",
      }}
    >
      {children}
    </div>
  );

  const handleClick = () => {
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
        {/* mini video frame (be autoplay) — tik preview */}
        <video src={url} style={mediaStyle} controls={false} />
        <Overlay>{blurred ? "Locked" : "▶"}</Overlay>
      </div>
    );
  }

  // Image / GIF
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

  if (loading) return <Group justify="center"><Loader /></Group>;
  if (err) return <Alert color="red">{err}</Alert>;
  if (!coach) return null;

  return (
    <Stack gap="md">
      <Group gap="lg" align="start">
        <Image src={coach.avatar_path || undefined} alt="" radius="xl" w={120} h={120} />
        <Stack gap={2}>
          <Title order={2}>{displayName}</Title>
          <Text c="dimmed">{coach.city || "—"}</Text>
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
              <Card withBorder radius="lg" padding="sm">
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
    </Stack>
  );
}