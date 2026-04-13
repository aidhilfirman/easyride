function LoginPage({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError("");
    setLoading(true);

    const action = isRegister
      ? auth.createUserWithEmailAndPassword(email.trim(), password)
      : auth.signInWithEmailAndPassword(email.trim(), password);

    action
      .then((result) => onLogin(result.user))
      .catch((err) => {
        setLoading(false);
        if (err.code === "auth/user-not-found") setError("No account found. Please register first.");
        else if (err.code === "auth/wrong-password") setError("Wrong password. Try again.");
        else if (err.code === "auth/email-already-in-use") setError("Email already registered. Please sign in.");
        else if (err.code === "auth/weak-password") setError("Password must be at least 6 characters.");
        else if (err.code === "auth/invalid-email") setError("Invalid email address.");
        else setError(err.message);
      });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-2xl font-bold mb-4 shadow-lg shadow-indigo-500/25">ER</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">EasyRide</h1>
          <p className="mt-2 text-sm text-slate-400">Rider Support Tracker</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <h2 className="text-lg font-semibold text-white mb-6">{isRegister ? "Create an account" : "Welcome back"}</h2>
          {error && <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">{error}</div>}
          <label className="block text-sm mb-4">
            <div className="mb-1.5 font-medium text-slate-300">Email</div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@easyride.com" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" />
          </label>
          <label className="block text-sm mb-6">
            <div className="mb-1.5 font-medium text-slate-300">Password</div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition" />
          </label>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:brightness-110 disabled:opacity-50 transition-all">
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
          </button>
          <p className="mt-5 text-center text-sm text-slate-400">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button type="button" onClick={() => { setIsRegister(!isRegister); setError(""); }} className="font-semibold text-indigo-400 hover:text-indigo-300 transition">
              {isRegister ? "Sign In" : "Register"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
