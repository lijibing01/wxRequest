import * as api from '../../api/index.js'

let cancel = {}
Page({
	data: {},
	onLoad() {
		for (let i = 0; i < 5; i++) {
			let p = api.getVersion({ // 如果需要取消请求不能直接使用链式调用，因为链式调用后.then会返回一个新的promise对象，则不能获取到requestId
				id: 'a' + i
			})
			if (i === 0) cancel.a0 = p
			if (i === 2) cancel.a2 = p
			p.then(res => {
				console.log('请求返回', res)
			}).catch(e => {
				console.log('请求出错', api.request.getErrMsg(e))
			})
		}
	},

	/**
	 * 生命周期函数--监听页面初次渲染完成
	 */
	onReady: function() {

	},

	/**
	 * 生命周期函数--监听页面显示
	 */
	onShow: function() {
		console.log('A页面onShow')
	},

	/**
	 * 生命周期函数--监听页面隐藏
	 */
	onHide: function() {

	},

	/**
	 * 生命周期函数--监听页面卸载
	 */
	onUnload: function() {
		console.log('A页面onUnload')
	},

	/**
	 * 页面相关事件处理函数--监听用户下拉动作
	 */
	onPullDownRefresh: function() {

	},

	/**
	 * 页面上拉触底事件的处理函数
	 */
	onReachBottom: function() {

	},

	/**
	 * 用户点击右上角分享
	 */
	onShareAppMessage: function() {

	},

	toPageB: function() {
		wx.navigateTo({
			url: '/pages/b/b'
		})
	},
	down: function() {
		let p = api.request.download({
			url: 'https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fimg9.51tietu.net%2Fpic%2F2019-091210%2Ft5pp4k0a0igt5pp4k0a0ig.jpg&refer=http%3A%2F%2Fimg9.51tietu.net&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=jpeg?sec=1620808181&t=2ffb84c52a0a6287816ef23bd39ab249',
			whiteList: false,
			onProgressUpdate: (progress) => {
				console.log('下载进度', progress)
			}
		})
		p.then(res => {
			console.log('下载完毕', res)
			this.upload(res.tempFilePath)
		}).catch(e => {
			console.log('下载出错', e)
		})
	},
	upload: function(tempFilePath) {
		let p = api.request.upload({
			url: 'https://jsonplaceholder.typicode.com/posts/',
			filePath: tempFilePath,
			name: 'file',
			whiteList: false,
			onProgressUpdate: (progress) => {
				console.log('上传进度', progress)
			}
		})
		cancel.uploadReq = p
		p.then(res => {
			console.log('上传完毕', res)
		}).catch(e => {
			console.log('上传出错', e)
		})
	},
	cancela0: function() {
		api.request.cancelRequest(cancel.a0.requestId)
	},
	cancela2: function() {
		api.request.cancelRequest(cancel.a2.requestId)
	},
	abortUpload: function() {
		api.request.cancelRequest(cancel.uploadReq.requestId)
	}
})
