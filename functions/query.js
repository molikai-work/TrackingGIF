/*
 * Copyright (c) molikai-work (2025)
 * https://github.com/molikai-work/TrackingGIF
 * 根据 AGPL-3.0 许可证发布
 */

// functions/query.js

import { allowOrigin, createResponse } from './utils';

export async function onRequest(context) {
    const { request, env } = context;

    // 处理预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': allowOrigin,
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // 仅允许 POST 请求
    if (request.method !== 'POST') {
        return createResponse(405, '不支持的请求方法');
    }

    // 解析 JSON 请求体
    let requestBody;
    try {
        requestBody = await request.json();
    } catch {
        return createResponse(400, '请求体必须是有效的 JSON 格式');
    }

    // 从请求体中获取参数
    const { trackingId, password } = requestBody;

    // 检查必填字段
    if (!trackingId) {
        return createResponse(422, '请提供跟踪 ID');
    }
    if (!password) {
        return createResponse(422, '请提供管理密码');
    }

    // 验证密码
    const expectedPassword = env?.PASSWORD;
    if (!expectedPassword || password !== expectedPassword) {
        return createResponse(403, '管理密码错误');
    }

    try {
        // 查询 tracking 数据表
        const trackingInfo = await env.DB.prepare(`
            SELECT visited, visitCount
            FROM tracking 
            WHERE trackingId = ?
        `).bind(trackingId).first();

        if (!trackingInfo) {
            return createResponse(404, '跟踪 ID 不存在');
        }

        // 查询访问日志
        // 升序 ORDER BY time ASC
        // 降序 ORDER BY time DESC
        const logResults = await env.DB.prepare(`
            SELECT time, ip, country, userAgent
            FROM logs
            WHERE trackingId = ?
            ORDER BY time DESC
        `).bind(trackingId).all();

        const logs = logResults.results.map(log => ({
            time: log.time,
            ip: log.ip,
            country: log.country,
            userAgent: log.userAgent || null,
        }));

        // 返回结果
        return createResponse(200, 'success', {
            data: {
                trackingId,
                visited: trackingInfo.visited === "true",
                visitCount: trackingInfo.visitCount,
                logs
            },
        });

    } catch (error) {
        console.error('数据查询失败：', error);
        return createResponse(500, '服务器内部错误');
    }
}
