import { useEffect, useRef, useState } from "react";
import {
  ActionIcon, Affix, Avatar, Badge, Box, Button, Card, Divider, Group,
  Loader, Paper, ScrollArea, Stack, Text, Textarea, Title, Tooltip
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconMessageCircle, IconX, IconRefresh, IconSend } from "@tabler/icons-react";
import { useAuth } from "../auth/useAuth";

import {
  listConversations,
  ensureConversation,
  getMessages,
  sendMessage,
  getCoachPublicProfile,
  getPresenceStatus,
} from "../api/chat";

import { ownedCoaches } from "../api/payments";

export default function UserFloatingInbox() {
  const { ready, user } = useAuth();
  const [opened, { toggle, close }] = useDisclosure(false);

  const [booting, setBooting] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [convos, setConvos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [coachMeta, setCoachMeta] = useState({});
  const scrollRef = useRef(null);
  const canType = !!(ready && user && activeId);

  // 1) Bootstrap – iš payments gaunam visų turimų trenerių user_id ir kiekvienam kviečiam ensureConversation
  async function bootstrapEnsureConvos() {
    setBooting(true);
    try {
      // Rekomenduojama:
      const res = await ownedCoaches().catch(() => null);
      const coachIds = Array.isArray(res?.data) ? res.data.map(Number) : [];

      // Jei vietoje ownedCoaches naudoji myProducts():
      // const pr = await myProducts().catch(() => null);
      // const coachIds = Array.from(new Set((pr?.data || []).map(p => Number(p.coach_id)).filter(Boolean)));

      if (coachIds.length) {
        await Promise.all(
          coachIds.map(id => ensureConversation(id).catch(() => null))
        );
      }
    } finally {
      setBooting(false);
    }
  }

  // 2) Pakeliame pokalbių sąrašą
  async function loadConvos() {
    setLoadingList(true);
    try {
      const r = await listConversations();
      const rows = Array.isArray(r?.data) ? r.data : [];
      setConvos(rows);
      if (!activeId && rows.length) setActiveId(rows[0].id);
    } finally {
      setLoadingList(false);
    }
  }

  // 3) Užsipildome trenerių meta (vardas, avatar, presence)
  async function ensureCoachMeta(ids) {
    const need = ids.filter((id) => !coachMeta[id]);
    if (!need.length) return;

    // profiliai
    const profiles = await Promise.all(need.map(async (id) => {
      try {
        const d = await getCoachPublicProfile(id);
        const name = d?.name || [d?.first_name, d?.last_name].filter(Boolean).join(" ") || `Coach #${id}`;
        const avatar = d?.avatar_url || d?.avatar_path || "";
        return [id, { name, avatar }];
      } catch {
        return [id, { name: `Coach #${id}`, avatar: "" }];
      }
    }));

    // presence (is_online/last_seen_at)
    const presence = await getPresenceStatus(need).catch(() => ({}));

    const patch = {};
    profiles.forEach(([id, base]) => {
      const rec = presence[id] || {};
      patch[id] = {
        ...base,
        online: !!rec.is_online,
        last_seen_at: rec.last_seen_at || null
      };
    });

    setCoachMeta(m => ({ ...m, ...patch }));
  }

  // 4) Vienkartinis messages fetch + intervalas
  async function loadMessagesOnce(id) {
    if (!id) return;
    setLoadingMessages(true);
    try {
      const r = await getMessages(id, { perPage: 50 });
      const rows = Array.isArray(r?.data) ? r.data : [];
      setMessages(rows);
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight });
      });
    } finally {
      setLoadingMessages(false);
    }
  }

  // Open → bootstrap + sąrašas
  useEffect(() => {
    if (!opened || !ready || !user) return;
    (async () => {
      await bootstrapEnsureConvos();
      await loadConvos();
    })();
  }, [opened, ready, user]);

  // Kai turime konversacijas – susirenkame meta
  useEffect(() => {
    if (!convos.length) return;
    const coachIds = Array.from(new Set(
      convos.map((c) => Number(c.coach_id)).filter(Boolean)
    ));
    ensureCoachMeta(coachIds);
  }, [convos]);

  // Messages polling
  useEffect(() => {
    if (!opened || !activeId) return;
    loadMessagesOnce(activeId);
    const t = setInterval(() => loadMessagesOnce(activeId), 5000);
    return () => clearInterval(t);
  }, [opened, activeId]);

  // Send
  async function handleSend() {
    const body = input.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    try {
      const r = await sendMessage(activeId, body);
      setInput("");
      setMessages((m) => [...m, r?.data].slice(-200));
      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight });
      });
    } finally {
      setSending(false);
    }
  }

  if (!ready || !user) return null;

  const activeConv = convos.find((c) => c.id === activeId) || null;
  const activeCoachId = activeConv ? Number(activeConv.coach_id) : null;
  const activeCoach = activeCoachId ? coachMeta[activeCoachId] : null;

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
            width: 760,
            maxWidth: "96vw",
            height: 560,
            zIndex: 1000,
          }}
        >
          <Paper
            shadow="lg"
            radius="lg"
            p="xs"
            withBorder
            style={{
              height: "100%",
              display: "grid",
              gridTemplateColumns: "260px 1fr",
              gap: 8
            }}
          >
            {/* Kairė – sąrašas */}
            <Stack gap="xs" p="xs" style={{ borderRight: "1px solid var(--mantine-color-gray-3)" }}>
              <Group justify="space-between">
                <Title order={5}>My coaches</Title>
                <Group gap={6}>
                  <ActionIcon variant="subtle" onClick={loadConvos}><IconRefresh size={16} /></ActionIcon>
                  <ActionIcon variant="subtle" onClick={close}><IconX size={18} /></ActionIcon>
                </Group>
              </Group>

              {(booting || loadingList) && <Loader size="sm" />}
              <ScrollArea style={{ flex: 1 }} offsetScrollbars>
                <Stack gap="xs">
                  {convos.map((c) => {
                    const cid = Number(c.coach_id);
                    const meta = coachMeta[cid];
                    const title = meta?.name || `Coach #${cid}`;
                    const sub = `Conversation #${c.id}`;
                    const active = activeId === c.id;
                    return (
                      <Card
                        key={c.id}
                        withBorder
                        p="xs"
                        radius="md"
                        onClick={() => setActiveId(c.id)}
                        style={{ cursor: "pointer", background: active ? "var(--mantine-color-gray-1)" : "transparent" }}
                      >
                        <Group gap="sm" wrap="nowrap">
                          <Avatar radius="xl" src={meta?.avatar || undefined}>
                            {!meta?.avatar && String(cid).slice(-1)}
                          </Avatar>
                          <div style={{ minWidth: 0 }}>
                            <Text fw={600} truncate="end">{title}</Text>
                            <Text size="xs" c="dimmed">{sub}</Text>
                          </div>
                          <Badge size="xs" variant="light" ml="auto" color={meta?.online ? "green" : "red"}>
                            {meta?.online ? "ONLINE" : "OFFLINE"}
                          </Badge>
                        </Group>
                      </Card>
                    );
                  })}
                  {!loadingList && convos.length === 0 && (
                    <Text c="dimmed" size="sm">No conversations.</Text>
                  )}
                </Stack>
              </ScrollArea>
            </Stack>

            {/* Dešinė – pokalbis */}
            <Stack p="xs" gap="xs" style={{ minWidth: 0 }}>
              <Group justify="space-between">
                <Group gap="sm">
                  <Avatar radius="xl" src={activeCoach?.avatar || undefined}>
                    {!activeCoach?.avatar && (activeCoachId ? String(activeCoachId).slice(-1) : "C")}
                  </Avatar>
                  <div>
                    <Title order={5} style={{ lineHeight: 1.2 }}>
                      {activeCoach ? activeCoach.name : activeId ? `Conversation #${activeId}` : "Conversation"}
                    </Title>
                    {activeCoachId && (
                      <Group gap={6}>
                        <Badge size="xs" variant="light" color={activeCoach?.online ? "green" : "red"}>
                          {activeCoach?.online ? "ONLINE" : "OFFLINE"}
                        </Badge>
                        <Text size="xs" c="dimmed">coach #{activeCoachId}</Text>
                      </Group>
                    )}
                  </div>
                </Group>
              </Group>

              <Divider />
              <ScrollArea style={{ flex: 1 }} viewportRef={scrollRef}>
                <Stack gap="xs">
                  {loadingMessages && <Group justify="center" my="md"><Loader size="sm" /></Group>}
                  {!loadingMessages && messages.length === 0 && activeId && (
                    <Text c="dimmed" ta="center">No messages.</Text>
                  )}
                  {messages.map((m) => {
                    const mine = m.sender_id === user?.id;
                    const text = m.body ?? m.message ?? m.text ?? "";
                    const when = new Date(m.created_at || m.createdAt).toLocaleString();
                    return (
                      <Group key={m.id} justify={mine ? "flex-end" : "flex-start"} wrap="nowrap">
                        {!mine && <Avatar size="sm" radius="xl" src={activeCoach?.avatar || undefined} />}
                        <Paper
                          radius="lg"
                          p="xs"
                          withBorder
                          style={{
                            maxWidth: "80%",
                            background: mine ? "var(--mantine-color-blue-light)" : "var(--mantine-color-gray-0)",
                          }}
                        >
                          <div style={{ whiteSpace: "pre-wrap" }}>{text}</div>
                          <div style={{ fontSize: 12, color: "var(--mantine-color-dimmed)" }}>{when}</div>
                        </Paper>
                        {mine && <Avatar size="sm" radius="xl" />}
                      </Group>
                    );
                  })}
                </Stack>
              </ScrollArea>

              <Divider />
              <Group align="end" wrap="nowrap">
                <Textarea
                  placeholder={activeId ? "Type a message…" : "Select a coach…"}
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