// webapp/src/pages/RegisterPage.jsx
import { useState } from 'react';
import {
  Button, Card, PasswordInput, TextInput, Title, Alert, Anchor, Group, SegmentedControl
} from '@mantine/core'; // ← pridėjome SegmentedControl
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

export default function RegisterPage() {
  const { doRegister } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user', // ← numatytoji rolė
  });
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      await doRegister(
        form.name,
        form.email,
        form.password,
        form.password_confirmation,
        form.role,              // ← perduodame rolę
      );
      nav('/');
    } catch (e) {
      setErr(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card maw={520} mx="auto" withBorder radius="lg" p="lg">
      <Title order={2} mb="md">Register</Title>
      {err && <Alert color="red" mb="md">{err}</Alert>}

      <form onSubmit={onSubmit}>
        <TextInput
          label="Name" required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
          mb="sm"
        />
        <TextInput
          label="Email" type="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
          mb="sm"
        />
        <PasswordInput
          label="Password" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.currentTarget.value })}
          mb="sm"
        />
        <PasswordInput
          label="Repeat password" required value={form.password_confirmation}
          onChange={(e) => setForm({ ...form, password_confirmation: e.currentTarget.value })}
          mb="md"
        />

        {/* Role selector */}
        <SegmentedControl
          fullWidth
          value={form.role}
          onChange={(value) => setForm({ ...form, role: value })}
          data={[
            { label: 'User', value: 'user' },
            { label: 'Coach', value: 'coach' },
          ]}
          mb="md"
        />

        <Button fullWidth type="submit" loading={loading}>Register</Button>
      </form>

      <Group justify="center" mt="md">
        <Anchor component={Link} to="/login">Already have an account? Sign in</Anchor>
      </Group>
    </Card>
  );
}