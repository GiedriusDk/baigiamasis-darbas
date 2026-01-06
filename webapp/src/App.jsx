import { useState, useEffect, useMemo } from 'react';
import {
  AppShell, Burger, Group, NavLink, ScrollArea, Title,
  Menu, Avatar, Loader, Button
} from '@mantine/core';
import { Routes, Route, Link, useLocation, Navigate, useParams } from 'react-router-dom';

import { AuthProvider, useAuth } from './auth/useAuth';

import SettingsPage from "./pages/Settings/SettingsPage.jsx";
import ExercisesPage from './pages/Catalog/ExercisesPage.jsx';
import RegisterPage from './pages/Auth/RegisterPage.jsx';
import LoginPage from './pages/Auth/LoginPage.jsx';
import CoachProfilePage from './pages/Coach/CoachProfilePage.jsx';
import CoachExercisesPage from './pages/Coach/Exercises/CoachExercisesPage.jsx';
import { getCoachProfile, getUserProfile } from './api/profiles';
import UserProfilePage from './pages/User/UserProfilePage.jsx';
import CoachesListPage from './pages/Coach/CoachesListPage.jsx';
import CoachPublicPage from './pages/Coach/CoachPublicPage.jsx';
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/Auth/ResetPasswordPage.jsx";

import PlannerPage from "./pages/User/Plan/PlannerPage.jsx";
import MyPlanPage from "./pages/MyPlanPage.jsx";

import CoachPlansPublic from "./pages/Coach/Plans/CoachPlansPublic.jsx";
import CoachPlansManage from "./pages/Coach/Plans/CoachPlansManage.jsx";
import PaymentsSuccess from "./pages/Payments/PaymentsSuccess.jsx";
import PaymentsCancel from "./pages/Payments/PaymentsCancel.jsx";
import CoachPlanEditor from "./pages/Coach/Plans/CoachPlanEditor.jsx";
import PlanViewPage from "./pages/User/Plan/PlanViewPage.jsx";
import { setChatDebug, presenceTouch } from './api/chat';
import CoachFloatingInbox from "./components/CoachFloatingInbox";
import UserFloatingInbox from "./components/UserFloatingInbox";
import usePresenceHeartbeat from './hooks/usePresenceHeartbeat';

import ProgressHome from './pages/Progress/ProgressHome.jsx';
import MetricsPage from './pages/Progress/MetricsPage.jsx';
import MetricDetailsPage from './pages/Progress/MetricDetailsPage.jsx';
import GoalsPage from './pages/Progress/GoalsPage.jsx';

import ForumsPage from "./pages/Community/ForumsPage.jsx";
import UserPlanBuilder from './pages/UserPlanBuilder.jsx';
import CoachClientsPage from './pages/Coach/CoachClientsPage.jsx';
import OAuthCallbackPage from "./pages/Auth/OAuthCallbackPage.jsx";
import ChooseRolePage from "./pages/Auth/ChooseRolePage.jsx";

import AdminHomePage from "./pages/Admin/AdminHomePage.jsx";

setChatDebug(true);

function Home() {
  return <Title order={3}>Home</Title>;
}

function CoachPublicRoute() {
  const { id } = useParams();
  return <CoachPlansPublic coachId={id} />;
}

function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Loader size="sm" />;
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />;
}

function RequireAdmin({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <Loader size="sm" />;

  const isAdmin = !!user?.roles?.some(r => r.name === 'admin');

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function HeaderRight() {
  const { user, ready, doLogout } = useAuth();
  const [avatar, setAvatar] = useState('');

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

  useEffect(() => {
    const onUpdated = (e) => setAvatar(e.detail?.avatar || '');
    window.addEventListener('profile:updated', onUpdated);
    return () => window.removeEventListener('profile:updated', onUpdated);
  }, []);

  if (!ready) return <Loader size="sm" />;
  if (!user) return <Button component={Link} to="/login" variant="light">Join Us</Button>;
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  const initial = ((user?.name || user?.email || '?')[0] || '?').toUpperCase();

  return (
    <Menu>
      <Menu.Target>
        <Group gap="xs" style={{ cursor: 'pointer' }}>
          <Avatar radius="xl" src={avatar || undefined}>{!avatar && initial}</Avatar>
          <span>{fullName || user.email}</span>
        </Group>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item component={Link} to="/">Home</Menu.Item>
        <Menu.Item component={Link} to="/settings">Settings</Menu.Item>
        <Menu.Divider />
        <Menu.Item onClick={doLogout} c="red">Logout</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

function AppInner() {
  const [opened, setOpened] = useState(false);
  const location = useLocation();
  const { user, ready } = useAuth();

  const isCoach = !!user?.roles?.some(r => r.name === 'coach');
  const isAdmin = !!user?.roles?.some(r => r.name === 'admin');
  const UserArea = !!user && (!isCoach || isAdmin);
  const CoachArea = !!user && (isCoach || isAdmin);

  const coachIdFromUrl = useMemo(() => {
    const m = location.pathname.match(/^\/coaches\/(\d+)/);
    return m ? Number(m[1]) : null;
  }, [location.pathname]);

  usePresenceHeartbeat({ intervalMs: 60000, fireImmediately: true });

  useEffect(() => {
    if (ready && user) presenceTouch().catch(() => {});
  }, [ready, user]);

  useEffect(() => {
    if (ready && user) presenceTouch().catch(() => {});
  }, [location.pathname, ready, user]);

  useEffect(() => {
    function onFocus() {
      if (ready && user) presenceTouch().catch(() => {});
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [ready, user]);

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
          <NavLink component={Link} to="/" label="Home" active={location.pathname === '/'} />
          <NavLink component={Link} to="/exercises" label="Exercises" active={location.pathname.startsWith('/exercises')} />

          {ready && UserArea && (
            <>
              <NavLink component={Link} to="/plans" label="Generate Plan" active={location.pathname === '/plans'} />
              <NavLink component={Link} to="/my" label="My plan" active={location.pathname === '/my'} />
              <NavLink component={Link} to="/plan-builder" label="Plan Builder" active={location.pathname === '/plan-builder'} />
              <NavLink component={Link} to="/progress" label="Progress" active={location.pathname === '/progress'} />
            </>
          )}

          <NavLink component={Link} to="/coaches" label="Coaches" active={location.pathname.startsWith('/coaches')} />

          {ready && UserArea && (
            <NavLink component={Link} to="/profile" label="My profile" active={location.pathname.startsWith('/profile')} />
          )}

          {ready && CoachArea && (
            <>
              <NavLink component={Link} to="/coach/exercises" label="Manage exercises" active={location.pathname.startsWith('/coach/exercises')} />
              <NavLink component={Link} to="/coach/plans/manage" label="Manage plans" active={location.pathname.startsWith('/coach/plans/manage')} />
              <NavLink component={Link} to="/coach/clients" label="My clients" active={location.pathname.startsWith('/coach/clients')} />
            </>
          )}

          {ready && isCoach && (
            <NavLink component={Link} to="/coach/profile" label="Profile" active={location.pathname.startsWith('/coach/profile')} />
          )}

          {ready && user && (
            <>
              <NavLink component={Link} to="/forum" label="Forum" active={location.pathname === '/forum'} />
              <NavLink component={Link} to="/settings" label="Settings" active={location.pathname === '/settings'} />
            </>
          )}

          {ready && isAdmin && (
            <NavLink
              component={Link}
              to="/admin"
              label="Admin"
              active={location.pathname.startsWith("/admin")}
            />
          )}
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/choose-role" element={<ChooseRolePage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/coaches" element={<CoachesListPage />} />
          <Route path="/coaches/:id" element={<CoachPublicPage />} />

          <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
          <Route path="/coach/profile" element={<RequireAuth><CoachProfilePage /></RequireAuth>} />
          <Route path="/coach/exercises" element={<RequireAuth><CoachExercisesPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><UserProfilePage /></RequireAuth>} />

          <Route path="/plans" element={<RequireAuth><PlannerPage /></RequireAuth>} />
          <Route path="/my" element={<RequireAuth><MyPlanPage /></RequireAuth>} />
          <Route path="/plan-builder" element={<RequireAuth><UserPlanBuilder /></RequireAuth>} />

          <Route path="/coach/:id/plans" element={<CoachPublicRoute />} />
          <Route path="/coach/plans/manage" element={<CoachPlansManage />} />
          <Route path="/payments/success" element={<PaymentsSuccess />} />
          <Route path="/payments/cancel" element={<PaymentsCancel />} />

          <Route path="/coach/plans/:productId/builder" element={<CoachPlanEditor />} />
          <Route path="/plans/:productId/" element={<PlanViewPage />} />

          <Route path="/forum" element={<RequireAuth><ForumsPage /></RequireAuth>} />

          <Route path="/progress" element={<RequireAuth><ProgressHome /></RequireAuth>} />
          <Route path="/progress/metrics" element={<RequireAuth><MetricsPage /></RequireAuth>} />
          <Route path="/progress/metric/:id" element={<RequireAuth><MetricDetailsPage /></RequireAuth>} />
          <Route path="/progress/goals" element={<RequireAuth><GoalsPage /></RequireAuth>} />
          <Route path="/coach/clients" element={<RequireAuth><CoachClientsPage /></RequireAuth>} />

          {/* Admin routas */}
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminHomePage />
              </RequireAdmin>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell.Main>

      {isCoach && <CoachFloatingInbox />}
      {!isCoach && <UserFloatingInbox />}
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