type RichNode =
  | { type: "paragraph"; text: string }
  | { type: "list"; listType: "ul" | "ol"; items: RichListItem[] };

type RichListItem = {
  text: string;
  children: RichNode[];
};

type RichListFrame = {
  listType: "ul" | "ol";
  indent: number;
  items: RichListItem[];
};

const LIST_ITEM_PATTERN = /^(\s*)([-*•]|\d+\.)\s+(.+)$/;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatInlineMarkdown(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function renderNodes(nodes: RichNode[]): string {
  return nodes
    .map((node) => {
      if (node.type === "paragraph") {
        return `<p>${formatInlineMarkdown(node.text)}</p>`;
      }

      return `<${node.listType}>${node.items
        .map((item) => `<li>${formatInlineMarkdown(item.text)}${renderNodes(item.children)}</li>`)
        .join("")}</${node.listType}>`;
    })
    .join("");
}

export function renderRichText(value?: string): string {
  if (!value) {
    return "";
  }

  const lines = value.replaceAll("\r\n", "\n").trim().split("\n");
  const nodes: RichNode[] = [];
  const listStack: RichListFrame[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return;
    }

    nodes.push({ type: "paragraph", text: paragraph.join(" ") });
    paragraph = [];
  };

  const appendParagraphToCurrentListItem = (text: string) => {
    const currentList = listStack[listStack.length - 1];
    if (!currentList) {
      nodes.push({ type: "paragraph", text });
      return;
    }

    const currentItem = currentList.items[currentList.items.length - 1];
    if (!currentItem) {
      nodes.push({ type: "paragraph", text });
      return;
    }

    const lastChild = currentItem.children[currentItem.children.length - 1];

    if (lastChild?.type === "paragraph") {
      lastChild.text = `${lastChild.text} ${text}`;
      return;
    }

    currentItem.children.push({ type: "paragraph", text });
  };

  const closeListFrame = () => {
    const frame = listStack.pop();
    if (!frame) {
      return;
    }

    const listNode: RichNode = { type: "list", listType: frame.listType, items: frame.items };
    const parent = listStack[listStack.length - 1];
    if (parent) {
      parent.items[parent.items.length - 1].children.push(listNode);
      return;
    }

    nodes.push(listNode);
  };

  const closeListsToIndent = (indent: number) => {
    while (listStack.length > 0 && listStack[listStack.length - 1].indent > indent) {
      closeListFrame();
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      closeListsToIndent(-1);
      continue;
    }

    const listMatch = line.match(LIST_ITEM_PATTERN);

    if (!listMatch) {
      if (listStack.length > 0) {
        appendParagraphToCurrentListItem(trimmed);
        continue;
      }

      closeListsToIndent(-1);
      paragraph.push(trimmed);
      continue;
    }

    flushParagraph();

    const indent = listMatch[1].replaceAll("\t", "  ").length;
    const listType = /\d+\./.test(listMatch[2]) ? "ol" : "ul";
    const content = listMatch[3];

    closeListsToIndent(indent);

    const current = listStack[listStack.length - 1];

    if (!current || indent > current.indent) {
      listStack.push({
        listType,
        indent,
        items: [{ text: content, children: [] }],
      });
      continue;
    }

    if (current.listType !== listType) {
      closeListFrame();
      listStack.push({
        listType,
        indent,
        items: [{ text: content, children: [] }],
      });
      continue;
    }

    current.items.push({ text: content, children: [] });
  }

  flushParagraph();
  while (listStack.length > 0) {
    closeListFrame();
  }

  return renderNodes(nodes);
}

export function richTextToPlainText(value?: string): string {
  if (!value) {
    return "";
  }

  return value
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((line) => line.replace(/^\s*([-*•]|\d+\.)\s+/, "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}