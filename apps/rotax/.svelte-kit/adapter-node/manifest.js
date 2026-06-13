export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.D0d5iLwD.js",app:"_app/immutable/entry/app.BFOzoLwX.js",imports:["_app/immutable/entry/start.D0d5iLwD.js","_app/immutable/chunks/CEdom-T8.js","_app/immutable/chunks/Bso-JtB5.js","_app/immutable/chunks/D41WeKGU.js","_app/immutable/entry/app.BFOzoLwX.js","_app/immutable/chunks/Bso-JtB5.js","_app/immutable/chunks/Bl5upyaA.js","_app/immutable/chunks/D41WeKGU.js","_app/immutable/chunks/DxBangs3.js","_app/immutable/chunks/Bf3gDfdE.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/tasks",
				pattern: /^\/api\/tasks\/?$/,
				params: [],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/tasks/_server.ts.js'))
			},
			{
				id: "/api/tasks/[id]",
				pattern: /^\/api\/tasks\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/tasks/_id_/_server.ts.js'))
			},
			{
				id: "/api/tasks/[id]/schedule",
				pattern: /^\/api\/tasks\/([^/]+?)\/schedule\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/tasks/_id_/schedule/_server.ts.js'))
			},
			{
				id: "/api/tasks/[id]/status",
				pattern: /^\/api\/tasks\/([^/]+?)\/status\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./entries/endpoints/api/tasks/_id_/status/_server.ts.js'))
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();

export const prerendered = new Set([]);

export const base = "";