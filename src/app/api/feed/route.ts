import { NextRequest, NextResponse } from "next/server";
import Parser from "rss-parser";
import { isCleanNewsText } from "@/lib/content-filter";

type CustomItem = {
  "media:content"?: { $?: { url?: string } };
  "media:thumbnail"?: { $?: { url?: string } };
  "content:encoded"?: string;
  enclosure?: { url?: string; length?: string; type?: string };
};

const parser = new Parser<Record<string, unknown>, CustomItem>({
  customFields: {
    item: [
      ["media:content", "media:content"],
      ["media:thumbnail", "media:thumbnail"],
      ["content:encoded", "content:encoded"],
    ],
  },
  timeout: 10_000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; OmniNewsBot/1.0; +https://omninews.ru)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

function extractImg(html: string): string {
  const m = html?.match(/<img[^>]+src=["']([^"'\s>]+)/i);
  return m?.[1] ?? "";
}

function stripHtml(s: string): string {
  return (s ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-zA-Z#\d]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "No URL" }, { status: 400 });
  }

  try {
    const feed = await parser.parseURL(url);
    const items = (feed.items ?? []).map((item, i) => {
      const mediaUrl =
        item["media:content"]?.["$"]?.url ??
        item["media:thumbnail"]?.["$"]?.url ??
        "";
      const enclosureUrl = item.enclosure?.url ?? "";
      const contentEncoded = item["content:encoded"] ?? "";

      const thumbnail =
        mediaUrl ||
        enclosureUrl ||
        extractImg(contentEncoded) ||
        extractImg(item.content ?? "") ||
        extractImg(item.summary ?? "");

      const title = stripHtml(item.title ?? "");
      const description = stripHtml(
        item.contentSnippet ?? item.summary ?? item.content ?? ""
      ).slice(0, 280);
      if (!isCleanNewsText(title, description)) return null;

      return {
        id: `${url}::${i}::${item.pubDate ?? item.isoDate ?? i}`,
        title,
        description,
        link: item.link ?? "#",
        pubDate: item.pubDate ?? item.isoDate ?? "",
        thumbnail: thumbnail?.startsWith("http") ? thumbnail : "",
        source: feed.title ?? "",
      };
    }).filter(Boolean) as Array<{
      id: string;
      title: string;
      description: string;
      link: string;
      pubDate: string;
      thumbnail: string;
      source: string;
    }>;

    return NextResponse.json(
      { status: "ok", items, feedTitle: feed.title ?? "" },
      {
        headers: {
          "Cache-Control": "s-maxage=120, stale-while-revalidate=300",
        },
      }
    );
  } catch (e) {
    console.error("[api/feed] Error fetching", url, e);
    return NextResponse.json({ status: "error", items: [] }, { status: 200 });
  }
}
