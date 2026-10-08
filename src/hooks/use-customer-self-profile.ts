import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentCustomerId } from "./use-current-customer-id";
import { type CustomerCommand } from "@/modules/customer-directory/domain/customer-self-profile";
import { createCustomerMutationSession } from "@/modules/customer-directory/application/customer-mutation-session";
import { customerProfileClient } from "@/modules/customer-directory/application/customer-profile-client";

export function useCustomerSelfProfile() {
  const { tenantId, user } = useAuth();
  const customer = useCurrentCustomerId();
  const qc = useQueryClient();
  const session = useRef(createCustomerMutationSession(customerProfileClient));
  const sessionOwner = useRef<string | null>(null);
  const currentOwner = `${tenantId}/${user?.id}`;
  function assertSessionOwner() {
    if (session.current.pending && sessionOwner.current !== currentOwner)
      throw new Error(
        "Tu sesión cambió. Vuelve a la sesión original para comprobar el resultado pendiente.",
      );
  }
  const [mayRetrySame, setMayRetrySame] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const repo = customerProfileClient;
  const profile = useQuery({
    queryKey: ["customer-self-profile", tenantId, user?.id, customer.data],
    enabled: Boolean(tenantId && customer.data),
    queryFn: () => repo.read(tenantId!, customer.data!),
  });
  const links = useQuery({
    queryKey: ["customer-identity-requests", tenantId, user?.id],
    enabled: Boolean(tenantId && user),
    queryFn: () => repo.identityRequests(tenantId!),
  });
  async function refresh() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["current-customer-id"] }),
      qc.invalidateQueries({ queryKey: ["customer-self-profile"] }),
      qc.invalidateQueries({ queryKey: ["customer-identity-requests"] }),
      qc.invalidateQueries({ queryKey: ["customer-directory"] }),
    ]);
  }
  async function execute(command: CustomerCommand) {
    assertSessionOwner();
    sessionOwner.current = currentOwner;
    setBusy(true);
    try {
      const result = await session.current.execute(tenantId!, command);
      setUncertain(false);
      await refresh();
      return result;
    } catch (error) {
      setUncertain(Boolean(session.current.pending));
      if (!session.current.pending) await refresh();
      throw error;
    } finally {
      setBusy(false);
      setMayRetrySame(session.current.mayRetrySame);
    }
  }
  async function reconcile() {
    assertSessionOwner();
    setBusy(true);
    try {
      const result = await session.current.reconcile();
      if (result !== null) {
        setUncertain(false);
        await refresh();
      }
      return result;
    } finally {
      setBusy(false);
      setMayRetrySame(session.current.mayRetrySame);
    }
  }
  async function retrySame() {
    assertSessionOwner();
    setBusy(true);
    try {
      const result = await session.current.retrySame();
      setUncertain(false);
      await refresh();
      return result;
    } catch (error) {
      setUncertain(Boolean(session.current.pending));
      throw error;
    } finally {
      setBusy(false);
      setMayRetrySame(session.current.mayRetrySame);
    }
  }
  return {
    tenantId,
    profile,
    links,
    customer,
    execute,
    reconcile,
    busy,
    uncertain,
    pendingRequestId: session.current.pending?.requestId,
    mayRetrySame,
    retrySame,
  };
}
