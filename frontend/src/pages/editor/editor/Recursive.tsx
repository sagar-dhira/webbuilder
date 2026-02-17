import { EditorElement } from "@/contexts/EditorContext";
import TextComponent from "./Text";
import Container from "./Container";
import ImageElement from "./Image";
import VideoElement from "./Video";
import AudioElement from "./Audio";
import MarqueeElement from "./Marquee";
import IconElement from "./Icon";
import EmbedElement from "./Embed";
import LinkElement from "./Link";
import ButtonElement from "./Button";
import InputElement from "./Input";
import TextareaElement from "./Textarea";
import SelectElement from "./Select";
import CheckboxElement from "./Checkbox";
import RadioElement from "./Radio";
import SubmitButtonElement from "./SubmitButton";
import ListElement from "./List";
import BlockquoteElement from "./Blockquote";
import CodeElement from "./Code";
import DividerElement from "./Divider";
import BadgeElement from "./Badge";
import SpacerElement from "./Spacer";
import TableElement from "./Table";
import AccordionElement from "./Accordion";
import TabsElement from "./Tabs";
import CardElement from "./Card";
import ChartElement from "./Chart";

export default function Recursive({ element }: { element: EditorElement }) {
  switch (element.type) {
    case "__body":
    case "container":
    case "section":
    case "form":
    case "2Col":
    case "3Col":
    case "2Row":
    case "3Row":
    case "Header2Col":
    case "2ColFooter":
    case "Sidebar2Row":
    case "Grid2x2":
    case "Layout1":
    case "Layout2":
    case "Layout3":
    case "Layout4":
    case "Layout5":
    case "Layout6":
    case "Layout7":
    case "Layout8":
    case "etl":
      return <Container element={element} />;
    case "image":
      return <ImageElement element={element} />;
    case "video":
      return <VideoElement element={element} />;
    case "audio":
      return <AudioElement element={element} />;
    case "marquee":
      return <MarqueeElement element={element} />;
    case "icon":
      return <IconElement element={element} />;
    case "embed":
      return <EmbedElement element={element} />;
    case "chart":
      return <ChartElement element={element} />;
    case "link":
      return <LinkElement element={element} />;
    case "button":
      return <ButtonElement element={element} />;
    case "input":
      return <InputElement element={element} />;
    case "textarea":
      return <TextareaElement element={element} />;
    case "select":
      return <SelectElement element={element} />;
    case "checkbox":
      return <CheckboxElement element={element} />;
    case "radio":
      return <RadioElement element={element} />;
    case "submitButton":
      return <SubmitButtonElement element={element} />;
    case "ol":
    case "ul":
      return <ListElement element={element} />;
    case "li":
      return <TextComponent element={element} />;
    case "blockquote":
      return <BlockquoteElement element={element} />;
    case "code":
      return <CodeElement element={element} />;
    case "hr":
      return <DividerElement element={element} />;
    case "badge":
      return <BadgeElement element={element} />;
    case "spacer":
      return <SpacerElement element={element} />;
    case "table":
      return <TableElement element={element} />;
    case "accordion":
      return <AccordionElement element={element} />;
    case "tabs":
      return <TabsElement element={element} />;
    case "card":
      return <CardElement element={element} />;
  }

  switch (element.category) {
    case "Text":
      return <TextComponent element={element} />;
    default:
      return null;
  }
}
