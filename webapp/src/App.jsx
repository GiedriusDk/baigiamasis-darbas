// webapp/src/App.jsx
import { useState, useEffect } from 'react';
import {
  AppShell, Burger, Group, NavLink, ScrollArea, Title,
  Menu, Avatar, Loader, Button
} from '@mantine/core';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/useAuth';

import ExercisesPage from './pages/ExercisesPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import CoachProfilePage from './pages/CoachProfilePage.jsx';
import CoachExercisesPage from './pages/CoachExercisesPage.jsx';

import { getCoachProfile } from './api/profiles';  

function Home() {
  return <Title order={3}>Home</Title>;
}

function HeaderRight() {
  const { user, ready, doLogout } = useAuth();
  const [avatar, setAvatar] = useState('');
  const [displayName, setDisplayName] = useState('');

  // inicijuojam pagal konteksto user
  useEffect(() => {
    setDisplayName(user?.name || user?.email || '');
  }, [user]);

  // avatar kaip buvo
  useEffect(() => {
    async function load() {
      if (!ready || !user) { setAvatar(''); return; }
      try {
        const p = await getCoachProfile();
        setAvatar(p?.avatar_path || '');
      } catch { setAvatar(''); }
    }
    load();
  }, [ready, user]);

  // klausom profilio avataro
  useEffect(() => {
    const onProfileUpdated = (e) => setAvatar(e.detail?.avatar || '');
    window.addEventListener('profile:updated', onProfileUpdated);
    return () => window.removeEventListener('profile:updated', onProfileUpdated);
  }, []);

  // klausom vardo pakeitimo
  useEffect(() => {
    const onAuthUpdated = (e) => {
      if (e.detail?.name) setDisplayName(e.detail.name);
    };
    window.addEventListener('auth:updated', onAuthUpdated);
    return () => window.removeEventListener('auth:updated', onAuthUpdated);
  }, []);

  if (!ready) return <Loader size="sm" />;
  if (!user) return <Button component={Link} to="/login" variant="light">Join Us</Button>;

  const initial = (displayName || '?')[0]?.toUpperCase() || '?';

  return (
    <Menu>
      <Menu.Target>
        <Group gap="xs" style={{ cursor: 'pointer' }}>
          <Avatar radius="xl" src={avatar || undefined}>
            {!avatar && initial}
          </Avatar>
          <span>{displayName}</span>
        </Group>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item component={Link} to="/">Home</Menu.Item>
        <Menu.Item onClick={doLogout} c="red">Logout</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

// Guard – leidžia tik prisijungusiems
function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Loader size="sm" />;
  return user ? children : <Navigate to="/login" replace />;
}

function AppInner() {
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const { user, ready } = useAuth();

  // ar vartotojas turi coach rolę?
  const isCoach = !!user?.roles?.some(r => r.name === 'coach');

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="lg"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={() => setOpened(o => !o)} hiddenFrom="sm" />
            <Title order={3}>Fit Plans</Title>
          </Group>
          <HeaderRight />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <ScrollArea type="always" offsetScrollbars>
          <NavLink component={Link} to="/" label="Pagrindinis" active={location.pathname === '/'} />
          <NavLink component={Link} to="/plans" label="Sugeneruoti planą" active={location.pathname === '/plans'} />
          <NavLink component={Link} to="/my" label="Mano planas" active={location.pathname === '/my'} />
          <NavLink component={Link} to="/exercises" label="Pratimai" active={location.pathname.startsWith('/exercises')} />

          {ready && isCoach && (
            <>
              <NavLink
                component={Link}
                to="/coach/profile"
                label="Coach profile"
                active={location.pathname.startsWith('/coach/profile')}
              />
              <NavLink
                component={Link}
                to="/coach/exercises"
                label="Coach exercises"
                active={location.pathname.startsWith('/coach/exercises')}
              />
            </>
          )}

          <NavLink component={Link} to="/billing" label="Apmokėjimai" active={location.pathname === '/billing'} />
          <NavLink component={Link} to="/settings" label="Nustatymai" active={location.pathname === '/settings'} />
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Coach pages – apsaugoti */}
          <Route
            path="/coach/profile"
            element={
              <RequireAuth>
                <CoachProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/coach/exercises"
            element={
              <RequireAuth>
                <CoachExercisesPage />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}