import { useSearchParams, Link } from "react-router-dom";
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  ThemeIcon,
  Alert,
} from "@mantine/core";
import { IconX, IconAlertCircle } from "@tabler/icons-react";

export default function PaymentsCancel() {
  const [params] = useSearchParams();
  const order = params.get("order");

  return (
    <Container size="sm" py="xl">
      <Paper withBorder radius="lg" p="xl">
        <Stack gap="md">
          <Group gap="sm" align="center">
            <ThemeIcon color="red" variant="light" radius="xl" size="lg">
              <IconX size={18} />
            </ThemeIcon>
            <div>
              <Title order={3}>Payment cancelled</Title>
              <Text c="dimmed" size="sm">
                The payment was not completed. You can try again.
              </Text>
            </div>
          </Group>

          {order ? (
            <Alert color="yellow" variant="light" icon={<IconAlertCircle size={16} />}>
              Order #{order} remains unpaid (pending).
            </Alert>
          ) : null}

          <Group justify="flex-end">
            <Button component={Link} to="/" variant="default">
              Go to home
            </Button>
            <Button component={Link} to="/plans">
              Back to plans
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Container>
  );
}