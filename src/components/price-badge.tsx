interface PriceBadgeProps {
  price: number | null | undefined;
  previousPrice?: number | null;
  size?: "sm" | "md" | "lg";
}

export function PriceBadge({
  price,
  previousPrice,
  size = "md",
}: PriceBadgeProps) {
  if (price === null || price === undefined) {
    return (
      <span className="text-muted-foreground text-sm italic">No price data</span>
    );
  }

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg font-semibold",
    lg: "text-2xl font-bold",
  };

  let changeIndicator = null;
  if (previousPrice && previousPrice > 0) {
    const change = price - previousPrice;
    const changePercent = ((change / previousPrice) * 100).toFixed(1);
    const isUp = change > 0;

    changeIndicator = (
      <span
        className={`text-xs font-medium ${
          isUp ? "text-green-600" : "text-red-600"
        }`}
      >
        {isUp ? "+" : ""}
        {changePercent}%
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <span className={sizeClasses[size]}>{formatted}</span>
      {changeIndicator}
    </div>
  );
}
