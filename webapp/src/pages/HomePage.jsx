import {
  Container,
  Group,
  Title,
  Text,
  Card,
  SimpleGrid,
  Badge,
} from "@mantine/core";
import {
  IconBarbell,
  IconChartLine,
  IconUsers,
  IconMessageCircle,
  IconCalendar,
} from "@tabler/icons-react";

export default function HomePage() {
  return (
    <Container size="lg" py="md">
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Title order={2}>Fit Plans</Title>
          <Text c="dimmed" mt={4}>
            Centralizuota treniruočių planavimo ir sportininkų bendradarbiavimo sistema.
          </Text>
        </div>

        <Badge variant="light">System overview</Badge>
      </Group>

      <Card withBorder radius="md" p="md" mb="md">
        <Title order={4}>Sistemos paskirtis</Title>
        <Text c="dimmed" size="sm" mt={6}>
          Fit Plans sistema skirta sportininkams ir treneriams, siekiantiems efektyviai
          planuoti treniruotes, stebėti progresą ir palaikyti nuolatinį tarpusavio ryšį
          vienoje integruotoje platformoje.
        </Text>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        <Card withBorder radius="md" p="md">
          <Group gap="sm">
            <IconBarbell size={28} />
            <Title order={5}>Treniruočių planai</Title>
          </Group>
          <Text c="dimmed" size="sm" mt={6}>
            Sistema leidžia kurti, administruoti ir automatiškai generuoti individualius
            treniruočių planus pagal sportininko tikslus ir galimybes.
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group gap="sm">
            <IconChartLine size={28} />
            <Title order={5}>Progreso stebėjimas</Title>
          </Group>
          <Text c="dimmed" size="sm" mt={6}>
            Naudotojai gali sekti savo fizinius rodiklius, treniruočių rezultatus ir
            ilgalaikį progresą, pasitelkiant struktūrizuotą duomenų kaupimą.
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group gap="sm">
            <IconUsers size={28} />
            <Title order={5}>Trenerių ekosistema</Title>
          </Group>
          <Text c="dimmed" size="sm" mt={6}>
            Treneriai turi galimybę valdyti klientus, teikti skaitmenines paslaugas,
            kurti treniruočių programas ir bendrauti su sportininkais.
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group gap="sm">
            <IconMessageCircle size={28} />
            <Title order={5}>Komunikacija</Title>
          </Group>
          <Text c="dimmed" size="sm" mt={6}>
            Integruota pokalbių sistema užtikrina tiesioginį ir asinchroninį bendravimą
            tarp sportininkų ir trenerių.
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group gap="sm">
            <IconCalendar size={28} />
            <Title order={5}>Planavimas</Title>
          </Group>
          <Text c="dimmed" size="sm" mt={6}>
            Sistema palaiko treniruočių struktūrizavimą laike, leidžiant aiškiai planuoti
            treniruočių ciklus ir krūvio paskirstymą.
          </Text>
        </Card>
      </SimpleGrid>
    </Container>
  );
}