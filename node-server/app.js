const Koa = require('koa')
const Router = require('koa-router')
const app = new Koa();
const router = new Router();
router.get('/version', async function(ctx, next) {
	await later().then(res => {
		ctx.body = {
			code: 0,
			data: {
				message: "hello world" + ctx.url
			}
		}
	})
})

router.post('/login', async function(ctx, next) {
	await later().then(res => {
		ctx.body = {
			code: 0,
			data: {
				access_token: "001"
			}
		}
	})
})

function later(timeout = 2000) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve()
		}, timeout);
	})
}

app.use(router.routes());
app.listen(3001, () => {
	console.log('starting at port 3001');
});
