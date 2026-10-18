import { useState, useEffect } from "react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { CustomerWelcomeModal } from "@/components/consumer";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentCustomerId } from "@/hooks/use-current-customer-id";

export const Route = createFileRoute("/_authenticated/app")({
  component: ConsumerAppLayout,
});

function ConsumerAppLayout() {
  const { isStaff, user } = useAuth();
  const customerQuery = useCurrentCustomerId();
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  useEffect(() => {
    // Prompt consumer users who do not yet have an active customer profile
    if (user && !isStaff && customerQuery.isSuccess && customerQuery.data === null) {
      setWelcomeOpen(true);
    }
  }, [user, isStaff, customerQuery.isSuccess, customerQuery.data]);

  return (
    <MobileShell>
      <Outlet />
      {user && !isStaff && (
        <CustomerWelcomeModal
          open={welcomeOpen}
          onOpenChange={setWelcomeOpen}
          onCompleted={() => setWelcomeOpen(false)}
        />
      )}
    </MobileShell>
  );
}
