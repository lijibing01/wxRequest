import * as api from '../../api/index.js'
Page({

	/**
	 * 页面的初始数据
	 */
	data: {

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad: function(options) {
		for (let i = 1; i < 3; i++) {
			api.getVersion({
				id: 'b' + i
			}).then(res => {
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
		console.log('B页面onShow')
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
		console.log('B页面onUnload')
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

	toPageC: function() {
		wx.navigateTo({
			url: '/pages/c/c'
		})
	}
})
