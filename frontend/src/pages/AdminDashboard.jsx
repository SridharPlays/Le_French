import React, { useState, useEffect } from "react";
import api from "../api/axiosClient";
import {
  LayoutDashboard,
  FilePlus,
  Lock,
  Users,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Save,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "react-hot-toast";

// ==========================================
// 🧩 SUB-COMPONENT: Dynamic Question Builder
// ==========================================
const QuestionBuilder = ({ onAddQuestion }) => {
  const [type, setType] = useState("fill_blank");

  // Internal states for different question types
  const [fillData, setFillData] = useState({ text: "", answer: "" });
  const [tfData, setTfData] = useState({ statement: "", isTrue: "true" });
  const [storyData, setStoryData] = useState({
    story: "",
    question: "",
    answer: "",
  });

  // Special state for "Match the Following" to make UI easier
  const [matchPairs, setMatchPairs] = useState([{ left: "", right: "" }]);

  // --- Match Logic ---
  const updatePair = (index, field, value) => {
    const newPairs = [...matchPairs];
    newPairs[index][field] = value;
    setMatchPairs(newPairs);
  };

  const addPairRow = () =>
    setMatchPairs([...matchPairs, { left: "", right: "" }]);
  const removePairRow = (index) =>
    setMatchPairs(matchPairs.filter((_, i) => i !== index));

  // --- Add to Queue Logic ---
  const handleAddClick = () => {
    let finalContent = {};

    // Validation & Formatting based on type
    if (type === "fill_blank") {
      if (!fillData.text.includes("___"))
        return toast.error(
          "Please include '___' in the question text for the blank space."
        );
      if (!fillData.answer) return toast.error("Please provide the correct answer.");
      finalContent = { ...fillData };
      setFillData({ text: "", answer: "" }); // Reset
    } else if (type === "true_false") {
      if (!tfData.statement) return toast.error("Please enter a statement.");
      finalContent = {
        statement: tfData.statement,
        isTrue: tfData.isTrue === "true",
      };
      setTfData({ statement: "", isTrue: "true" }); // Reset
    } else if (type === "match") {
      // Filter out empty rows
      const validPairs = matchPairs.filter((p) => p.left && p.right);
      if (validPairs.length < 2)
        return toast.error("Please add at least 2 valid pairs.");

      // Convert array to the string format backend might expect, or keep as JSON object
      // Let's store it as a clean JSON object for the DB
      finalContent = { pairs: validPairs };
      setMatchPairs([{ left: "", right: "" }]); // Reset
    } else if (type === "story") {
      if (!storyData.story || !storyData.question || !storyData.answer)
        return toast.error("Please fill all fields.");
      finalContent = { ...storyData };
      setStoryData({ story: "", question: "", answer: "" }); // Reset
    }

    onAddQuestion({ question_type: type, content: finalContent });
  };

  return (
    <div className="bg-gray-50 p-6 rounded-xl border-2 border-dashed border-gray-300 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-gray-700 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          Add New Question
        </h4>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="fill_blank">Fill in the Blanks</option>
          <option value="true_false">True / False</option>
          <option value="match">Match the Following</option>
          <option value="story">Story Comprehension</option>
        </select>
      </div>

      {/* --- Dynamic Input Area --- */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4">
        {/* 1. Fill in Blank UI */}
        {type === "fill_blank" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Question Sentence
              </label>
              <div className="text-xs text-blue-500 mb-1">
                Tip: Use three underscores (___) to mark the missing word.
              </div>
              <input
                className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                placeholder="e.g., Le chat ___ sur le tapis."
                value={fillData.text}
                onChange={(e) =>
                  setFillData({ ...fillData, text: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Correct Answer
              </label>
              <input
                className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition"
                placeholder="e.g., dort"
                value={fillData.answer}
                onChange={(e) =>
                  setFillData({ ...fillData, answer: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {/* 2. True/False UI */}
        {type === "true_false" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Statement
              </label>
              <input
                className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Paris is the capital of Italy."
                value={tfData.statement}
                onChange={(e) =>
                  setTfData({ ...tfData, statement: e.target.value })
                }
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                Correct Answer
              </label>
              <div className="flex gap-4">
                <label
                  className={`flex-1 p-3 rounded-lg border cursor-pointer text-center font-bold transition ${
                    tfData.isTrue === "true"
                      ? "bg-green-100 border-green-500 text-green-700"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="tf"
                    value="true"
                    checked={tfData.isTrue === "true"}
                    onChange={(e) =>
                      setTfData({ ...tfData, isTrue: e.target.value })
                    }
                    className="hidden"
                  />
                  TRUE
                </label>
                <label
                  className={`flex-1 p-3 rounded-lg border cursor-pointer text-center font-bold transition ${
                    tfData.isTrue === "false"
                      ? "bg-red-100 border-red-500 text-red-700"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="tf"
                    value="false"
                    checked={tfData.isTrue === "false"}
                    onChange={(e) =>
                      setTfData({ ...tfData, isTrue: e.target.value })
                    }
                    className="hidden"
                  />
                  FALSE
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 3. Match the Following UI (Better UX) */}
        {type === "match" && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-gray-500 uppercase px-1">
              <span>Left Side (e.g., French)</span>
              <span>Right Side (e.g., English)</span>
            </div>
            {matchPairs.map((pair, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  placeholder="Item A"
                  className="flex-1 p-2 border rounded bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  value={pair.left}
                  onChange={(e) => updatePair(idx, "left", e.target.value)}
                />
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <input
                  placeholder="Match A"
                  className="flex-1 p-2 border rounded bg-gray-50 focus:bg-white outline-none focus:ring-1 focus:ring-blue-500"
                  value={pair.right}
                  onChange={(e) => updatePair(idx, "right", e.target.value)}
                />
                {matchPairs.length > 1 && (
                  <button
                    onClick={() => removePairRow(idx)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addPairRow}
              className="text-sm text-blue-600 font-semibold hover:underline flex items-center gap-1 mt-2"
            >
              <Plus className="w-4 h-4" /> Add another pair
            </button>
          </div>
        )}

        {/* 4. Story UI */}
        {type === "story" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">
                Story Text (French)
              </label>
              <textarea
                className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none h-24"
                placeholder="Paste the story paragraph here..."
                value={storyData.story}
                onChange={(e) =>
                  setStoryData({ ...storyData, story: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Question
                </label>
                <input
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  value={storyData.question}
                  onChange={(e) =>
                    setStoryData({ ...storyData, question: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Answer
                </label>
                <input
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none"
                  value={storyData.answer}
                  onChange={(e) =>
                    setStoryData({ ...storyData, answer: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleAddClick}
        className="w-full mt-4 bg-gray-800 hover:bg-black text-white font-semibold py-3 rounded-lg transition flex justify-center items-center gap-2"
      >
        <Plus className="w-5 h-5" /> Add Question to Queue
      </button>
    </div>
  );
};

// ==========================================
// 🚀 MAIN DASHBOARD COMPONENT
// ==========================================
const AdminDashboard = () => {
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState([]);
  const [batches, setBatches] = useState([]);
  const [chapters, setChapters] = useState([]);

  // --- Create Content State ---
  const [newChapter, setNewChapter] = useState({
    title: "",
    description: "",
    order: 1,
  });
  const [newExercise, setNewExercise] = useState({
    title: "",
    type: "quiz",
    chapter_id: "",
    xp: 10,
  });
  const [questionQueue, setQuestionQueue] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchBatches();
    fetchChapters();
  }, []);

  // --- API Calls (Safe Wrappers) ---
  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (e) {
      console.warn("Missing stats endpoint",e);
    }
  };
  const fetchBatches = async () => {
    try {
      const res = await api.get("/auth/batches");
      setBatches(res.data);
    } catch (e) {
      console.warn("Missing batches endpoint",e);
    }
  };
  const fetchChapters = async () => {
    try {
      const res = await api.get("/admin/chapters_list");
      setChapters(res.data);
    } catch (e) {
      console.warn("Missing chapter endpoint",e);
    }
  };

  // --- Handlers ---
  const handleCreateChapter = async () => {
    if (!newChapter.title) return toast.error("Title required");
    try {
      const res = await api.post("/admin/chapter", newChapter);
      toast.success(`Chapter "${res.data.title}" created!`);
      setNewChapter({
        title: "",
        description: "",
        order: parseInt(newChapter.order) + 1,
      });
      setChapters([...chapters, res.data]);
    } catch (err) {
      toast.error("Failed to create chapter.", err);
    }
  };

  const removeQuestionFromQueue = (idx) => {
    setQuestionQueue(questionQueue.filter((_, i) => i !== idx));
  };

  const submitExercise = async () => {
    if (!newExercise.title) return toast.error("Exercise Title required");
    if (!newExercise.chapter_id) return toast.error("Please select a Chapter");
    if (questionQueue.length === 0)
      return toast.error("Please add at least one question");

    try {
      await api.post("/admin/exercise", {
        ...newExercise,
        questions: questionQueue,
      });
      toast.success("✅ Exercise Published Successfully!");

      // Reset Form
      setQuestionQueue([]);
      setNewExercise({ ...newExercise, title: "" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish exercise.");
    }
  };

  const handleLockToggle = async (batchId, chapterId, unlock) => {
    try {
      await api.post("/admin/lock", {
        batch_id: batchId,
        chapter_id: chapterId,
        unlock,
      });
      toast.success(unlock ? "Chapter Unlocked 🔓" : "Chapter Locked 🔒");
    } catch (e) {
      toast.error("Error updating lock", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-red-900 text-white min-h-screen fixed h-full z-20 shadow-xl">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-red-900 font-bold">
              A
            </div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Admin Portal
            </h2>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setTab("stats")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                tab === "stats"
                  ? "bg-white text-red-900 font-bold shadow"
                  : "hover:bg-red-800 text-red-100"
              }`}
            >
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </button>
            <button
              onClick={() => setTab("create")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                tab === "create"
                  ? "bg-white text-red-900 font-bold shadow"
                  : "hover:bg-red-800 text-red-100"
              }`}
            >
              <FilePlus className="w-5 h-5" /> Content Creator
            </button>
            <button
              onClick={() => setTab("locks")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                tab === "locks"
                  ? "bg-white text-red-900 font-bold shadow"
                  : "hover:bg-red-800 text-red-100"
              }`}
            >
              <Lock className="w-5 h-5" /> Batch Access
            </button>
          </nav>
        </div>
        <div className="absolute bottom-0 w-full p-6 text-xs text-red-300 text-center">
          v1.0.0 • Secure Admin
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 ml-64 p-10">
        {/* === STATS TAB === */}
        {tab === "stats" && (
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Overview</h1>
            <p className="text-gray-500 mb-8">
              Monitor student performance and engagement.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.map((b, i) => (
                <div
                  key={i}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-500" /> {b.batch_name}
                    </h4>
                    <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">
                      Active
                    </span>
                  </div>
                  <div className="flex items-end justify-between mt-4">
                    <div>
                      <p className="text-4xl font-extrabold text-gray-800">
                        {b.students}
                      </p>
                      <p className="text-gray-400 text-xs uppercase tracking-wider mt-1 font-bold">
                        Enrolled
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-green-600 flex items-center justify-end gap-1">
                        <Award className="w-5 h-5" /> {b.total_batch_xp || 0}
                      </p>
                      <p className="text-gray-400 text-xs uppercase tracking-wider font-bold">
                        Total XP
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* === CREATE CONTENT TAB === */}
        {tab === "create" && (
          <div className="max-w-4xl mx-auto pb-20 animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Curriculum Manager
            </h1>
            <p className="text-gray-500 mb-8">
              Create chapters and assign gamified exercises.
            </p>

            {/* 1. CREATE CHAPTER CARD */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                Step 1: Create Chapter
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-5">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                    Chapter Title
                  </label>
                  <input
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="e.g., Basics 101"
                    value={newChapter.title}
                    onChange={(e) =>
                      setNewChapter({ ...newChapter, title: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-5">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                    Description
                  </label>
                  <input
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                    placeholder="e.g., Greetings & Introductions"
                    value={newChapter.description}
                    onChange={(e) =>
                      setNewChapter({
                        ...newChapter,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <button
                    onClick={handleCreateChapter}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition flex justify-center items-center"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* 2. CREATE EXERCISE CARD */}
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <FilePlus className="w-6 h-6 text-red-600" />
                Step 2: Create Exercise
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                    Exercise Title
                  </label>
                  <input
                    placeholder="e.g., Verb Conjugation Quiz"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500 outline-none"
                    value={newExercise.title}
                    onChange={(e) =>
                      setNewExercise({ ...newExercise, title: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                    Assign to Chapter
                  </label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500 outline-none"
                    value={newExercise.chapter_id}
                    onChange={(e) =>
                      setNewExercise({
                        ...newExercise,
                        chapter_id: e.target.value,
                      })
                    }
                  >
                    <option value="">-- Select Chapter --</option>
                    {chapters.map((chap) => (
                      <option key={chap.chapter_id} value={chap.chapter_id}>
                        {chap.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                    Interaction Type
                  </label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500 outline-none"
                    onChange={(e) =>
                      setNewExercise({ ...newExercise, type: e.target.value })
                    }
                  >
                    <option value="quiz">Standard Quiz</option>
                    <option value="game">Mini Game</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">
                    XP Reward
                  </label>
                  <input
                    type="number"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-red-500 outline-none"
                    value={newExercise.xp}
                    onChange={(e) =>
                      setNewExercise({ ...newExercise, xp: e.target.value })
                    }
                  />
                </div>
              </div>

              <hr className="border-gray-100 my-8" />

              {/* 3. ADD QUESTIONS (The complex part) */}
              <QuestionBuilder
                onAddQuestion={(q) => setQuestionQueue([...questionQueue, q])}
              />

              {/* 4. QUEUE & PUBLISH */}
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h5 className="font-bold text-gray-700 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    Exercise Queue
                  </h5>
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">
                    {questionQueue.length} Items
                  </span>
                </div>

                {questionQueue.length === 0 ? (
                  <div className="p-8 border-2 border-dashed border-gray-200 rounded-xl text-center text-gray-400">
                    No questions added yet. Use the builder above.
                  </div>
                ) : (
                  <div className="space-y-2 mb-6">
                    {questionQueue.map((q, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-red-200 transition group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="bg-white border border-gray-200 text-gray-500 w-6 h-6 flex items-center justify-center rounded text-xs font-mono">
                            {i + 1}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-blue-600 uppercase mb-0.5">
                              {q.question_type.replace("_", " ")}
                            </div>
                            <div className="text-sm text-gray-700 font-medium truncate w-96">
                              {q.content.text ||
                                q.content.statement ||
                                (q.content.pairs
                                  ? "Matching Pairs"
                                  : "Story Content")}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => removeQuestionFromQueue(i)}
                          className="text-gray-400 hover:text-red-600 transition p-2"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={submitExercise}
                  disabled={questionQueue.length === 0}
                  className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex justify-center items-center gap-2 transition-all transform active:scale-95 ${
                    questionQueue.length === 0
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-linear-to-r from-red-900 to-red-700 text-white hover:shadow-xl"
                  }`}
                >
                  <Save className="w-6 h-6" />
                  Publish Exercise Live
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === LOCKS TAB === */}
        {tab === "locks" && (
          <div className="max-w-5xl mx-auto animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Batch Access
            </h1>
            <p className="text-gray-500 mb-8">
              Control which chapters are visible to specific batches.
            </p>

            <div className="grid grid-cols-1 gap-8">
              {batches.map((batch) => (
                <div
                  key={batch.batch_id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">
                      {batch.batch_name}
                    </h3>
                    <span className="text-xs font-mono text-gray-400">
                      ID: {batch.batch_id}
                    </span>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(chapters.length > 0
                      ? chapters
                      : [{ chapter_id: 1, title: "Basics (Default)" }]
                    ).map((chap) => (
                      <div
                        key={chap.chapter_id}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-50 p-2 rounded text-blue-600">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <span className="font-medium text-gray-700 text-sm">
                            {chap.title}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            title="Unlock"
                            onClick={() =>
                              handleLockToggle(
                                batch.batch_id,
                                chap.chapter_id,
                                true
                              )
                            }
                            className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-green-600 hover:border-green-300 rounded transition"
                          >
                            <Lock className="w-4 h-4 rotate-180" />{" "}
                            {/* Hack for 'Unlock' icon visual */}
                          </button>
                          <button
                            title="Lock"
                            onClick={() =>
                              handleLockToggle(
                                batch.batch_id,
                                chap.chapter_id,
                                false
                              )
                            }
                            className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 rounded transition"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
