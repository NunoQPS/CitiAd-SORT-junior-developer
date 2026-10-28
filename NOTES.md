# Implementation Notes

## My Approach

I started by getting the backend and frontend running so I could understand how the application worked before making any changes.

I decided to focus on the backend first, since both citation linking and personal data redaction needed to happen before the information reached the frontend.

Once those were working, I moved on to displaying everything in Next.js.

## Backend

**Citation linking**

I used Python's `re` module to find the reference IDs inside each answer, then matched them against the available sources using a dictionary.

From there, I replaced the references with clickable links to the relevant websites.

I also added an `is_cited` field to identify which sources were actually referenced in the answer. This helps distinguish them from the additional sources provided.

**Personal data redaction**

I used the provided GLiNER2 model to identify names, phone numbers and email addresses.

I then passed those results to Presidio to replace the personal information with the required placeholders.

The redaction happens in the backend, so the original personal details aren't sent to the frontend.

**Favicons**

I used `urlparse()` to get the hostname from each source URL and Google's favicon service to generate the corresponding icon URL.

I chose this approach because it was straightforward and avoided having to retrieve and store each website's favicon separately.

## Frontend

For the frontend, I used the existing Next.js setup and built on the components already provided.

I updated `page.tsx` to fetch the processed data from FastAPI and display each record through the `Content` component.

Each record now shows the redacted question, the answer with its references, and the complete list of sources.

I also added labels to make it easier to see which sources were cited and which were simply included as additional references.

For styling, I kept things fairly simple. My main focus was making the information easy to read and navigate rather than spending too much time on the appearance.

I also used `sanitize-html` to restrict the HTML being rendered from the answer content.

## Challenges and Limitations

One issue I noticed was in the debt advice record, where a reference ID didn't match any of the available source IDs.

Rather than assume which source it was meant to reference, I decided to display `[Source unavailable]`. I felt this was better than potentially linking to the wrong information.

I also had a few issues with my local development environment, including a port conflict and Visual Studio reporting TypeScript errors. However, the application compiled successfully using the Next.js build command.

The personal data redaction worked with the four supplied records, although I recognise that the model may not always identify every piece of personal information in different inputs.

The favicon implementation also relies on an external service, so the icons may not always be available.

## Testing

I tested the individual citation-matching and favicon functions using Python commands.

I also used FastAPI's `/docs` endpoint to check the returned data, including the redacted questions, citation links and source information.

On the frontend, I checked that all four records displayed correctly, including their answers, source lists and favicons.

Finally, I ran `npm run build`, which completed successfully, including the TypeScript checks.

I haven't included an automated test suite, so testing was mainly focused on the provided data and checking the application manually.

## What I'd Improve

If I had more time, I'd focus on adding automated tests, particularly for personal data redaction and citation matching.

I'd also look at improving how missing source references are handled, rather than simply displaying an unavailable message.

Another area worth exploring would be testing the redaction model against a wider variety of questions to see how reliably it identifies personal information.

Overall, I focused on getting the required functionality working while keeping the implementation understandable and relatively straightforward.