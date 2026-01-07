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
            A centralized training planning and athlete collaboration platform.
          </Text>
        </div>

        <Badge variant="light">System overview</Badge>
      </Group>

      <Card withBorder radius="md" p="md" mb="md">
        <Title order={4}>System purpose</Title>
        <Text c="dimmed" size="sm" mt={6}>
          Fit Plans is designed for athletes and coaches who want to efficiently
          plan training sessions, track progress, and maintain continuous
          communication within a single integrated platform.
        </Text>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        <Card withBorder radius="md" p="md">
          <Group gap="sm">
            <IconBarbell size={28} />
            <Title order={5}>Training plans</Title>
          </Group>
          <Text c="dimmed" size="sm" mt={6}>
            The system allows users to create, manage, and automatically generate
            personalized training plans based on individual goals and capabilities.
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group gap="sm">
            <IconChartLine size={28} />
            <Title order={5}>Progress tracking</Title>
          </Group>
          <Text c="dimmed" size="sm" mt={6}>
            Users can track physical metrics, training results, and long-term
            progress using structured and consistent data collection.
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group gap="sm">
            <IconUsers size={28} />
            <Title order={5}>Coach ecosystem</Title>
          </Group>
          <Text c="dimmed" size="sm" mt={6}>
            Coaches can manage clients, provide digital services, create training
            programs, and communicate directly with athletes.
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group gap="sm">
            <IconMessageCircle size={28} />
            <Title order={5}>Communication</Title>
          </Group>
          <Text c="dimmed" size="sm" mt={6}>
            An integrated chat system enables both real-time and asynchronous
            communication between athletes and coaches.
          </Text>
        </Card>

        <Card withBorder radius="md" p="md">
          <Group gap="sm">
            <IconCalendar size={28} />
            <Title order={5}>Planning</Title>
          </Group>
          <Text c="dimmed" size="sm" mt={6}>
            The system supports time-based training organization, allowing clear
            planning of training cycles and workload distribution.
          </Text>
        </Card>
      </SimpleGrid>
    </Container>
  );
}