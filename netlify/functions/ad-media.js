// netlify/functions/ad-media.js

exports.handler = async (event) => {
  try {
    const snapshotUrl = event.queryStringParameters?.snapshot;

    if (!snapshotUrl) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ error: "snapshot param required" }),
      };
    }

    // Decode in case it's URL-encoded
    const url = decodeURIComponent(snapshotUrl);

    const fbRes = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const html = await fbRes.text();

    if (!fbRes.ok) {
      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: `FB error ${fbRes.status}`,
          details: html.slice(0, 500),
        }),
      };
    }

    // ---- very simple image extraction ----
    let imageUrl = null;

    // 1) <img src="...">
    const imgMatch = html.match(/<img[^>]+src="([^"]+)"/i);
    if (imgMatch && imgMatch[1]) {
      imageUrl = imgMatch[1];
    }

    // 2) background-image: url(...)
    if (!imageUrl) {
      const bgMatch = html.match(/background-image:\s*url\(([^)]+)\)/i);
      if (bgMatch && bgMatch[1]) {
        imageUrl = bgMatch[1].replace(/['"]/g, "");
      }
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ imageUrl }),
    };
  } catch (e) {
    console.error(e);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ error: "Unexpected error" }),
    };
  }
};
