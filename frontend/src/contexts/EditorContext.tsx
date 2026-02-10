import React, { createContext, Dispatch, useContext, useReducer } from "react";
import { ElementTypes, CategoryTypes } from "@/lib/constants";
import { createId } from "@paralleldrive/cuid2";

export type DeviceTypes = "Desktop" | "Tablet" | "Mobile";

export type ElementContentPayload = {
  href?: string;
  innerText?: string;
  imageUrl?: string;
  altText?: string;
  destinationUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  controls?: boolean;
  marqueeText?: string;
  iconName?: string;
  embedUrl?: string;
  buttonLabel?: string;
  formAction?: string;
  formMethod?: string;
  inputType?: string;
  placeholder?: string;
  options?: string;
  checked?: boolean;
  name?: string;
  value?: string;
  listItems?: string;
  codeText?: string;
  badgeText?: string;
  spacerWidth?: string;
  spacerHeight?: string;
  tableHeaders?: string;
  tableRows?: string;
  accordionItems?: string;
  tabLabels?: string;
  tabContents?: string;
  cardTitle?: string;
  cardBody?: string;
  cardImageUrl?: string;
};

export type EditorElement = {
  id: string;
  styles: React.CSSProperties;
  name: string;
  type: ElementTypes;
  category: CategoryTypes;
  content: EditorElement[] | ElementContentPayload;
  formAction?: string;
  formMethod?: string;
  /** ETL widget: API endpoint, token, tenant, request, body for execute */
  apiEndpoint?: string;
  token?: string;
  tenantName?: string;
  request?: string;
  body?: string;
};

export type Editor = {
  siteId: string;
  liveMode: boolean;
  previewMode: boolean;
  visible: boolean;
  elements: EditorElement[];
  selectedElement: EditorElement;
  device: DeviceTypes;
};

export type HistoryState = { history: Editor[]; currentIndex: number };

export type EditorState = { editor: Editor; history: HistoryState };

const emptyElement: EditorElement = {
  id: "",
  content: [],
  name: "",
  styles: {},
  type: null,
  category: null,
};

const initialEditor: Editor = {
  elements: [{ content: [], id: "__body", name: "Body", styles: {}, type: "__body", category: "Container" }],
  selectedElement: emptyElement,
  device: "Desktop",
  previewMode: false,
  liveMode: false,
  visible: false,
  siteId: "",
};

const initialState: EditorState = {
  editor: initialEditor,
  history: { history: [initialEditor], currentIndex: 0 },
};

export const DRAGGED_ELEMENT_ID_KEY = "draggedElementId";

export type EditorAction =
  | { type: "ADD_ELEMENT"; payload: { containerId: string; elementDetails: EditorElement } }
  | { type: "MOVE_ELEMENT"; payload: { elementId: string; targetContainerId: string; insertIndex?: number } }
  | { type: "UPDATE_ELEMENT"; payload: { elementDetails: EditorElement } }
  | { type: "DELETE_ELEMENT"; payload: { elementDetails: EditorElement } }
  | { type: "DUPLICATE_ELEMENT"; payload: { elementDetails: EditorElement } }
  | { type: "CHANGE_SELECTED_ELEMENT"; payload: { elementDetails?: EditorElement | typeof emptyElement } }
  | { type: "CHANGE_DEVICE"; payload: { device: DeviceTypes } }
  | { type: "TOGGLE_PREVIEW_MODE" }
  | { type: "TOGGLE_LIVE_MODE"; payload?: { value: boolean } }
  | { type: "TOGGLE_VISIBILITY_STATUS"; payload?: { value: boolean } }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "LOAD_DATA"; payload: { elements: EditorElement[]; withLive: boolean } }
  | { type: "SET_SITE_ID"; payload: { siteId: string } };

function addElement(arr: EditorElement[], action: EditorAction): EditorElement[] {
  if (action.type !== "ADD_ELEMENT") return arr;
  return arr.map((item) => {
    if (item.id === action.payload.containerId && Array.isArray(item.content)) {
      return { ...item, content: [...item.content, action.payload.elementDetails] };
    }
    if (item.content && Array.isArray(item.content)) {
      return { ...item, content: addElement(item.content, action) };
    }
    return item;
  });
}

function updateElement(arr: EditorElement[], action: EditorAction): EditorElement[] {
  if (action.type !== "UPDATE_ELEMENT") return arr;
  return arr.map((item) => {
    if (item.id === action.payload.elementDetails.id) return { ...item, ...action.payload.elementDetails };
    if (item.content && Array.isArray(item.content)) return { ...item, content: updateElement(item.content, action) };
    return item;
  });
}

function deleteElement(arr: EditorElement[], action: EditorAction): EditorElement[] {
  if (action.type !== "DELETE_ELEMENT") return arr;
  return arr.filter((item) => {
    if (item.id === action.payload.elementDetails.id) return false;
    if (item.content && Array.isArray(item.content)) {
      (item as EditorElement).content = deleteElement(item.content, action);
    }
    return true;
  });
}

// Helper function to deep clone an element and generate new IDs for all nested elements
function cloneElementWithNewIds(element: EditorElement): EditorElement {
  const cloned: EditorElement = {
    ...element,
    id: createId(),
  };

  if (Array.isArray(element.content)) {
    cloned.content = element.content.map((child) => cloneElementWithNewIds(child));
  } else {
    cloned.content = { ...element.content };
  }

  return cloned;
}

function duplicateElement(arr: EditorElement[], action: EditorAction): EditorElement[] {
  if (action.type !== "DUPLICATE_ELEMENT") return arr;
  
  const elementToDuplicate = action.payload.elementDetails;
  const clonedElement = cloneElementWithNewIds(elementToDuplicate);
  
  // Find the parent container and add the cloned element after the original
  return arr.map((item) => {
    if (item.content && Array.isArray(item.content)) {
      const contentIndex = item.content.findIndex((child) => child.id === elementToDuplicate.id);
      if (contentIndex !== -1) {
        // Found the element in this container's children
        const newContent = [...item.content];
        newContent.splice(contentIndex + 1, 0, clonedElement);
        return { ...item, content: newContent };
      }
      // Recursively search in nested content
      return { ...item, content: duplicateElement(item.content, action) };
    }
    return item;
  });
}

// Find element by id in tree
function getElementById(arr: EditorElement[], elementId: string): EditorElement | null {
  for (const el of arr) {
    if (el.id === elementId) return el;
    if (Array.isArray(el.content)) {
      const found = getElementById(el.content, elementId);
      if (found) return found;
    }
  }
  return null;
}

// Check if descendantId is inside the tree rooted at ancestorId
function isDescendantOf(arr: EditorElement[], descendantId: string, ancestorId: string): boolean {
  const ancestor = getElementById(arr, ancestorId);
  if (!ancestor || !Array.isArray(ancestor.content)) return false;
  const checkIn = (list: EditorElement[]): boolean => {
    for (const el of list) {
      if (el.id === descendantId) return true;
      if (Array.isArray(el.content) && checkIn(el.content)) return true;
    }
    return false;
  };
  return checkIn(ancestor.content);
}

// Remove element by id from tree; returns { newElements, removed: EditorElement | null }
function removeElementFromParent(
  arr: EditorElement[],
  elementId: string
): { newElements: EditorElement[]; removed: EditorElement | null } {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].id === elementId) {
      const removed = arr[i];
      const newElements = [...arr];
      newElements.splice(i, 1);
      return { newElements, removed };
    }
    if (Array.isArray(arr[i].content)) {
      const { newElements, removed } = removeElementFromParent(arr[i].content as EditorElement[], elementId);
      if (removed) {
        const newArr = [...arr];
        newArr[i] = { ...arr[i], content: newElements };
        return { newElements: newArr, removed };
      }
    }
  }
  return { newElements: arr, removed: null };
}

// Insert element into container's content at index
function insertElementIntoContainer(
  arr: EditorElement[],
  targetContainerId: string,
  element: EditorElement,
  insertIndex?: number
): EditorElement[] {
  return arr.map((item) => {
    if (item.id === targetContainerId && Array.isArray(item.content)) {
      const content = [...item.content];
      const idx = insertIndex !== undefined ? Math.min(insertIndex, content.length) : content.length;
      content.splice(idx, 0, element);
      return { ...item, content };
    }
    if (item.content && Array.isArray(item.content)) {
      return { ...item, content: insertElementIntoContainer(item.content as EditorElement[], targetContainerId, element, insertIndex) };
    }
    return item;
  });
}

function moveElement(arr: EditorElement[], action: EditorAction): EditorElement[] {
  if (action.type !== "MOVE_ELEMENT") return arr;
  const { elementId, targetContainerId, insertIndex } = action.payload;
  if (elementId === targetContainerId) return arr; // can't drop onto self
  const { newElements: afterRemove, removed } = removeElementFromParent(arr, elementId);
  if (!removed) return arr;
  return insertElementIntoContainer(afterRemove, targetContainerId, removed, insertIndex);
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "ADD_ELEMENT": {
      const updated = { ...state.editor, elements: addElement(state.editor.elements, action) };
      const history = [...state.history.history.slice(0, state.history.currentIndex + 1), updated];
      return { ...state, editor: updated, history: { history, currentIndex: history.length - 1 } };
    }
    case "UPDATE_ELEMENT": {
      const elements = updateElement(state.editor.elements, action);
      const selectedElement =
        state.editor.selectedElement.id === action.payload.elementDetails.id
          ? action.payload.elementDetails
          : emptyElement;
      const updated = { ...state.editor, elements, selectedElement };
      const history = [...state.history.history.slice(0, state.history.currentIndex + 1), updated];
      return { ...state, editor: updated, history: { history, currentIndex: history.length - 1 } };
    }
    case "DELETE_ELEMENT": {
      const elements = deleteElement(state.editor.elements, action);
      const updated = { ...state.editor, elements, selectedElement: emptyElement };
      const history = [...state.history.history.slice(0, state.history.currentIndex + 1), updated];
      return { ...state, editor: updated, history: { history, currentIndex: history.length - 1 } };
    }
    case "DUPLICATE_ELEMENT": {
      const elements = duplicateElement(state.editor.elements, action);
      const updated = { ...state.editor, elements };
      const history = [...state.history.history.slice(0, state.history.currentIndex + 1), updated];
      return { ...state, editor: updated, history: { history, currentIndex: history.length - 1 } };
    }
    case "MOVE_ELEMENT": {
      const { elementId, targetContainerId } = action.payload;
      if (elementId === targetContainerId) return state;
      if (isDescendantOf(state.editor.elements, targetContainerId, elementId)) return state; // prevent drop into own descendant
      const elements = moveElement(state.editor.elements, action);
      const updated = { ...state.editor, elements };
      const history = [...state.history.history.slice(0, state.history.currentIndex + 1), updated];
      const stillSelected = state.editor.selectedElement.id === elementId ? getElementById(elements, elementId) : null;
      return {
        ...state,
        editor: { ...updated, selectedElement: stillSelected || state.editor.selectedElement },
        history: { history, currentIndex: history.length - 1 },
      };
    }
    case "CHANGE_SELECTED_ELEMENT":
      return { ...state, editor: { ...state.editor, selectedElement: action.payload.elementDetails || emptyElement } };
    case "CHANGE_DEVICE":
      return { ...state, editor: { ...state.editor, device: action.payload.device } };
    case "TOGGLE_PREVIEW_MODE":
      return { ...state, editor: { ...state.editor, previewMode: !state.editor.previewMode } };
    case "TOGGLE_LIVE_MODE":
      return { ...state, editor: { ...state.editor, liveMode: action.payload?.value ?? !state.editor.liveMode } };
    case "TOGGLE_VISIBILITY_STATUS":
      return { ...state, editor: { ...state.editor, visible: action.payload?.value ?? !state.editor.visible } };
    case "UNDO":
      if (state.history.currentIndex > 0) {
        const prev = state.history.history[state.history.currentIndex - 1];
        return { ...state, editor: prev, history: { ...state.history, currentIndex: state.history.currentIndex - 1 } };
      }
      return state;
    case "REDO":
      if (state.history.currentIndex < state.history.history.length - 1) {
        const next = state.history.history[state.history.currentIndex + 1];
        return { ...state, editor: next, history: { ...state.history, currentIndex: state.history.currentIndex + 1 } };
      }
      return state;
    case "LOAD_DATA":
      return { ...initialState, editor: { ...initialEditor, elements: action.payload.elements || initialEditor.elements, liveMode: !!action.payload.withLive } };
    case "SET_SITE_ID":
      return { ...state, editor: { ...state.editor, siteId: action.payload.siteId } };
    default:
      return state;
  }
}

interface EditorContextValue {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  siteId: string;
  siteDetails: { id: string; title: string; subdomain: string; visible: boolean } | null;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({
  children,
  siteId,
  siteDetails,
}: {
  children: React.ReactNode;
  siteId: string;
  siteDetails: { id: string; title: string; subdomain: string; visible: boolean; content?: string | null };
}) {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  return (
    <EditorContext.Provider value={{ state, dispatch, siteId, siteDetails }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within EditorProvider");
  return ctx;
}
