// ==UserScript==
// @name         VidStuck Ad & Sandbox Bypass (Cinema Plus)
// @namespace    https://cinema-three-wheat.vercel.app/
// @version      1.1
// @description  منع إعلانات المشغل المنبثقة وخداع فحص الحظر وإزالة الطبقات الشفافة
// @author       Wleed
// @match        *://*.vidstuck.*/*
// @match        *://vidstuck.*/*
// @match        *://*.zxcstream.*/*
// @match        *://zxcstream.*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('[AdShield] تم تفعيل مانع إعلانات VidStuck بنجاح!');

    // 1. كائن وهمي يحاكي النافذة المفتوحة بنجاح لخداع فحص المشغل
    const fakeWindow = {
        closed: false,
        name: '',
        opener: window,
        focus: function() {},
        blur: function() {},
        close: function() { this.closed = true; },
        location: {
            href: '',
            replace: function() {},
            assign: function() {}
        },
        document: {
            write: function() {},
            open: function() {},
            close: function() {}
        }
    };

    // 2. استبدال window.open لترجع الكائن الوهمي بدون فتح أي نافذة حقيقية
    try {
        Object.defineProperty(window, 'open', {
            configurable: true,
            writable: true,
            value: function(url, target, features) {
                console.log('[AdShield] تم اعتراض ومنع فتح نافذة إعلانية وهمياً:', url);
                return fakeWindow;
            }
        });
    } catch (e) {
        window.open = function() {
            return fakeWindow;
        };
    }

    // 3. اعتراض النقر على الروابط الخارجية التي تفتح في صفحة جديدة (_blank)
    window.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && (link.target === '_blank' || link.getAttribute('target') === '_blank')) {
            console.log('[AdShield] تم منع فتح رابط إعلاني خارجي:', link.href);
            e.preventDefault();
            e.stopImmediatePropagation();
        }
    }, true);

    // 4. مراقبة وإزالة الطبقات الإعلانية الشفافة الخفية (Invisible Overlays)
    function removeInvisibleOverlays() {
        const elements = document.querySelectorAll('div, a');
        elements.forEach(el => {
            if (el.tagName === 'VIDEO' || el.closest('video') || el.classList.contains('art-video-player')) return;

            const style = window.getComputedStyle(el);
            const isFixed = style.position === 'fixed' || style.position === 'absolute';
            const isHighZ = parseInt(style.zIndex, 10) >= 100 || style.zIndex === '2147483647';
            const isTransparent = style.opacity === '0' || style.backgroundColor === 'rgba(0, 0, 0, 0)' || style.backgroundColor === 'transparent';
            const isFullSize = el.offsetWidth >= window.innerWidth * 0.8 && el.offsetHeight >= window.innerHeight * 0.8;

            if (isFixed && isHighZ && (isTransparent || isFullSize) && el.children.length === 0) {
                console.log('[AdShield] تم حذف طبقة شفافة خفية:', el);
                el.remove();
            }
        });
    }

    const observer = new MutationObserver(() => {
        removeInvisibleOverlays();
    });

    if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            observer.observe(document.body, { childList: true, subtree: true });
        });
    }
})();
