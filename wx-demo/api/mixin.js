import * as api from './index.js'
const nativePage = Page
Page = options => {
	merge(options)
	nativePage(options)
}

function merge(options) {
	if (options.onUnload) {
		let native = options.onUnload
		options.onUnload = function() {
			cancelPageRequest.call(this)
			return native && native.call(this)
		}
	} else {
		options.onUnload = cancelPageRequest
	}
}

function cancelPageRequest() {
	api.request.cancelPageRequest(api.request.getCurrentPage())
}
