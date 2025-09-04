import { useState } from 'react'
import { AppShell, Burger, Button, Code, Group, NavLink, ScrollArea, Text, Title, Card, Stack, Loader } from '@mantine/core'
import { pingCatalog } from './api'

export default function App() {
  const [opened, setOpened] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resp, setResp] = useState(null)
  const [err, setErr] = useState(null)

  async function handlePing() {
    setLoading(true); setErr(null)
    try {
      const data = await pingCatalog()
      setResp(data)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

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
          <NavLink label="Pagrindinis" active />
          <NavLink label="Sugeneruoti planą" />
          <NavLink label="Mano planas" />
          <NavLink label="Treneriai" />
          <NavLink label="Apmokėjimai" />
          <NavLink label="Nustatymai" />
        </ScrollArea>
      </AppShell.Navbar>

      <AppShell.Main>
        <Stack gap="lg">
          <Card withBorder padding="lg" radius="lg">
            <Title order={3} mb="xs">Mini demo</Title>
            <Text c="dimmed" mb="md">
              Šis mygtukas kviečia Laravel <Code>/catalog/api/health</Code> per gateway.
            </Text>
            <Group>
              <Button onClick={handlePing} disabled={loading}>
                {loading ? <Group gap={8}><Loader size="xs" /> Kviečiame…</Group> : 'Ping mikropaslaugą'}
              </Button>
              {err && <Text c="red">Klaida: {err}</Text>}
            </Group>

            {resp && (
              <Card mt="md" withBorder radius="md">
                <Text fw={600} mb={6}>Atsakymas:</Text>
                <Code block>{JSON.stringify(resp, null, 2)}</Code>
              </Card>
            )}
          </Card>

          <Card withBorder padding="lg" radius="lg">
            <Title order={4} mb="sm">Šios savaitės planas (vietos laikiklis)</Title>
            <Text c="dimmed" mb="md">Čia vėliau atsiras kortelės iš <Code>/plans/api/generate</Code>.</Text>
            <Group>
              <Button variant="light">Generuoti planą</Button>
              <Button variant="outline">Pakeisti pratimą</Button>
            </Group>
          </Card>
        </Stack>
      </AppShell.Main>
    </AppShell>
  )
}
