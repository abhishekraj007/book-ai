/**
 * Block types supported by the block editor
 */
export type BlockType =
  | "paragraph"
  | "heading1"
  | "heading2"
  | "heading3"
  | "quote"
  | "divider"
  | "bulletList"
  | "numberedList"
  | "callout"
  | "image"
  | "spacer";

/**
 * Block data structure for creating blocks from markdown
 */
export interface ParsedBlock {
  type: BlockType;
  content: {
    html: string;
    plainText: string;
  };
  blockData?:
    | {
        type: "image";
        url: string;
        caption?: string;
        alignment?: string;
        alt?: string;
        storageId?: string;
        width?: string;
      }
    | {
        type: "callout";
        icon?: string;
        backgroundColor?: string;
      };
  order: number;
}

/**
 * Parse markdown text into structured blocks
 *
 * Parsing rules:
 * - `# Heading` → heading1
 * - `## Heading` → heading2
 * - `### Heading` → heading3
 * - `> Quote` → quote
 * - `---` or `***` → divider
 * - `- List` or `* List` → bulletList
 * - `1. List` → numberedList
 * - `![alt](url)` → image
 * - Paragraphs → paragraph
 * - Empty lines → ignored
 */
export function parseMarkdownToBlocks(markdown: string): ParsedBlock[] {
  const lines = markdown.split("\n");
  const blocks: ParsedBlock[] = [];
  let order = 0;
  let currentListType: "bullet" | "numbered" | null = null;
  let currentListItems: string[] = [];

  const flushList = () => {
    if (currentListItems.length > 0 && currentListType) {
      const listHtml =
        currentListType === "bullet"
          ? `<ul>${currentListItems.map((item) => `<li>${item}</li>`).join("")}</ul>`
          : `<ol>${currentListItems.map((item) => `<li>${item}</li>`).join("")}</ol>`;

      const plainText = currentListItems.join("\n");

      blocks.push({
        type: currentListType === "bullet" ? "bulletList" : "numberedList",
        content: { html: listHtml, plainText },
        order: order++,
      });

      currentListItems = [];
      currentListType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      flushList();
      continue;
    }

    // Heading 1
    if (trimmed.startsWith("# ") && !trimmed.startsWith("## ")) {
      flushList();
      const text = trimmed.slice(2).trim();
      blocks.push({
        type: "heading1",
        content: { html: `<h1>${text}</h1>`, plainText: text },
        order: order++,
      });
      continue;
    }

    // Heading 2
    if (trimmed.startsWith("## ") && !trimmed.startsWith("### ")) {
      flushList();
      const text = trimmed.slice(3).trim();
      blocks.push({
        type: "heading2",
        content: { html: `<h2>${text}</h2>`, plainText: text },
        order: order++,
      });
      continue;
    }

    // Heading 3
    if (trimmed.startsWith("### ")) {
      flushList();
      const text = trimmed.slice(4).trim();
      blocks.push({
        type: "heading3",
        content: { html: `<h3>${text}</h3>`, plainText: text },
        order: order++,
      });
      continue;
    }

    // Divider (---, ***, or ___)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushList();
      blocks.push({
        type: "divider",
        content: { html: "<hr />", plainText: "---" },
        order: order++,
      });
      continue;
    }

    // Quote
    if (trimmed.startsWith("> ")) {
      flushList();
      const text = trimmed.slice(2).trim();
      blocks.push({
        type: "quote",
        content: { html: `<p>${text}</p>`, plainText: text },
        order: order++,
      });
      continue;
    }

    // Image: ![alt](url)
    const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imageMatch) {
      flushList();
      const [, alt, url] = imageMatch;
      blocks.push({
        type: "image",
        content: { html: "", plainText: alt || "" },
        blockData: {
          type: "image", // Required by schema union
          url,
          caption: alt || "",
          alignment: "center",
        },
        order: order++,
      });
      continue;
    }

    // Bullet list (- or *)
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      const [, itemText] = bulletMatch;
      if (currentListType !== "bullet") {
        flushList();
        currentListType = "bullet";
      }
      currentListItems.push(itemText);
      continue;
    }

    // Numbered list (1., 2., etc.)
    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch) {
      const [, itemText] = numberedMatch;
      if (currentListType !== "numbered") {
        flushList();
        currentListType = "numbered";
      }
      currentListItems.push(itemText);
      continue;
    }

    // Default: paragraph
    flushList();
    blocks.push({
      type: "paragraph",
      content: { html: `<p>${trimmed}</p>`, plainText: trimmed },
      order: order++,
    });
  }

  // Flush any remaining list items
  flushList();

  return blocks;
}

/**
 * Helper to escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
