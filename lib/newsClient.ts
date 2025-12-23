// lib/newsClient.ts
import type { DerivativeNews, NewsCardRow } from "@/components/types/derivativenews";

// util kecil: mapping negara → simbol indeks
const COUNTRY_SYMBOL_MAP: Record<string, string> = {
    Indonesia: "IDN Index",
    Japan: "JPN Index",
    "United States": "USA Index",
    Singapore: "SGP Index",
};

function mapRowToDerivativeNews(row: NewsCardRow): DerivativeNews {
    const symbol =
        COUNTRY_SYMBOL_MAP[row.country] ?? row.country ?? "Global Index";

    // di sini kamu bisa bikin time based on real data,
    // sementara kita pakai "Today" simple saja
    const now = new Date();
    const timeLabel = now.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    return {
        id: row.id,
        title: row.title,
        description: row.description,
        imageUrl: row.imageUrl,
        country: row.country,
        symbol,
    };
}

// Fungsi fetch utama – dipanggil dari Server Component
export async function fetchDerivativeNews(): Promise<DerivativeNews[]> {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!baseUrl) {
        throw new Error(
            "NEXT_PUBLIC_BACKEND_URL is not set. Please set it to your Ponder backend URL.",
        );
    }

    console.log("Fetching news_card from", baseUrl);

    const res = await fetch(`${baseUrl}/news_card`, {
        // Next.js App Router: caching / revalidate
        next: { revalidate: 60 }, // re-fetch tiap 60 detik (sesuaikan)
    });

    console.log("response Api: ", res);

    if (!res.ok) {
        throw new Error(`Failed to fetch news_card: ${res.statusText}`);
    }

    const data = (await res.json()) as NewsCardRow[];

    return data.map(mapRowToDerivativeNews);
}
