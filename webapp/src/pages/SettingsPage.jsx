import { useEffect, useState } from 'react';
import {
  Card, Title, Text, TextInput, PasswordInput,
  Button, Group, Stack, Divider
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

import {
  updateMe,
  updateEmail,
  updatePassword,
  logout,
} from '../api/auth';

export default function SettingsPage() {
  const { user, ready, setUser } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');

  const [currentPassForEmail, setCurrentPassForEmail] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const [nameErr, setNameErr] = useState('');
  const [nameLoading, setNameLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  if (!ready) {
    return (
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Text>Loading…</Text>
      </Card>
    );
  }

  async function onSaveName(e) {
    e.preventDefault();
    setNameErr('');
    setNameLoading(true);
    try {
      if (!firstName.trim() || !lastName.trim()) {
        setNameErr('First and last name are required.');
        return;
      }
      const updated = await updateMe({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      setUser((prev) => ({
        ...(prev || {}),
        ...updated,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      }));
      notifications.show({ color: 'green', message: 'Name updated.' });
    } catch (err) {
      setNameErr(err.message || 'Failed to update name');
      notifications.show({ color: 'red', message: err.message });
    } finally {
      setNameLoading(false);
    }
  }

  async function onSaveEmail(e) {
    e.preventDefault();
    setEmailErr('');
    setEmailLoading(true);
    try {
      if (!email.trim()) {
        setEmailErr('Email is required.');
        return;
      }
      if (!currentPassForEmail) {
        setEmailErr('Current password is required.');
        return;
      }
      await updateEmail({ email: email.trim(), password: currentPassForEmail });
      setUser((prev) => ({ ...(prev || {}), email: email.trim() }));
      setCurrentPassForEmail('');
      notifications.show({ color: 'green', message: 'Email updated.' });
    } catch (err) {
      setEmailErr(err.message || 'Failed to update email');
      notifications.show({ color: 'red', message: err.message });
    } finally {
      setEmailLoading(false);
    }
  }

  async function onSavePassword(e) {
    e.preventDefault();
    setPwdErr('');
    setPwdLoading(true);
    try {
      if (!currentPassword) {
        setPwdErr('Current password is required.');
        return;
      }
      if (!newPassword || newPassword.length < 8) {
        setPwdErr('New password must be at least 8 characters.');
        return;
      }
      if (newPassword !== repeatPassword) {
        setPwdErr('Passwords do not match.');
        return;
      }
      const res = await updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: repeatPassword,
      });
      notifications.show({ color: 'green', message: res.message || 'Password updated.' });
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setPwdErr(err.message || 'Failed to update password');
      notifications.show({ color: 'red', message: err.message });
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <Stack gap="lg" maw={720} mx="auto">
      <Title order={2}>Account settings</Title>

      <Card withBorder radius="md" p="lg">
        <Title order={4} mb="sm">Update name</Title>
        <form onSubmit={onSaveName}>
          <Group align="flex-start" wrap="nowrap" gap="md">
            <TextInput
              label="First name"
              placeholder="Enter first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              error={nameErr}
              style={{ flex: 1 }}
            />
            <TextInput
              label="Last name"
              placeholder="Enter last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              error={nameErr}
              style={{ flex: 1 }}
            />
            <Button type="submit" loading={nameLoading} mt="xl">
              Save
            </Button>
          </Group>
        </form>
      </Card>

      <Card withBorder radius="md" p="lg">
        <Title order={4} mb="sm">Update email</Title>
        <form onSubmit={onSaveEmail}>
          <Group align="flex-end" grow>
            <TextInput
              label="New email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={emailErr}
            />
            <PasswordInput
              label="Current password"
              placeholder="••••••••"
              value={currentPassForEmail}
              onChange={(e) => setCurrentPassForEmail(e.target.value)}
            />
            <Button type="submit" loading={emailLoading}>
              Save
            </Button>
          </Group>
        </form>
      </Card>

      <Card withBorder radius="md" p="lg">
        <Title order={4} mb="sm">Update password</Title>
        <form onSubmit={onSavePassword}>
          <Stack>
            <Group grow>
              <PasswordInput
                label="Current password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <PasswordInput
                label="New password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <PasswordInput
                label="Repeat new password"
                placeholder="Repeat new password"
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
              />
            </Group>
            {pwdErr && <Text c="red">{pwdErr}</Text>}
            <Group justify="flex-end">
              <Button type="submit" loading={pwdLoading} color="green">
                Save password
              </Button>
            </Group>
          </Stack>
        </form>
        <Divider my="md" />
        <Text size="xs" c="dimmed">
          Note: After updating your password you will be logged out and need to sign in again.
        </Text>
      </Card>
    </Stack>
  );
}