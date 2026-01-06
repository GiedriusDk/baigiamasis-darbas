import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Group,
  Title,
  Text,
  Card,
  SimpleGrid,
  Button,
  Badge,
} from "@mantine/core";
import { me } from "../api/auth";

export default function HomePage({ user: userProp }) {
  const [user, setUser] = useState(userProp ?? null);

  useEffect(() => {
    let active = true;
    if (!userProp) {
      me()
        .then((u) => active && setUser(u))
        .catch(() => active && setUser(null));
    }
    return () => {
      active = false;
    };
  }, [userProp]);

  const displayName = useMemo(() => {
    if (!user) return "to Fit Plans";
    const first = user.first_name || "";
    const last = user.last_name || "";
    const name = `${first} ${last}`.trim();
    return name || user.email || "to Fit Plans";
  }, [user]);

  return (
    <Container size="lg" py="md">
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Title order={2}>Home</Title>
          <Text c="dimmed" mt={4}>
            Welcome {displayName}. Manage your training, progress and plans from one place.
          </Text>
        </div>

        <Group>
          <Badge variant="light">
            {user ? "Authenticated" : "Guest"}
          </Badge>
          {!user && (
            <Button component={Link} to="/login" variant="light">
              Sign in
            </Button>
          )}
        </Group>
      </Group>

      <Card withBorder radius="md" p="md" mb="md">
        <Group justify="space-between" align="center">
          <div>
            <Title order={4}>Quick actions</Title>
            <Text c="dimmed" size="sm">
              Start training or review your current progress.
            </Text>
          </div>

          <Group>
            <Button component={Link} to="/generate-plan">
              Generate plan
            </Button>
            <Button component={Link} to="/my-plan" variant="light">
              My plan
            </Button>
            <Button component={Link} to="/progress" variant="light">
              Progress
            </Button>
            <Button component={Link} to="/coaches" variant="light">
              Coaches
            </Button>
          </Group>
        </Group>
      </Card>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        <Card withBorder radius="md" p="md">
          <Title order={5}>Training plans</Title>
          <Text c="dimmed" size="sm" mt={6}>
            Create or generate workout plans based on your goals, availability and equipment.
          </Text>
          <Group mt="md">
            <Button component={Link} to="/generate-plan" size="xs">
              Generate
            </Button>
            <Button component={Link} to="/plan-builder" size="xs" variant="light">
              Plan builder
            </Button>
          </Group>
        </Card>

        <Card withBorder radius="md" p="md">
          <Title order={5}>Progress tracking</Title>
          <Text c="dimmed" size="sm" mt={6}>
            Track measurements, goals and visualize your long-term training progress.
          </Text>
          <Group mt="md">
            <Button component={Link} to="/progress" size="xs">
              View progress
            </Button>
          </Group>
        </Card>

        <Card withBorder radius="md" p="md">
          <Title order={5}>Coaches & community</Title>
          <Text c="dimmed" size="sm" mt={6}>
            Explore coaches, purchase plans and communicate through the built-in chat.
          </Text>
          <Group mt="md">
            <Button component={Link} to="/coaches" size="xs">
              Browse coaches
            </Button>
            <Button component={Link} to="/forum" size="xs" variant="light">
              Forum
            </Button>
          </Group>
        </Card>
      </SimpleGrid>
    </Container>
  );
}