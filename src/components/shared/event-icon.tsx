import {
  Cake, Camera, Flower2, Gem, Gift, Heart, Mic2, Music, PartyPopper,
  Sparkles, Sun, Utensils, type LucideIcon,
} from "lucide-react";

export const EVENT_ICONS: Record<string, LucideIcon> = {
  Flower2, Sun, Gem, PartyPopper, Sparkles, Heart, Music, Mic2,
  Cake, Gift, Camera, Utensils,
};

export function EventIcon({ name, className }: { name: string; className?: string }) {
  const Icon = EVENT_ICONS[name] ?? Sparkles;
  return <Icon className={className} />;
}
