---
theme: smartblue
---
# 一、主要功能
1. 自动清理垃圾请求：假设小程序有A B C三个页面,每个页面都会发起请求。从 C 页面 navigateBack 或者用户手动往回滑动切换到 B 页面时，会自动终止 C 页面还未完成的请求从而释放资源。从 C 页面 switchTab 到 A 页面时会自动终止B C页面还未完成的请求。其原理是将发起的请求和页面绑定起来，再监听页面的 onUnload 卸载事件，页面卸载时将其还未请求完成的请求终止掉，也可以通过参数配置请求不和页面绑定。
2. 请求改为 promise 形式：将原生小程序的请求方式，封装成 promise 方式。
3. 限制请求并发数量：小程序限制请求并发数量为10，超过会报错。本代码将请求队列化，可以配置并发数量。
4. token 过期时自动重新登录：可以配置接口返回某种情况时自动重新登录。重新登录后之前的请求会自动重新发送，这个过程用户无感知，体验更好。
5. 增加重试功能：小程序的 request api 偶发性会出现错误，移动端的网络状态也没有 PC 端稳定，因为设备可能在移动，最好是增加重试。有一种复现方法是写一个响应比较慢的接口，然后在请求的时候频繁的将手机的网络从 wifi 状态切换到 4g，就是在请求接口时一直重复打开和关闭 wifi 的开关。这样接口也不会每次都响应成功。另外还有可能出现社区中帖子里的这些情况，本代码可以配置接口的重试次数。[社区中发现的request问题。](https://developers.weixin.qq.com/community/develop/doc/0000a610f988483b88cba8af656400?highLine=%257B%2522errMsg%2522%253A%2522request%253Afail%2520timeout%2522%257D)

6. 取消请求：可以取消普通请求和上传下载请求
7. 可以配置接口是否是需要鉴权的：需要鉴权的话就算没有主动调用登录接口也会提前调用登录接口再请求。就算并发请求多个需要鉴权的接口，程序也只会自动执行一次登录接口，这样就不用担心重复登录的问题。假设有2个 tabBar  页面A B，A是首页，在 A 页面中有登录逻辑，用户还未等到登录完毕就切换到 B 页面，不做处理的话 B 页面发起的需要鉴权的请求会失败
8. 兼容uni-app

# 二、使用方式（可以运行代码参考）
1. 在 app.js 中导入 mixin.js（一定要在app.js中导入）。
2. uni-app需要导入uniapp-demo中api目录下的mixin.js（一定要在main.js中导入）。
3. 导入 wxRequest.js
4. 初始化 wxRequest ，参数如下，**无默认值的都是必填项**
---
**baseUrl**
- 类型：String
- 默认值：无
- 用法：接口的前缀

**loginUrl**
- 类型：String
- 默认值：无
- 用法：表示登录接口是 baseUrl + loginUrl 两个字符串的拼接
- 例子：baseUrl 是 http://127.0.0.1:3001/ loginUrl 是 login。那么表示登录接口是http://127.0.0.1:3001/login

**resolveData**
- 类型：function
- 默认值：无
- 用法：一个有返回值的方法，响应拦截器，即调用方then获取到的数据
- 例子： 假如接口返回值为{"code":0,"data":{"message":"hello world/version?id=a0"}}前端只想要data中的数据，那么就像下面这样设置即可

```js
function(data) {
    return data.data // 响应拦截器，即then获取的数据
}
```

**getToken**
- 类型：function
- 默认值：无
- 用法：一个有返回值的方法，告诉代码怎么获取登录接口返回后的token
- 例子：假如登录接口的返回值为{"code":0,"data":{"access_token":"001"}} 想要获取token就这样设置

```js
function(data) {
    return data.data.access_token
}
```

**reqSuccess**
- 类型：function
- 默认值：无
- 用法：需要返回true和false，告诉代码接口返回的值在什么样的情况下是成功的
- 例子：假如说接口返回的code必须是0且有data值的情况下才算成功，那么就这样设置

```js
function(data) {
    if (data && data.code === 0 && data.data) {
        return true
    }
    return false
}
```

**reacquire**
- 类型：function
- 默认值：无
- 用法：需要返回true和false，告诉代码什么样的情况下需要重新登录了
- 例子：假如说code是401或者402就表示token过期需要重新登录了，那么就这样设置

```js
function(data) {
    if (data && [401, 402].includes(data.code)) {
        return true
    }
    return false
}
```

**authorization**
- 类型：String
- 默认值：Authorization
- 用法：传递给后端token时的key值，放在请求的header处

**limit**
- 类型：Number
- 默认值： 5
- 用法：表示最多并发多少个请求，包括上传和下载一起算在里面

**loginRetry**
- 类型：Number
- 默认值：2
- 用法：表示登录接口出现异常时重试的次数，如果是服务器出错了则不会重试（服务器出错指的是类似于500错误这种）

**retry**
- 类型：Number
- 默认值：2
- 用法：表示登录接口外的接口出错时重试几次，如果是服务器出错了则不会重试（但是上传和下载没有实现重试而是直接报错，因为上传和下载比较少用到而且貌似很少出错）

---

4. 初始化好 wxRequest 实例后就是调用他的 **api** 了

# 三、api

**token**
- 类型：property
- 用法：获取登录后的token

**ajax**
- 类型：function
- 用法：发起请求
- 参数：
1. data：对象类型，和小程序的request api中的data一样，是传给服务器的参数
2. url：字符串类型，会在前面拼接baseUrl组成请求地址
3. type：字符串类型，默认为 GET ，和小程序 api 中的 method 参数一致
4. page： 字符串类型，表示这个请求关联哪一个页面，如果不填就是微信 api 的 getCurrentPages() 返回数组中的最后一个路由 path。如果不想接口和页面绑定在一块，可以随便填一个不是路由的值
5. whiteList：boolean类型，true表示需要登录后才能访问，false表示不登录也可以访问

**upload**
- 类型：function
- 用法：上传文件
- 参数：Object，有下面几个属性
1. page：非必填的String类型，不填就是路由
2. url：上传的地址
3. filePath：文件的本地地址
4. name：上传文件的名字和小程序参数一致
5. onProgressUpdate：非必填的Function，上传进度回调函数

**download**
- 类型：function
- 用法：下载文件
- 参数：Object，有下面几个属性
1. page：非必填的String类型，不填就是路由
2. url：下载的地址
3. onProgressUpdate：非必填的function，下载进度的回调函数


**login**
- 类型：function
- 用法：主动调用登录
- 参数：无

**cancelAllRequest**
- 类型：function
- 用法：取消小程序所有的请求
- 参数： 无

**cancelRequest**
- 类型：function
- 用法：取消某个请求
- 参数：使用ajax返回的promise中的requestId（具体可以运行demo小程序，首页有取消按钮）

**cancelPageRequest**
- 类型：function
- 用法：取消某个页面的请求
- 参数：字符串类型，可以是某个路由的path，也可以是开始调用ajax时传递的page参数

**getErrMsg**
- 类型：function
- 用法：提炼错误信息，用在catch中获取出错的信息
- 参数：错误信息，可以是对象或者字符串，由于不能完全考虑到所有情况，所以需要根据实际业务做修改

# 四、测试
1. 使用项目中提供的 node-server 中的代码，先 npm install 安装依赖，再使用 npm run dev 启动 node 服务器
2. 如果要模拟重试的情况，直接不启动 node 服务器，这样登陆请求会重试
3. 如果要模拟登陆鉴权失效的情况，就将 node-server 中 /version 接口的 code 改为 401
4. 中途修改 node-server 代码会自动重启服务器。就可以随时修改接口的返回，可以测试小程序在运行过程中途遇到401的情况会不会重新登录。中途关闭服务器看看会不会重试。在重试过程中再启动服务器看看会不会重试成功

# 五、仓库地址
https://github.com/lijibing01/wxRequest.git
- 欢迎star


