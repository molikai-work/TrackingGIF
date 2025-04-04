/*
 * Copyright (c) molikai-work (2025)
 * https://github.com/molikai-work/TrackingGIF
 * 根据 AGPL-3.0 许可证发布
 */

// functions/create.js

import { allowOrigin, createResponse } from './utils';

export async function onRequest(context) {
    const { request, env } = context;

    // 预检请求处理
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

    // 当前时间戳
    const formattedDate = Date.now().toString();

    // 解析 JSON 请求体
    let requestBody;
    try {
        requestBody = await request.json();
    } catch {
        return createResponse(400, '请求体必须是有效的 JSON 格式');
    }

    // 从请求体中获取参数
    const { password } = requestBody;

    // 检查必填字段
    if (!password) {
        return createResponse(422, '请提供管理密码');
    }

    // 密码验证
    const expectedPassword = env?.PASSWORD;
    if (!expectedPassword || password !== expectedPassword) {
        return createResponse(403, '管理密码错误');
    }

    // 创建追踪 ID
    const trackingId = crypto.randomUUID();

    try {
        // 插入新的追踪 ID
        await env.DB.prepare(`
            INSERT INTO tracking (trackingId, createdAt, visited, visitCount)
            VALUES (?, ?, ?, ?)
        `)
        .bind(trackingId, formattedDate, "false", 0)
        .run();

        return createResponse(200, 'success', { trackingId });
    } catch (error) {
        console.error('追踪 ID 创建失败：', error);
        return createResponse(500, '服务器内部错误');
    }
}
