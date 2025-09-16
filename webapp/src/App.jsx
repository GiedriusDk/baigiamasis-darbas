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
import { getCoachProfile, getUserProfile } from './api/profiles'; 

import UserProfilePage from './pages/UserProfilePage.jsx';

import CoachesListPage from './pages/CoachesListPage.jsx';
import CoachPublicPage from './pages/CoachPublicPage.jsx';

function Home() {
  return <Title order={3}>Home</Title>;
}

function HeaderRight() {
  const { user, ready, doLogout } = useAuth();
  const [avatar, setAvatar] = useState('');

  // Užkraunam avatarą – coach arba user
  useEffect(() => {
    async function load() {
      if (!ready || !user) { setAvatar(''); return; }

      let url = '';
      try {
        const isCoach = !!user?.roles?.some(r => r.name === 'coach');
        if (isCoach) {
          const cp = await getCoachProfile().catch(() => null);
          url = cp?.avatar_path || cp?.avatar_url || '';
        }
        if (!url) {
          const up = await getUserProfile().catch(() => null);
          url = up?.avatar_path || '';
        }
      } finally {
        setAvatar(url || '');
      }
    }
    load();
  }, [ready, user]);

  // Reaguojam į avataro atnaujinimą
  useEffect(() => {
    const onUpdated = (e) => setAvatar(e.detail?.avatar || '');
    window.addEventListener('profile:updated', onUpdated);
    return () => window.removeEventListener('profile:updated', onUpdated);
  }, []);

  if (!ready) return <Loader size="sm" />;
  if (!user) return <Button component={Link} to="/login" variant="light">Join Us</Button>;

  const initial = (user.name || user.email || '?')[0]?.toUpperCase() || '?';

  return (
    <Menu>
      <Menu.Target>
        <Group gap="xs" style={{ cursor: 'pointer' }}>
          <Avatar radius="xl" src={avatar || undefined}>
            {!avatar && initial}
          </Avatar>
          <span>{user.name || user.email}</span>
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
          <NavLink component={Link} to="/exercises" label="Exercises" active={location.pathname.startsWith('/exercises')} />
          
          <NavLink component={Link} to="/coaches" label="Coaches" active={location.pathname.startsWith('/coaches')} />

          {ready && !isCoach && (
            <>
              <NavLink
                component={Link}
                to="/profile"
                label="My profile"
                active={location.pathname.startsWith('/profile')}
              />
            </>
          )}

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
          <Route path="/coaches" element={<CoachesListPage />} />
          <Route path="/coaches/:id" element={<CoachPublicPage />} /> 

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
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <UserProfilePage />
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