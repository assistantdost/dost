import json
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
import trafilatura


def search_web(query: str, num_results: int = 3, max_chars_per_page: int = 1000) -> str:
    """
    Search DuckDuckGo for a query, scrape the top results, and return their truncated content along with links and snippets.
    Use this to find detailed information online.
    """
    results = []
    url = "https://html.duckduckgo.com/html/"
    data = urllib.parse.urlencode({'q': query}).encode('utf-8')

    req = urllib.request.Request(
        url,
        data=data,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    )

    try:
        response = urllib.request.urlopen(req, timeout=5)
        html = response.read().decode('utf-8')
    except Exception as e:
        return json.dumps({"error": f"Search failed: {e}"})

    soup = BeautifulSoup(html, 'html.parser')

    for result_div in soup.find_all('div', class_='result'):
        try:
            anchor = result_div.find('a', class_='result__url')
            if not anchor or not anchor.get('href'):
                continue

            link = anchor['href']
            if 'uddg=' in link:
                try:
                    query_params = urllib.parse.parse_qs(urllib.parse.urlparse(link).query)
                    link = query_params.get('uddg', [link])[0]
                except Exception:
                    pass

            title_elem = result_div.find('h2', class_='result__title')
            title = title_elem.text.strip() if title_elem else 'No title'

            snippet_elem = result_div.find('a', class_='result__snippet')
            snippet = snippet_elem.text.strip() if snippet_elem else ''

            if link.startswith('http') and 'duckduckgo.com' not in link:
                results.append({
                    'title': title,
                    'url': link,
                    'snippet': snippet
                })

            if len(results) >= num_results:
                break
        except Exception:
            pass

    scraped_data = []
    for result in results:
        page_url = result['url']
        content = scrape_webpage(page_url)

        if len(content) > max_chars_per_page:
            content = f"{content[:max_chars_per_page]}\n\n... (truncated to {max_chars_per_page} characters) <u>[Read More]({page_url})</u>"

        scraped_data.append({
            "source_url": page_url,
            "title": result["title"],
            "search_snippet": result["snippet"],
            "extracted_content": content
        })

    return json.dumps(scraped_data, indent=2, ensure_ascii=False)


def scrape_webpage(url: str) -> str:
    """
    Fetch the content of a specific webpage URL. Returns the entire text content of the page without truncation.
    """
    try:
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'}
        )
        downloaded = urllib.request.urlopen(req, timeout=8).read()
    except Exception as e:
        return f"Error fetching {url}: {e}"

    clean_text = None
    if downloaded:
        clean_text = trafilatura.extract(
            downloaded,
            include_links=True,
            include_images=True,
            include_comments=False,
            output_format="markdown"
        )

        if not clean_text:
            try:
                soup = BeautifulSoup(downloaded, 'html.parser')
                for tag in soup(["script", "style", "nav", "footer", "header"]):
                    tag.decompose()
                clean_text = ' '.join(soup.get_text(separator=' ').split())
            except Exception as e:
                clean_text = f"Extraction failed: {e}"

    if clean_text:
        return clean_text
    else:
        return "Could not extract readable text."
