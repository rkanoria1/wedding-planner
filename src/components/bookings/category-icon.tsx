import {
  BedDouble, Brush, Camera, Car, CircleEllipsis, Disc3, Flower2, Gem, Hand,
  Landmark, Lightbulb, Mail, Shirt, Sparkles, UtensilsCrossed, Video,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Landmark, UtensilsCrossed, Camera, Video, Gem, Sparkles, BedDouble, Shirt,
  Mail, Disc3, Brush, Hand, Lightbulb, Car, Flower2, CircleEllipsis,
};

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? CircleEllipsis;
  return <Icon className={className} />;
}
