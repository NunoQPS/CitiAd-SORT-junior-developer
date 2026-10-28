
import Image from "next/image";
import { Suspense } from "react";

import Content, { type AdviceItem } from "@/components/Content";

// Fetch the processed advice records from our FastAPI backend
async function ContentList() {
    const response = await fetch("http://127.0.0.1:8000/data", {
        cache: "no-store",
    });

    // Display an error if the backend request fails
    if (!response.ok) {
        return <p>Unable to load advice records.</p>;
    }

    // Convert the JSON response into our TypeScript data structure
    const items: AdviceItem[] = await response.json();

    // Display a message when there are no records
    if (items.length === 0) {
        return <p>No advice records available.</p>;
    }

    // Render a separate Content component for every record
    return (
        <section className= "w-full space-y-6" >
        {
            items.map((item, index) => (
                <Content key= {`${item.category}-${index}`} item = { item } />
      ))
}
</section>
  );
}

export default function Home() {
    return (
        <main className= "mx-auto flex min-h-screen max-w-4xl flex-col items-center gap-8 px-5 py-10" >
        <header className="flex flex-col items-center text-center" >
            <Image
          src="/logo.png"
    alt = "Citizens Advice SORT"
    width = { 130}
    height = { 130}
    priority
        />

        <h1 className="mt-4 text-3xl font-bold" >
            Citizens Advice SORT
                </h1>

                < h2 className = "mt-2 text-lg" >
                    Junior Developer Practical
                        </h2>
                        </header>

                        < Suspense fallback = {< p > Loading advice records...</p>
}>
    <ContentList />
    </Suspense>
    </main>
  );
}
