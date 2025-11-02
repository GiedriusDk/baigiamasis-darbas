import { useEffect, useMemo, useState } from "react";
import {
  Modal, Group, Text, Image, Stack, Badge, Divider, Loader, ScrollArea, AspectRatio, Button
} from "@mantine/core";

function getYoutubeId(url = "") {
  try {
    const re = /(?:youtube\.com\/(?:.*v=|v\/|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,12})/;
    const m = String(url).match(re);
    return m ? m[1] : null;
  } catch { return null; }
}
function isVideoUrl(url = "") {
  const u = String(url || "").toLowerCase();
  return u.endsWith(".mp4") || u.endsWith(".webm") || u.includes("vimeo.com");
}

export default function ExerciseDetailsModal({ opened, onClose, exercise, exerciseId }) {
  const [data, setData] = useState(exercise || null);
  const [loading, setLoading] = useState(false);
  const [playVideo, setPlayVideo] = useState(false);

  const id = useMemo(() => (exercise?.id ?? exerciseId ?? null), [exercise, exerciseId]);

  const mediaUrl   = data?.video_url || data?.media_url || "";
  const imageUrl   = data?.image_url || (!isVideoUrl(mediaUrl) && !getYoutubeId(mediaUrl) ? mediaUrl : null);
  const ytId       = getYoutubeId(mediaUrl);
  const isHtml5Vid = !ytId && isVideoUrl(mediaUrl);

  const instructions = useMemo(() => {
    const raw = data?.instructions;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string" && raw.trim() !== "") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return raw.split("\n").map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  }, [data]);

  useEffect(() => { if (opened) setPlayVideo(false); }, [opened, id]);

  useEffect(() => {
    if (!opened) return;

    const hasInstructions =
      exercise && (Array.isArray(exercise.instructions) ||
                   (typeof exercise.instructions === "string" && exercise.instructions.trim() !== ""));

    if (hasInstructions) {
      setData(exercise);
      return;
    }

    if (!id) {
      setData(exercise || null);
      return;
    }

    let ignore = false;
    setLoading(true);

    fetch(`/catalog/api/exercises/${id}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.message || "Failed to load exercise");
        if (!ignore) {
          const merged = { ...(exercise || {}), ...(j.data || {}) };
          setData(merged);
        }
      })
      .catch(() => { if (!ignore) setData(exercise || null); })
      .finally(() => { if (!ignore) setLoading(false); });

    return () => { ignore = true; };
  }, [opened, id, exercise]);

  return (
    <Modal opened={opened} onClose={onClose} title="Exercise details" size="lg" radius="lg">
      {loading && (
        <Group justify="center" my="md"><Loader /></Group>
      )}

      {!loading && !data && (
        <Text c="dimmed">No data.</Text>
      )}

      {!loading && !!data && (
        <Stack gap="md">
          <Group justify="space-between" align="flex-start">
            <Text fw={700} size="lg">{data.name}</Text>
            <Group gap="xs">
              {data.primary_muscle && <Badge variant="filled">{data.primary_muscle}</Badge>}
              {data.equipment && <Badge variant="outline">{data.equipment}</Badge>}
            </Group>
          </Group>

          {/* Media zona: YouTube (su paspaudimu), HTML5 video, arba paveikslėlis */}
          <AspectRatio ratio={16/9} style={{ width: '100%', borderRadius: 12, overflow: 'hidden', background: 'white' }}>
            {ytId ? (
              playVideo ? (
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
                  title="YouTube video"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  style={{ border: 0, width: "100%", height: "100%" }}
                />
              ) : (
                <div
                  role="button"
                  onClick={() => setPlayVideo(true)}
                  style={{ position: 'relative', width: '100%', height: '100%', cursor: 'pointer' }}
                >
                  <img
                    src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                    alt="YouTube preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <Button
                    size="md"
                    radius="xl"
                    variant="white"
                    style={{
                      position: 'absolute', inset: 'auto', left: '50%', top: '50%',
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    ▶ Play
                  </Button>
                </div>
              )
            ) : isHtml5Vid ? (
              <video src={mediaUrl} controls style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <Image
                src={imageUrl || undefined}
                alt={data.name}
                fit="contain"
                styles={{ image: { objectFit: 'contain' } }}
              />
            )}
          </AspectRatio>

          {/* Aprašymas */}
          {data.description && (
            <>
              <Divider />
              <div>
                <Text fw={600} mb={6}>Description</Text>
                <ScrollArea.Autosize mah={200} type="hover" offsetScrollbars>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {Array.isArray(data.description) ? data.description.join("\n") : String(data.description)}
                  </Text>
                </ScrollArea.Autosize>
              </div>
            </>
          )}

          <Divider />

          {/* Instrukcijos */}
          <div>
            <Text fw={600} mb={6}>Instructions</Text>
            {instructions.length > 0 ? (
              <ScrollArea.Autosize mah={260} type="always" offsetScrollbars>
                {instructions.length === 1 ? (
                  <Text size="sm">{instructions[0]}</Text>
                ) : (
                  <ul style={{ paddingLeft: 0, margin: 0, listStyle: "none" }}>
                    {instructions.map((line, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>
                        <Text size="sm">{line}</Text>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea.Autosize>
            ) : (
              <Text size="sm" c="dimmed">No instructions provided.</Text>
            )}
          </div>
        </Stack>
      )}
    </Modal>
  );
}