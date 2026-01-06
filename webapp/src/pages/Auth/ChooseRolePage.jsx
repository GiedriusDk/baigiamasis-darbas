import { Button, Stack, Title, Text } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { selectRole, me as fetchMe } from "../../api/auth";
import { useAuth } from "../../auth/useAuth";

export default function ChooseRolePage() {
  const nav = useNavigate();
  const { setUser } = useAuth();

  async function pick(role) {
    try {
      await selectRole(role);
      const user = await fetchMe();
      setUser?.(user);
      notifications.show({ color: "green", message: "Role selected." });
      nav("/", { replace: true });
    } catch (e) {
      notifications.show({ color: "red", message: e?.message || "Failed" });
    }
  }

  return (
    <Stack maw={420} mx="auto" mt="xl">
      <Title order={2}>Choose account type</Title>
      <Text c="dimmed">
        You can continue as a client or as a coach.
      </Text>

      <Button onClick={() => pick("user")}>I’m a client</Button>
      <Button variant="outline" onClick={() => pick("coach")}>
        I’m a coach
      </Button>
    </Stack>
  );
}