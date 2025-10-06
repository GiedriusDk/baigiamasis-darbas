import { useEffect, useMemo, useState } from "react";
import {
  Modal, Group, Text, Image, Stack, Badge, Divider, Loader, ScrollArea,
} from "@mantine/core";

export default function ExerciseDetailsModal({ opened, onClose, exercise, exerciseId }) {
  const [data, setData] = useState(exercise || null);
  const [loading, setLoading] = useState(false);

  const id = useMemo(() => (exercise?.id ?? exerciseId ?? null), [exercise, exerciseId]);

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
          // jei iš sąrašo jau turėjom dalį laukų – sujungiam, kad neprarastume image_url ir pan.
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

          <div style={{
            width: '100%', height: 260, background: 'white', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
          }}>
            <Image
              src={data.image_url || undefined}
              alt={data.name}
              height={260}
              fit="contain"
              styles={{ image: { objectFit: 'contain' } }}
            />
          </div>

          <Divider />

          <div>
            <Text fw={600} mb={6}>Instructions</Text>
            {instructions.length > 0 ? (
              <ScrollArea.Autosize mah={260} type="always" offsetScrollbars>
                <ol style={{ paddingLeft: 18, margin: 0 }}>
                  {instructions.map((line, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>
                      <Text size="sm">{line}</Text>
                    </li>
                  ))}
                </ol>
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