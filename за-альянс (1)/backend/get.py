import requests

cookies = {
    "__ddg9_": "104.28.232.202",
    "__ddg1_": "B4V4RboXUTbNtbGeXzoo",
    "xf_manga_2100": "1",
    "xf_manga_2100": "1",
    "xf_session": "b2011d940ed93f1f01aa07daf0e7c13d",
    "xf_session": "b2011d940ed93f1f01aa07daf0e7c13d",
    "G_ENABLED_IDPS": "google",
    "__ddg10_": "1756999922",
    "__ddg8_": "zOWl7RPjdRns5knv",
}

headers = {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    "cache-control": "max-age=0",
    "if-modified-since": "Thu, 04 Sep 2025 15:32:01 GMT",
    "priority": "u=0, i",
    "sec-ch-ua": '"Chromium";v="140", "Not=A?Brand";v="24", "Google Chrome";v="140"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "none",
    "sec-fetch-user": "?1",
    "upgrade-insecure-requests": "1",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
    # 'cookie': '__ddg9_=104.28.232.202; __ddg1_=B4V4RboXUTbNtbGeXzoo; xf_manga_2100=1; xf_manga_2100=1; xf_session=b2011d940ed93f1f01aa07daf0e7c13d; xf_session=b2011d940ed93f1f01aa07daf0e7c13d; G_ENABLED_IDPS=google; __ddg10_=1756999922; __ddg8_=zOWl7RPjdRns5knv',
}

response = requests.get(
    "https://desu.city/manga/omniscient-readers-viewpoint.2100/",
    cookies=cookies,
    headers=headers,
)

with open("output.html", "w", encoding="utf-8") as file:
    file.write(response.text)
