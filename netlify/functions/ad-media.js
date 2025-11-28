// netlify/functions/ad-media.js

const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;

exports.handler = async (event) => {
  try {
    const adId = event.queryStringParameters?.ad_id;
    if (!adId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "ad_id required" }),
      };
    }

    if (!FB_ACCESS_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "FB_ACCESS_TOKEN missing" }),
      };
    }

    const snapshotUrl =
      `https://www.facebook.com/ads/archive/render_ad/?id=${adId}` +
      `&access_token=${FB_ACCESS_TOKEN}`;

    const fbRes = await fetch(snapshotUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!fbRes.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({ error: `FB error ${fbRes.status}` }),
      };
    }

    const html = await fbRes.text();

    let imageUrl = null;

    const imgMatch = html.match(/<img[^>]+src="([^"]+)"/i);
    if (imgMatch && imgMatch[1]) {
      imageUrl = imgMatch[1];
    }

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
      body: JSON.stringify({ error: "Unexpected error" }),
    };
  }
};
