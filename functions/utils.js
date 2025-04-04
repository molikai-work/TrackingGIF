/*
 * Copyright (c) molikai-work (2025)
 * https://github.com/molikai-work/TrackingGIF
 * 根据 AGPL-3.0 许可证发布
 */

// functions/utils.js

// 跨域请求允许域
export const allowOrigin = "*"

// CORS 相关的响应头部信息
export const corsHeaders = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
};

// 统一返回函数
export function createResponse(code, message, extraData = {}) {
    return Response.json({
        code: code,
        message: message,
        time: Date.now(),
        ...extraData
    }, {
        headers: corsHeaders,
        status: code
    });
}
