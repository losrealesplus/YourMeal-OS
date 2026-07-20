import { useTranslation } from "react-i18next";

export function PlaceholderPanel({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const { t } = useTranslation("common");
  return (
    <div className="bg-card border border-border rounded-2xl p-8 lg:p-12 ring-1 ring-black/[0.03]">
      <p className="meta-label">{t("comingSoon")}</p>
      <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight mt-2">
        {title}
      </h1>
      {description ? (
        <p className="text-muted-foreground mt-3 max-w-xl text-pretty">
          {description}
        </p>
      ) : null}
    </div>
  );
}
