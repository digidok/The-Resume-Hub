import { Star } from "lucide-react";

export function CompanyRatingBadge({
  rating,
  reviewsCount,
}: {
  rating: number | null | undefined;
  reviewsCount?: number | null;
}) {
  if (rating == null) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      {rating.toFixed(1)}
      {reviewsCount != null && <span className="text-slate-400">({reviewsCount})</span>}
      <span className="text-slate-400">on Google</span>
    </span>
  );
}
