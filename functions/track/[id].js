/*
 * Copyright (c) molikai-work (2025)
 * https://github.com/molikai-work/TrackingGIF
 * 根据 AGPL-3.0 许可证发布
 */

// functions/track/[id].js

import { allowOrigin, createResponse } from '../utils';

// 单像素透明 GIF 内容
const PIXEL_GIF = new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
    0x01, 0x00, 0x80, 0xff, 0x00, 0xff, 0xff, 0xff,
    0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
    0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
    0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
    0x01, 0x00, 0x3b
]);

export async function onRequest(context) {
    const { request, params, env } = context;

    // 处理预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': allowOrigin,
                'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // 处理 params.id
    const rawId = params.id;
    if (!rawId || !rawId.endsWith('.gif')) {
        return createResponse(404, '', {}, true);
    }
    const trackingId = rawId.slice(0, -4); // 去除 .gif 后缀

    // 获取访客的 IP、地区和 UA
    const clientIP = request.headers.get('CF-Connecting-IP');
    const country = request.headers.get('CF-IPCountry');
    const userAgent = request.headers.get('User-Agent') || null;

    // 当前时间戳
    const formattedDate = Date.now().toString();

    // 验证 trackingId 的格式
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(trackingId)) {
        return createResponse(404, '', {}, true);
    }

    try {
        // 查询数据
        const trackingData = await env.DB.prepare(`
            SELECT visited, initialPingUrl
            FROM tracking
            WHERE trackingId = ?
            LIMIT 1
        `).bind(trackingId).first();

        if (!trackingData) {
            return createResponse(404, '', {}, true);
        }

        // 如果满足条件，向 initialPingUrl 发送请求
        if (trackingData.visited === 'false' && trackingData.initialPingUrl) {
            try {
                context.waitUntil(
                    fetch(trackingData.initialPingUrl).catch(() => {});
                );
            } catch (error) {
                // 忽略错误
            }
        }

        // 更新访问状态和增加计数
        await env.DB.prepare(`
            UPDATE tracking
            SET visited = "true", visitCount = visitCount + 1
            WHERE trackingId = ?
        `).bind(trackingId).first();

        // 记录访问日志
        await env.DB.prepare(`
            INSERT INTO logs (trackingId, time, ip, country, userAgent)
            VALUES (?, ?, ?, ?, ?)
        `).bind(
            trackingId,
            formattedDate,
            clientIP,
            country,
            userAgent
        ).run();

        // 返回 GIF
        return new Response(PIXEL_GIF, {
            headers: {
                'Content-Type': 'image/gif',
                'Content-Length': PIXEL_GIF.length.toString(),
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
            }
        });
    } catch (error) {
        console.error('处理跟踪请求时出错：', error);
        return createResponse(500, '', {}, true);
    }
}
