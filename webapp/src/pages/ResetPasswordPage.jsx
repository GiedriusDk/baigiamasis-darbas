import { useState } from "react";
import {
  Card, Title, Text, PasswordInput, Button,
  Stack, Group, Anchor, Progress
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Link, useSearchParams } from "react-router-dom";

const BASE = "http://localhost:8080/api/auth";

function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s += 33;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 33;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s += 34;
  return Math.min(100, s);
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const disabled = !token || !email;

  async function onSubmit(e) {
    e.preventDefault();
    if (disabled) return;

    if (!password || password.length < 8) {
      notifications.show({ color: "red", message: "Password must be at least 8 characters." });
      return;
    }
    if (password !== confirm) {
      notifications.show({ color: "red", message: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BASE}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          password,
          password_confirmation: confirm,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        notifications.show({
          color: "green",
          message: "Password changed. You can now sign in.",
        });
      } else {
        notifications.show({
          color: "red",
          message: data?.message || "Could not reset password.",
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
          <Title order={2}>Reset Password</Title>
          <Text c="dimmed">
            {disabled
              ? "The reset link is invalid or incomplete."
              : `Reset password for ${email}`}
          </Text>

          <form onSubmit={onSubmit}>
            <Stack gap="xs">
              <PasswordInput
                label="New password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                disabled={disabled}
                required
              />
              <Progress value={strength(password)} mt={-4} aria-label="Password strength" />
              <PasswordInput
                label="Confirm new password"
                placeholder="Repeat new password"
                value={confirm}
                onChange={(e) => setConfirm(e.currentTarget.value)}
                disabled={disabled}
                required
              />

              <Group justify="space-between" mt="sm">
                <Anchor component={Link} to="/login">Back to Sign in</Anchor>
                <Button type="submit" loading={loading} disabled={disabled}>
                  Reset password
                </Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Card>
    </div>
  );
}