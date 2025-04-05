# TrackingGIF
一个基于 Cloudflare Pages 的跟踪像素（图片探针）程序。

## 部署
1. Fork 分叉[此仓库](https://github.com/molikai-work/TrackingGIF)，打开 Cloudflare 控制台，在 `Workers 和 Pages` 页面创建一个 Pages 应用程序，连接到 Git 然后选择您刚刚分叉的这个仓库，什么设置项都不用填，直接保存并部署即可。
2. 在 `D1 SQL 数据库` 页面创建一个 D1 数据库，名称、区域随意，您喜欢就好，  
然后找到项目根目录下的 [`tracking.sql`](tracking.sql) 文件，复制内容在您刚刚创建的 D1 数据库的控制台里粘贴并执行。
3. 在 `Workers 和 Pages` 页面下找到您刚刚创建的 Pages 应用程序，进入设置，  
往下翻找到 `变量和机密`，添加一个变量：变量名称为 `PASSWORD`，值填写一个强大的密码并保存，这将作为您使用本程序的密码，  
然后找到 `绑定`，添加一个 D1 数据库的绑定：变量名称为 `DB`，D1 数据库选择您刚刚创建的 D1 数据库并保存。
4. 在 Pages 应用程序的 `部署` 页面重试部署，完成。

## 使用
由于本程序的功能主要是面向最终用户的，所以并未提供前端管理界面，您需要通过 API 接口来管理程序。

### 创建 `/create`
POST /create，请求体带 JSON：
```json
{
    "password": "0123456789"
}
```

`password` 的值填写您在部署阶段第3步设置的密码，必填。

返回：
```json
{
    "code": 200, // 状态码
    "message": "success", // 返回的消息
    "time": 1743758735672, // 请求时间戳
    "trackingId": "63d8129f-6010-452f-a0af-9117284d758c" // 跟踪 ID
}
```

将这个跟踪 ID 拼接得到：
```txt
https://example.com/track/63d8129f-6010-452f-a0af-9117284d758c.gif
```

您可以将这串 URL 以图片的形式引入到电子邮件中，可以简单粗略的判断对方是否已读。

### 查询 `/query`
POST /query，请求体带 JSON：
```json
{
    "trackingId": "63d8129f-6010-452f-a0af-9117284d758c",
    "sortOrder": "asc",
    "limit": "10",
    "password": "0123456789"
}
```

`trackingId` 的值填写您要查询的跟踪 ID，必填。  
`sortOrder` 的值填写您需要按升序还是降序查询，`asc` 和 `desc`，可选，默认为 `desc` 降序。  
`limit` 的值填写您需要输出多少条记录，正整数且最大为 10,000,000，可选，默认为全部输出。  
`password` 的值填写您在部署阶段第3步设置的密码，必填。

返回：
```json
{
    "code": 200,
    "message": "success",
    "time": 1743759386232,
    "data": {
        "trackingId": "63d8129f-6010-452f-a0af-9117284d758c", // 查询的跟踪 ID
        "visited": true, // 是否已访问
        "visitCount": 2, // 访问次数
        "logs": [
            {
                "time": "1743759381268", // 访问时间戳
                "ip": "56.133.0.0", // 访问者 IP
                "country": "XX", // 访问者地区代码
                "userAgent": "Go-http-client/1.1" // 访问者 UA
            },
            {
                "time": "1743759372320",
                "ip": "56.133.0.0",
                "country": "XX",
                "userAgent": "Go-http-client/1.1"
            }
        ]
    }
}
```

### 删除 `/delete`
POST /delete，请求体带 JSON：
```json
{
    "trackingId": "63d8129f-6010-452f-a0af-9117284d758c",
    "password": "0123456789"
}
```

`trackingId` 的值填写您要删除的跟踪 ID，必填。  
`password` 的值填写您在部署阶段第3步设置的密码，必填。

返回：
```http
HTTP/1.1 204 No Content
```

## 错误提示
1.
    ```json
    {
        "code": 403,
        "message": "管理密码错误",
        "time": 1743833970121
    }
    ```

    解释：您在 `password` 字段提供的密码无效。

2.
    ```json
    {
        "code": 400,
        "message": "无效的跟踪 ID",
        "time": 1743834105599
    }
    ```

    解释：您在 `trackingId` 字段提供的跟踪 ID 无效。

3.
    ```json
    {
        "code": 400,
        "message": "无效的排序方式",
        "time": 1743834148588
    }
    ```

    解释：您在 `sortOrder` 字段提供的排序方式无效。

4.
    ```json
    {
        "code": 400,
        "message": "无效的输出限制",
        "time": 1743834186189
    }
    ```

    解释：您在 `limit` 字段提供的输出限制无效。

5.
    ```json
    {
        "code": 404,
        "message": "跟踪 ID 不存在",
        "time": 1743834250267
    }
    ```

    解释：您提供的 `trackingId` 字段不存在。

6.
    ```json
    {
        "code": 422,
        "message": "请提供跟踪 ID",
        "time": 1743834307575
    }
    ```

    解释：您未提供 `trackingId` 字段。

7.
    ```json
    {
        "code": 401,
        "message": "请提供管理密码",
        "time": 1743834364127
    }
    ```

    解释：您未提供 `password` 字段。

8.
    ```json
    {
        "code": 405,
        "message": "不支持的请求方法",
        "time": 1743834463268
    }
    ```

    解释：您对接口使用了它不支持的请求方式。

9.
    ```json
    {
        "code": 400,
        "message": "请求体必须是有效的 JSON 格式",
        "time": 1743834533066
    }
    ```

    解释：您向接口提供了它无法解析的 JSON 格式。

10.
    ```json
    {
        "code": 500,
        "message": "服务器内部错误",
        "time": 1743834533066
    }
    ```

    解释：发生了意料之外的错误，请查看函数日志以了解更多信息。

## 许可证
本程序使用 AGPL-3.0，  
更多信息请参见 [LICENSE](LICENSE)。

![](https://trackinggif.pages.dev/track/4dc2a514-5de1-4133-ae0a-eefa52d47fb5.gif)
