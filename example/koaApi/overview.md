## Koa

### introduction

Koa是Express团队设计的一个新的web框架，它的目标是为web应用程序和api提供一个更小、更富表现力、更健壮的基础。通过利用异步函数，Koa允许您放弃回调并大大增加错误处理。Koa在其核心中不捆绑任何中间件，并且它提供了一套优雅的方法，使编写服务器变得快速和令人愉快。

### installation

Koa要求节点v7.6.0或更高版本才能支持ES2015和异步功能。

您可以使用喜欢的版本管理器快速安装受支持的节点版本：

```sh
$ nvm install 7
$ npm i koa
$ node my-koa-app.js
```
### aapplication

Koa应用程序是一个对象，其中包含一系列中间件功能，这些中间件功能可应要求以类似栈的方式组成和执行。 Koa与您可能遇到的许多其他中间件系统类似，例如Ruby的Rack，Connect等-但是做出了一项关键设计决策，决定在其他较低层的中间件层提供高层“糖”。 这提高了互操作性，鲁棒性，并使编写中间件更加有趣。

这包括用于常见任务的方法，例如内容协商，缓存新鲜度，代理支持以及重定向。 尽管提供了大量有用的方法，但由于没有捆绑中间件，所以Koa占用的资源很少。

强制性的hello world应用程序：

```js
const Koa = require('koa', 2.11.0)
const app = new Koa()

app.use(async ctx => {
  ctx.body = 'hello world'
})

app.listen(3000)
```

### cascading

Koa中间件以一种您可能已经习惯使用类似工具的更传统的方式进行级联-以前这很难使用户易于使用节点的回调。 但是，使用异步功能，我们可以实现“真正的”中间件。 与Connect的实现相反，该实现仅通过一系列功能传递控制权直到一个返回，Koa调用“下游”，然后控制流向“上游”。

以下示例以“ Hello World”响应，但是首先请求流经x响应时间并记录中间件以标记请求何时开始，然后继续通过响应中间件产生控制权。 当中间件调用next（）时，函数将挂起并将控制权传递给所定义的下一个中间件。 在没有更多的中间件要在下游执行时，堆栈将解散，并且每个中间件都将恢复执行其上游行为。

```js
const Koa = require('koa')
const app = new Koa()

// logger

app.use(async (ctx, next) => {
  await next()
  const rt = ctx.response.get('X-Response-Time');
  console.log(`${ctx.method} ${ctx.url} - ${rt}`);
})

// x-response-time

app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// response

app.use(async ctx => {
  ctx.body = 'hello world'
})

app.listen(3000)
```

### settings

应用程序设置是应用程序实例上的属性，目前支持以下设置

app.env默认设置为NODE_ENV或“development”

当真正的代理报头字段将被信任时

subdomainoffset .subdomains忽略[2]的偏移量

#### app.listen(...)

Koa应用程序不是HTTP服务器的一对一表示。 可以将一个或多个Koa应用程序安装在一起，以使用单个HTTP服务器形成更大的应用程序。

创建并返回一个HTTP服务器，将给定的参数传递给Server＃listen（）。 这些参数记录在nodejs.org上。 以下是绑定到端口3000的无用的Koa应用程序：

```js
const koa = require('koa')
const app = new koa()
app.listen(3000)
```
这个app.listen(…)方法只是为下面的内容添加了一些修饰

```js
const http = require('http')
const koa = require('koa')
const app = new koa()
http.createServer(app.callback()).listen(3000)
```

这意味着您可以启动与HTTP和HTTPS相同的应用程序，也可以在多个地址上启动：

```js
const http = require('http');
const https = require('https');
const Koa = require('koa');
const app = new Koa();
http.createServer(app.callback()).listen(3000);
https.createServer(app.callback()).listen(3001);
```

#### app.callback()

返回适合于http.createServer（）方法的回调函数来处理请求。 您也可以使用此回调函数将Koa应用程序安装在Connect / Express应用程序中。

#### app.use(function)

将给定的中间件功能添加到此应用程序

#### app.keys=

Set signed cookie keys.

这些被传递给KeyGrip，但是你也可以传递你自己的KeyGrip实例。例如，以下内容是可以接受的

```js
app.keys = ['im a newer secret', 'i like turtle'];
app.keys = new KeyGrip(['im a newer secret', 'i like turtle'], 'sha256');
```

这些键可以旋转，并在使用{signed: true}选项签署cookie时使用

```js
ctx.cookies.set('name', 'tobi', { signed: true })
```

#### app.context

app.context是从中创建ctx的原型。 您可以通过编辑app.context向ctx添加其他属性。 这对于在ctx中添加要在整个应用程序中使用的属性或方法很有用，这可能会更高效（不需要中间件）和/或更容易（需要更少的require（）），但会更多地依赖于ctx，这可能是 被认为是反模式。

例如，从ctx向数据库添加引用

```js
app.context.db  =  db()
app.use(async ctx => {
  console.log(ctx.db)
})
```
ctx上的许多属性都是使用getter、setter和Object.defineProperty()来定义的。您只能通过在app.context上使用Object.defineProperty()来编辑这些属性(不推荐)。见https://github.com/koajs/koa/issues/652。

安装的应用程序目前使用父类的ctx和设置。因此，挂载的应用程序实际上只是中间件组。

#### Error Handling

默认情况下，将所有错误输出到stderr，除非app.silent为真。默认的错误处理程序在出错时也不会输出错误。状态是404或err。公开是正确的。要执行自定义错误处理逻辑(如集中式日志记录)，可以添加一个“错误”事件监听器

```js
app.on('error', err => {
  log.error('server error', err)
})
```

如果错误发生在req/res循环中，无法响应客户端，也会传递上下文实例:

```js
app.on('error', (err, ctx) => {
  log.error('server error', err, ctx)
});
```

当发生错误并且仍然有可能响应客户端（即没有数据写入套接字）时，Koa会以500“内部服务器错误”进行适当响应。 在任何一种情况下，都会出于记录目的发出应用程序级别的“错误”。

### context

Koa上下文将节点的请求和响应对象封装到一个对象中，该对象为编写web应用程序和api提供了许多有用的方法。这些操作在HTTP服务器开发中使用得如此频繁，以至于它们被添加到这个级别，而不是一个更高级别的框架，这将迫使中间件重新实现这个公共功能。

每个请求都创建一个上下文，并在中间件中作为接收者或ctx标识符进行引用，如下面的代码片段所示

```js
app.use(async ctx => {
  ctx; // is the Context
  ctx.request; // is a koa request
  ctx.response; // is a koa response
})
```

许多上下文的访问器和方法只是委托给它们的ctx。请求或ctx。响应等价于方便，其他方面是相同的。例如ctx。类型和ctx。长度委托给响应对象，ctx。路径和ctx。方法委托给请求。

### Api

特定于上下文的方法和访问器。

#### ctx.req

Node's request object

#### ctx.res

Node's response object

不支持绕过Koa的响应处理。避免使用以下节点属性

res.statusCode

res.writeHead()

res.write()

res.end()

#### ctx.request

A Koa request object

#### ctx.response

A Koa request object

#### ctx.state

推荐的用于通过中间件和前端视图传递信息的名称空间。

```js
ctx.state.user = await User.find(id)
```

#### ctx.app

应用程序实例参考。

#### ctx.app.emit

Koa应用程序扩展了一个内部EventEmitter。ctx.app。emit发出带有类型的事件，类型由第一个参数定义。对于每个事件，都可以连接“监听器”，这是在发出事件时调用的函数。

#### ctx.cookies.get(name, [options])

使用选项获取Cookie名称：

已签名要求的Cookie应该已签名

Koa使用cookie模块，在其中简单地传递选项。

#### ctx.cookies.set(name, value, [options])

使用选项将cookie名称设置为value：

maxAge一个数字，表示从Date.now（）开始的毫秒数

签名cookie值

Cookie过期日期过期

路径cookie路径，默认为/'

域Cookie域

安全的安全cookie

httpOnly服务器可访问的cookie，默认情况下为true

覆盖一个布尔值，该布尔值指示是否覆盖以前设置的同名cookie（默认情况下为false）。 如果为true，则在设置此Cookie时，将从同一Cookie头中过滤出的所有具有相同名称（无论路径或域）的相同请求期间设置的所有Cookie。

Koa使用cookie模块，在该模块中只传递选项。

#### ctx.throw([status], [msg], [properties])

Helper方法抛出一个.status属性默认为500的错误，这将允许Koa做出适当的响应。允许下列组合

```js
ctx.throw(400);
ctx.throw(400, 'name required');
ctx.throw(400, 'name required', { user: user });
```

例如ctx。throw(400， 'name required')相当于

```js
const err = new Error('name required');
err.status = 400;
err.expose = true;
throw err;
```

请注意，这些是用户级别的错误，并带有err.expose标记，这意味着该消息适用于客户端响应，对于错误消息，通常情况并非如此，因为您不想泄漏故障详细信息。

可以选择传递一个按原样合并到错误中的属性对象，该属性对象用于修饰机器友好的错误，这些错误会报告给上游的请求者。

```js
ctx.throw(401, 'access_denied', { user: user });
```

Koa使用http-errors来创建错误。状态只能作为第一个参数传递。

#### ctx.assert(value, [status], [msg], [properties])

方法来抛出类似于.throw()的错误。类似于node的assert()方法。

```js
ctx.assert(ctx.state.user, 401, 'User not found. Please login!');
```

Koa对断言使用http-assert。

### ctx.respond

要绕过Koa的内置响应处理，您可以显式设置ctx.respond = false;。 如果您要写入原始res对象，而不是让Koa为您处理响应，请使用此方法。

请注意，Koa不支持使用此功能。 这可能会破坏Koa中间件和Koa本身的预期功能。 使用此属性被视为黑客，并且对于那些希望在Koa中使用传统fn（req，res）函数和中间件的人来说只是一种便利。

#### Request aliases

下面的访问器和别名请求等价物

```js
ctx.header
ctx.headers
ctx.method
ctx.method=
ctx.url
ctx.url=
ctx.originalUrl
ctx.origin
ctx.href
ctx.path
ctx.path=
ctx.query
ctx.query=
ctx.querystring
ctx.querystring=
ctx.host
ctx.hostname
ctx.fresh
ctx.stale
ctx.socket
ctx.protocol
ctx.secure
ctx.ip
ctx.ips
ctx.subdomains
ctx.is()
ctx.accepts()
ctx.acceptsEncodings()
ctx.acceptsCharsets()
ctx.acceptsLanguages()
ctx.get()
```

#### Response aliases

以下访问器和别名响应当量

```js
ctx.body
ctx.body=
ctx.status
ctx.status=
ctx.message
ctx.message=
ctx.length=
ctx.length
ctx.type=
ctx.type
ctx.headerSent
ctx.redirect()
ctx.attachment()
ctx.set()
ctx.append()
ctx.remove()
ctx.lastModified=
ctx.etag=
```

### Request

Koa请求对象是node的普通请求对象之上的一个抽象，它提供了额外的功能，这对每天的HTTP服务器开发都很有用。

#### request.header

请求头对象。

#### request.header=

设置请求头对象

#### request.headers

请求头对象。request.header别名。

#### request.headers=

设置请求头对象 别名request.header =

#### request.method

Request method.

#### request.method=

设置请求方法，用于实现诸如methodOverride()之类的中间件。

#### request.length

返回请求内容长度，在出现或未定义时作为数字。

#### request.url

Get request URL.

#### request.url=

设置请求URL，用于URL重写。

#### request.originalUrl

Get request original URL.

#### request.origin

获取URL的来源，包括协议和主机。

```js
ctx.request.origin
// => http://example.com
```

#### request.href

获取完整的请求URL，包括协议，主机和URL。

```js
ctx.request.href;
// => http://example.com/foo/bar?q=1
```

#### request.path

Get request pathname.

#### request.path=

设置请求路径名，并保留查询字符串。

#### request.querystring

获取原始查询字符串void ?

#### request.querystring=

设置原始查询字符串。

####  request.search

Get raw query string with the ?.

#### request.search=

Set raw query string.

#### request.host

获得主机(主机名:端口)。当app.proxy为真时，支持x - forwarding主机，否则使用主机。

#### request.hostname

出现时获取主机名。当app.proxy为真时，支持x - forwarding主机，否则使用主机。

如果主机是IPv6, Koa将解析委托给WHATWG URL API，注意这可能会影响性能。

#### request.URL

Get WHATWG parsed URL object. 获取WHATWG解析的URL对象。

#### request.type

获取请求内容类型的void参数，如“charset”。

```js
const ct = ctx.request.type;
// => "image/png"
```

#### request.charset

获取当前或未定义的请求字符集

```js
ctx.request.charset;
// => "utf-8"
```

#### request.query

获取已解析的查询字符串，如果不存在查询字符串，则返回一个空对象。 请注意，此getter不支持嵌套解析。

例如“ color = blue＆size = small”：

```js
{
  color: 'blue',
  size: 'small'
}
```

#### request.query=

将查询字符串设置为给定对象。请注意，此setter不支持嵌套对象。

```js
ctx.query = { next: '/login' };
```

#### request.fresh

检查请求缓存是否为fresh，即内容没有更改。 此方法用于If-None-Match / ETag与If-Modified-Since和Last-Modified之间的缓存协商。 在设置一个或多个这些响应头之后，应该引用它。

```js
// freshness check requires status 20x or 304
ctx.status = 200;
ctx.set('ETag', '123');

// cache is ok
if (ctx.fresh) {
  ctx.status = 304;
  return;
}

// cache is stale
// fetch new data
ctx.body = await db.find('something');
```

#### request.stale

Inverse of request.fresh.

#### request.protocol

返回请求协议，“https”或“http”。当app.proxy为真时，支持x - forwarding -原型。

#### request.secure

对ctx速记。检查请求是否通过TLS发出。

#### request.ip

请求远程地址。当app.proxy为真时，支持x - forwarding。

#### request.ips

当x - forward - for出现并启用app.proxy时，将返回这些ip的一个数组，从上游到下游排序。当禁用时，将返回一个空数组。

#### request.subdomains

以数组形式返回子域。

子域是主机在应用程序主域之前的点分隔部分。 默认情况下，应用程序的域假定为主机的最后两个部分。 可以通过设置app.subdomainOffset来更改。

例如，如果域为“ tobi.ferrets.example.com”：如果未设置app.subdomainOffset，则ctx.subdomains为[“ ferrets”，“ tobi”]。 如果app.subdomainOffset为3，则ctx.subdomains为[“ tobi”]。

#### request.is(types...)

检查传入的请求是否包含“ Content-Type”头字段，并且其中包含任何给定的mime类型。 如果没有请求正文，则返回null。 如果没有内容类型，或者匹配失败，则返回false。 否则，它将返回匹配的内容类型。

```js
// With Content-Type: text/html; charset=utf-8
ctx.is('html'); // => 'html'
ctx.is('text/html'); // => 'text/html'
ctx.is('text/*', 'text/html'); // => 'text/html'

// When Content-Type is application/json
ctx.is('json', 'urlencoded'); // => 'json'
ctx.is('application/json'); // => 'application/json'
ctx.is('html', 'application/*'); // => 'application/json'

ctx.is('html'); // => false
```

例如，如果希望确保只将图像发送到给定路由

```js
if (ctx.is('image/*')) {
  // process
} else {
  ctx.throw(415, 'images only!');
}
```

#### Content Negotiation

Koa的请求对象包括由接受者和谈判者提供支持的有用的内容协商实用程序。 这些实用程序是：

request.accepts（类型）

request.acceptsEncodings（types）

request.acceptsCharsets（charsets）

request.acceptsLanguages（langs）

如果未提供任何类型，则返回所有可接受的类型。

如果提供了多种类型，则将返回最佳匹配。 如果未找到匹配项，则返回false，您应该向客户端发送406“不可接受”响应。

如果缺少可接受的标头（任何类型都可接受），则将返回第一种类型。 因此，您提供的类型的顺序很重要。

#### request.accepts(types)

检查给定类型是否可接受，如果为真则返回最佳匹配，否则为假。类型值可以是一个或多个mime类型字符串，如“application/json”，扩展名如“json”，或数组["json"， "html"， "text/plain"]。

```js
// Accept: text/html
ctx.accepts('html');
// => "html"

// Accept: text/*, application/json
ctx.accepts('html');
// => "html"
ctx.accepts('text/html');
// => "text/html"
ctx.accepts('json', 'text');
// => "json"
ctx.accepts('application/json');
// => "application/json"

// Accept: text/*, application/json
ctx.accepts('image/png');
ctx.accepts('png');
// => false

// Accept: text/*;q=.5, application/json
ctx.accepts(['html', 'json']);
ctx.accepts('html', 'json');
// => "json"

// No Accept header
ctx.accepts('html', 'json');
// => "html"
ctx.accepts('json', 'html');
// => "json"
```

您可以根据需要多次调用ctx.accept()，或者使用开关

```js
switch (ctx.accepts('json', 'html', 'text')) {
  case 'json': break;
  case 'html': break;
  case 'text': break;
  default: ctx.throw(406, 'json, html, or text only');
}
```

#### request.acceptsEncodings(encodings)

检查编码是否可接受，如果为真则返回最佳匹配，否则为假。注意，您应该将identity作为编码之一

```js
// Accept-Encoding: gzip
ctx.acceptsEncodings('gzip', 'deflate', 'identity');
// => "gzip"

ctx.acceptsEncodings(['gzip', 'deflate', 'identity']);
// => "gzip"
```

当没有给出任何参数时，所有可接受的编码都作为数组返回

```js
// Accept-Encoding: gzip, deflate
ctx.acceptsEncodings();
// => ["gzip", "deflate", "identity"]

```

注意，如果客户端显式发送标识，则标识编码(即无编码)可能是不可接受的;q=0。尽管这是一种边缘情况，您仍然应该处理这种方法返回false的情况。

#### request.acceptsCharsets(charsets)

检查是否可以接受字符集，如果是，则返回最佳匹配，否则为假。

```js
// Accept-Charset: utf-8, iso-8859-1;q=0.2, utf-7;q=0.5
ctx.acceptsCharsets('utf-8', 'utf-7');
// => "utf-8"

ctx.acceptsCharsets(['utf-7', 'utf-8']);
// => "utf-8"
```
当没有参数时，所有被接受的字符集都作为数组返回

```js
// Accept-Charset: utf-8, iso-8859-1;q=0.2, utf-7;q=0.5
ctx.acceptsCharsets();
// => ["utf-8", "utf-7", "iso-8859-1"]
```

#### request.acceptsLanguages(langs)

检查langs是否可接受，如果为真则返回最佳匹配，否则为假。

```js
// Accept-Language: en;q=0.8, es, pt
ctx.acceptsLanguages('es', 'en');
// => "es"

ctx.acceptsLanguages(['en', 'es']);
// => "es"
```

当没有参数时，所有被接受的语言都作为数组返回

```js
// Accept-Language: en;q=0.8, es, pt
ctx.acceptsLanguages();
// => ["es", "pt", "en"]
```

#### request.idempotent

检查请求是否是幂等的。

#### request.socket

返回的socket请求。

#### request.get(field)

返回请求头。

Return request header.

### response

Koa响应对象是node的普通响应对象之上的一个抽象，它提供了对日常HTTP服务器开发有用的附加功能。

#### response.header

Response header object.

#### response.headers

Response header object. Alias as response.header.

#### response.socket

Request socket.

#### response.status

得到响应状态。默认情况下,响应。状态设置为404，不像node的res.statusCode默认为200。

#### response.status=

Set response status via numeric code:

100 "continue"

101 "switching protocols"

102 "processing"

200 "ok"

201 "created"

202 "accepted"

203 "non-authoritative information"

204 "no content"

205 "reset content"

206 "partial content"

207 "multi-status"

208 "already reported"

226 "im used"

300 "multiple choices"

301 "moved permanently"

302 "found"

303 "see other"

304 "not modified"

305 "use proxy"

307 "temporary redirect"

308 "permanent redirect"

400 "bad request"

401 "unauthorized"

402 "payment required"

403 "forbidden"

404 "not found"

405 "method not allowed"

406 "not acceptable"

407 "proxy authentication required"

408 "request timeout"

409 "conflict"

410 "gone"

411 "length required"

412 "precondition failed"

413 "payload too large"

414 "uri too long"

415 "unsupported media type"

416 "range not satisfiable"

417 "expectation failed"

418 "I'm a teapot"

422 "unprocessable entity"

423 "locked"

424 "failed dependency"

426 "upgrade required"

428 "precondition required"

429 "too many requests"

431 "request header fields too large"

500 "internal server error"

501 "not implemented"

502 "bad gateway"

503 "service unavailable"

504 "gateway timeout"

505 "http version not supported"

506 "variant also negotiates"

507 "insufficient storage"

508 "loop detected"

510 "not extended"

511 "network authentication required"

NOTE:不要太担心记忆这些字符串，如果你有一个打字错误，一个错误将被抛出，显示这个列表，所以你可以做一个修正。

#### response.message

获取响应状态消息。默认情况下,响应。消息与response.status关联。

#### response.message=

将响应状态消息设置为给定的值。

Set response status message to the given value.

#### response.length=

将响应状态消息设置为给定的值。

Set response Content-Length to the given value.

#### response.length

当出现时，返回响应内容长度作为一个数字，或者从ctx推断。可能时为体，或未定义。

Return response Content-Length as a number when present, or deduce from ctx.body when possible, or undefined.

#### response.body

Get response body.

#### response.body=

将响应体设置为以下之一

string written

Buffer written

Stream piped

Object || Array json-stringified

null no content response

如果响应。状态未设置，Koa将自动设置状态为200或204。

Koa并不防备可能放入响应主体的所有内容-函数没有有意义的序列化，根据您的应用程序返回布尔值可能是有意义的，并且尽管错误起作用，但它可能无法像某些人预期的那样起作用 错误的属性不可枚举。 我们建议您在应用中添加中间件，以声明每个应用的主体类型。 一个示例中间件可能是：

```js
app.use(async (ctx, next) => {
  await next()

  ctx.assert.equal('object', typeof ctx, 500, 'some dev did something wrong')
})
```
#### String

Content-Type默认为text/html或text/plain，两者的默认字符集都是utf-8。还设置了Content-Length字段。

The Content-Type is defaulted to text/html or text/plain, both with a default charset of utf-8. The Content-Length field is also set.

#### Buffer

Content-Type默认为application / octet-stream，并且Content-Length也已设置。

The Content-Type is defaulted to application/octet-stream, and Content-Length is also set.

#### Stream

内容类型默认为application/octe -stream。

无论何时将流设置为响应体，.onerror都将自动添加为错误事件的侦听器，以捕获任何错误。此外，无论何时关闭请求(即使是提前关闭)，流都会被销毁。如果您不想要这两个特性，不要直接将流设置为主体。例如，在将主体设置为代理中的HTTP流时，您可能不希望这样做，因为这会破坏底层连接。

更多信息见:https://github.com/koajs/koa/pull/612。

下面是一个不自动销毁流的流错误处理示例:

Here's an example of stream error handling without automatically destroying the stream:

```js
const PassThrough = require('stream').PassThrough;

app.use(async ctx => {
  ctx.body = someHTTPStream.on('error', ctx.onerror).pipe(PassThrough());
});
```
#### Object

Content-Type默认为application/json。这包括普通对象{foo: 'bar'}和数组['foo'， 'bar']。

The Content-Type is defaulted to application/json. This includes plain objects { foo: 'bar' } and arrays ['foo', 'bar'].

#### response.get(field)

获取不区分大小写字段的响应标题字段值。

Get a response header field value with case-insensitive field.

```js
const etag = ctx.response.get('ETag');
```
#### response.set(field, value)

将响应头字段设置为值

Set response header field to value:

```js
ctx.set('Cache-Control', 'no-cache');
```

#### response.append(field, value)

附加附加的标题字段值val。

Append additional header field with value val.

```js
ctx.append('Link', '<http://127.0.0.1/>');
```
#### response.set(fields)

用一个对象设置几个响应头字段

```js
ctx.set({
  'Etag': '1234',
  'Last-Modified': date
});
```

这将委托给setHeader，它将根据指定的键设置或更新标头，而不会重置整个标头。

This delegates to setHeader which sets or updates headers by specified keys and doesn't reset the entire header.

#### response.remove(field)

除去头字段。

Remove header field.

#### response.type

获取不包含“charset”等参数的响应内容类型。

Get response Content-Type void of parameters such as "charset".

```js
const ct = ctx.type;
// => "image/png"
```
### response.type=

通过mime字符串或文件扩展名设置响应内容类型。

Set response Content-Type via mime string or file extension.

```js
ctx.type = 'text/plain; charset=utf-8';
ctx.type = 'image/png';
ctx.type = '.png';
ctx.type = 'png';
```
注意:适当时为您选择charset，例如response。type = 'html'将默认为"utf-8"。如果需要覆盖charset，请使用ctx。设置('Content-Type'， 'text/html')直接将响应头字段设置为值。

Note: when appropriate a charset is selected for you, for example response.type = 'html' will default to "utf-8". If you need to overwrite charset, use ctx.set('Content-Type', 'text/html') to set response header field to value directly.

#### response.is(types...)

与ctx.request.is（）非常相似。 检查响应类型是否为提供的类型之一。 这对于创建操纵响应的中间件特别有用。

例如，这是一个中间件，可最小化除流之外的所有HTML响应。

```js
const minify = require('html-minifier');

app.use(async (ctx, next) => {
  await next();

  if (!ctx.response.is('html')) return;

  let body = ctx.body;
  if (!body || body.pipe) return;

  if (Buffer.isBuffer(body)) body = body.toString();
  ctx.body = minify(body);
});
```

#### response.redirect(url, [alt])

执行[302]重定向到url。

字符串“back”是特殊大小写的，以便在没有使用“alt”或“/”时提供引用支持。

Perform a [302] redirect to url.

The string "back" is special-cased to provide Referrer support, when Referrer is not present alt or "/" is used.

```js
ctx.redirect('back');
ctx.redirect('back', '/index.html');
ctx.redirect('/login');
ctx.redirect('http://google.com');
```

要更改302的默认状态，只需在调用之前或之后分配状态。要更改主体，请在此调用之后分配它

To alter the default status of 302, simply assign the status before or after this call. To alter the body, assign it after this call:

```js
ctx.status = 301;
ctx.redirect('/cart');
ctx.body = 'Redirecting to shopping cart';

```
#### response.attachment([filename], [options])

将内容配置设置为“附件”，以指示客户端提示下载。可选地指定下载的文件名和一些选项。

Set Content-Disposition to "attachment" to signal the client to prompt for download. Optionally specify the filename of the download and some options.

#### response.headerSent

检查是否已经发送了响应标头。用于查看客户端是否可能在出错时得到通知。

Check if a response header has already been sent. Useful for seeing if the client may be notified on error.

#### response.lastModified

如果存在最后修改的标头，则将其作为日期返回。

Return the Last-Modified header as a Date, if it exists.

#### esponse.lastModified=

将Last-Modified标头设置为适当的UTC字符串。 您可以将其设置为日期或日期字符串。

Set the Last-Modified header as an appropriate UTC string. You can either set it as a Date or date string.

```js
ctx.response.lastModified = new Date();
```

#### response.etag=

Set the ETag of a response including the wrapped "s. Note that there is no corresponding response.etag getter.

设置包括包装的响应的ETag。注意没有相应的响应。etag getter。

```js
ctx.response.etag = crypto.createHash('md5').update(ctx.body).digest('hex');
```

#### response.vary(field)

Vary on field.

不同领域。

#### response.flushHeaders()

刷新任何设置的标题，并开始正文。

Flush any set headers, and begin the body.

#### koa.1x 异常处理

```js
app.use(function *(next) {
  try {
    yield next
  } catch (err) {
    this.status = err.status || 500
    this.body = err
    this.app.emit('error', err, this)
  }
})
```