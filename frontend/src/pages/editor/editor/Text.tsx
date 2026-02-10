import { EditorElement, useEditor } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";

export default function TextComponent({ element }: { element: EditorElement }) {
  const { state, dispatch } = useEditor();
  const TextTag = element.type as keyof JSX.IntrinsicElements;

  const handleBlur = (e: React.FocusEvent) => {
    const newText = (e.target as HTMLElement).innerText.trim();
    dispatch({
      type: "UPDATE_ELEMENT",
      payload: {
        elementDetails: { ...element, content: { ...(typeof element.content === "object" && !Array.isArray(element.content) ? element.content : {}), innerText: newText } },
      },
    });
  };

  return (
    <ElementWrapper element={element}>
      <div
        style={element.styles}
        className="p-0.5 w-full relative transition-all overflow-auto"
      >
        <TextTag
          contentEditable={!state.editor.liveMode}
          suppressContentEditableWarning
          onBlur={handleBlur}
          className="border-none outline-none"
          style={{ margin: 0, padding: 0 }}
        >
          {typeof element.content === "object" && !Array.isArray(element.content) && element.content.innerText}
        </TextTag>
      </div>
    </ElementWrapper>
  );
}
