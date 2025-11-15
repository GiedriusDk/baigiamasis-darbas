import { useEffect, useRef, useState } from "react";
import {
  ActionIcon,
  Affix,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Divider,
  Group,
  Loader,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Title,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconMessageCircle,
  IconX,
  IconRefresh,
  IconSend,
  IconPaperclip,
} from "@tabler/icons-react";
import { useAuth } from "../auth/useAuth";
import {
  listConversations,
  getMessages,
  sendMessage,
  getUserPublicProfile,
} from "../api/chat";

export default function CoachFloatingInbox() {
  const { ready, user } = useAuth();
  const [opened, { toggle, close }] = useDisclosure(false);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [convos, setConvos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const [userMeta, setUserMeta] = useState({});
  const scrollRef = useRef(null);
  const canType = !!(ready && user && activeId);

  // attachment
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentName, setAttachmentName] = useState("");
  const fileInputRef = useRef(null);

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

  async function ensureUserMeta(ids) {
    const need = ids.filter((id) => !userMeta[id]);
    if (!need.length) return;

    const fetched = await Promise.all(
      need.map(async (id) => {
        try {
          const d = await getUserPublicProfile(id);
          const name =
            d?.name ||
            [d?.first_name, d?.last_name].filter(Boolean).join(" ") ||
            `User #${id}`;
          const avatar = d?.avatar_url || d?.avatar_path || "";
          const online = !!(d?.is_online ?? false);
          return [id, { name, avatar, online }];
        } catch {
          return [id, { name: `User #${id}`, avatar: "", online: false }];
        }
      })
    );

    const patch = {};
    fetched.forEach(([id, meta]) => (patch[id] = meta));
    setUserMeta((m) => ({ ...m, ...patch }));
  }

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

  useEffect(() => {
    if (!opened || !ready || !user) return;
    loadConvos();
  }, [opened, ready, user]);

  useEffect(() => {
    if (!convos.length) return;
    const uids = Array.from(
      new Set(convos.map((c) => Number(c.user_id)).filter(Boolean))
    );
    ensureUserMeta(uids);
  }, [convos]);

  useEffect(() => {
    if (!opened || !activeId) return;
    loadMessagesOnce(activeId);
    const t = setInterval(() => loadMessagesOnce(activeId), 5000);
    return () => clearInterval(t);
  }, [opened, activeId]);

  async function handleSend() {
    const body = input.trim();
    if (!body && !attachmentFile) return;
    if (!activeId || sending) return;

    setSending(true);
    try {
      const r = await sendMessage(activeId, {
        body,
        attachmentFile,
      });

      const msg = r?.data || r;
      setInput("");
      setAttachmentFile(null);
      setAttachmentName("");
      setMessages((m) => [...m, msg].slice(-200));

      requestAnimationFrame(() => {
        const el = scrollRef.current;
        if (el) el.scrollTo({ top: el.scrollHeight });
      });
    } finally {
      setSending(false);
    }
  }

  function handleAttachClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0] || null;
    setAttachmentFile(f);
    setAttachmentName(f ? f.name : "");
  }

  function handleRemoveAttachment() {
    setAttachmentFile(null);
    setAttachmentName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (!ready || !user) return null;
  const isCoach = !!user?.roles?.some((r) => r.name === "coach");
  if (!isCoach) return null;

  const activeConv = convos.find((c) => c.id === activeId) || null;
  const activeUserId = activeConv ? Number(activeConv.user_id) : null;
  const activeUser = activeUserId ? userMeta[activeUserId] : null;

  return (
    <>
      <Affix position={{ bottom: 20, right: 20 }}>
        <Tooltip label="Open inbox" withArrow>
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
              gap: 8,
            }}
          >
            {/* Kairė – sąrašas */}
            <Stack
              gap="xs"
              p="xs"
              style={{ borderRight: "1px solid var(--mantine-color-gray-3)" }}
            >
              <Group justify="space-between">
                <Title order={5}>Inbox</Title>
                <Group gap={6}>
                  <ActionIcon variant="subtle" onClick={loadConvos}>
                    <IconRefresh size={16} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" onClick={close}>
                    <IconX size={18} />
                  </ActionIcon>
                </Group>
              </Group>

              {loadingList && <Loader size="sm" />}
              <ScrollArea style={{ flex: 1 }} offsetScrollbars>
                <Stack gap="xs">
                  {convos.map((c) => {
                    const uid = Number(c.user_id);
                    const meta = userMeta[uid];
                    const title = meta?.name || `User #${uid}`;
                    const sub = `Conversation #${c.id}`;
                    const active = activeId === c.id;
                    return (
                      <Card
                        key={c.id}
                        withBorder
                        p="xs"
                        radius="md"
                        onClick={() => setActiveId(c.id)}
                        style={{
                          cursor: "pointer",
                          background: active
                            ? "var(--mantine-color-gray-1)"
                            : "transparent",
                        }}
                      >
                        <Group gap="sm" wrap="nowrap">
                          <Avatar radius="xl" src={meta?.avatar || undefined}>
                            {!meta?.avatar && String(uid).slice(-1)}
                          </Avatar>
                          <div style={{ minWidth: 0 }}>
                            <Text fw={600} truncate="end">
                              {title}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {sub}
                            </Text>
                          </div>
                          <Group gap={6} ml="auto">
                            {meta?.online && (
                              <Badge size="xs" color="green" variant="light">
                                ONLINE
                              </Badge>
                            )}
                            <Badge size="xs" variant="light">
                              coach #{c.coach_id}
                            </Badge>
                          </Group>
                        </Group>
                      </Card>
                    );
                  })}
                  {!loadingList && convos.length === 0 && (
                    <Text c="dimmed" size="sm">
                      No conversations yet.
                    </Text>
                  )}
                </Stack>
              </ScrollArea>
            </Stack>

            {/* Dešinė – pokalbis */}
            <Stack p="xs" gap="xs" style={{ minWidth: 0, minHeight: 0 }}>
              <Group justify="space-between">
                <Group gap="sm">
                  {activeUser && (
                    <Avatar radius="xl" src={activeUser.avatar || undefined}>
                      {!activeUser.avatar && (activeUser.name?.[0] || "U")}
                    </Avatar>
                  )}
                  <div>
                    <Title order={5}>
                      {activeUser
                        ? activeUser.name
                        : activeId
                        ? `Conversation #${activeId}`
                        : "Select a conversation"}
                    </Title>
                    {activeUser && (
                      <Group gap={6}>
                        {activeUser.online && (
                          <Badge size="xs" color="green" variant="light">
                            ONLINE
                          </Badge>
                        )}
                        {activeUserId && (
                          <Badge size="xs" variant="light">
                            user #{activeUserId}
                          </Badge>
                        )}
                      </Group>
                    )}
                  </div>
                </Group>
              </Group>

              <Divider />

              <ScrollArea style={{ flex: 1 }} viewportRef={scrollRef}>
                <Stack gap="xs">
                  {loadingMessages && (
                    <Group justify="center" my="md">
                      <Loader size="sm" />
                    </Group>
                  )}
                  {!loadingMessages && messages.length === 0 && activeId && (
                    <Text c="dimmed" ta="center">
                      No messages.
                    </Text>
                  )}

                  {messages.map((m) => {
                    const mine = m.sender_id === user?.id;
                    const text = m.body ?? m.message ?? m.text ?? "";
                    const when = new Date(
                      m.created_at || m.createdAt
                    ).toLocaleString();
                    const attachment =
                      m.attachment_url || m.attachmentUrl || "";
                    const hasText = !!text;
                    const hasAttachment = !!attachment;

                    return (
                      <Group
                        key={m.id}
                        justify={mine ? "flex-end" : "flex-start"}
                        wrap="nowrap"
                      >
                        {!mine && (
                          <Avatar
                            size="sm"
                            radius="xl"
                            src={activeUser?.avatar || undefined}
                          >
                            {!activeUser?.avatar &&
                              (activeUser?.name?.[0] || "U")}
                          </Avatar>
                        )}

                        <Paper
                          radius="lg"
                          p="xs"
                          withBorder
                          style={{
                            maxWidth: 260,
                            background: mine
                              ? "var(--mantine-color-blue-light)"
                              : "var(--mantine-color-gray-0)",
                          }}
                        >
                          {hasText && (
                            <div style={{ whiteSpace: "pre-wrap" }}>{text}</div>
                          )}

                          {hasAttachment && (
                            <div
                              style={{
                                marginTop: hasText ? 6 : 0,
                                borderRadius: 8,
                                overflow: "hidden",
                              }}
                            >
                              {/\.(mp4|webm)$/i.test(attachment) ? (
                                <video
                                  src={attachment}
                                  controls
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    maxHeight: 180,
                                  }}
                                />
                              ) : (
                                <img
                                  src={attachment}
                                  alt=""
                                  style={{
                                    display: "block",
                                    width: "100%",
                                    height: "auto",
                                    maxWidth: "240px",
                                    maxHeight: "180px",
                                    borderRadius: "8px",
                                    objectFit: "contain",
                                  }}
                                />
                              )}
                            </div>
                          )}

                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--mantine-color-dimmed)",
                              marginTop: 4,
                              textAlign: mine ? "right" : "left",
                            }}
                          >
                            {when}
                          </div>
                        </Paper>

                        {mine && <Avatar size="sm" radius="xl" />}
                      </Group>
                    );
                  })}
                </Stack>
              </ScrollArea>

              <Divider />

              {attachmentName && (
                <Group justify="space-between" gap="xs">
                  <Text size="xs" c="dimmed">
                    Attached: {attachmentName}
                  </Text>
                  <Button
                    size="xs"
                    variant="subtle"
                    onClick={handleRemoveAttachment}
                  >
                    Remove
                  </Button>
                </Group>
              )}

              <Group align="end" wrap="nowrap">
                <Textarea
                  placeholder={
                    activeId ? "Type a reply…" : "Select a conversation…"
                  }
                  autosize
                  minRows={1}
                  maxRows={4}
                  value={input}
                  onChange={(e) => setInput(e.currentTarget.value)}
                  disabled={!canType || sending}
                  style={{ flex: 1 }}
                />
                <ActionIcon
                  variant="light"
                  radius="xl"
                  onClick={handleAttachClick}
                  disabled={!canType || sending}
                >
                  <IconPaperclip size={18} />
                </ActionIcon>
                <Button
                  onClick={handleSend}
                  loading={sending}
                  disabled={
                    !canType || (!input.trim() && !attachmentFile)
                  }
                  rightSection={<IconSend size={16} />}
                >
                  Send
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </Group>
            </Stack>
          </Paper>
        </Box>
      )}
    </>
  );
}