from pydantic import BaseModel #BaseModel will allow us to describe what our data should look like and validate that data


class Source(BaseModel):
    id: str
    title: str
    source: str
    is_cited: bool = False  #Whether the source is cited in the answer
    favicon_url: str | None = None #Stores the favicon URL if available

class Data(BaseModel):
    category: str
    question: str
    sources: list[Source]
    content: str
    