# TrackingGIF
一个基于 Cloudflare Pages 的跟踪像素（图片探针）程序

## 部署
1. Fork 分叉此仓库，打开 Cloudflare 控制台，在 `Workers 和 Pages` 页面创建一个 Pages 应用程序，连接到 Git 然后选择您刚刚分叉的这个仓库，什么设置项都不用填，直接保存并部署即可。
2. 在 `D1 SQL 数据库` 页面创建一个 D1 数据库，名称、区域随意，您喜欢就好，  
然后找到项目根目录下的 [`tracking.sql`](tracking.sql) 文件，复制内容在您刚刚创建的 D1 数据库的控制台里粘贴并执行。
3. 在 `Workers 和 Pages` 页面下找到您刚刚创建的 Pages 应用程序，进入设置，  
往下翻找到 `变量和机密`，添加一个变量：变量名称为 `PASSWORD`，值填写一个强大的密码并保存，这将作为您使用本程序的密码，  
然后找到 `绑定`，添加一个 D1 数据库的绑定：变量名称为 `DB`，D1 数据库选择您刚刚创建的 D1 数据库并保存。
4. 在 Pages 应用程序的 `部署` 页面重试部署，完成。

## 使用
由于本程序主要是面向最终用户的，所以并未提供前端界面，您需要通过 API 接口来管理。

### 创建 `/create`
POST /create，请求体带 JSON：
```json
{
    "password": "0123456789"
}
```

`password` 的值填写您在部署阶段第3步设置的密码。

返回：
```json
{
    "code": 200,
    "message": "success",
    "time": 1743758735672,
    "trackingId": "63d8129f-6010-452f-a0af-9117284d758c"
}
```

其中的 `trackingId` 字段是生成的跟踪 ID，  
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
    "password": "0123456789"
}
```

`trackingId` 的值填写您要查询的跟踪 ID。  
`password` 的值填写您在部署阶段第3步设置的密码。

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
                "time": "1743759381268", // 访问时间
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

![](https://trackinggif.pages.dev/track/4dc2a514-5de1-4133-ae0a-eefa52d47fb5.gif)
