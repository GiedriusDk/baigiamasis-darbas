import { useState } from 'react';
import {
  Button, Card, PasswordInput, TextInput, Title, Alert, Anchor, Group, SegmentedControl
} from '@mantine/core';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

export default function RegisterPage() {
  const { doRegister } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: 'user',
  });
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await doRegister({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        role: form.role,
      });
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
          label="First name" required value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.currentTarget.value })}
          mb="sm"
        />
        <TextInput
          label="Last name" required value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.currentTarget.value })}
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