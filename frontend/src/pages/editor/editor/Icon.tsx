import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import {
  Star,
  Heart,
  Mail,
  Phone,
  MapPin,
  Search,
  Menu,
  Home,
  User,
  Settings,
  Link as LinkIcon,
  Image as ImageIcon,
  FileText,
  Check,
  X,
  ChevronRight,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Star,
  Heart,
  Mail,
  Phone,
  MapPin,
  Search,
  Menu,
  Home,
  User,
  Settings,
  Link: LinkIcon,
  Image: ImageIcon,
  File: FileText,
  Check,
  X,
  ChevronRight,
  ChevronDown,
};

export default function IconElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { iconName?: string; href?: string };
  const name = content.iconName || "Star";
  const href = content.href?.trim();
  const IconComponent = iconMap[name] || Star;
  const size = element.styles?.fontSize ? parseInt(String(element.styles.fontSize), 10) || 24 : 24;

  const icon = <IconComponent size={size} className="shrink-0" style={element.styles} />;

  return (
    <ElementWrapper element={element} className="!w-fit !h-fit inline-flex">
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex">
          {icon}
        </a>
      ) : (
        icon
      )}
    </ElementWrapper>
  );
}
