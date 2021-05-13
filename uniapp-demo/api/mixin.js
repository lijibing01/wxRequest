import * as api from './index.js'
import Vue from 'vue'

Vue.mixin({
  onUnload: function () {
    api.request.cancelPageRequest(api.request.getCurrentPage())
  }
})
