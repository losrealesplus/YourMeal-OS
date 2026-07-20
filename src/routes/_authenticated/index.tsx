import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/")({
  component: AuthedIndex,
});

function AuthedIndex() {
  const { loading, homePath } = useAuth();
  if (loading) return null;
  return <Navigate to={homePath} replace />;
}
