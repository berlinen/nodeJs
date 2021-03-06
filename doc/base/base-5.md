# node.js 网络操作

不了解网络编程的程序员不是好前端，而NodeJS恰好提供了一扇了解网络编程的窗口。通过NodeJS，除了可以编写一些服务端程序来协助前端开发和测试外，还能够学习一些HTTP协议与Socket协议的相关知识，这些知识在优化前端性能和排查前端故障时说不定能派上用场。本章将介绍与之相关的NodeJS内置模块。

## 开门红

NodeJS本来的用途是编写高性能Web服务器。我们首先在这里重复一下官方文档里的例子，使用NodeJS内置的http模块简单实现一个HTTP服务器。

```js
const http = require('http')

http.createServer((res, rep) => {
  res.writeHead(200, { 'Content-Type': 'text-plain' })
  response.end('Hello World\n')
}).listen(8124)
```

以上程序创建了一个HTTP服务器并监听8124端口，打开浏览器访问该端口http://127.0.0.1:8124/就能够看到效果。

豆知识： 在Linux系统下，监听1024以下端口需要root权限。因此，如果想监听80或443端口的话，需要使用sudo命令启动程序。

## API走马观花

### 'http'模块提供两种使用方式：

1. 作为服务端使用时，创建一个HTTP服务器，监听HTTP客户端请求并返回响应。

2. 作为客户端使用时，发起一个HTTP客户端请求，获取服务端响应。

首先我们来看看服务端模式下如何工作。如开门红中的例子所示，首先需要使用.createServer方法创建一个服务器，然后调用.listen方法监听端口。之后，每当来了一个客户端请求，创建服务器时传入的回调函数就被调用一次。可以看出，这是一种事件机制。

HTTP请求本质上是一个数据流，由请求头（headers）和请求体（body）组成。例如以下是一个完整的HTTP请求数据内容。

```txt
POST / HTTP/1.1
User-Agent: curl/7.26.0
Host: localhost
Accept: */*
Content-Length: 11
Content-Type: application/x-www-form-urlencoded

Hello World
```

可以看到，空行之上是请求头，之下是请求体。HTTP请求在发送给服务器时，可以认为是按照从头到尾的顺序一个字节一个字节地以数据流方式发送的。而http模块创建的HTTP服务器在接收到完整的请求头后，就会调用回调函数。在回调函数中，除了可以使用request对象访问请求头数据外，还能把request对象当作一个只读数据流来访问请求体数据。以下是一个例子。

```js
http.createServer((req, res) => {
  var body = {}

  console.log(req.method)
  console.log(req.headers)

  req.on('data', (chunk) => {
    body.push(chunk)
  })

  req.on('end', () => {
    body = Buffer.concat(body)
    console.log(body.toString())
  })
}).listen(80)

------------------------------------

POST
{ 'user-agent': 'curl/7.26.0',
  host: 'localhost',
  accept: '*/*',
  'content-length': '11',
  'content-type': 'application/x-www-form-urlencoded' }
Hello World

```

HTTP响应本质上也是一个数据流，同样由响应头（headers）和响应体（body）组成。例如以下是一个完整的HTTP请求数据内容。

```txt
HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 11
Date: Tue, 05 Nov 2013 05:31:38 GMT
Connection: keep-alive

Hello World
```

在回调函数中，除了可以使用response对象来写入响应头数据外，还能把response对象当作一个只写数据流来写入响应体数据。例如在以下例子中，服务端原样将客户端请求的请求体数据返回给客户端。

```js
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })

  req.on('data', (chunk) => {
    res.write(chunk)
  })

  req.on('end', () => {
    res.end()
  })
}).listen(80)
```

接下来我们看看客户端模式下如何工作。为了发起一个客户端HTTP请求，我们需要指定目标服务器的位置并发送请求头和请求体，以下示例演示了具体做法。

```js
var options = {
  hostname: 'www.example.com',
  port: 80,
  path: '/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
}

var request = http.request(options, (res) => {})

request.write('hello world')

request.end()
```

可以看到，.request方法创建了一个客户端，并指定请求目标和请求头数据。之后，就可以把request对象当作一个只写数据流来写入请求体数据和结束请求。另外，由于HTTP请求中GET请求是最常见的一种，并且不需要请求体，因此http模块也提供了以下便捷API。

```js
http.get('http://www.example.com/', function (response) {});
```

当客户端发送请求并接收到完整的服务端响应头时，就会调用回调函数。在回调函数中，除了可以使用response对象访问响应头数据外，还能把response对象当作一个只读数据流来访问响应体数据。以下是一个例子。

```js
http.get('http://www.example.com', (res) => {
  var body = []

  console.log(res.statusCode)
  console.log(res.headers)

  res.on('data', (chunk) => {
    body.push(chunk)
  })

  res.on('end', () => {
    body = Buffer.concat(body)
    console.log(body.toString())
  })
})

------------------------------------
200
{ 'content-type': 'text/html',
  server: 'Apache',
  'content-length': '801',
  date: 'Tue, 05 Nov 2013 06:08:41 GMT',
  connection: 'keep-alive' }
<!DOCTYPE html>

```

## https

https模块与http模块极为类似，区别在于https模块需要额外处理SSL证书。

在服务端模式下，创建一个HTTPS服务器的示例如下。

```js
var options = {
  key: fs.readFileSync('./ssl/default.key'),
  cert: fs.readFileSync('./ssl/default.cer')
}

var server = https.createServer(options, (req, res) => {

})
```

可以看到，与创建HTTP服务器相比，多了一个options对象，通过key和cert字段指定了HTTPS服务器使用的私钥和公钥。

另外，NodeJS支持SNI技术，可以根据HTTPS客户端请求使用的域名动态使用不同的证书，因此同一个HTTPS服务器可以使用多个域名提供服务。接着上例，可以使用以下方法为HTTPS服务器添加多组证书。

```js
server.addContext('foo.com', {
  key: fs.readFileSync('./ssl/foo.com.key'),
  cert: fs.readFileSync('./ssl/foo.com.cert)
})

server.addContext('bar.com', {
  key: fs.readFileSync('./ssl/bar.com.key'),
  cert: fs.readFileSync('./ssl/bar.com.cert)
})
```

在客户端模式下，发起一个HTTPS客户端请求与http模块几乎相同，示例如下。

```js
const options = {
  hostname: 'www.example.com',
  port: 443,
  path: '/',
  method: 'GET'
}

var request = https.request(options, (res) => {})

request.end()
```

但如果目标服务器使用的SSL证书是自制的，不是从颁发机构购买的，默认情况下https模块会拒绝连接，提示说有证书安全问题。在options里加入rejectUnauthorized: false字段可以禁用对证书有效性的检查，从而允许https模块请求开发环境下使用自制证书的HTTPS服务器。

## URL

处理HTTP请求时url模块使用率超高，因为该模块允许解析URL、生成URL，以及拼接URL。首先我们来看看一个完整的URL的各组成部分。

```txt
                           href
 -----------------------------------------------------------------
                            host              path
                      --------------- ----------------------------
 http: // user:pass @ host.com : 8080 /p/a/t/h ?query=string #hash
 -----    ---------   --------   ---- -------- ------------- -----
protocol     auth     hostname   port pathname     search     hash
                                                ------------
                                                   query
```

我们可以使用.parse方法来将一个URL字符串转换为URL对象，示例如下。

```js
url.parse('http://user:pass@host.com:8080/p/a/t/h?query=string#hash');
/* =>
{ protocol: 'http:',
  auth: 'user:pass',
  host: 'host.com:8080',
  port: '8080',
  hostname: 'host.com',
  hash: '#hash',
  search: '?query=string',
  query: 'query=string',
  pathname: '/p/a/t/h',
  path: '/p/a/t/h?query=string',
  href: 'http://user:pass@host.com:8080/p/a/t/h?query=string#hash' }
*/
```

传给.parse方法的不一定要是一个完整的URL，例如在HTTP服务器回调函数中，request.url不包含协议头和域名，但同样可以用.parse方法解析。

```js
http.createServer((req, res) => {
  var tmp = req.url  // foo/bar?a=b
  url.parse(tmp);
   /* =>
    { protocol: null,
      slashes: null,
      auth: null,
      host: null,
      port: null,
      hostname: null,
      hash: null,
      search: '?a=b',
      query: 'a=b',
      pathname: '/foo/bar',
      path: '/foo/bar?a=b',
      href: '/foo/bar?a=b' }
    */
}).listen(80)
```

.parse方法还支持第二个和第三个布尔类型可选参数。第二个参数等于true时，该方法返回的URL对象中，query字段不再是一个字符串，而是一个经过querystring模块转换后的参数对象。第三个参数等于true时，该方法可以正确解析不带协议头的URL，例如//www.example.com/foo/bar。

反过来，format方法允许将一个URL对象转换为URL字符串，示例如下。

```js
url.format({
  protocol: 'http:',
  host: 'www.example.com',
  pathname: '/p/a/t/h',
  searcch: 'query=string'
})

/* =>
'http://www.example.com/p/a/t/h?query=string'
*/

```

另外，.resolve方法可以用于拼接URL，示例如下。

```js
url.resolve('http://www.example.com/foo/bar', '../baz');
/* =>
http://www.example.com/baz
*/
```

## Query String

querystring模块用于实现URL参数字符串与参数对象的互相转换，示例如下。

```js
querystring.parse('foo=bar&baz=qux&baz=quux&corge')

/* =>
{ foo: 'bar', baz: ['qux', 'quux'], corge: '' }
*/

querystring.stringify({ foo: 'bar', baz: ['qux', 'quux'], corge: '' });
/* =>
'foo=bar&baz=qux&baz=quux&corge='
*/

```

## Zlib

zlib模块提供了数据压缩和解压的功能。当我们处理HTTP请求和响应时，可能需要用到这个模块。

首先我们看一个使用zlib模块压缩HTTP响应体数据的例子。这个例子中，判断了客户端是否支持gzip，并在支持的情况下使用zlib模块返回gzip之后的响应体数据。

```js
http.createServer((req, res) => {
  var i = 1024,
      data = ''

  while(i--) {
    data += '.'
  }

  if((req.headers['accept-encoding'] || '').indexOf('gzip') !== -1) {
    zlip.gzip(data, (err, data) => {
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Content-Encoding': 'gzip'
      })
      res.end(data)
    })
  } else {
    res.writeHead(200, {
       'Content-Type': 'text/plain'
    })
    res.end(data)
  }
}).listen(80)
```

接着我们看一个使用zlib模块解压HTTP响应体数据的例子。这个例子中，判断了服务端响应是否使用gzip压缩，并在压缩的情况下使用zlib模块解压响应体数据。

```js
var options = {
  hostname: 'www.example.com',
  port: 80,
  path: '/',
  method: 'GET',
  headers: {
    'Accept-Encoding': 'gzip, deflate'
  }
}

http.request(options, (res) => {
  var body = []

  res.on('data', chunk => {
    body.push(chunk)
  })

  res.on('end', chunk => {
    body = Buffer.concat(body)

    if(res.headers['content-encoding'] === 'gzip') {
      zlib.gunzip(body, (err, data) => {
        console.log(data.toString())
      })
    } else {
      console.log(data.toString())
    }
  })
})
```

## net

net模块可用于创建Socket服务器或Socket客户端。由于Socket在前端领域的使用范围还不是很广，这里先不涉及到WebSocket的介绍，仅仅简单演示一下如何从Socket层面来实现HTTP请求和响应.

首先我们来看一个使用Socket搭建一个很不严谨的HTTP服务器的例子。这个HTTP服务器不管收到啥请求，都固定返回相同的响应。

```js
net.createServer( conn => {
  conn.on('data', data => {
    conn.write([
      'HTTP/1.1 200 OK',
      'Content-Type: text/plain',
      'Content-length: 11',
      '',
      'hello world'
    ].join('\n'))
  })
}).listen(80)
```

接着我们来看一个使用Socket发起HTTP客户端请求的例子。这个例子中，Socket客户端在建立连接后发送了一个HTTP GET请求，并通过data事件监听函数来获取服务器响应。

```js
var options = {
  port: 80,
  host: 'www.wxample.com'
}

var client = net.connect(options, () => {
  client.write([
    'GET / HTTP/1.1',
    'User-Agent: curl/7.26.0',
    'Host: www.baidu.com',
    'Accept: */*',
    '',
    ''
  ].join('\n'))
})

client.on('data', (data) => {
  console.log(data.toString())
  client.end()
})
```

## 灵机一点

使用NodeJS操作网络，特别是操作HTTP请求和响应时会遇到一些惊喜，这里对一些常见问题做解答。

1. 问： 为什么通过headers对象访问到的HTTP请求头或响应头字段不是驼峰的？

答： 从规范上讲，HTTP请求头和响应头字段都应该是驼峰的。但现实是残酷的，不是每个HTTP服务端或客户端程序都严格遵循规范，所以NodeJS在处理从别的客户端或服务端收到的头字段时，都统一地转换为了小写字母格式，以便开发者能使用统一的方式来访问头字段，例如headers['content-length']。

2. 问： 为什么http模块创建的HTTP服务器返回的响应是chunked传输方式的？

答： 因为默认情况下，使用.writeHead方法写入响应头后，允许使用.write方法写入任意长度的响应体数据，并使用.end方法结束一个响应。由于响应体数据长度不确定，因此NodeJS自动在响应头里添加了Transfer-Encoding: chunked字段，并采用chunked传输方式。但是当响应体数据长度确定时，可使用.writeHead方法在响应头里加上Content-Length字段，这样做之后NodeJS就不会自动添加Transfer-Encoding字段和使用chunked传输方式。

3. 问： 为什么使用http模块发起HTTP客户端请求时，有时候会发生socket hang up错误？

答： 发起客户端HTTP请求前需要先创建一个客户端。http模块提供了一个全局客户端http.globalAgent，可以让我们使用.request或.get方法时不用手动创建客户端。但是全局客户端默认只允许5个并发Socket连接，当某一个时刻HTTP客户端请求创建过多，超过这个数字时，就会发生socket hang up错误。解决方法也很简单，通过http.globalAgent.maxSockets属性把这个数字改大些即可。另外，https模块遇到这个问题时也一样通过https.globalAgent.maxSockets属性来处理。

## 小结

本章介绍了使用NodeJS操作网络时需要的API以及一些坑回避技巧，总结起来有以下几点：

1. http和https模块支持服务端模式和客户端模式两种使用方式。

2. request和response对象除了用于读写头数据外，都可以当作数据流来操作。

3. url.parse方法加上request.url属性是处理HTTP请求时的固定搭配。

4. 使用zlib模块可以减少使用HTTP协议时的数据传输量。

5. 通过net模块的Socket服务器与客户端可对HTTP协议做底层操作。

6. 小心踩坑.


