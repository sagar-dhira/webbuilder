export type ElementTypes =
  | "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  | "p" | "span"
  | "container" | "section" | "link"
  | "2Col" | "3Col" | "2Row" | "3Row"
  | "Header2Col" | "2ColFooter" | "Sidebar2Row" | "Grid2x2"
  | "Layout1" | "Layout2" | "Layout3" | "Layout4" | "Layout5" | "Layout6" | "Layout7" | "Layout8"
  | "video" | "image" | "audio" | "marquee" | "icon" | "embed"
  | "button" | "form" | "input" | "textarea" | "select" | "checkbox" | "radio" | "submitButton"
  | "ol" | "ul" | "li"
  | "blockquote" | "code" | "hr" | "badge" | "spacer"
  | "table" | "accordion" | "tabs" | "card"
  | "__body"
  | null;

export type CategoryTypes = "Container" | "Text" | "Link" | "Basic" | "Media" | "Form" | "Content" | null;

export const defaultStyles: React.CSSProperties = {
  backgroundPosition: "center",
  objectFit: "cover",
  backgroundRepeat: "no-repeat",
  textAlign: "left",
  opacity: "100%",
};

export const categoriesWithCustomSettings: CategoryTypes[] = ["Text", "Link", "Basic", "Media", "Form", "Content"];
