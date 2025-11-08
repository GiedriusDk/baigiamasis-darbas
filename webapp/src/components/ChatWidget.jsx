import { useEffect, useRef, useState } from "react";
import {
  ActionIcon, Affix, Avatar, Badge, Box, Button, Divider, Group,
  Loader, Menu, Paper, ScrollArea, Stack, Text, Textarea, Title, Tooltip
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconMessageCircle, IconSend, IconX, IconChevronDown } from "@tabler/icons-react";
import { useAuth } from "../auth/useAuth";
import {
  listConversations,
  ensureConversation,
  getMessages,
  sendMessage,
  getCoachPublicProfile
} from "../api/chat";

export default function ChatWidget({ coachId: coachProfileId, title = "Chat with coach", coachName, coachAvatar }) {
  const { user, ready } = useAuth();
  const [opened, { toggle, close }] = useDisclosure(false);

  const [convId, setConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");

  const [headerName, setHeaderName] = useState(coachName || "");
  const [headerAvatar, setHeaderAvatar] = useState(coachAvatar || "");

  const [convos, setConvos] = useState([]);
  const [activeCoachUserId, setActiveCoachUserId] = useState(null);

  const scrollRef = useRef(null);
  const canType = !!(ready && user && convId);

  /* Užkraunam header info + coach user_id iš public profilio */
  useEffect(() => {
    if (!coachProfileId) return;
    let cancelled = false;
    (async () => {
      const data = await getCoachPublicProfile(coachProfileId);
      if (cancelled) return;
      const name = data?.name || [data?.first_name, data?.last_name].filter(Boolean).join(" ") || `coach #${coachProfileId}`;
      setHeaderName(name);
      setHeaderAvatar(data?.avatar_url || data?.avatar_path || "");
      setActiveCoachUserId(data?.user_id ?? null);
    })();
    return () => { cancelled = true; };
  }, [coachProfileId, coachName, coachAvatar]);

  /* Mano pokalbių sąrašas (nebūtinas token iš useAuth – API pats paims) */
  useEffect(() => {
    if (!opened || !ready || !user) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await listConversations();
        if (cancelled) return;
        const rows = Array.isArray(res?.data) ? res.data : [];
        setConvos(rows);
      } catch {
        setConvos([]);
      }
    })();
    return () => { cancelled = true; };
  }, [opened, ready, user]);

  /* Užsitikrinam/sukuriam pokalbį su aktyviu coach (coach user_id) */
  useEffect(() => {
    if (!opened || !ready || !user || !activeCoachUserId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const resp = await ensureConversation(activeCoachUserId);
        if (cancelled) return;
        setConvId(resp?.data?.id || null);
      } catch {
        setConvId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [opened, ready, user, activeCoachUserId]);

  async function loadMessagesOnce() {
    if (!convId) return;
    const resp = await getMessages(convId, { perPage: 50 });
    setMessages(Array.isArray(resp?.data) ? resp.data : []);
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight });
    });
  }

  useEffect(() => {
    if (!opened || !convId) return;
    loadMessagesOnce();
    const id = setInterval(loadMessagesOnce, 5000);
    return () => clearInterval(id);
  }, [opened, convId]);

  async function handleSend() {
    const body = String(input || "").trim();
    if (!body || !convId || sending) return;
    setSending(true);
    try {
      const resp = await sendMessage(convId, body);
      setInput("");
      setMessages((m) => [...m, resp?.data].slice(-200));
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight });
      });
    } finally {
      setSending(false);
    }
  }

  const shownName = headerName || title;
  const shownAvatar = headerAvatar || undefined;

  return (
    <>
      <Affix position={{ bottom: 20, right: 20 }}>
        <Tooltip label="Open chat" withArrow>
          <ActionIcon
            size={56}
            radius="xl"
            variant="filled"
            color="blue"
            onClick={toggle}
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,.15)" }}
          >
            <IconMessageCircle size={28} />
          </ActionIcon>
        </Tooltip>
      </Affix>

      {opened && (
        <Box
          style={{
            position: "fixed",
            bottom: 92,
            right: 20,
            width: 380,
            maxWidth: "92vw",
            height: 520,
            zIndex: 1000,
          }}
        >
          <Paper shadow="lg" radius="lg" p="xs" withBorder style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Group justify="space-between" p="xs">
              <Group gap="sm">
                <Avatar radius="xl" src={shownAvatar}>{!shownAvatar && (shownName?.[0] || "C")}</Avatar>
                <div>
                  <Title order={5} style={{ lineHeight: 1.2 }}>{shownName}</Title>
                  <Group gap={6}>
                    <Badge size="xs" variant="light" color="green">ONLINEee</Badge>
                    <Text size="xs" c="dimmed">{activeCoachUserId ? `coach #${activeCoachUserId}` : ""}</Text>
                  </Group>
                </div>
              </Group>

              <Group gap="xs">
                {convos.length > 1 && (
                  <Menu shadow="md" width={240}>
                    <Menu.Target>
                      <Button size="xs" variant="light" rightSection={<IconChevronDown size={16} />}>
                        Switch coach
                      </Button>
                    </Menu.Target>
                    <Menu.Dropdown>
                      {convos.map((c) => (
                        <Menu.Item
                          key={c.id}
                          onClick={() => {
                            setActiveCoachUserId(c.coach_id);
                            setMessages([]);
                          }}
                          leftSection={<Avatar size="sm" radius="xl">{String(c.coach_id).slice(-1)}</Avatar>}
                        >
                          Coach #{c.coach_id}
                        </Menu.Item>
                      ))}
                    </Menu.Dropdown>
                  </Menu>
                )}
                <ActionIcon variant="subtle" onClick={close}><IconX /></ActionIcon>
              </Group>
            </Group>

            <Divider mt="xs" mb="xs" />

            <ScrollArea viewportRef={scrollRef} style={{ flex: 1 }}>
              <Stack p="xs" gap="xs">
                {loading && (
                  <Group justify="center" mt="md" mb="md"><Loader size="sm" /></Group>
                )}
                {!loading && messages.length === 0 && (
                  <Text ta="center" c="dimmed" size="sm">No messages yet. Say hi! 👋</Text>
                )}
                {messages.map((m) => {
                  const mine = m.sender_id === user?.id;
                  return (
                    <Group key={m.id} justify={mine ? "flex-end" : "flex-start"} wrap="nowrap">
                      {!mine && <Avatar size="sm" radius="xl" />}
                      <Paper
                        radius="lg"
                        p="xs"
                        withBorder
                        style={{
                          maxWidth: "80%",
                          background: mine ? "var(--mantine-color-blue-light)" : "var(--mantine-color-gray-0)",
                        }}
                      >
                        <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>{m.body || m.message}</Text>
                        <Text size="xs" c="dimmed">
                          {new Date(m.created_at || m.createdAt).toLocaleString()}
                        </Text>
                      </Paper>
                      {mine && <Avatar size="sm" radius="xl" />}
                    </Group>
                  );
                })}
              </Stack>
            </ScrollArea>

            <Divider mt="xs" mb="xs" />

            <Stack gap={8} p="xs">
              {!canType && (
                <Text size="sm" c="red">In order to write to this coach, buy one of their plans.</Text>
              )}
              <Group align="end" wrap="nowrap">
                <Textarea
                  placeholder="Type a message…"
                  autosize
                  minRows={1}
                  maxRows={4}
                  value={input}
                  onChange={(e) => setInput(e.currentTarget.value)}
                  disabled={!canType || sending}
                  style={{ flex: 1 }}
                />
                <Button
                  onClick={handleSend}
                  loading={sending}
                  disabled={!canType || input.trim().length === 0}
                  rightSection={<IconSend size={16} />}
                >
                  Send
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Box>
      )}
    </>
  );
}