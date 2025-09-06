import { useState } from 'react'
import { AppShell, Burger, Button, Group, NavLink, ScrollArea, Title } from '@mantine/core'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import ExercisesPage from './pages/ExercisesPage.jsx'

function Home() {
  return <Title order={3}>Pagrindinis</Title>
}

export default function App() {
  const [opened, setOpened] = useState(false)
  const location = useLocation()

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="lg"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="sm">
            <Burger opened={opened} onClick={() => setOpened((o) => !o)} hiddenFrom="sm" />
            <Title order={3}>Fit Plans</Title>
          </Group>
          <Group>
            <Button variant="light">Prisijungti</Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <ScrollArea type="always" offsetScrollbars>
          <NavLink component={Link} to="/" label="Pagrindinis" active={location.pathname === '/'} />
          <NavLink component={Link} to="/plans" label="Sugeneruoti planą" active={location.pathname === '/plans'} />
          <NavLink component={Link} to="/my" label="Mano planas" active={location.pathname === '/my'} />
          <NavLink component={Link} to="/exercises" label="Pratimai" active={location.pathname.startsWith('/exercises')} />
          <NavLink component={Link} to="/coaches" label="Treneriai" active={location.pathname === '/coaches'} />
          <NavLink component={Link} to="/billing" label="Apmokėjimai" active={location.pathname === '/billing'} />
          <NavLink component={Link} to="/settings" label="Nustatymai" active={location.pathname === '/settings'} />
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exercises" element={<ExercisesPage />} />
          {/* kiti maršrutai vėliau */}
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}