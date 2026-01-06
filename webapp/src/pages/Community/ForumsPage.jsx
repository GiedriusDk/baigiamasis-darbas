import { useEffect, useState, useRef } from "react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  ScrollArea,
  Stack,
  Text,
  Textarea,
  Title,
} from "@mantine/core";

import { useAuth } from "../../auth/useAuth";
import {
  listForumRooms,
  listForumMessages,
  sendForumMessage,
  getCoachPublicProfile,
  getUserPublicProfile,
} from "../../api/chat";

export default function ForumsPage() {
  const { user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [activeRoom, setActiveRoom] = useState(null);
  const [file, setFile] = useState(null);

  const [messages, setMessages] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const viewportRef = useRef(null);
  const fileInputRef = useRef(null);

  function onlyFirstName(name = "") {
    const parts = String(name).trim().split(/\s+/);
    return parts[0] || name || "";
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoadingRooms(true);
        const res = await listForumRooms();
        const data = res?.data ?? res ?? [];

        if (!mounted) return;

        setRooms(data);
        if (data.length > 0) {
          setActiveId((prev) => prev ?? data[0].id);
          setActiveRoom((prev) => prev ?? data[0]);
        }
      } finally {
        if (mounted) setLoadingRooms(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const loadMessages = async (roomId) => {
    setLoadingMessages(true);
    try {
      const res = await listForumMessages(roomId);
      const msgs = res?.data ?? res ?? [];

      const ids = [...new Set(msgs.map((m) => m.sender_id).filter(Boolean))];
      const profilesMap = {};

      for (const id of ids) {
        try {
          const up = await getUserPublicProfile(id);
          if (up) {
            profilesMap[id] = {
              name:
                onlyFirstName(
                  [up.first_name, up.last_name].filter(Boolean).join(" "),
                ) ||
                onlyFirstName(up.name) ||
                `User #${id}`,
              avatar_url: up.avatar_path || up.avatar_url || null,
            };
            continue;
          }
        } catch {}

        try {
          const cp = await getCoachPublicProfile(id);
          if (cp) {
            profilesMap[id] = {
              name:
                onlyFirstName(
                  [cp.first_name, cp.last_name].filter(Boolean).join(" "),
                ) ||
                onlyFirstName(cp.name) ||
                `Coach #${id}`,
              avatar_url: cp.avatar_path || cp.avatar_url || null,
            };
          }
        } catch {}
      }

      const enhanced = msgs.map((m) => ({
        ...m,
        sender: profilesMap[m.sender_id] || null,
      }));

      setMessages(enhanced);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!activeId) return;
    const room = rooms.find((r) => r.id === activeId) || null;
    setActiveRoom(room);
    loadMessages(activeId).catch(() => {});
  }, [activeId]);

  useEffect(() => {
    if (!viewportRef.current) return;
    const el = viewportRef.current;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !file) return;
    if (!activeId || sending) return;

    setSending(true);
    try {
      const res = await sendForumMessage(activeId, {
        message: trimmed,
        attachmentFile: file || null,
      });
      const msg = res?.data ?? res;

      let senderProfile =
        messages.find((m) => m.sender_id === user?.id)?.sender || null;

      if (!senderProfile && user?.id) {
        try {
          const up = await getUserPublicProfile(user.id);
          if (up) {
            senderProfile = {
              id: user.id,
              name:
                onlyFirstName(
                  [up.first_name, up.last_name].filter(Boolean).join(" "),
                ) ||
                onlyFirstName(up.name) ||
                "You",
              avatar_url: up.avatar_path || up.avatar_url || null,
            };
          }
        } catch {}
      }

      if (!senderProfile) {
        const meName =
          onlyFirstName(
            [user?.first_name, user?.last_name].filter(Boolean).join(" "),
          ) ||
          onlyFirstName(user?.name) ||
          "You";
        senderProfile = {
          id: user?.id,
          name: meName,
          avatar_url: null,
        };
      }

      const newMsg = {
        ...msg,
        sender: senderProfile,
      };

      setMessages((prev) => [...prev, newMsg]);
      setText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setSending(false);
    }
  };

  if (loadingRooms) return <Loader />;

  return (
    <Stack
      gap="md"
      style={{
        height: "calc(100vh - 96px)",
        overflow: "hidden",
      }}
    >
      <Group justify="space-between">
        <Group gap="xs">
          <Title order={2}>{activeRoom?.title || "Forum"}</Title>
          <Badge variant="light" size="sm">
            #{activeRoom?.slug?.toUpperCase()}
          </Badge>
        </Group>
      </Group>

      <Group gap="sm">
        {rooms.map((room) => (
          <Button
            key={room.id}
            size="xs"
            variant={room.id === activeId ? "filled" : "light"}
            onClick={() => setActiveId(room.id)}
          >
            {room.title}
          </Button>
        ))}
      </Group>

      <Card
        withBorder
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          marginTop: 4,
          marginBottom: 32,
        }}
      >
        <ScrollArea
          style={{ flex: 1, minHeight: 0 }}
          type="always"
          offsetScrollbars
          viewportRef={viewportRef}
        >
          <Stack p="md">
            {loadingMessages ? (
              <Loader size="sm" />
            ) : messages.length === 0 ? (
              <Text size="sm" c="dimmed">
                No messages yet. Be the first to write something 💬
              </Text>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                const baseName =
                  msg.sender?.name || `User #${msg.sender_id || "?"}`;
                const displayName = isMine ? "You" : baseName;
                const avatarUrl = msg.sender?.avatar_url || null;
                const initial = (
                  displayName && displayName[0] ? displayName[0] : "U"
                ).toUpperCase();

                const createdAtStr = msg.created_at
                  ? new Date(msg.created_at).toLocaleString()
                  : "";

                const attachmentUrl =
                  msg.attachment_url || msg.attachment || null;

                const isVideo =
                  typeof attachmentUrl === "string" &&
                  /\.mp4$|\.webm$/i.test(attachmentUrl);

                return (
                  <Group
                    key={msg.id}
                    justify={isMine ? "flex-end" : "flex-start"}
                  >
                    {!isMine && (
                      <Avatar radius="xl" src={avatarUrl || undefined}>
                        {!avatarUrl && initial}
                      </Avatar>
                    )}

                    <Card
                      padding="xs"
                      withBorder
                      style={{
                        maxWidth: "60%",
                        backgroundColor: isMine ? "#e7f5ff" : "white",
                      }}
                    >
                      <Group justify="space-between" gap={8} mb={4}>
                        <Text size="xs" fw={500}>
                          {displayName}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {createdAtStr}
                        </Text>
                      </Group>

                      {msg.message && <Text size="sm">{msg.message}</Text>}

                      {attachmentUrl && (
                        <Group mt={8}>
                          {isVideo ? (
                            <video
                              src={attachmentUrl}
                              controls
                              style={{
                                maxWidth: 260,
                                borderRadius: 8,
                                display: "block",
                              }}
                            />
                          ) : (
                            <img
                              src={attachmentUrl}
                              alt=""
                              style={{
                                maxWidth: 260,
                                borderRadius: 8,
                                display: "block",
                              }}
                            />
                          )}
                        </Group>
                      )}
                    </Card>

                    {isMine && (
                      <Avatar radius="xl" src={avatarUrl || undefined}>
                        {!avatarUrl && initial}
                      </Avatar>
                    )}
                  </Group>
                );
              })
            )}
          </Stack>
        </ScrollArea>

        <Group
          p="md"
          pt={0}
          gap="sm"
          align="flex-end"
          style={{ paddingRight: 80 }}
        >
          <Textarea
            placeholder="Write a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            autosize
            minRows={1}
            maxRows={3}
            style={{ flex: 1 }}
          />

          <Stack gap={4} align="flex-start" style={{ minWidth: 140 }}>
            <Button
              variant={file ? "filled" : "light"}
              size="xs"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? "Change file" : "Attach"}
            </Button>
            {file && (
              <Text size="xs" c="dimmed" maw={160} lineClamp={2}>
                {file.name}
              </Text>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </Stack>

          <Button
            onClick={handleSend}
            disabled={(!text.trim() && !file) || sending}
          >
            Send
          </Button>
        </Group>
      </Card>
    </Stack>
  );
}