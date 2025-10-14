import { useEffect, useState } from "react";
import { Card, Stack, Group, Text, Badge, Button } from "@mantine/core";
import { getProductExerciseIdsPublic } from "../api/payments";
import { getPublicCoachExercises } from "../api/profiles";

function eur(priceCents, currency = "EUR") {
  const euros = Number(priceCents || 0) / 100;
  return new Intl.NumberFormat("lt-LT", { style: "currency", currency }).format(euros);
}

export default function PlanCard({ plan, owned = false, onBuy, onEdit, onArchive }) {
  const hasWeeks = plan?.metadata && typeof plan.metadata === "object" && plan.metadata.weeks;

  const [openPreview, setOpenPreview] = useState(false);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [prevErr, setPrevErr] = useState("");
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    if (!openPreview) return;

    let ignore = false;
    (async () => {
      setLoadingPrev(true);
      setPrevErr("");
      try {
        const ids = await getProductExerciseIdsPublic(plan.id);
        const coachId = plan.coach_id || plan.coach?.id;
        const all = coachId ? await getPublicCoachExercises(coachId) : [];
        const matched = all.filter((x) => ids.includes(x.id)).slice(0, 5);
        if (!ignore) setExercises(matched);
      } catch (e) {
        if (!ignore) setPrevErr(e.message || "Failed to load contents");
      } finally {
        if (!ignore) setLoadingPrev(false);
      }
    })();

    return () => { ignore = true; };
  }, [openPreview, plan.id, plan.coach_id, plan.coach]);

  return (
    <Card withBorder radius="lg" padding="md" shadow="sm">
      <Stack gap="xs">
        <Group justify="space-between" align="start">
          <Text fw={700} size="lg" style={{ lineHeight: 1.2 }}>{plan.title}</Text>
          <Group gap="xs">
            {owned && <Badge color="teal" variant="light">Owned</Badge>}
            <Badge size="lg" variant="light" color="blue">
              {eur(plan.price, plan.currency || "EUR")}
            </Badge>
          </Group>
        </Group>

        {plan.description ? <Text c="dimmed" size="sm">{plan.description}</Text> : null}

        <Group gap="xs" mt="xs" wrap="wrap">
          {plan.currency ? <Badge variant="outline">{String(plan.currency).toUpperCase()}</Badge> : null}
          {hasWeeks ? <Badge variant="dot">{plan.metadata.weeks} WEEKS</Badge> : null}
        </Group>

        <Group gap="md" mt="xs" wrap="wrap">
          <Button size="xs" variant="subtle" onClick={() => setOpenPreview(v => !v)}>
            {openPreview ? "Hide contents" : "View contents"}
          </Button>
        </Group>

        {openPreview && (
          <div style={{ borderTop: "1px dashed var(--mantine-color-gray-4)", paddingTop: 8 }}>
            {loadingPrev && <Text c="dimmed" size="sm">Loading…</Text>}
            {prevErr && <Text c="red" size="sm">{prevErr}</Text>}
            {!loadingPrev && !prevErr && (
              exercises.length ? (
                <Stack gap={6}>
                  {exercises.map(ex => (
                    <Group key={ex.id} gap="xs" wrap="nowrap" align="center">
                      <Text size="sm" fw={500} lineClamp={1}>{ex.title}</Text>
                      {ex.is_paid && <Badge color="red" size="xs" variant="light">PAID</Badge>}
                    </Group>
                  ))}
                </Stack>
              ) : (
                <Text c="dimmed" size="sm">No exercises assigned yet.</Text>
              )
            )}
          </div>
        )}

        <Group mt="sm" gap="xs" wrap="wrap">
          {!owned && onBuy ? <Button onClick={() => onBuy(plan)} fullWidth>Buy</Button> : null}
          {owned && <Button variant="light" fullWidth>Open plan</Button>}
          {onEdit ? <Button variant="light" onClick={() => onEdit(plan)}>Edit</Button> : null}
          {onArchive ? <Button variant="subtle" color="red" onClick={() => onArchive(plan)}>Archive</Button> : null}
        </Group>
      </Stack>
    </Card>
  );
}