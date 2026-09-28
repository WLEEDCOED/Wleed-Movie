import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

const ALLOWED_DOMAINS = [
  'voe.sx',
  'luluvdo.com',
  'streamtape.com',
  'doodstream.com',
  'ok.ru',
  'vk.com',
  'vixcloud.co',
  'filemoon.sx',
  'vidoza.net',
  'mixdrop.co',
  'upstream.to',
];

const AD_SCRIPT_PATTERNS = [
  'ads',
  'popunder',
  'doubleclick',
  'googlesyndication',
  'exoclick',
  'juicyads',
  'trafficjunky',
  'popads',
  'adsterra',
  'propellerads',
  'hilltopads',
  'clickadu',
  'monetag',
  'a-ads',
];

const AD_IFRAME_PATTERNS = [
  'doubleclick',
  'googlesyndication',
  'adsystem',
  'popads',
  'adsterra',
];

const AD_ELEMENT_PATTERNS = [
  '[class*="ad-"]',
  '[id*="ad-"]',
  '[class*="advert"]',
  '[class*="popup"]',
  '[class*="overlay"]',
  '[class*="banner"]',
  '[id*="popup"]',
  '[id*="overlay"]',
  '.ad',
  '#ad',
  '.ads',
  '#ads',
];

function isDomainAllowed(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ALLOWED_DOMAINS.some(
      (domain) =>
        parsedUrl.hostname === domain ||
        parsedUrl.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

function cleanHtml(html: string, baseUrl: string): string {
  const $ = cheerio.load(html);

  // Remove ad scripts
  for (const pattern of AD_SCRIPT_PATTERNS) {
    $(`script[src*="${pattern}"]`).remove();
  }

  // Remove ad iframes
  for (const pattern of AD_IFRAME_PATTERNS) {
    $(`iframe[src*="${pattern}"]`).remove();
  }

  // Remove ad elements
  for (const selector of AD_ELEMENT_PATTERNS) {
    $(selector).remove();
  }

  // Remove onclick handlers that open new windows
  $('[onclick]').each(function () {
    const onclick = $(this).attr('onclick') || '';
    if (onclick.includes('window.open') || onclick.includes('popup')) {
      $(this).removeAttr('onclick');
    }
  });

  // Remove target="_blank" links
  $('a[target="_blank"]').removeAttr('target');

  // Remove popunder/popup scripts inline
  $('script').each(function () {
    const content = $(this).html() || '';
    if (
      content.includes('popunder') ||
      content.includes('window.open') ||
      content.includes('popup') ||
      content.includes('clickunder') ||
      content.includes('ad_') ||
      content.includes('adblock')
    ) {
      $(this).remove();
    }
  });

  // Inject base tag for relative URLs
  const baseTag = `<base href="${baseUrl}">`;
  $('head').prepend(baseTag);

  // Inject CSS to hide remaining ad elements
  const hideAdsCSS = `
    <style>
      [class*="ad-"], [id*="ad-"], [class*="advert"],
      [class*="popup"], [class*="overlay"], [class*="banner"],
      .ad, #ad, .ads, #ads, .pop, #pop {
        display: none !important;
      }
    </style>
  `;
  $('head').append(hideAdsCSS);

  return $.html();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return new NextResponse(
      '<html><body style="background:#000;color:#666;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif"><p>URL parameter required</p></body></html>',
      {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  if (!isDomainAllowed(url)) {
    return new NextResponse(
      '<html><body style="background:#000;color:#666;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif"><p>Domain not allowed</p></body></html>',
      {
        status: 403,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: new URL(url).origin + '/',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || '';

    // If not HTML, pass through as-is
    if (
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml')
    ) {
      const body = await response.arrayBuffer();
      return new NextResponse(body, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // HTML content - clean it
    const html = await response.text();
    const cleanedHtml = cleanHtml(html, new URL(url).origin);

    return new NextResponse(cleanedHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Stream proxy error:', error);
    return new NextResponse(
      '<html><body style="background:#000;color:#666;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif"><p>خطأ في تحميل المحتوى</p></body></html>',
      {
        status: 500,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }
}
