import { useState } from "react";
import {
  Card, Title, Text, TextInput, Button,
  Stack, Group, Anchor
} from "@mantine/core";
import { IconMail } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { Link } from "react-router-dom";

const BASE = "http://localhost:8080/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        notifications.show({
          color: "green",
          message:
            "If this email exists, a reset link has been sent.",
        });
        setEmail("");
      } else {
        notifications.show({
          color: "red",
          message: data?.message || "Could not send reset link.",
        });
      }
    } catch {
      notifications.show({ color: "red", message: "Server error." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      <Card withBorder radius="md" p="xl">
        <Stack gap="md">
          <Title order={2}>Forgot Password</Title>
          <Text c="dimmed">
            Enter the email address you used to create your account and we’ll send you a reset link.
          </Text>

          <form onSubmit={onSubmit}>
            <Stack gap="sm">
              <TextInput
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                leftSection={<IconMail size={16} />}
                required
              />

              <Group justify="space-between" mt="xs">
                <Anchor component={Link} to="/login">Back to Sign in</Anchor>
                <Button type="submit" loading={loading}>
                  Send reset link
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Card>
    </div>
  );
}