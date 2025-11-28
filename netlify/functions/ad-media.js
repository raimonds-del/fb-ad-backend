// netlify/functions/ad-media.js

exports.handler = async (event) => {
  try {
    const adId = event.queryStringParameters?.ad_id;
    if (!adId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "ad_id required" }),
      };
    }

    // ✅ No access_token, public snapshot
    const snapshotUrl =
      `https://www.facebook.com/ads/archive/render_ad/?id=${adId}`;

    const fbRes = await fetch(snapshotUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0", // pretend to be a normal browser
      },
    });

    const html = await fbRes.text();

    if (!fbRes.ok) {
      // return FB body as well for debugging
      return {
        statusCode: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: `FB error ${fbRes.status}`,
          details: html.slice(0, 500), // first 500 chars for debug
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
