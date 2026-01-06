import { useState } from 'react';
import {
  Card, Title, Text, TextInput, PasswordInput,
  Button, Group, Anchor, Stack
} from '@mantine/core';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { login, me as fetchMe, setToken } from '../../api/auth';
import { useAuth } from '../../auth/useAuth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ email: email.trim(), password });
      if (res?.token) setToken(res.token);

      const user = await fetchMe();
      setUser?.(user);

      notifications.show({ color: 'green', message: 'Signed in.' });
      navigate(from, { replace: true });
    } catch (err) {
      notifications.show({ color: 'red', message: err.message || 'Login failed' });
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    try {
      const r = await fetch("http://localhost:8080/api/auth/google/redirect");
      const data = await r.json();
      if (!data?.url) throw new Error("No redirect URL returned");
      window.location.href = data.url;
    } catch (e) {
      notifications.show({ color: "red", message: e.message || "Google login failed" });
    }
  }

  return (



    <Card maw={520} mx="auto" mt="xl" withBorder radius="md" p="lg">


      <Title order={3} mb="md">Sign in</Title>

      <form onSubmit={onSubmit}>
        <Stack>
          <TextInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
          />
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
          />

          <Group justify="space-between" mt="xs">
            <Anchor component={Link} to="/forgot-password" size="sm">
              Forgot your password?
            </Anchor>

            <Button variant="default" onClick={onGoogle}>
              Continue with Google
            </Button>

            <Button type="submit" loading={loading}>
              Sign in
            </Button>
          </Group>

          <Text size="sm" c="dimmed">
            Don’t have an account?{' '}
            <Anchor component={Link} to="/register">Create an account</Anchor>
          </Text>
        </Stack>
      </form>
    </Card>
  );
}