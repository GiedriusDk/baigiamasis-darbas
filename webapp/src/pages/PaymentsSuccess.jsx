import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Loader,
  Alert,
  ThemeIcon,
} from "@mantine/core";
import { IconCircleCheck, IconAlertCircle, IconArrowRight } from "@tabler/icons-react";
import { confirm } from "../api/payments";

export default function PaymentsSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const coachId = params.get("coach_id");      // ✅ IMAM IŠ URL
  const productId = params.get("product_id");  // optional, jei prireiks

  const [state, setState] = useState({
    loading: true,
    error: "",
    ok: false,
  });

  useEffect(() => {
    const order = params.get("order");
    const session = params.get("session_id") || params.get("session");

    if (!order || !session) {
      setState({
        loading: false,
        error: "Missing required parameters (order/session_id).",
        ok: false,
      });
      return;
    }

    confirm(order, session)
      .then(() => setState({ loading: false, error: "", ok: true }))
      .catch((e) =>
        setState({
          loading: false,
          error: e?.message || "Failed to confirm payment.",
          ok: false,
        })
      );
  }, [params]);

  return (
    <Container size="sm" py="xl">
      <Paper withBorder radius="lg" p="xl">
        {state.loading && (
          <Stack align="center" gap="sm">
            <Loader />
            <Title order={3}>Processing payment…</Title>
            <Text c="dimmed" ta="center">
              Please wait while we verify the payment status.
            </Text>
          </Stack>
        )}

        {!state.loading && state.error && (
          <Stack gap="md">
            <Group gap="sm" align="center">
              <ThemeIcon color="red" variant="light" radius="xl" size="lg">
                <IconAlertCircle size={18} />
              </ThemeIcon>
              <div>
                <Title order={3}>Payment confirmation failed</Title>
                <Text c="dimmed" size="sm">
                  If the problem persists, please try again or contact support.
                </Text>
              </div>
            </Group>

            <Alert color="red" variant="light" icon={<IconAlertCircle size={16} />}>
              {state.error}
            </Alert>

            <Group justify="flex-end">
              <Button variant="default" onClick={() => navigate("/")}>
                Go home
              </Button>
              <Button onClick={() => navigate("/plans")}>Try again</Button>
            </Group>
          </Stack>
        )}

        {!state.loading && !state.error && state.ok && (
          <Stack gap="md">
            <Group gap="sm" align="center">
              <ThemeIcon color="green" variant="light" radius="xl" size="lg">
                <IconCircleCheck size={18} />
              </ThemeIcon>
              <div>
                <Title order={3}>Payment confirmed</Title>
                <Text c="dimmed" size="sm">
                  Thank you! You can now continue and access your plan.
                </Text>
              </div>
            </Group>

            <Group justify="flex-end">
              <Button variant="default" onClick={() => navigate("/")}>
                Go home
              </Button>

              <Button
                rightSection={<IconArrowRight size={16} />}
                onClick={() => navigate(coachId ? `/coaches/${coachId}` : "/coaches")}
              >
                Back to coach
              </Button>
            </Group>
          </Stack>
        )}
      </Paper>
    </Container>
  );
}