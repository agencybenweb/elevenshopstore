from duckduckgo_search import DDGS

ddgs = DDGS()
results = ddgs.images("Red Bull Green Edition can packshot png", max_results=5)
print(f"Results count: {len(results)}")
for r in results:
    print("Title:", r.get('title'))
    print("Image:", r.get('image'))
    print("Thumbnail:", r.get('thumbnail'))
    print("---")
