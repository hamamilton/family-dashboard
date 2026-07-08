import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Save, LogOut, ChevronDown, ChevronUp, Loader2, Shield, FastForward } from 'lucide-react';
import { useAdmin } from '../../hooks/useAdmin';

const PB_URL = 'https://hamilton-family-db.fly.dev';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DATES = Array.from({ length: 31 }, (_, i) => String(i + 1));

const EMPTY_CHORE = {
    chore_name: '',
    assigned_to: [],
    frequency: 'daily',
    due_dates: [],
    xp_reward: 10,
    round_robin_pool: [],
    is_completed: false,
    rotation_period: 7,
};

function LoginForm({ onLogin, loading, error }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-8">
            <div className="flex items-center gap-3 mb-2">
                <Shield size={20} className="text-cyan-400" />
                <h2 className="text-xl font-black uppercase tracking-widest text-white">Admin Access</h2>
            </div>

            <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-cyan-600 mb-2">Email</label>
                <input
                    type="email" required autoFocus
                    value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-black border border-slate-700 focus:border-cyan-400 p-3 text-white text-sm outline-none transition-colors"
                    placeholder="admin@example.com"
                />
            </div>

            <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-cyan-600 mb-2">Password</label>
                <input
                    type="password" required
                    value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-black border border-slate-700 focus:border-cyan-400 p-3 text-white text-sm outline-none transition-colors"
                    placeholder="••••••••"
                />
            </div>

            {error && <p className="text-rose-400 text-xs font-bold">{error}</p>}

            <button type="submit" disabled={loading}
                className="flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest py-3 transition-colors disabled:opacity-50">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                {loading ? 'Authenticating...' : 'Login'}
            </button>
        </form>
    );
}

function ChoreForm({ chore, profiles, onSave, onCancel, saving }) {
    const initialName = (chore.chore_name || '').replace('[STRICT]', '').trim();
    const [form, setForm] = useState({ ...chore, chore_name: initialName });
    const [isStrict, setIsStrict] = useState((chore.chore_name || '').includes('[STRICT]'));
    const [cannotCover, setCannotCover] = useState(chore.cannot_cover || false);

    const toggleMulti = (field, val) => {
        setForm(f => ({
            ...f,
            [field]: f[field].includes(val)
                ? f[field].filter(v => v !== val)
                : [...f[field], val]
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        let finalName = form.chore_name.trim();
        if (isStrict) {
            finalName += ' [STRICT]';
        }
        
        onSave({ ...form, chore_name: finalName, cannot_cover: cannotCover });
    };

    const dueDateOptions = form.frequency === 'weekly' ? DAYS : form.frequency === 'monthly' ? DATES : [];

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
            {/* Chore Name */}
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-cyan-600 mb-1">Chore Name</label>
                <input required value={form.chore_name}
                    onChange={e => setForm(f => ({ ...f, chore_name: e.target.value }))}
                    className="w-full bg-black border border-slate-700 focus:border-cyan-400 p-2.5 text-white outline-none transition-colors"
                    placeholder="e.g. Vacuum Living Room" />
                
                {/* Strict Deadline Toggle */}
                <div className="flex items-center gap-2 mt-2">
                    <input 
                        type="checkbox" 
                        id="strict_toggle"
                        checked={isStrict}
                        onChange={(e) => setIsStrict(e.target.checked)}
                        className="w-4 h-4 accent-cyan-500"
                    />
                    <label htmlFor="strict_toggle" className="text-[10px] text-slate-400 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                        Strict Deadline (Disappears if missed, -5 XP)
                    </label>
                </div>

                {/* Cannot Cover Toggle */}
                <div className="flex items-center gap-2 mt-2">
                    <input 
                        type="checkbox" 
                        id="cannot_cover_toggle"
                        checked={cannotCover}
                        onChange={(e) => setCannotCover(e.target.checked)}
                        className="w-4 h-4 accent-cyan-500"
                    />
                    <label htmlFor="cannot_cover_toggle" className="text-[10px] text-slate-400 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                        Cannot be covered by parents
                    </label>
                </div>
            </div>

            {/* Assigned To */}
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-cyan-600 mb-1">Assigned To</label>
                <div className="flex flex-wrap gap-1.5">
                    {profiles.map(p => {
                        const isSelected = Array.isArray(form.assigned_to) 
                            ? form.assigned_to.includes(p.id) 
                            : form.assigned_to === p.id;
                            
                        return (
                            <button key={p.id} type="button"
                                onClick={() => toggleMulti('assigned_to', p.id)}
                                className={`px-2 py-1 text-[10px] font-black uppercase border transition-colors ${isSelected
                                    ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                                    : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                                {p.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* XP Reward */}
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-cyan-600 mb-1">XP Reward</label>
                <input type="number" min="1" max="500" value={form.xp_reward}
                    onChange={e => setForm(f => ({ ...f, xp_reward: parseInt(e.target.value) || 10 }))}
                    className="w-full bg-black border border-slate-700 focus:border-cyan-400 p-2.5 text-white outline-none" />
            </div>

            {/* Frequency */}
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-cyan-600 mb-1">Frequency</label>
                <div className="flex gap-2">
                    {['daily', 'weekly', 'monthly', 'none'].map(f => (
                        <button key={f} type="button"
                            onClick={() => setForm(prev => ({ ...prev, frequency: f, due_dates: [] }))}
                            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider border transition-colors ${form.frequency === f
                                ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                                : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                            {f === 'none' ? 'one-off' : f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Rotation Period */}
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-cyan-600 mb-1">Rotation Period (Days)</label>
                <input type="number" min="1" value={form.rotation_period || 7}
                    onChange={e => setForm(f => ({ ...f, rotation_period: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-black border border-slate-700 focus:border-cyan-400 p-2.5 text-white outline-none" />
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">How long a task remains assigned to a profile before rotating</p>
            </div>

            {/* Due Dates (weekly/monthly) */}
            {dueDateOptions.length > 0 && (
                <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-cyan-600 mb-1">
                        {form.frequency === 'weekly' ? 'Due Days' : 'Due Dates'}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                        {dueDateOptions.map(opt => (
                            <button key={opt} type="button"
                                onClick={() => toggleMulti('due_dates', opt)}
                                className={`px-2 py-1 text-[10px] font-black uppercase border transition-colors ${form.due_dates.includes(opt)
                                    ? 'border-fuchsia-400 bg-fuchsia-400/10 text-fuchsia-400'
                                    : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                                {form.frequency === 'weekly' ? opt.slice(0, 3) : opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Round Robin Pool */}
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-cyan-600 mb-1">
                    Round Robin Pool <span className="text-slate-600 normal-case">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                    {profiles.map(p => (
                        <button key={p.id} type="button"
                            onClick={() => toggleMulti('round_robin_pool', p.id)}
                            className={`px-2 py-1 text-[10px] font-black uppercase border transition-colors ${form.round_robin_pool.includes(p.id)
                                ? 'border-emerald-400 bg-emerald-400/10 text-emerald-400'
                                : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                <button type="button" onClick={onCancel}
                    className="flex-1 border border-slate-700 text-slate-400 font-black uppercase tracking-wider py-2.5 hover:border-slate-500 transition-colors text-xs">
                    Cancel
                </button>
                <button type="submit" disabled={saving}
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-wider py-2.5 transition-colors text-xs flex items-center justify-center gap-1 disabled:opacity-50">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    {chore.id ? 'Save Changes' : 'Create Chore'}
                </button>
            </div>
        </form>
    );
}

function ProfileManager({ profiles, adminRequest, onRefresh }) {
    const [xpValues, setXpValues] = useState({});
    const [savingId, setSavingId] = useState(null);

    const handleAdjust = async (profile, isAdd) => {
        const val = parseInt(xpValues[profile.id] || 0, 10);
        if (isNaN(val) || val === 0) return;
        setSavingId(profile.id);
        const newBalance = isAdd ? profile.xp_balance + val : profile.xp_balance - val;
        try {
            await adminRequest(`/api/collections/profiles/records/${profile.id}`, 'PATCH', {
                xp_balance: Math.max(0, newBalance),
                is_op: Math.max(0, newBalance) >= 100
            });
            onRefresh();
            setXpValues(prev => ({ ...prev, [profile.id]: '' }));
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="p-6 flex flex-col gap-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-cyan-400 mb-2">Adjust Profile XP</h3>
            {profiles.map(p => (
                <div key={p.id} className="border border-slate-800 p-4 transition-colors flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <p className="font-black uppercase tracking-wider text-white text-sm">{p.name}</p>
                        <p className="text-xs font-bold text-fuchsia-400 tracking-widest">{p.xp_balance} XP</p>
                    </div>
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            min="1"
                            placeholder="Amount..."
                            value={xpValues[p.id] !== undefined ? xpValues[p.id] : ''}
                            onChange={e => setXpValues(prev => ({ ...prev, [p.id]: e.target.value }))}
                            className="w-24 bg-black border border-slate-700 focus:border-cyan-400 px-3 py-2 text-white text-xs outline-none transition-colors"
                        />
                        <button 
                            disabled={savingId === p.id || !xpValues[p.id]}
                            onClick={() => handleAdjust(p, false)}
                            className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 border border-rose-500/50 font-black uppercase tracking-widest px-4 py-2 text-xs transition-colors disabled:opacity-50">
                            - Sub
                        </button>
                        <button 
                            disabled={savingId === p.id || !xpValues[p.id]}
                            onClick={() => handleAdjust(p, true)}
                            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-400 border border-emerald-500/50 font-black uppercase tracking-widest px-4 py-2 text-xs transition-colors disabled:opacity-50">
                            + Add
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function AdminPanel({ isOpen, onClose }) {
    const { isAdmin, loading, error, login, logout, adminRequest } = useAdmin();
    const [chores, setChores] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [editingChore, setEditingChore] = useState(null); // null = list, {} = new, {id,...} = edit
    const [saving, setSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);
    const [quickAddName, setQuickAddName] = useState('');
    const [activeTab, setActiveTab] = useState('chores');

    useEffect(() => {
        if (isAdmin && isOpen) {
            loadData();
        }
    }, [isAdmin, isOpen]);

    const loadData = async () => {
        setDataLoading(true);
        try {
            const [choreData, profileData] = await Promise.all([
                adminRequest('/api/collections/chores/records?perPage=200'),
                adminRequest('/api/collections/profiles/records?perPage=50'),
            ]);
            setChores(choreData.items || []);
            setProfiles(profileData.items || []);
        } finally {
            setDataLoading(false);
        }
    };

    const handleSave = async (form) => {
        setSaving(true);
        try {
            const payload = {
                chore_name: form.chore_name,
                assigned_to: form.assigned_to,
                xp_reward: form.xp_reward,
                frequency: form.frequency,
                due_dates: form.due_dates,
                round_robin_pool: form.round_robin_pool, // array of profile IDs
                is_completed: form.is_completed || false,
                rotation_period: form.rotation_period || 7,
                cannot_cover: form.cannot_cover || false,
            };

            if (form.id) {
                await adminRequest(`/api/collections/chores/records/${form.id}`, 'PATCH', payload);
            } else {
                await adminRequest('/api/collections/chores/records', 'POST', payload);
            }
            await loadData();
            setEditingChore(null);
        } finally {
            setSaving(false);
        }
    };

    const handleQuickAdd = async (e) => {
        e.preventDefault();
        if (!quickAddName.trim()) return;
        setSaving(true);
        try {
            await adminRequest('/api/collections/chores/records', 'POST', {
                ...EMPTY_CHORE,
                chore_name: quickAddName.trim()
            });
            setQuickAddName('');
            await loadData();
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = async (id) => {
        if (!confirm('Skip this chore for today? (It will be marked as complete without giving XP)')) return;
        await adminRequest(`/api/collections/chores/records/${id}`, 'PATCH', { is_completed: true });
        await loadData();
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this chore?')) return;
        await adminRequest(`/api/collections/chores/records/${id}`, 'DELETE');
        await loadData();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

            {/* Panel */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-slate-950 border-l-2 border-cyan-900 z-50 flex flex-col font-mono shadow-[0_0_40px_rgba(34,211,238,0.15)]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-none">
                    <div className="flex items-center gap-3">
                        <Shield size={18} className="text-cyan-400" />
                        <h2 className="text-lg font-black uppercase tracking-widest text-white">Admin Panel</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <button onClick={logout} className="text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1 text-xs uppercase tracking-wider font-bold">
                                <LogOut size={14} /> Logout
                            </button>
                        )}
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {!isAdmin ? (
                        <LoginForm onLogin={login} loading={loading} error={error} />
                    ) : (
                        <>
                            {/* Tabs */}
                            <div className="flex border-b border-slate-800">
                                <button onClick={() => setActiveTab('chores')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'chores' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-950/20' : 'text-slate-500 hover:text-slate-300'}`}>Chores</button>
                                <button onClick={() => setActiveTab('profiles')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === 'profiles' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-950/20' : 'text-slate-500 hover:text-slate-300'}`}>Profiles</button>
                            </div>

                            {activeTab === 'profiles' ? (
                                <ProfileManager profiles={profiles} adminRequest={adminRequest} onRefresh={loadData} />
                            ) : editingChore ? (
                        <div className="p-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-cyan-400 mb-4">
                                {editingChore.id ? 'Edit Chore' : 'New Chore'}
                            </h3>
                            <ChoreForm
                                chore={editingChore}
                                profiles={profiles}
                                onSave={handleSave}
                                onCancel={() => setEditingChore(null)}
                                saving={saving}
                            />
                        </div>
                    ) : (
                        <div className="p-6 flex flex-col gap-4">
                            {/* Quick Add */}
                            <form onSubmit={handleQuickAdd} className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={quickAddName}
                                    onChange={e => setQuickAddName(e.target.value)}
                                    placeholder="Quick add chore..."
                                    className="flex-1 bg-black border border-slate-700 focus:border-cyan-400 px-3 py-2 text-white text-sm outline-none transition-colors"
                                />
                                <button type="submit" disabled={saving || !quickAddName.trim()}
                                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest px-4 py-2 text-xs transition-colors disabled:opacity-50">
                                    Quick Add
                                </button>
                            </form>

                            {/* Add button */}
                            <button onClick={() => setEditingChore({ ...EMPTY_CHORE })}
                                className="flex items-center justify-center gap-2 border-2 border-dashed border-cyan-800 hover:border-cyan-400 text-cyan-600 hover:text-cyan-400 font-black uppercase tracking-widest py-3 text-sm transition-colors mt-2">
                                <Plus size={16} /> Advanced Add
                            </button>

                            {/* Chore list */}
                            {dataLoading ? (
                                <div className="flex justify-center py-12">
                                    <Loader2 size={32} className="animate-spin text-cyan-500" />
                                </div>
                            ) : chores.length === 0 ? (
                                <p className="text-center text-slate-600 text-sm py-8 uppercase tracking-widest">No chores yet</p>
                            ) : (
                                chores.map(chore => (
                                    <div key={chore.id}
                                        className="border border-slate-800 hover:border-slate-700 p-4 transition-colors">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-black uppercase tracking-wider text-white text-sm truncate">{chore.chore_name}</p>
                                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                                                        {Array.isArray(chore.expand?.assigned_to)
                                                            ? chore.expand.assigned_to.map(p => p.name).join(', ')
                                                            : chore.expand?.assigned_to?.name || 
                                                              (Array.isArray(chore.assigned_to) ? chore.assigned_to.join(', ') : chore.assigned_to) || '—'}
                                                    </span>
                                                    <span className="text-[10px] text-cyan-700 uppercase">
                                                        {chore.frequency === 'none' ? 'one-off' : chore.frequency}
                                                    </span>
                                                    <span className="text-[10px] text-fuchsia-700">+{chore.xp_reward} XP</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-none">
                                                {!chore.is_completed && (
                                                    <button onClick={() => handleSkip(chore.id)}
                                                        title="Skip for today (No XP)"
                                                        className="p-1.5 text-slate-500 hover:text-fuchsia-400 transition-colors">
                                                        <FastForward size={14} />
                                                    </button>
                                                )}
                                                <button onClick={() => setEditingChore({
                                                    ...chore,
                                                    due_dates: Array.isArray(chore.due_dates) ? chore.due_dates : [],
                                                    round_robin_pool: Array.isArray(chore.round_robin_pool) ? chore.round_robin_pool : [],
                                                })}
                                                    className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(chore.id)}
                                                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                    </>
                    )}
                </div>
            </div>
        </>
    );
}
