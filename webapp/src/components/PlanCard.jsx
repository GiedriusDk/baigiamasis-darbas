import { Card, Stack, Text, Group, Button, Badge } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function PlanCard({ plan, onEdit, onArchive, owned, onBuy }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const price = typeof plan.price === "number" ? (plan.price / 100).toFixed(2) : "";
  const productId = plan.product_id ?? plan.id;

  const isCoachOwner = user && Number(user.id) === Number(plan.coach_id);
  const isOwned = typeof owned === "boolean" ? owned : !!plan.owned;
  const canView = isCoachOwner || isOwned;

  const handleView = () => {
    if (!canView) return;
    if (isCoachOwner) navigate(`/coach/plans/${productId}/builder`);
    else navigate(`/plans/${productId}`);
  };

  return (
    <Card withBorder radius="lg" p="md">
      <Stack gap="xs">
        <Group justify="space-between" align="start">
          <Text fw={700} lineClamp={1}>{plan.title}</Text>
          {price && <Badge variant="light">{price} {plan.currency || "EUR"}</Badge>}
        </Group>

        {plan.description && (
          <Text c="dimmed" size="sm" lineClamp={2}>{plan.description}</Text>
        )}

        <Group justify="space-between" mt="xs">
          {isOwned ? (
            <Badge color="green" variant="light">Owned</Badge>
          ) : (
            <Badge color="gray" variant="outline">Not owned</Badge>
          )}

          <Group gap="xs">
            {onBuy && !canView && (
              <Button size="xs" onClick={onBuy}>
                Buy
              </Button>
            )}

            {onEdit && isCoachOwner && (
              <Button size="xs" variant="light" onClick={() => onEdit(plan)}>
                Edit
              </Button>
            )}

            {onArchive && isCoachOwner && (
              <Button
                size="xs"
                variant="subtle"
                color="red"
                onClick={() => onArchive(plan)}
              >
                Archive
              </Button>
            )}

            {canView && (
              <Button size="xs" variant="default" onClick={handleView}>
                View contents
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Card>
  );
}