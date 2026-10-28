
import Image from "next/image";
import sanitizeHtml from "sanitize-html";

// Define the structure of an individual source
type Source = {
    id: string;
    title: string;
    source: string;
    is_cited: boolean;
    favicon_url: string | null;
};

// Define the advice record returned by FastAPI
export type AdviceItem = {
    category: string;
    question: string;
    content: string;
    sources: Source[];
};

// Give the categories readable display names
const categoryNames: Record<string, string> = {
    consumer_goods_and_services: "Consumer Goods and Services",
    benefits_and_tax_credits: "Benefits and Tax Credits",
    debt: "Debt Advice",
    gva_and_hate_crime: "Hate Crime",
};

export default function Content({ item }: { item: AdviceItem }) {
    // Allow only the HTML needed for formatting and source links
    const safeContent = sanitizeHtml(item.content, {
        allowedTags: ["b", "a"],
        allowedAttributes: {
            a: ["href", "target", "rel"],
        },
        allowedSchemes: ["https", "http"],
    });

    // Find how many sources are referenced in the answer
    const citedCount = item.sources.filter(
        (source) => source.is_cited
    ).length;

    return (
        <article className= "w-full rounded-xl bg-white p-6 text-slate-900 shadow-lg" >
        {/* Advice category */ }
        < div className = "mb-5 flex flex-wrap items-center justify-between gap-2" >
            <h2 className="text-xl font-bold text-blue-900" >
            { categoryNames[item.category] ?? item.category }
                </h2>

                < span className = "rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800" >
                { citedCount } cited sources
                    </span>
                    </div>

    {/* Client question with personal details removed */ }
    <section className="mb-6" >
        <h3 className="mb-2 text-base font-semibold" >
            Adviser Question
                </h3>

                < p className = "rounded-lg bg-slate-100 p-4 leading-7 text-slate-700" >
                { item.question }
                    </p>
                    </section>

    {/* Advice answer containing the source hyperlinks */ }
    <section className="mb-6" >
        <h3 className="mb-3 text-base font-semibold" >
            Advice
            </h3>

            < div
    className = "whitespace-pre-line leading-7 text-slate-700 [&_a]:font-medium [&_a]:text-blue-700 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-blue-950 [&_b]:font-semibold"
    dangerouslySetInnerHTML = {{ __html: safeContent }
}
        />
    </section>

{/* Display every source, including uncited ones */ }
<section className="border-t border-slate-200 pt-5" >
    <h3 className="mb-3 text-base font-semibold" >
        Sources
        </h3>

        < ul className = "space-y-3" >
            {
                item.sources.map((source) => (
                    <li
              key= { source.id }
              className = "flex items-start gap-3 rounded-lg bg-slate-50 p-3"
                    >
                    {/* Display the website favicon when available */ }
              {
                        source.favicon_url ? (
                            <Image
                  src= { source.favicon_url }
                  alt=""
                  width={ 24}
                  height={ 24}
                  unoptimized
                  className="mt-1 h-6 w-6 shrink-0 object-contain"
                        />
              ) : (
                            <span className="mt-1 h-6 w-6 shrink-0 rounded bg-slate-200" />
              )}

<div className="min-w-0 flex-1" >
{/* Source title opens the original website */ }
    < a
href = { source.source }
target = "_blank"
rel = "noopener noreferrer"
className = "break-words font-medium text-blue-700 underline-offset-2 hover:underline"
    >
{ source.title }
    </a>

{/* Indicate whether the answer actually cites this source */ }
<p className="mt-1 text-xs text-slate-500" >
{
    source.is_cited
        ? "Cited in answer"
        : "Additional source"
}
    </p>
    </div>
    </li>
          ))}
</ul>
    </section>
    </article>
  );
}
