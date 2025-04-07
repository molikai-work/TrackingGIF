// functions/query.js

import { allowOrigin, createResponse } from './utils';

export async function onRequest(context) {
    const { request, env } = context;

    // 处理预检请求
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
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
    const { trackingId, sortOrder, limit, password } = requestBody;

    // 检查必填字段
    if (!trackingId) {
        return createResponse(422, '请提供跟踪 ID');
    }
    if (!password) {
        return createResponse(401, '请提供管理密码');
    }

    // 验证 trackingId 的格式
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidV4Regex.test(trackingId)) {
        return createResponse(400, '无效的跟踪 ID');
    }

    // 验证 sortOrder 是否有效
    const validSortOrders = ['asc', 'desc'];
    if (sortOrder && !validSortOrders.includes(sortOrder)) {
        return createResponse(400, '无效的排序方式');
    }
    // 默认排序方式为降序
    const orderBy = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // 验证 limit 是否为正整数
    let logsLimit = null;
    if (limit !== undefined) {
        if (!/^\d+$/.test(limit)) {
            return createResponse(400, '无效的输出限制');
        }

        const parsedLimit = parseInt(limit, 10);
        if (parsedLimit <= 0 || parsedLimit > 10000000) {
            return createResponse(400, '无效的输出限制');
        }

        logsLimit = parsedLimit;
    }

    // 验证密码
    const expectedPassword = env?.PASSWORD;
    if (!expectedPassword || password !== expectedPassword) {
        return createResponse(403, '管理密码错误');
    }

    try {
        // 查询 tracking 数据表
        const trackingInfo = await env.DB.prepare(`
            SELECT visited, visitCount, initialPingUrl
            FROM tracking 
            WHERE trackingId = ?
        `).bind(trackingId).first();

        if (!trackingInfo) {
            return createResponse(404, '跟踪 ID 不存在');
        }

        // 构建 SQL 查询语句
        let logsQuery = `
            SELECT time, ip, country, userAgent
            FROM logs
            WHERE trackingId = ?
            ORDER BY time ${orderBy}
        `;
        if (logsLimit !== null) {
            logsQuery += ` LIMIT ${logsLimit}`;
        }

        const logResults = await env.DB.prepare(logsQuery).bind(trackingId).all();

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
                visited: trackingInfo.visited,
                visitCount: trackingInfo.visitCount,
                initialPingUrl: trackingInfo.initialPingUrl == null ? null : trackingInfo.initialPingUrl,
                logs
            },
        });
    } catch (error) {
        console.error('数据查询失败：', error);
        return createResponse(500, '服务器内部错误');
    }
}
