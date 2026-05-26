"use client";

import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { Plus, Trash2, Settings, MonitorPlay, Users, Star, LogOut, Copy, UserPlus, Volume2, VolumeX, Maximize, Minimize, BarChart3, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/lib/supabase";
import type { Category, ClassGoal, Classroom, Student } from "@/lib/types";

type RewardLog = {
  id: string;
  classroom_id: string;
  student_id: string;
  teacher_id: string | null;
  category_id: string | null;
  category_name: string;
  points: number;
  created_at: string;
};

const DEFAULT_CATEGORIES = [
  ["Ninja Time", "🥷"], ["Lunch Time", "🍱"], ["Nap Time", "😴"],
  ["Class Captain", "🧢"], ["Locker", "🎒"], ["English", "🔤"],
  ["Japanese", "あ"], ["Helping Out", "🤝"], ["Teamwork", "👥"],
];

const AVATARS = ["🥷", "🦊", "🐼", "🐯", "🦁", "🐸", "🐵", "🐰", "🦄", "🐲", "⭐", "🌈", "🚀", "🎨", "⚽", "🎵"];

const CATEGORY_COLORS = [
  "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6",
  "#8b5cf6", "#ec4899", "#ef4444", "#14b8a6", "#84cc16",
  "#f59e0b", "#6366f1"
];

function getCategoryColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}


const THEMES: Record<string, { bg: string; panel: string; accent: string; accentText: string; soft: string; emoji: string; label: string }> = {
  "Ninja Academy": { bg: "from-slate-900 via-indigo-950 to-slate-800", panel: "bg-white/90", accent: "bg-indigo-600", accentText: "text-indigo-700", soft: "bg-indigo-50", emoji: "🥷", label: "Ninja Academy" },
  "Space Mission": { bg: "from-blue-950 via-purple-950 to-black", panel: "bg-white/90", accent: "bg-violet-600", accentText: "text-violet-700", soft: "bg-violet-50", emoji: "🚀", label: "Space Mission" },
  "Rainbow Garden": { bg: "from-pink-200 via-yellow-100 to-green-200", panel: "bg-white/90", accent: "bg-pink-500", accentText: "text-pink-700", soft: "bg-pink-50", emoji: "🌈", label: "Rainbow Garden" },
  "Jungle Safari": { bg: "from-green-900 via-emerald-700 to-lime-500", panel: "bg-white/90", accent: "bg-emerald-600", accentText: "text-emerald-700", soft: "bg-emerald-50", emoji: "🦁", label: "Jungle Safari" },
};

export default function HomePage() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classroomId, setClassroomId] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goal, setGoal] = useState<ClassGoal | null>(null);
  const [rewards, setRewards] = useState<RewardLog[]>([]);

  const [mode, setMode] = useState<"board" | "setup" | "reports">("board");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [popStudentId, setPopStudentId] = useState<string>("");
  const [negativePopStudentId, setNegativePopStudentId] = useState<string>("");
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  const [celebration, setCelebration] = useState("");
  const [message, setMessage] = useState("");

  const [newClassName, setNewClassName] = useState("Sunshine Class");
  const [joinCode, setJoinCode] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentAvatar, setNewStudentAvatar] = useState("🥷");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryEmoji, setNewCategoryEmoji] = useState("⭐");
  const [newCategoryPoints, setNewCategoryPoints] = useState(1);

  const selectedStudent = useMemo(() => students.find((s) => s.id === selectedStudentId), [students, selectedStudentId]);
  const activeClassroom = useMemo(() => classrooms.find((c) => c.id === classroomId), [classrooms, classroomId]);
  const theme = THEMES[activeClassroom?.theme || "Ninja Academy"] || THEMES["Ninja Academy"];
  const kioskMode = Boolean(activeClassroom?.kiosk_mode);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSessionUserId(data.user?.id ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSessionUserId(session?.user.id ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (sessionUserId) loadClassrooms(); }, [sessionUserId]);
  useEffect(() => { if (classroomId) loadClassroomData(classroomId); }, [classroomId]);

  function playTone(type: "star" | "goal" | "test" = "star") {
    if (!activeClassroom?.sounds_enabled && type !== "test") return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();

      const notes = type === "goal"
        ? [523.25, 659.25, 783.99, 1046.5]
        : type === "test"
          ? [440, 660, 880]
          : [880, 1174.66];

      notes.forEach((frequency, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = type === "goal" ? "triangle" : "sine";
        osc.frequency.value = frequency;

        const start = ctx.currentTime + index * 0.08;
        const end = start + (type === "goal" ? 0.26 : 0.18);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(type === "goal" ? 0.16 : 0.11, start + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, end);

        osc.start(start);
        osc.stop(end);
      });
    } catch {
      // Browser may block audio until a click/tap happens.
    }
  }

  function launchSparkles() {
    const emojis = ["⭐", "✨", "🌟", "💫", "☀️"];
    const next = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i,
      x: 15 + Math.random() * 70,
      y: 42 + Math.random() * 28,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
    }));
    setSparkles(next);
    setTimeout(() => setSparkles([]), 1300);
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage(error.message);
  }

  async function signUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setMessage(error.message);
    else setMessage("Account created. Check your email if confirmation is enabled.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSessionUserId(null); setClassrooms([]); setClassroomId("");
  }

  async function loadClassrooms() {
    const { data, error } = await supabase.from("classrooms").select("*").order("created_at", { ascending: true });
    if (error) return setMessage(error.message);
    setClassrooms(data ?? []);
    if (data?.length && !classroomId) setClassroomId(data[0].id);
  }

  async function updateClassroomSetting(field: "theme" | "sounds_enabled" | "kiosk_mode" | "animation_level", value: string | boolean) {
    if (!classroomId) return;
    const { error } = await supabase.from("classrooms").update({ [field]: value }).eq("id", classroomId);
    if (error) return setMessage(error.message);
    await loadClassrooms();
  }

  async function createClassroom() {
    if (!sessionUserId || !newClassName.trim()) return;
    const { data, error } = await supabase.from("classrooms").insert({ name: newClassName.trim(), created_by: sessionUserId }).select().single();
    if (error) return setMessage(error.message);
    await supabase.from("classroom_members").insert({ classroom_id: data.id, user_id: sessionUserId, role: "owner" });
    await supabase.from("class_goals").insert({ classroom_id: data.id, name: "Fill the Sunshine", reward_name: "Bubble Time", target_points: 30, current_points: 0 });
    await supabase.from("categories").insert(DEFAULT_CATEGORIES.map(([name, emoji]) => ({ classroom_id: data.id, name, emoji, points: 1 })));
    setClassroomId(data.id); setMessage("Classroom created."); await loadClassrooms();
  }

  async function joinClassroom() {
    if (!joinCode.trim()) return;
    const { data, error } = await supabase.rpc("join_classroom_by_invite", { code: joinCode.trim() });
    if (error) return setMessage(error.message);
    setJoinCode(""); setMessage("Joined classroom successfully."); await loadClassrooms();
    if (data) setClassroomId(data as string);
  }

  async function copyInviteCode() {
    if (!activeClassroom?.invite_code) return;
    await navigator.clipboard.writeText(activeClassroom.invite_code);
    setMessage("Invite code copied.");
  }

  async function loadClassroomData(id: string) {
    const [studentsRes, categoriesRes, goalsRes, rewardsRes] = await Promise.all([
      supabase.from("students").select("*").eq("classroom_id", id).order("created_at", { ascending: true }),
      supabase.from("categories").select("*").eq("classroom_id", id).order("created_at", { ascending: true }),
      supabase.from("class_goals").select("*").eq("classroom_id", id).limit(1).maybeSingle(),
      supabase.from("rewards").select("*").eq("classroom_id", id).order("created_at", { ascending: false }).limit(500),
    ]);
    if (studentsRes.error) setMessage(studentsRes.error.message);
    if (categoriesRes.error) setMessage(categoriesRes.error.message);
    if (goalsRes.error) setMessage(goalsRes.error.message);
    if (rewardsRes.error) setMessage(rewardsRes.error.message);
    setStudents(studentsRes.data ?? []);
    setCategories(categoriesRes.data ?? []);
    setGoal(goalsRes.data ?? null);
    setRewards((rewardsRes.data ?? []) as RewardLog[]);
  }

  async function addStudent() {
    if (!classroomId || !newStudentName.trim()) return;
    const { error } = await supabase.from("students").insert({ classroom_id: classroomId, name: newStudentName.trim(), avatar: newStudentAvatar, total_points: 0 });
    if (error) return setMessage(error.message);
    setNewStudentName(""); await loadClassroomData(classroomId);
  }

  async function removeStudent(id: string) {
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) return setMessage(error.message);
    if (selectedStudentId === id) setSelectedStudentId("");
    await loadClassroomData(classroomId);
  }

  async function addCategory() {
    if (!classroomId || !newCategoryName.trim()) return;
    const { error } = await supabase.from("categories").insert({ classroom_id: classroomId, name: newCategoryName.trim(), emoji: newCategoryEmoji, points: 1 });
    if (error) return setMessage(error.message);
    setNewCategoryName(""); setNewCategoryPoints(1); await loadClassroomData(classroomId);
  }

  async function removeCategory(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return setMessage(error.message);
    await loadClassroomData(classroomId);
  }

  async function updateCategoryPoints(id: string, points: number) {
    const { error } = await supabase.from("categories").update({ points }).eq("id", id);
    if (error) return setMessage(error.message);
    await loadClassroomData(classroomId);
  }

  async function quickTakeAwayPoint() {
    if (!selectedStudent || !goal || !sessionUserId) {
      setMessage("Select a student first.");
      return;
    }

    const newStudentTotal = Math.max(0, selectedStudent.total_points - 1);
    const newGoalTotal = Math.max(0, goal.current_points - 1);

    await supabase.from("rewards").insert({
      classroom_id: classroomId,
      student_id: selectedStudent.id,
      teacher_id: sessionUserId,
      category_id: null,
      category_name: "Point Removed",
      points: -1,
    });

    await supabase.from("students").update({ total_points: newStudentTotal }).eq("id", selectedStudent.id);
    await supabase.from("class_goals").update({ current_points: newGoalTotal }).eq("id", goal.id);

    setNegativePopStudentId(selectedStudent.id);
    setMessage(`Removed 1 point from ${selectedStudent.name}.`);
    setTimeout(() => { setPopStudentId(""); setNegativePopStudentId(""); }, 1200);
    await loadClassroomData(classroomId);
  }

  async function giveReward(category: Category) {
    if (!selectedStudent || !goal || !sessionUserId) return;
    const newStudentTotal = Math.max(0, selectedStudent.total_points + category.points);
    const newGoalTotal = Math.max(0, goal.current_points + category.points);
    await supabase.from("rewards").insert({ classroom_id: classroomId, student_id: selectedStudent.id, teacher_id: sessionUserId, category_id: category.id, category_name: category.name, points: category.points });
    await supabase.from("students").update({ total_points: newStudentTotal }).eq("id", selectedStudent.id);
    await supabase.from("class_goals").update({ current_points: newGoalTotal }).eq("id", goal.id);
    if (category.points < 0) {
      setNegativePopStudentId(selectedStudent.id);
    } else {
      setPopStudentId(selectedStudent.id);
    }
    setMessage(category.points >= 0 ? `${selectedStudent.name} earned ${category.points} point(s) for ${category.name}!` : `${selectedStudent.name} lost ${Math.abs(category.points)} point(s) for ${category.name}.`);
    if (category.points > 0) {
      launchSparkles();
      playTone("star");
    }
    const level = activeClassroom?.animation_level || "high";
    if (category.points > 0 && newGoalTotal >= goal.target_points) {
      setCelebration(`🎉 ${goal.reward_name} Unlocked!`);
      playTone("goal");
      confetti({ particleCount: level === "low" ? 100 : 260, spread: 100, origin: { y: 0.65 } });
      if (level === "high") {
        setTimeout(() => confetti({ particleCount: 180, spread: 140, origin: { y: 0.5 } }), 350);
        setTimeout(() => confetti({ particleCount: 120, spread: 100, origin: { x: 0.18, y: 0.7 } }), 650);
        setTimeout(() => confetti({ particleCount: 120, spread: 100, origin: { x: 0.82, y: 0.7 } }), 800);
      }
      setTimeout(() => setCelebration(""), 2600);
    } else if (level !== "low") {
      confetti({ particleCount: 55, spread: 70, origin: { y: 0.7 } });
    }
    setTimeout(() => { setPopStudentId(""); setNegativePopStudentId(""); }, 1200);
    await loadClassroomData(classroomId);
  }

  async function updateGoal(field: keyof Pick<ClassGoal, "name" | "reward_name" | "target_points" | "current_points">, value: string | number) {
    if (!goal) return;
    const { error } = await supabase.from("class_goals").update({ [field]: value }).eq("id", goal.id);
    if (error) return setMessage(error.message);
    await loadClassroomData(classroomId);
  }

  if (!sessionUserId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-orange-100 to-yellow-50">
        <section className="w-full max-w-md rounded-[2rem] bg-white/90 shadow-2xl p-8 border border-white">
          <div className="text-center mb-8"><div className="text-6xl mb-3">☀️</div><h1 className="text-4xl font-black text-orange-600">Sunshine Stars</h1><p className="text-slate-600 mt-2">Teacher reward board login</p></div>
          <input className="w-full mb-3 rounded-2xl border p-4 text-lg" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full mb-4 rounded-2xl border p-4 text-lg" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="grid grid-cols-2 gap-3"><button onClick={signIn} className="rounded-2xl bg-orange-500 text-white p-4 font-bold touch-button">Log in</button><button onClick={signUp} className="rounded-2xl bg-yellow-300 text-orange-900 p-4 font-bold touch-button">Sign up</button></div>
          {message && <p className="mt-4 text-sm text-center text-slate-600">{message}</p>}
        </section>
      </main>
    );
  }

  const progress = goal ? Math.min(100, Math.round((goal.current_points / goal.target_points) * 100)) : 0;

  return (
    <main className={`min-h-screen p-3 md:p-5 bg-gradient-to-br ${theme.bg}`}>
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="reward-sparkle animate-sparkle"
          style={{ left: `${sparkle.x}%`, top: `${sparkle.y}%` }}
        >
          {sparkle.emoji}
        </div>
      ))}
      {celebration && (
        <div className="celebration-banner animate-bannerPop">
          <div className="rounded-[2rem] bg-white/95 px-8 py-6 text-center shadow-2xl border-4 border-yellow-300">
            <div className="text-5xl md:text-7xl font-black text-orange-500">{celebration}</div>
            <div className="text-xl font-bold text-slate-600 mt-2">Amazing class teamwork!</div>
          </div>
        </div>
      )}
      {!kioskMode && (
        <header className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div><h1 className="text-4xl md:text-6xl font-black text-white drop-shadow-lg">{theme.emoji} Sunshine Stars</h1><p className="text-white/80 text-lg">Interactive board mode for teachers</p></div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setMode("board")} className={`px-5 py-4 rounded-2xl font-bold flex gap-2 items-center touch-button ${mode === "board" ? `${theme.accent} text-white` : "bg-white"}`}><MonitorPlay /> Board</button>
            <button onClick={() => setMode("setup")} className={`px-5 py-4 rounded-2xl font-bold flex gap-2 items-center touch-button ${mode === "setup" ? "bg-blue-500 text-white" : "bg-white"}`}><Settings /> Setup</button>
            <button onClick={() => setMode("reports")} className={`px-5 py-4 rounded-2xl font-bold flex gap-2 items-center touch-button ${mode === "reports" ? "bg-emerald-500 text-white" : "bg-white"}`}><BarChart3 /> Reports</button>
            <button onClick={() => updateClassroomSetting("kiosk_mode", true)} className="px-5 py-4 rounded-2xl font-bold bg-white flex gap-2 items-center touch-button"><Maximize /> Kiosk</button>
            <button onClick={signOut} className="px-5 py-4 rounded-2xl font-bold bg-white flex gap-2 items-center touch-button"><LogOut /> Logout</button>
          </div>
        </header>
      )}
      {kioskMode && <button onClick={() => updateClassroomSetting("kiosk_mode", false)} className="fixed top-4 right-4 z-50 rounded-2xl bg-white/90 px-4 py-3 font-bold shadow-xl flex gap-2 items-center touch-button"><Minimize /> Exit Kiosk</button>}

      <section className={`grid grid-cols-1 ${kioskMode ? "xl:grid-cols-[1fr_320px]" : "lg:grid-cols-[1fr_360px]"} gap-5`}>
        <div className={`rounded-[2rem] ${theme.panel} shadow-2xl p-4 md:p-5 border border-white`}>
          {!kioskMode && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <select className="rounded-2xl border p-4 text-xl font-bold bg-white" value={classroomId} onChange={(e) => setClassroomId(e.target.value)}>
                  {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="flex flex-wrap gap-2">
                  <input className="rounded-2xl border p-3" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
                  <button onClick={createClassroom} className="rounded-2xl bg-green-500 text-white px-4 font-bold flex gap-2 items-center touch-button"><Plus /> Class</button>
                  <input className="rounded-2xl border p-3 uppercase" placeholder="Invite code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} />
                  <button onClick={joinClassroom} className="rounded-2xl bg-purple-500 text-white px-4 font-bold flex gap-2 items-center touch-button"><UserPlus /> Join</button>
                </div>
              </div>
              {activeClassroom?.invite_code && (
                <div className="mb-4 rounded-2xl bg-purple-50 border border-purple-200 p-4 flex flex-wrap items-center justify-between gap-3">
                  <div><div className="text-sm font-bold text-purple-700">Classroom Invite Code</div><div className="text-3xl font-black tracking-widest text-purple-900">{activeClassroom.invite_code}</div><div className="text-slate-600 text-sm">Give this code to another teacher so they can join this classroom.</div></div>
                  <button onClick={copyInviteCode} className="rounded-2xl bg-purple-600 text-white px-4 py-3 font-bold flex gap-2 items-center touch-button"><Copy /> Copy</button>
                </div>
              )}
            </>
          )}

          {mode === "board" ? (
            <BoardMode students={students} categories={categories} selectedStudentId={selectedStudentId} setSelectedStudentId={setSelectedStudentId} popStudentId={popStudentId} negativePopStudentId={negativePopStudentId} giveReward={giveReward} quickTakeAwayPoint={quickTakeAwayPoint} theme={theme} kioskMode={kioskMode} />
          ) : mode === "setup" ? (
            <SetupMode students={students} categories={categories} newStudentName={newStudentName} setNewStudentName={setNewStudentName} newStudentAvatar={newStudentAvatar} setNewStudentAvatar={setNewStudentAvatar} addStudent={addStudent} removeStudent={removeStudent} newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName} newCategoryEmoji={newCategoryEmoji} setNewCategoryEmoji={setNewCategoryEmoji} newCategoryPoints={newCategoryPoints} setNewCategoryPoints={setNewCategoryPoints} addCategory={addCategory} removeCategory={removeCategory} updateCategoryPoints={updateCategoryPoints} activeClassroom={activeClassroom} updateClassroomSetting={updateClassroomSetting} playTestSound={() => playTone("test")} />
          ) : (
            <ReportsMode students={students} rewards={rewards} />
          )}
        </div>

        <aside className={`rounded-[2rem] ${theme.panel} shadow-2xl p-5 border border-white`}>
          <h2 className={`text-3xl font-black ${theme.accentText} mb-3`}>Class Goal</h2>
          {goal ? (
            <>
              {!kioskMode && <input className="w-full rounded-2xl border p-3 mb-3 font-bold text-lg" value={goal.name} onChange={(e) => updateGoal("name", e.target.value)} />}
              {!kioskMode && <input className="w-full rounded-2xl border p-3 mb-3" value={goal.reward_name} onChange={(e) => updateGoal("reward_name", e.target.value)} />}
              <div className="text-center my-5"><div className="text-7xl animate-pop">{theme.emoji}</div><div className="text-5xl font-black">{goal.current_points} / {goal.target_points}</div><div className="text-slate-500 text-xl">Reward: {goal.reward_name}</div></div>
              <div className="w-full bg-orange-100 rounded-full h-10 overflow-hidden shadow-inner"><div className="bg-gradient-to-r from-yellow-300 to-orange-500 h-full rounded-full transition-all duration-700" style={{ width: `${progress}%` }} /></div>
              {!kioskMode && <><label className="block mt-4 font-bold">Target points</label><input type="number" className="w-full rounded-2xl border p-3" value={goal.target_points} onChange={(e) => updateGoal("target_points", Number(e.target.value))} /><button onClick={() => updateGoal("current_points", 0)} className="w-full mt-3 rounded-2xl bg-slate-900 text-white p-4 font-bold touch-button">Reset Goal Progress</button></>}
            </>
          ) : <p>No goal yet.</p>}
          {message && <div className="mt-5 rounded-2xl bg-yellow-100 p-4 font-bold text-orange-900 animate-pop">{message}</div>}
        </aside>
      </section>
    </main>
  );
}

function BoardMode({ students, categories, selectedStudentId, setSelectedStudentId, popStudentId, negativePopStudentId, giveReward, quickTakeAwayPoint, theme, kioskMode }: { students: Student[]; categories: Category[]; selectedStudentId: string; setSelectedStudentId: (id: string) => void; popStudentId: string; negativePopStudentId: string; giveReward: (category: Category) => void; quickTakeAwayPoint: () => void; theme: any; kioskMode: boolean; }) {
  return (
    <div>
      {kioskMode && <div className="text-center mb-4"><div className="text-5xl md:text-7xl font-black text-slate-800">{theme.emoji} Board Mode</div><p className="text-xl text-slate-600">Tap a student, then tap a reward.</p></div>}
      <div className={`grid grid-cols-2 md:grid-cols-3 ${kioskMode ? "2xl:grid-cols-5" : "xl:grid-cols-4"} gap-4 mb-6`}>
        {students.map((student) => (
          <button key={student.id} onClick={() => setSelectedStudentId(student.id)} className={`relative rounded-[2rem] p-5 md:p-7 ${kioskMode ? "min-h-56" : "min-h-44"} text-center shadow-xl border-4 transition-all touch-button ${selectedStudentId === student.id ? "bg-yellow-100 border-yellow-400 scale-[1.04]" : "bg-white border-white hover:scale-[1.02]"} ${popStudentId === student.id ? "animate-glow" : ""}`}>
            {popStudentId === student.id && (
              <div className="absolute inset-x-0 top-8 animate-floatUp pointer-events-none">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-yellow-300 px-6 py-3 text-5xl md:text-7xl font-black text-orange-700 shadow-2xl border-4 border-white">
                  ⭐ +1
                </div>
              </div>
            )}

            {negativePopStudentId === student.id && (
              <div className="absolute inset-x-0 top-8 animate-floatUp pointer-events-none">
                <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-red-500 px-6 py-3 text-5xl md:text-7xl font-black text-white shadow-2xl border-4 border-white">
                  💥 -1
                </div>
              </div>
            )}
            <div className={`${kioskMode ? "text-8xl" : "text-6xl"} mb-2`}>{student.avatar}</div>
            <div className={`${kioskMode ? "text-4xl" : "text-3xl"} font-black text-slate-800`}>{student.name}</div>
            <div className={`${kioskMode ? "text-3xl" : "text-2xl"} font-bold text-orange-500 mt-2`}><Star className="inline" /> {student.total_points}</div>
          </button>
        ))}
      </div>
      <div className={`rounded-[2rem] ${theme.soft} p-5`}>
        <h2 className={`text-3xl md:text-4xl font-black mb-4 ${theme.accentText}`}>Tap a reward category</h2>
        {!selectedStudentId && <p className="mb-4 text-lg font-bold text-slate-600">Select a student first.</p>}
        {selectedStudentId && (
          <button
            onClick={quickTakeAwayPoint}
            className="mb-4 rounded-[1.5rem] bg-red-100 text-red-700 border-2 border-red-200 px-6 py-4 text-2xl font-black shadow hover:scale-[1.02] active:scale-95 transition-all touch-button"
          >
            −1 Take Away Point
          </button>
        )}
        <div className={`grid grid-cols-2 md:grid-cols-3 ${kioskMode ? "xl:grid-cols-5" : ""} gap-3`}>
          {categories.map((category) => (
            <button key={category.id} disabled={!selectedStudentId} onClick={() => giveReward(category)} className={`${kioskMode ? "min-h-36 text-3xl" : "text-2xl"} rounded-[1.5rem] ${category.points < 0 ? "bg-red-50 text-red-700 border-2 border-red-200" : "bg-white"} p-5 font-black shadow-lg hover:scale-[1.04] active:scale-95 disabled:opacity-40 transition-all touch-button`}>
              <span className={`${kioskMode ? "text-6xl" : "text-4xl"} block mb-2`}>{category.emoji}</span>
              <span className="block">{category.name}</span>
              <span className={`mt-2 inline-block rounded-full px-3 py-1 text-base ${category.points < 0 ? "bg-red-200 text-red-900" : "bg-yellow-100 text-orange-700"}`}>
                {category.points > 0 ? `+${category.points}` : category.points} pts
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportsMode({ students, rewards }: { students: Student[]; rewards: RewardLog[] }) {
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);
  const todaysRewards = rewards.filter((r) => new Date(r.created_at).toDateString() === today.toDateString());
  const weeklyRewards = rewards.filter((r) => new Date(r.created_at) >= weekAgo);
  const totalToday = todaysRewards.reduce((sum, r) => sum + r.points, 0);
  const totalWeek = weeklyRewards.reduce((sum, r) => sum + r.points, 0);
  const totalAll = rewards.reduce((sum, r) => sum + r.points, 0);
  const categoryTotals = Object.values(weeklyRewards.reduce<Record<string, { name: string; points: number }>>((acc, reward) => {
    const key = reward.category_name || "Other";
    acc[key] = acc[key] || { name: key, points: 0 };
    acc[key].points += reward.points;
    return acc;
  }, {})).sort((a, b) => b.points - a.points).map((item) => ({
    ...item,
    fill: getCategoryColor(item.name),
  }));
  const studentTotals = students.map((student) => ({
    name: student.name,
    avatar: student.avatar,
    points: weeklyRewards.filter((reward) => reward.student_id === student.id).reduce((sum, reward) => sum + reward.points, 0),
    total: student.total_points,
  })).sort((a, b) => b.points - a.points);
  const dailyTotals = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const dayRewards = rewards.filter((reward) => new Date(reward.created_at).toDateString() === d.toDateString());
    const points = dayRewards.reduce((sum, reward) => sum + reward.points, 0);
    const topCategory = Object.values(dayRewards.reduce<Record<string, { name: string; points: number }>>((acc, reward) => {
      const key = reward.category_name || "Other";
      acc[key] = acc[key] || { name: key, points: 0 };
      acc[key].points += reward.points;
      return acc;
    }, {})).sort((a, b) => b.points - a.points)[0]?.name || "No Rewards";
    return {
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      points,
      fill: getCategoryColor(topCategory),
    };
  });
  const topCategory = categoryTotals[0]?.name || "No rewards yet";
  const topStudent = studentTotals[0]?.points ? studentTotals[0].name : "No student yet";
  const summary = `This week the class earned ${totalWeek} points. The most common reward category was ${topCategory}. The top weekly participant was ${topStudent}.`;

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-[2rem] bg-white p-5 shadow"><div className="text-slate-500 font-bold">Today</div><div className="text-5xl font-black text-orange-500">{totalToday}</div><div className="text-slate-500">points</div></div>
        <div className="rounded-[2rem] bg-white p-5 shadow"><div className="text-slate-500 font-bold">Last 7 Days</div><div className="text-5xl font-black text-emerald-500">{totalWeek}</div><div className="text-slate-500">points</div></div>
        <div className="rounded-[2rem] bg-white p-5 shadow"><div className="text-slate-500 font-bold">All Time</div><div className="text-5xl font-black text-indigo-500">{totalAll}</div><div className="text-slate-500">points</div></div>
      </div>
      <div className="rounded-[2rem] bg-yellow-50 p-5 border border-yellow-100"><h2 className="text-3xl font-black text-orange-700 mb-2 flex gap-2 items-center"><Activity /> Teacher Summary</h2><p className="text-xl text-slate-700">{summary}</p></div>
      <div className="grid xl:grid-cols-2 gap-5">
        <section className="rounded-[2rem] bg-white p-5 shadow"><h2 className="text-3xl font-black mb-4">Daily Points</h2><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={dailyTotals}><XAxis dataKey="day" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="points" radius={[12, 12, 0, 0]}>{dailyTotals.map((entry, index) => <Cell key={`daily-${index}`} fill={entry.fill} />)}</Bar></BarChart></ResponsiveContainer></div></section>
        <section className="rounded-[2rem] bg-white p-5 shadow">
          <h2 className="text-3xl font-black mb-4">Category Breakdown</h2>
          {categoryTotals.length ? (
            <>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryTotals} dataKey="points" nameKey="name" outerRadius={100} label />
                    {categoryTotals.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                {categoryTotals.map((entry) => (
                  <div key={entry.name} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                    <div className="flex items-center gap-2 font-bold">
                      <span className="h-4 w-4 rounded-full" style={{ backgroundColor: entry.fill }} />
                      {entry.name}
                    </div>
                    <span className="font-black">{entry.points}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-slate-500">No category data yet.</p>
          )}
        </section>
      </div>
      <div className="grid xl:grid-cols-2 gap-5">
        <section className="rounded-[2rem] bg-white p-5 shadow"><h2 className="text-3xl font-black mb-4">Weekly Student Points</h2><div className="space-y-2">{studentTotals.map((student) => <div key={student.name} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><div className="text-xl font-black"><span className="text-3xl mr-2">{student.avatar}</span>{student.name}</div><div className="text-2xl font-black text-orange-500">{student.points}</div></div>)}</div></section>
        <section className="rounded-[2rem] bg-white p-5 shadow"><h2 className="text-3xl font-black mb-4">Recent Rewards</h2><div className="space-y-2 max-h-96 overflow-auto">{rewards.slice(0, 20).map((reward) => { const student = students.find((s) => s.id === reward.student_id); return <div key={reward.id} className="rounded-2xl bg-slate-50 p-4 border-l-8" style={{ borderLeftColor: getCategoryColor(reward.category_name) }}><div className="font-black text-lg">{student?.avatar} {student?.name || "Student"} {reward.points >= 0 ? "earned" : "lost"} {Math.abs(reward.points)} point</div><div className="text-slate-600">{reward.category_name}</div><div className="text-xs text-slate-400">{new Date(reward.created_at).toLocaleString()}</div></div>; })}</div></section>
      </div>
    </div>
  );
}

function SetupMode(props: {
  students: Student[]; categories: Category[]; newStudentName: string; setNewStudentName: (v: string) => void; newStudentAvatar: string; setNewStudentAvatar: (v: string) => void; addStudent: () => void; removeStudent: (id: string) => void; newCategoryName: string; setNewCategoryName: (v: string) => void; newCategoryEmoji: string; setNewCategoryEmoji: (v: string) => void; newCategoryPoints: number; setNewCategoryPoints: (v: number) => void; addCategory: () => void; removeCategory: (id: string) => void; updateCategoryPoints: (id: string, points: number) => void; activeClassroom?: Classroom; updateClassroomSetting: (field: "theme" | "sounds_enabled" | "kiosk_mode" | "animation_level", value: string | boolean) => void; playTestSound: () => void;
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <section className="rounded-[2rem] bg-blue-50 p-5">
        <h2 className="text-3xl font-black text-blue-700 mb-4 flex gap-2 items-center"><Users /> Students</h2>
        <div className="flex gap-2 mb-3"><input className="flex-1 rounded-2xl border p-3" placeholder="Student name" value={props.newStudentName} onChange={(e) => props.setNewStudentName(e.target.value)} /><input className="w-20 rounded-2xl border p-3 text-center text-2xl" value={props.newStudentAvatar} onChange={(e) => props.setNewStudentAvatar(e.target.value)} /><button onClick={props.addStudent} className="rounded-2xl bg-blue-500 text-white px-4 font-bold touch-button"><Plus /></button></div>
        <div className="flex flex-wrap gap-2 mb-4">{AVATARS.map((a) => <button key={a} onClick={() => props.setNewStudentAvatar(a)} className="text-2xl bg-white rounded-xl p-2 shadow touch-button">{a}</button>)}</div>
        <div className="space-y-2">{props.students.map((s) => <div key={s.id} className="flex items-center justify-between bg-white rounded-2xl p-3"><div className="font-bold text-xl"><span className="text-3xl mr-2">{s.avatar}</span>{s.name}</div><button onClick={() => props.removeStudent(s.id)} className="text-red-500 touch-button"><Trash2 /></button></div>)}</div>
      </section>
      <section className="rounded-[2rem] bg-green-50 p-5">
        <h2 className="text-3xl font-black text-green-700 mb-4">Categories</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <input className="flex-1 min-w-48 rounded-2xl border p-3" placeholder="Category name" value={props.newCategoryName} onChange={(e) => props.setNewCategoryName(e.target.value)} />
          <input className="w-20 rounded-2xl border p-3 text-center text-2xl" value={props.newCategoryEmoji} onChange={(e) => props.setNewCategoryEmoji(e.target.value)} />
          <input type="number" className="w-28 rounded-2xl border p-3 text-center font-bold" value={props.newCategoryPoints} onChange={(e) => props.setNewCategoryPoints(Number(e.target.value))} />
          <button onClick={props.addCategory} className="rounded-2xl bg-green-500 text-white px-4 font-bold touch-button"><Plus /></button>
        </div>
        <p className="mb-3 text-sm text-slate-600">Use positive numbers for rewards, or negative numbers for point deductions.</p>
        <div className="space-y-2 mb-6">
          {props.categories.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-3">
              <div className="font-bold text-xl">
                <span className="text-3xl mr-2">{c.emoji}</span>{c.name}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-slate-500">Points</label>
                <input
                  type="number"
                  className={`w-24 rounded-xl border p-2 text-center font-black ${c.points < 0 ? "text-red-600" : "text-orange-600"}`}
                  value={c.points}
                  onChange={(e) => props.updateCategoryPoints(c.id, Number(e.target.value))}
                />
                <button onClick={() => props.removeCategory(c.id)} className="text-red-500 touch-button"><Trash2 /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-[2rem] bg-white p-4 shadow">
          <h3 className="text-2xl font-black mb-3">Board Settings</h3>
          <label className="block font-bold mb-1">Theme</label>
          <select className="w-full rounded-2xl border p-3 mb-3" value={props.activeClassroom?.theme || "Ninja Academy"} onChange={(e) => props.updateClassroomSetting("theme", e.target.value)}>{Object.keys(THEMES).map((name) => <option key={name} value={name}>{THEMES[name].emoji} {name}</option>)}</select>
          <label className="block font-bold mb-1">Animation level</label>
          <select className="w-full rounded-2xl border p-3 mb-3" value={props.activeClassroom?.animation_level || "high"} onChange={(e) => props.updateClassroomSetting("animation_level", e.target.value)}><option value="low">Low</option><option value="high">High</option></select>
          <button onClick={() => props.updateClassroomSetting("sounds_enabled", !props.activeClassroom?.sounds_enabled)} className="w-full rounded-2xl bg-slate-900 text-white p-4 font-bold flex justify-center gap-2 items-center mb-3 touch-button">{props.activeClassroom?.sounds_enabled ? <Volume2 /> : <VolumeX />} Sounds: {props.activeClassroom?.sounds_enabled ? "On" : "Off"}</button>
          <button onClick={props.playTestSound} className="w-full rounded-2xl bg-yellow-400 text-orange-950 p-4 font-bold mb-3 touch-button">Test Sound ✨</button>
          <button onClick={() => props.updateClassroomSetting("kiosk_mode", true)} className="w-full rounded-2xl bg-orange-500 text-white p-4 font-bold flex justify-center gap-2 items-center touch-button"><Maximize /> Open Kiosk Mode</button>
        </div>
      </section>
    </div>
  );
}
