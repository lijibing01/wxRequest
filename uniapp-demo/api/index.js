import wxRequest from './wxRequest.js'
let request = new wxRequest({
	baseUrl: 'http://127.0.0.1:3001/',
	loginUrl: 'login',
	resolveData: function(data) {
		return data.data
	},
	getToken: function(data) {
		return data.data.access_token
	},
	reqSuccess: function(data) {
		if (data && data.code === 0 && data.data) {
			return true
		}
		return false
	},
	reacquire: function(data) {
		if (data && [401, 402].includes(data.code)) {
			return true
		}
		return false
	}
})

function getVersion(data, page) {
	return request.ajax({
		data: data,
		url: 'version',
		type: 'GET',
		page: page
	})
}

function saveUserInfo(data, page) {
	return request.ajax({
		url: '/api_clone/userinfo',
		data: data,
		type: 'POST',
		whiteList: true, // 表示不需要token
		page: page
	})
}

export {
	request,
	getVersion,
	saveUserInfo
}
