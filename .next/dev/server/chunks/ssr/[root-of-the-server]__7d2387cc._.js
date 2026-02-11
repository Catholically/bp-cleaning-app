module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/lib/supabase/client.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createClient",
    ()=>createClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createBrowserClient.js [app-ssr] (ecmascript)");
;
// Singleton pattern to prevent multiple Supabase instances
let supabaseInstance = null;
function createClient() {
    const supabaseUrl = ("TURBOPACK compile-time value", "https://nesvkpyngurlkmduyywy.supabase.co");
    const supabaseKey = ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lc3ZrcHluZ3VybGttZHV5eXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NDk1NDMsImV4cCI6MjA4NDAyNTU0M30.3bNH0wborAy_wI6PukPgJX9scOwzavPFMFbgP77oAXc");
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Return existing instance if available (singleton)
    if (supabaseInstance) {
        return supabaseInstance;
    }
    // Create new instance only once
    supabaseInstance = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createBrowserClient"])(supabaseUrl, supabaseKey);
    return supabaseInstance;
}
}),
"[project]/src/components/providers/auth-provider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase/client.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])({
    user: null,
    profile: null,
    loading: true,
    isSuperuser: false,
    isManager: false,
    isManagerOrSuperuser: false,
    signOut: async ()=>{},
    refreshProfile: async ()=>{}
});
function AuthProvider({ children }) {
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const supabaseRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createClient"])());
    const supabase = supabaseRef.current;
    const fetchProfile = async (userId)=>{
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
        return data;
    };
    const refreshProfile = async ()=>{
        if (user) {
            const profile = await fetchProfile(user.id);
            setProfile(profile);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let mounted = true;
        // Use getSession first (reads from local storage, faster)
        // Then onAuthStateChange will handle token refresh if needed
        const initAuth = async ()=>{
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (!mounted) return;
                if (error || !session) {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                    return;
                }
                setUser(session.user);
                // Fetch profile in background, don't block loading
                fetchProfile(session.user.id).then((profile)=>{
                    if (mounted) setProfile(profile);
                });
                setLoading(false);
            } catch (error) {
                console.error('Auth init error:', error);
                if (mounted) {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                }
            }
        };
        initAuth();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session)=>{
            if (!mounted) return;
            if (session?.user) {
                setUser(session.user);
                // Fetch profile in background
                fetchProfile(session.user.id).then((profile)=>{
                    if (mounted) setProfile(profile);
                });
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });
        return ()=>{
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);
    const signOut = async ()=>{
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        // Force redirect to avoid state issues
        window.location.href = '/login';
    };
    const isSuperuser = profile?.role === 'superuser';
    const isManager = profile?.role === 'manager';
    const isManagerOrSuperuser = isSuperuser || isManager;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            profile,
            loading,
            isSuperuser,
            isManager,
            isManagerOrSuperuser,
            signOut,
            refreshProfile
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/providers/auth-provider.tsx",
        lineNumber: 134,
        columnNumber: 5
    }, this);
}
const useAuth = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__7d2387cc._.js.map