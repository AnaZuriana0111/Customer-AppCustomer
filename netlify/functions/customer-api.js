/**
 * Netlify Function proxy untuk Google Apps Script.
 *
 * WAJIB: Tampal URL Web App Google Apps Script yang berakhir dengan /exec.
 * Contoh:
 * https://script.google.com/macros/s/AKfycbxxxxxxxxxxxxxxxx/exec
 */
const GOOGLE_SCRIPT_URL = "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

exports.handler = async function handler(event) {
  try {
    if (
      !GOOGLE_SCRIPT_URL ||
      GOOGLE_SCRIPT_URL.includes("PASTE_GOOGLE_APPS_SCRIPT") ||
      !GOOGLE_SCRIPT_URL.endsWith("/exec")
    ) {
      return json(500, {
        status: "error",
        message: "Masukkan URL Google Apps Script /exec dalam netlify/functions/customer-api.js."
      });
    }

    const method = String(event.httpMethod || "GET").toUpperCase();
    if (!['GET', 'POST'].includes(method)) {
      return json(405, {
        status: "error",
        message: "Method tidak dibenarkan."
      });
    }

    const query = event.rawQuery ? `?${event.rawQuery}` : "";
    const targetUrl = `${GOOGLE_SCRIPT_URL}${query}`;

    const fetchOptions = {
      method,
      redirect: "follow",
      headers: {
        "Accept": "application/json"
      }
    };

    if (method === "POST") {
      fetchOptions.headers["Content-Type"] = "text/plain;charset=utf-8";
      fetchOptions.body = event.body || "{}";
    }

    const response = await fetch(targetUrl, fetchOptions);
    const responseText = await response.text();

    if (!response.ok) {
      return json(response.status || 502, {
        status: "error",
        message: `Google Apps Script pulangkan HTTP ${response.status}.`,
        details: responseText.slice(0, 500)
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (error) {
      return json(502, {
        status: "error",
        message: "Respons Google Apps Script bukan JSON. Semak deployment access: Execute as Me, Who has access: Anyone.",
        details: responseText.slice(0, 500)
      });
    }

    return json(200, parsed);
  } catch (error) {
    console.error("customer-api proxy error:", error);
    return json(500, {
      status: "error",
      message: error instanceof Error ? error.message : "Ralat proxy Netlify."
    });
  }
};

function json(statusCode, payload) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  };
}
