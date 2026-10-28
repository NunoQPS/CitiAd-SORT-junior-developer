
import json  #Read the mock JSON data
import re  #Find and replace citation references
import html  #Escape URLs when creating HTML links

from urllib.parse import urlparse  #Extract website information from URLs

from pathlib import Path  #Handle file paths

from fastapi import APIRouter, Depends  #Create API routes and inject dependencies
from gliner2 import GLiNER2  #Detect personal information in text
from presidio_anonymizer import AnonymizerEngine  #Redact detected personal details
from presidio_anonymizer.entities import OperatorConfig, RecognizerResult  #Configure replacements and detection results

from app.dependencies import get_model  #Access the redaction model loaded at startup
from app.models import Data, Source  #Define the structure of API data and sources


router = APIRouter(tags=["data"])

DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "mock.json"

def find_citations(content: str) -> list[str]:
    pattern = r"<ref>(.*?)</ref>"     #Find the source IDs inside <ref> tags

    return re.findall(pattern, content)    #Return ALL matching source IDs

def match_citations(content: str, sources: list[Source]) -> dict[str, str]:
    source_lookup = {source.id: source.source for source in sources}     #Create a lookup dictionary using source IDs as keys

    citation_ids = find_citations(content)     #Find all citation IDs in the answer

    #Match citations to their URLs, skipping IDs that don't exist
    return {
        citation_id: source_lookup[citation_id]
        for citation_id in citation_ids
        if citation_id in source_lookup
    }

def link_citations(content: str, sources: list[Source]) -> str:
    citation_links = match_citations(content, sources)     #Get the URLs associated with the citations

    def replace_reference(match: re.Match[str]) -> str:
        citation_id = match.group(1)         #Extract the citation ID from the matched tag
        url = citation_links.get(citation_id)         #Find the URL associated with the ID

        #Handle references that have no matching source
        if url is None:
            return "[Source unavailable]"

        #Escape the URL and create a clickable HTML link
        safe_url = html.escape(url, quote=True)
        return (
            f'<a href="{safe_url}" target="_blank" '
            f'rel="noopener noreferrer">[Source]</a>'
        )

    # Replace each reference tag with its corresponding link
    return re.sub(r"<ref>(.*?)</ref>", replace_reference, content)


def redact_question(question: str, model: GLiNER2) -> str:
    # Personal details the model needs to identify
    labels = [
        "full_name",
        "first_name",
        "last_name",
        "email",
        "phone_number",
    ]

    # Detect personal details and their positions in the text
    results = model.extract_entities(
        question,
        labels,
        include_spans=True,
        include_confidence=True,
    )

    # Convert GLiNER2 results into Presidio recognizer results
    recognizer_results = []

    for label, entities in results["entities"].items():
        for entity in entities:
            recognizer_results.append(
                RecognizerResult(
                    entity_type=label,
                    start=entity["start"],
                    end=entity["end"],
                    score=entity["confidence"],
                )
            )

    # Define the replacement for each personal detail
    operators = {
        "full_name": OperatorConfig("replace", {"new_value": "[NAME]"}),
        "first_name": OperatorConfig("replace", {"new_value": "[NAME]"}),
        "last_name": OperatorConfig("replace", {"new_value": "[NAME]"}),
        "email": OperatorConfig("replace", {"new_value": "[EMAIL]"}),
        "phone_number": OperatorConfig("replace", {"new_value": "[PHONE]"}),
    }

    # Replace detected details and handle overlapping names
    anonymizer = AnonymizerEngine()
    result = anonymizer.anonymize(
        text=question,
        analyzer_results=recognizer_results,
        operators=operators,
    )

    return result.text

def get_favicon_url(url: str) -> str | None:
    # Get the hostname from the website URL
    parsed_url = urlparse(url)
    domain = parsed_url.hostname

    # Stop if the URL has no hostname
    if domain is None:
        return None

    # Build a favicon URL using the website's hostname
    favicon_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=32"
    return favicon_url  # Send the URL back to the caller



@router.get("/data")
def get_data(model: GLiNER2 = Depends(get_model)) -> list[Data]:
    #Load and validate the original data
    items = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    data = [Data.model_validate(item) for item in items]

    #Process each advice record
    for item in data:
        # Find citations before replacing their tags
        cited_ids = set(find_citations(item.content))

        #Update each source
        for source in item.sources:
            source.is_cited = source.id in cited_ids
            source.favicon_url = get_favicon_url(source.source)

        #Link the citations and redact personal information
        item.content = link_citations(item.content, item.sources)
        item.question = redact_question(item.question, model)

    #Return all processed records
    return data

