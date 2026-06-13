const manifest = (() => {
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
			__memo(() => import('./chunks/0-DS5l1eW-.js')),
			__memo(() => import('./chunks/1-DKC_sInM.js')),
			__memo(() => import('./chunks/2-CuI-G3Tl.js'))
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
				endpoint: __memo(() => import('./chunks/_server.ts-Chw_l2tu.js'))
			},
			{
				id: "/api/tasks/[id]",
				pattern: /^\/api\/tasks\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-C7SKw6v_.js'))
			},
			{
				id: "/api/tasks/[id]/schedule",
				pattern: /^\/api\/tasks\/([^/]+?)\/schedule\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CeeHc1g2.js'))
			},
			{
				id: "/api/tasks/[id]/status",
				pattern: /^\/api\/tasks\/([^/]+?)\/status\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: __memo(() => import('./chunks/_server.ts-CVbOyhmS.js'))
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

const prerendered = new Set([]);

const base = "";

export { base, manifest, prerendered };
//# sourceMappingURL=manifest.js.map
