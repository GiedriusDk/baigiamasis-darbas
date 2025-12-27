import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { me as fetchMe, setToken } from "../api/auth";
import { useAuth } from "../auth/useAuth";

export default function OAuthCallbackPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const nav = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    (async () => {
      if (!token) {
        notifications.show({ color: "red", message: "Missing token." });
        nav("/login", { replace: true });
        return;
      }

      try {
        setToken(token);

        const user = await fetchMe();
        setUser?.(user);

        const roleNames = (user?.roles ?? []).map((r) => r.name);
        const isCoachOrAdmin = roleNames.includes("coach") || roleNames.includes("admin");

        notifications.show({ color: "green", message: "Signed in with Google." });

        if (!isCoachOrAdmin) {
          nav("/choose-role", { replace: true });
          return;
        }

        nav("/", { replace: true });
      } catch (e) {
        notifications.show({ color: "red", message: e.message || "Google login failed" });
        nav("/login", { replace: true });
      }
    })();
  }, [token, nav, setUser]);

  return null;
}