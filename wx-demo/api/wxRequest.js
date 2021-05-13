let initialValue = {
	authorization: 'Authorization', // token的key
	limit: 5, // 同时最多5个接口在请求
	loginRetry: 2, // 登录接口重试次数
	retry: 2, // 接口请求失败时默认重试2次
}

let app = typeof uni === 'object' ? uni : wx

// 已经发起请求的集合 例：requestId为1时， {1: {task: requestTask, page: '表示是哪个页面发起的请求', reject: '取消请求的promise'}} , requestTask是wx.request的返回的对象，可以用于取消请求
let RequestTasks = {}

// 被锁住的请求队列，有两种情况
// 第一种情况(重新登录后需要发送请求) {resolve,reject,param,requestId,page}
// 第二种情况(当前在登录了) {page: '表示是哪个页面发起的请求', promise: '包含promise的对象'，requestId: '请求id'}
let RequestsQueue = []

// 取消请求时返回的提示
const abortTip = 'request:fail abort'

class wxRequest {
	constructor(customizeValue) {
		this.token = '' // 登录获取的token
		this.number = 0 // 当前在请求的数量，小于limit时才会发起请求，否则进入RequestsQueue队列中
		this.requestId = 0 // 递增值，请求的唯一标志
		this.lock = false // true表示当前正在登录，不能发送需要token的请求（即whiteList不为true的请求不能发送，会进入请求队列，获取到token后才会按先后顺序发送）
		this.options = null // 配置参数
		this.initParam(customizeValue)
	}

	ajax(param) {
		let requestId = this.requestId++
		let page = param.page ? param.page : this.getCurrentPage()
		if (param.cancelToken) {
			this.addCancelToken(requestId, param)
		}
		let p = new Promise((resolve, reject) => {
			RequestTasks[requestId] = {
				page,
				reject
			}
			this.getToken(param, requestId, page).then(() => {
				// getToken可能比较耗时，回来后用户可能已经取消请求了，所以需要做判断
				if (RequestTasks[requestId]) {
					this.request(resolve, reject, param, requestId, page)
				} else {
					this.number--
					reject(abortTip)
				}
			}).catch((err) => {
				Reflect.deleteProperty(RequestTasks, requestId)
				reject(err)
			})
		})
		p.requestId = requestId
		return p
	}

	request(resolve, reject, param, requestId, page, num = 0) {
		let requestTask = app.request({
			url: this.getRealUrl(param.url),
			data: param.data || {},
			header: {
				[this.options.authorization]: this.token,
			},
			method: param.type || 'GET',
			success: (res) => {
				if (this.options.reqSuccess(res.data)) {
					Reflect.deleteProperty(RequestTasks, requestId)
					this.number--
					resolve(this.options.resolveData(res.data))
					this.checkRequests()
				} else {
					if (this.options.reacquire(res.data)) {
						// token过期重新登录
						this.token = ''
						this.number--
						this.reLogin(resolve, reject, param, requestId, page).then(() => {
							if (RequestTasks[requestId]) {
								this.request(resolve, reject, param, requestId, page)
							} else {
								Reflect.deleteProperty(RequestTasks, requestId)
								this.number--
								reject(abortTip)
							}
						}).catch(() => {
							Reflect.deleteProperty(RequestTasks, requestId)
							reject(res)
							this.checkRequests()
						})
					} else {
						Reflect.deleteProperty(RequestTasks, requestId)
						this.number--
						reject(res.data)
						this.checkRequests()
					}
				}
			},
			fail: (res) => {
				// request:fail abort  客户端主动取消请求，不需要重试
				if ([abortTip].includes(res.errMsg)) {
					Reflect.deleteProperty(RequestTasks, requestId)
					this.number--
					this.checkRequests()
					reject(res)
				} else {
					// console.log(requestId, '重试原因', res)
					this.retryRequest(resolve, reject, param, requestId, num, res, page)
				}
			}
		})
		RequestTasks[requestId] = {
			task: requestTask,
			page: page
		}
	}

	retryRequest(resolve, reject, param, requestId, num, res, page) {
		if (num >= this.options.retry) {
			Reflect.deleteProperty(RequestTasks, requestId)
			this.number--
			reject(res)
			this.checkRequests()
		} else {
			this.request(resolve, reject, param, requestId, page, ++num)
		}
	}

	upload(param) {
		let requestId = this.requestId++
		let uploadTask = null
		let page = param.page ? param.page : this.getCurrentPage()
		let p = new Promise((resolve, reject) => {
			RequestTasks[requestId] = {
				page,
				reject
			}
			this.getToken(param, requestId, page).then(() => {
				if (RequestTasks[requestId]) {
					uploadTask = app.uploadFile({
						url: this.getRealUrl(param.url),
						filePath: param.filePath,
						name: param.name,
						success: (res) => {
							this.number--
							Reflect.deleteProperty(RequestTasks, requestId)
							this.checkRequests()
							resolve(res)

						},
						fail: (e) => {
							this.number--
							Reflect.deleteProperty(RequestTasks, requestId)
							this.checkRequests()
							reject(e)
						}
					})
					RequestTasks[requestId] = {
						task: uploadTask,
						page: page
					}
					param.onProgressUpdate && uploadTask.onProgressUpdate(param.onProgressUpdate)
				} else {
					this.number--
					reject(abortTip)
				}
			}).catch((err) => {
				reject(err)
			})
		})
		p.uploadTask = uploadTask
		p.requestId = requestId
		return p
	}

	download(param) {
		let requestId = this.requestId++
		let downTask = null
		let page = param.page ? param.page : this.getCurrentPage()
		let p = new Promise((resolve, reject) => {
			RequestTasks[requestId] = {
				page,
				reject
			}
			this.getToken(param, requestId, page).then(() => {
				if (RequestTasks[requestId]) {
					downTask = app.downloadFile({
						url: this.getRealUrl(param.url),
						success: (res) => {
							this.number--
							Reflect.deleteProperty(RequestTasks, requestId)
							this.checkRequests()
							resolve(res)
						},
						fail: (e) => {
							this.number--
							Reflect.deleteProperty(RequestTasks, requestId)
							this.checkRequests()
							reject(e)
						}
					})
					RequestTasks[requestId] = {
						task: downTask,
						page: page
					}
					param.onProgressUpdate && downTask.onProgressUpdate(param.onProgressUpdate)
				} else {
					this.number--
					reject(abortTip)
				}
			}).catch((err) => {
				reject(err)
			})
		})
		p.downTask = downTask
		p.requestId = requestId
		return p
	}

	getToken(param, requestId, page) {
		return new Promise((resolve, reject) => {
			if (this.number >= this.options.limit) {
				// 超出数量限制则进入待请求队列
				this.addRequest({
					resolve,
					reject
				}, requestId, page)
				return
			}
			if (param.whiteList || this.token) {
				// 没超出数量限制且是白名单则直接请求。或者没超出数量限制且已经登录过了也直接请求
				this.number++
				return resolve()
			}
			if (this.lock) {
				// 不是白名单且已经在登录了也加入请求队列
				this.addRequest({
					resolve,
					reject
				}, requestId, page)
				return
			}
			this.wxlogin(resolve, reject)
		})
	}

	wxlogin(resolve, reject, num = 0) {
		this.number++
		this.lock = true
		let requestTime = Date.now()
		app.login({
			success: (msg) => {
				if (msg && msg.code) {
					app.request({
						url: this.getRealUrl(this.options.loginUrl),
						data: {
							code: msg.code
						},
						method: 'POST',
						success: (res) => {
							if (this.options.reqSuccess(res.data)) {
								this.token = this.options.getToken(res.data)
								this.lock = false
								if (!(RequestsQueue.length && this.number < this.options
										.limit)) {
									this.number-- // 此时后面没有请求了需要减去login请求的数量
								} else {
									// 此时需要减去login请求的数量，但是又要加上checkRequests返回之后发出请求的数量，所以不增不减
								}
								resolve(this.token)
								this.checkRequests()
							} else {
								// 这里说明登录出错了，业务方面的，不重试直接失败
								this.lock = false
								this.number--
								reject(res)
								this.cancelAllRequest() // 登录出错则取消所有请求
							}
						},
						fail: (err) => {
							this.tryLogin(resolve, reject, err, num)
						}
					})
				} else {
					this.tryLogin(resolve, reject, msg, num)
				}
			},
			fail: (err) => {
				this.tryLogin(resolve, reject, err, num)
			}
		})
	}

	login() {
		return new Promise((resolve, reject) => {
			if (this.lock) {
				reject('已经在登录了')
			} else if (this.number >= this.options.limit) {
				reject('没有资源登录')
			} else {
				this.wxlogin(resolve, reject)
			}
		})
	}

	reLogin(resolve, reject, param, requestId, page) {
		return new Promise((resolve1, reject1) => {
			if (!this.lock) {
				this.wxlogin(resolve1, reject1)
			} else {
				RequestsQueue.unshift({
					resolve,
					reject,
					param,
					requestId,
					page
				})
			}
		})
	}

	tryLogin(resolve, reject, msg, num) {
		if (num >= this.options.loginRetry) { // 登录接口重试
			this.lock = false
			this.number--
			reject(msg)
			// 重复登录多次都失败了,就取消所有请求
			this.cancelAllRequest()
		} else {
			this.number--
			this.wxlogin(resolve, reject, ++num)
		}
	}

	cancelAllRequest() {
		for (let [key, value] of Object.entries(RequestTasks)) {
			value.task && value.task.abort()
			value.reject && value.reject(abortTip)
		}
		RequestTasks = {}
		while (RequestsQueue.length) {
			if (RequestsQueue.shift().promise) {
				RequestsQueue.shift().promise.reject(abortTip)
			} else {
				RequestsQueue.shift().reject(abortTip)
			}
		}
		RequestsQueue = []
	}

	initParam(customize) {
		this.options = Object.assign(initialValue, customize)
	}

	checkRequests() {
		while (RequestsQueue.length && this.number < this.options.limit) {
			this.number++
			let request = RequestsQueue[0]
			if (request.promise) {
				RequestsQueue.shift().promise.resolve()
			} else {
				let {
					resolve,
					reject,
					param,
					requestId,
					page
				} = request
				this.request(resolve, reject, param, requestId, page)
				RequestsQueue.shift()
			}
		}
		// console.log('--', this.number, RequestsQueue, RequestTasks)
	}

	addRequest(promise, requestId, page) {
		RequestsQueue.push({
			page,
			promise,
			requestId
		})
	}

	addCancelToken(requestId, param) {
		param.cancelToken({
			abort: () => {
				this.cancelRequest(requestId)
			}
		})
	}

	getCurrentPage() {
		let pages = getCurrentPages()
		return pages[pages.length - 1].route
	}

	// 取消某个请求
	cancelRequest(requestId) {
		if (RequestTasks[requestId]) {
			if (RequestTasks[requestId].task) {
				RequestTasks[requestId].task.abort()
			} else if (RequestTasks[requestId].reject) {
				RequestTasks[requestId].reject(abortTip)
			}
			Reflect.deleteProperty(RequestTasks, requestId)
		}
		let index = RequestsQueue.findIndex((request) => {
			return request.requestId === requestId
		})
		if (index > -1) {
			if (RequestsQueue[index].promise) {
				RequestsQueue[index].promise.reject(abortTip)
			} else {
				RequestsQueue[index].reject(abortTip)
			}
			RequestsQueue.splice(index, 1)
		}
	}

	// 取消某个页面的所有请求 page表示页面路径
	cancelPageRequest(page) {
		for (let [key, value] of Object.entries(RequestTasks)) {
			if (value.page === page) {
				value.task && value.task.abort()
				Reflect.deleteProperty(RequestTasks, key)
			}
		}
		let cancels = []
		for (let i = 0; i < RequestsQueue.length; i++) {
			if (RequestsQueue[i].page === page) {
				if (RequestsQueue[i].promise) {
					RequestsQueue[i].promise.reject(abortTip) // 释放promise
				} else {
					RequestsQueue[i].reject(abortTip)
				}
				cancels.push(i)
			}
		}
		if (cancels.length) {
			cancels.reverse().forEach(i => {
				RequestsQueue.splice(i, 1)
			})
		}
	}

	// 提炼错误信息
	getErrMsg(err) {
		if (typeof err === 'string') {
			return err
		}
		return err.msg || err.errMsg || (err.detail && err.detail.errMsg) || '未知错误'
	}

	// 检测用户输入的url
	getRealUrl(url) {
		if (url.startsWith('http') || url.startsWith('https')) {
			return url
		}
		return this.options.baseUrl + url
	}
}

export default wxRequest
