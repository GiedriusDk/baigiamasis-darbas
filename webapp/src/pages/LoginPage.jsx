// webapp/src/pages/LoginPage.jsx
import { useState } from 'react';
import { Button, Card, PasswordInput, TextInput, Title, Alert, Anchor, Group } from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export default function LoginPage() {
  const { doLogin } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      await doLogin(email, password);
      nav('/');
    } catch (e) {
      setErr(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card maw={520} mx="auto" withBorder radius="lg" p="lg">
      <Title order={2} mb="md">Sign in</Title>
      {err && <Alert color="red" mb="md">{err}</Alert>}

      <form onSubmit={onSubmit}>
        <TextInput label="Email" type="email" required value={email} onChange={(e) => setEmail(e.currentTarget.value)} mb="sm" />
        <PasswordInput label="Password" required value={password} onChange={(e) => setPassword(e.currentTarget.value)} mb="md" />
        <Button fullWidth type="submit" loading={loading}>Sign in</Button>
      </form>

      <Group justify="center" mt="md">
        <Anchor component={Link} to="/register">Create an account</Anchor>
      </Group>
    </Card>
  );
}