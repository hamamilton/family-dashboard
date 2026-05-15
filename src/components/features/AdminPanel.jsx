import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Save, LogOut, ChevronDown, ChevronUp, Loader2, Shield, Copy } from 'lucide-react';
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

function XpAdjuster({ profiles, adminRequest, onUpdate }) {
    const [selectedProfile, setSelectedProfile] = useState('');
    const [amount, setAmount] = useState(10);
    const [loading, setLoading] = useState(false);

    const handleAdjust = async (isAdding) => {
        if (!selectedProfile) return;
        const profile = profiles.find(p => p.id === selectedProfile);
        if (!profile) return;

        setLoading(true);
        try {
            const xpChange = isAdding ? amount : -amount;
            const newBalance = Math.max(0, (profile.xp_balance || 0) + xpChange);
            
            await adminRequest(`/api/collections/profiles/records/${profile.id}`, 'PATCH', {
                xp_balance: newBalance,
                is_op: profile.is_op || (newBalance >= 1000)
            });
            await onUpdate();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 p-4 mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-3 flex items-center gap-2">
                <Shield size={12} /> XP Modifier
            </h3>
            <div className="flex flex-col gap-3">
                <select 
                    value={selectedProfile}
                    onChange={e => setSelectedProfile(e.target.value)}
                    className="w-full bg-black border border-slate-700 p-2 text-white text-xs outline-none appearance-none"
                >
                    <option value="">— Select Profile —</option>
                    {profiles.map(p => <option key={p.id} value={p.id}>{p.name} ({p.xp_balance || 0} XP)</option>)}
                </select>
                <div className="flex gap-2">
                    <input 
                        type="number" min="1" 
                        value={amount} onChange={e => setAmount(parseInt(e.target.value) || 0)}
                        className="w-20 bg-black border border-slate-700 p-2 text-white text-center text-xs outline-none"
                    />
                    <button 
                        onClick={() => handleAdjust(true)} disabled={loading || !selectedProfile}
                        className="flex-1 bg-emerald-900/50 hover:bg-emerald-800 text-emerald-400 border border-emerald-800 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                        + Add XP
                    </button>
                    <button 
                        onClick={() => handleAdjust(false)} disabled={loading || !selectedProfile}
                        className="flex-1 bg-rose-900/50 hover:bg-rose-800 text-rose-400 border border-rose-800 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                        - Remove
                    </button>
                </div>
            </div>
        </div>
    );
}

function QuickMissionForm({ profiles, adminRequest, onUpdate }) {
    const [name, setName] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        try {
            await adminRequest('/api/collections/chores/records', 'POST', {
                chore_name: name.trim(),
                assigned_to: assignedTo,
                frequency: 'none',
                is_completed: false,
                xp_reward: 25
            });
            setName('');
            setAssignedTo('');
            await onUpdate();
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-4 mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3 flex items-center gap-2">
                <Plus size={12} /> Quick One-Off Task
            </h3>
            <div className="flex flex-col gap-3">
                <input 
                    type="text" required
                    value={name} onChange={e => setName(e.target.value)}
                    placeholder="Task Name (e.g. Wash Car)"
                    className="w-full bg-black border border-slate-700 p-2 text-white text-xs outline-none"
                />
                <div className="flex gap-2">
                    <select 
                        value={assignedTo}
                        onChange={e => setAssignedTo(e.target.value)}
                        className="flex-1 bg-black border border-slate-700 p-2 text-white text-xs outline-none appearance-none"
                    >
                        <option value="">— Anyone —</option>
                        {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button 
                        type="submit" disabled={loading || !name.trim()}
                        className="bg-amber-600 hover:bg-amber-500 text-white px-4 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                    >
                        {loading ? '...' : 'Deploy'}
                    </button>
                </div>
            </div>
        </form>
    );
}

function ChoreForm({ chore, profiles, onSave, onCancel, saving }) {
    const [form, setForm] = useState(chore);

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
        onSave(form);
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
            </div>

            {/* Assigned To */}
            <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-cyan-600 mb-1">
                    Assigned To <span className="text-slate-600 normal-case">(can select multiple)</span>
                </label>
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
                    {['daily', 'weekly', 'monthly'].map(f => (
                        <button key={f} type="button"
                            onClick={() => setForm(prev => ({ ...prev, frequency: f, due_dates: [] }))}
                            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider border transition-colors ${form.frequency === f
                                ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400'
                                : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                            {f}
                        </button>
                    ))}
                </div>
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

export function AdminPanel({ isOpen, onClose }) {
    const { isAdmin, loading, error, login, logout, adminRequest } = useAdmin();
    const [chores, setChores] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [editingChore, setEditingChore] = useState(null); // null = list, {} = new, {id,...} = edit
    const [saving, setSaving] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);

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
                        <div className="p-6 flex flex-col gap-2">
                            <XpAdjuster profiles={profiles} adminRequest={adminRequest} onUpdate={loadData} />
                            <QuickMissionForm profiles={profiles} adminRequest={adminRequest} onUpdate={loadData} />

                            <div className="flex items-center gap-4 my-2">
                                <div className="h-px flex-1 bg-slate-800" />
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Manage All Chores</span>
                                <div className="h-px flex-1 bg-slate-800" />
                            </div>

                            {/* Add button */}
                            <button onClick={() => setEditingChore({ ...EMPTY_CHORE })}
                                className="flex items-center justify-center gap-2 border-2 border-dashed border-cyan-800 hover:border-cyan-400 text-cyan-600 hover:text-cyan-400 font-black uppercase tracking-widest py-3 text-sm transition-colors mt-2">
                                <Plus size={16} /> Add New Chore
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
                                                            : chore.expand?.assigned_to?.name || (Array.isArray(chore.assigned_to) ? chore.assigned_to.join(', ') : chore.assigned_to) || '—'}
                                                    </span>
                                                    <span className="text-[10px] text-cyan-700 uppercase">{chore.frequency}</span>
                                                    <span className="text-[10px] text-fuchsia-700">+{chore.xp_reward} XP</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 flex-none">
                                                <button onClick={() => setEditingChore({
                                                    ...chore,
                                                    id: undefined, // Remove ID to create new
                                                    chore_name: `${chore.chore_name} (Copy)`,
                                                    assigned_to: Array.isArray(chore.assigned_to) ? chore.assigned_to : [chore.assigned_to].filter(Boolean),
                                                    due_dates: Array.isArray(chore.due_dates) ? chore.due_dates : [],
                                                    round_robin_pool: Array.isArray(chore.round_robin_pool) ? chore.round_robin_pool : [],
                                                })}
                                                    className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors"
                                                    title="Duplicate">
                                                    <Copy size={14} />
                                                </button>
                                                <button onClick={() => setEditingChore({
                                                    ...chore,
                                                    assigned_to: Array.isArray(chore.assigned_to) ? chore.assigned_to : [chore.assigned_to].filter(Boolean),
                                                    due_dates: Array.isArray(chore.due_dates) ? chore.due_dates : [],
                                                    round_robin_pool: Array.isArray(chore.round_robin_pool) ? chore.round_robin_pool : [],
                                                })}
                                                    className="p-1.5 text-slate-500 hover:text-cyan-400 transition-colors"
                                                    title="Edit">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(chore.id)}
                                                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                                                    title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
