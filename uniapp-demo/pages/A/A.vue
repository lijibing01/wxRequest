<template>
	<view class="content">
		<button type="primary" @click="toPageB()" class="mt10">去B页面</button>
		<button type="primary" @click="down()" class="mt10">下载并上传</button>
		<button type="primary" @click="abortUpload()" class="mt10">取消上传</button>
		<button type="primary" @click="cancela0()" class="mt10">取消id=a0请求</button>
		<button type="primary" @click="cancela2()" class="mt10">取消id=a2请求</button>
	</view>
</template>

<script>
	import * as api from '../../api/index.js'
	export default {
		data() {
			return {
				cancel: {}
			}
		},
		onLoad() {
			for (let i = 0; i < 5; i++) {
				let p = api.getVersion({ // 如果需要取消请求不能直接使用链式调用，因为链式调用后.then会返回一个新的promise对象，则不能获取到requestId
					id: 'a' + i
				})
				if (i === 0) this.cancel.a0 = p
				if (i === 2) this.cancel.a2 = p
				p.then(res => {
					console.log('请求返回', res)
				}).catch(e => {
					console.log('请求出错', api.request.getErrMsg(e))
				})
			}
		},
		methods: {
			toPageB() {
				uni.navigateTo({
					url: '/pages/B/B'
				})
			},
			down() {
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
			upload(tempFilePath) {
				let p = api.request.upload({
					url: 'https://jsonplaceholder.typicode.com/posts/',
					filePath: tempFilePath,
					name: 'file',
					whiteList: false,
					onProgressUpdate: (progress) => {
						console.log('上传进度', progress)
					}
				})
				this.cancel.uploadReq = p
				p.then(res => {
					console.log('上传完毕', res)
				}).catch(e => {
					console.log('上传出错', e)
				})
			},
			cancela0() {
				api.request.cancelRequest(this.cancel.a0.requestId)
			},
			cancela2() {
				api.request.cancelRequest(this.cancel.a2.requestId)
			},
			abortUpload() {
				api.request.cancelRequest(this.cancel.uploadReq.requestId)
			}
		}
	}
</script>

<style>
	.content {
		padding: 50px
	}

	.mt10 {
		margin-top: 10px;
	}
</style>
