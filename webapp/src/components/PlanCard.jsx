import { Card, Stack, Group, Text, Badge, Button } from "@mantine/core";

function eur(priceCents, currency = "EUR") {
  const euros = Number(priceCents || 0) / 100;
  return new Intl.NumberFormat("lt-LT", { style: "currency", currency }).format(euros);
}

export default function PlanCard({ plan, onBuy, onEdit, onArchive }) {
  const hasWeeks = plan?.metadata && typeof plan.metadata === "object" && plan.metadata.weeks;

  return (
    <Card withBorder radius="lg" padding="md" shadow="sm">
      <Stack gap="xs">
        <Group justify="space-between" align="start">
          <Text fw={700} size="lg" style={{ lineHeight: 1.2 }}>
            {plan.title}
          </Text>
          <Badge size="lg" variant="light" color="blue">
            {eur(plan.price, plan.currency || "EUR")}
          </Badge>
        </Group>

        {plan.description ? (
          <Text c="dimmed" size="sm">
            {plan.description}
          </Text>
        ) : null}

        <Group gap="xs" mt="xs" wrap="wrap">
          {plan.currency ? (
            <Badge variant="outline">{String(plan.currency).toUpperCase()}</Badge>
          ) : null}
          {hasWeeks ? <Badge variant="dot">{plan.metadata.weeks} WEEKS</Badge> : null}
        </Group>

        <Group mt="sm" gap="xs" wrap="wrap">
          {onBuy ? (
            <Button onClick={() => onBuy(plan)} fullWidth>
              Buy
            </Button>
          ) : null}
          {onEdit ? (
            <Button variant="light" onClick={() => onEdit(plan)}>
              Edit
            </Button>
          ) : null}
          {onArchive ? (
            <Button variant="subtle" color="red" onClick={() => onArchive(plan)}>
              Archive
            </Button>
          ) : null}
        </Group>
      </Stack>
    </Card>
  );
}