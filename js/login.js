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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-white text-2xl font-bold mb-4">ER</div>
          <h1 className="text-2xl font-semibold text-slate-900">EasyRider</h1>
          <p className="mt-1 text-sm text-slate-500">Rider Support Tracker</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">{isRegister ? "Create an account" : "Sign in to your account"}</h2>
          {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <label className="block text-sm mb-4">
            <div className="mb-1.5 font-medium text-slate-700">Email</div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@easyride.com" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500" />
          </label>
          <label className="block text-sm mb-6">
            <div className="mb-1.5 font-medium text-slate-700">Password</div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-500" />
          </label>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
            {loading ? "Please wait..." : isRegister ? "Register" : "Sign In"}
          </button>
          <p className="mt-4 text-center text-sm text-slate-500">
            {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
            <button type="button" onClick={() => { setIsRegister(!isRegister); setError(""); }} className="font-medium text-slate-900 hover:underline">
              {isRegister ? "Sign In" : "Register"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
