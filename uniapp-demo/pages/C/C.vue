<template>
	<view class="content">
		<button type="primary" @click="toPageA()" class="mt10">去首页</button>
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
					id: 'c' + i
				})
				p.then(res => {
					console.log('请求返回', res)
				}).catch(e => {
					console.log('请求出错', api.request.getErrMsg(e))
				})
			}
		},
		methods: {
			toPageA() {
				uni.switchTab({
					url: '/pages/A/A'
				})
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
