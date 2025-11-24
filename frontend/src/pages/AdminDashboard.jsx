/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
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
  AlignLeft,
  LogOut,
  ChevronLeft,
  XCircle,
  Clock,
  History,
  Unlock,
  Mic
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
  const [jumbleData, setJumbleData] = useState({ sentence: "" });
  const [speakingData, setSpeakingData] = useState({ text: "" }); // NEW STATE

  // Special state for "Match the Following"
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
      const validPairs = matchPairs.filter((p) => p.left && p.right);
      if (validPairs.length < 2)
        return toast.error("Please add at least 2 valid pairs.");
      finalContent = { pairs: validPairs };
      setMatchPairs([{ left: "", right: "" }]); // Reset
    } else if (type === "story") {
      if (!storyData.story || !storyData.question || !storyData.answer)
        return toast.error("Please fill all fields.");
      finalContent = { ...storyData };
      setStoryData({ story: "", question: "", answer: "" }); // Reset
    } else if (type === "jumbled_sentence") {
      if (!jumbleData.sentence) return toast.error("Please enter the correct sentence.");
      finalContent = { sentence: jumbleData.sentence };
      setJumbleData({ sentence: "" }); // Reset
    } else if (type === "speaking") {
      // NEW: Speaking Validation
      if (!speakingData.text) return toast.error("Please enter the sentence to pronounce.");
      finalContent = { text: speakingData.text };
      setSpeakingData({ text: "" });
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
          <option value="jumbled_sentence">Jumbled Sentence</option>
          <option value="speaking">Speaking Challenge</option> {/* NEW OPTION */}
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

        {/* 3. Match the Following UI */}
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

        {/* 5. Jumbled Sentence UI */}
        {type === "jumbled_sentence" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <AlignLeft className="w-5 h-5 text-purple-600" />
              <label className="text-xs font-bold text-gray-500 uppercase">
                Correct Sentence
              </label>
            </div>
            <p className="text-xs text-gray-400 mb-2">
              Enter the full correct sentence. The game will automatically shuffle the words for the student.
            </p>
            <input
              className="w-full p-4 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none text-lg"
              placeholder="e.g., Je mange une pomme rouge"
              value={jumbleData.sentence}
              onChange={(e) => setJumbleData({ sentence: e.target.value })}
            />
          </div>
        )}

        {/* 6. NEW: Speaking UI */}
        {type === "speaking" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-5 h-5 text-rose-600" />
              <label className="text-xs font-bold text-gray-500 uppercase">
                Reference Text to Pronounce
              </label>
            </div>
            <p className="text-xs text-gray-400 mb-2">
              Enter the word or sentence the student needs to speak.
            </p>
            <input
              className="w-full p-4 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-rose-500 outline-none text-lg"
              placeholder="e.g., Bonjour, comment ça va ?"
              value={speakingData.text}
              onChange={(e) => setSpeakingData({ text: e.target.value })}
            />
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
  
  // Access Status State
  const [accessMap, setAccessMap] = useState(new Set());

  // Drill-down States
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [batchDetails, setBatchDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentHistory, setStudentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Auth & Navigation
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  // Create Content State
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
    fetchAccessMap();
  }, []);

  // API Calls
  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (e) {
      console.error("Missing stats endpoint", e);
    }
  };
  const fetchBatches = async () => {
    try {
      const res = await api.get("/auth/batches");
      setBatches(res.data);
    } catch (e) {
      console.error("Missing batches endpoint", e);
    }
  };
  const fetchChapters = async () => {
    try {
      const res = await api.get("/admin/chapters_list");
      setChapters(res.data);
    } catch (e) {
      console.error("Missing chapter endpoint", e);
    }
  };
  
  const fetchAccessMap = async () => {
    try {
      const res = await api.get("/admin/access_map");
      const newMap = new Set(res.data.map(item => `${item.batch_id}-${item.chapter_id}`));
      setAccessMap(newMap);
    } catch (e) {
      console.error("Missing access map endpoint", e);
    }
  };

  // Handlers
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleViewBatchDetails = async (batchId) => {
    setSelectedBatchId(batchId);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/batch/${batchId}/full`);
      setBatchDetails(res.data);
    } catch (err) {
      toast.error("Failed to load batch details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewStudentHistory = async (student) => {
    setSelectedStudent(student);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/admin/student/${student.user_id}`);
      setStudentHistory(res.data);
    } catch (err) {
      toast.error("Failed to load student history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleBackToBatch = () => {
    setSelectedStudent(null);
    setStudentHistory([]);
  };

  const handleBackToOverview = () => {
    setSelectedBatchId(null);
    setBatchDetails(null);
  };

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
      
      const key = `${batchId}-${chapterId}`;
      const newMap = new Set(accessMap);
      if (unlock) {
        newMap.add(key);
      } else {
        newMap.delete(key);
      }
      setAccessMap(newMap);

      toast.success(unlock ? "Chapter Unlocked 🔓" : "Chapter Locked 🔒");
    } catch (e) {
      toast.error("Error updating lock", e);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-red-900 text-white min-h-screen fixed h-full z-20 shadow-xl flex flex-col">
        <div className="p-6 flex-1">
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
        
        <div className="p-4 border-t border-red-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-red-200 hover:text-white px-4 py-2 hover:bg-red-800 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
          <div className="mt-4 text-xs text-red-300 text-center">
            v1.0.0 • Secure Admin
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-10">
        
        {/* === 1. DASHBOARD / STATS TAB === */}
        {tab === "stats" && (
          <div className="animate-fade-in">
            
            {!selectedBatchId ? (
              // A) BATCH OVERVIEW
              <>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Overview</h1>
                <p className="text-gray-500 mb-8">
                  Monitor student performance and engagement across batches.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stats.map((b, i) => (
                    <div
                      key={i}
                      className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer group"
                      onClick={() => handleViewBatchDetails(b.batch_id)}
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
                      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-blue-600 text-sm font-bold group-hover:translate-x-1 transition-transform">
                        View Student Progress <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : !selectedStudent ? (
              // B) BATCH DETAILS
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-h-[500px]">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleBackToOverview}
                      className="p-2 hover:bg-white rounded-full border border-transparent hover:border-gray-300 transition shadow-sm"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {loadingDetails ? "Loading..." : batchDetails?.batch_name}
                      </h2>
                      <p className="text-xs text-gray-500">Select a student to view detailed history</p>
                    </div>
                  </div>
                  <div className="text-sm font-mono bg-white px-3 py-1 rounded border">
                    {batchDetails?.students?.length || 0} Students
                  </div>
                </div>

                {loadingDetails ? (
                  <div className="p-20 text-center text-gray-400">Loading student data...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="py-4 px-6">Student Name</th>
                          <th className="py-4 px-6">Email</th>
                          <th className="py-4 px-6 text-center">Total XP</th>
                          <th className="py-4 px-6 text-center">Lessons</th>
                          <th className="py-4 px-6 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {batchDetails?.students?.map((student) => (
                          <tr key={student.user_id} className="hover:bg-blue-50 transition-colors">
                            <td className="py-4 px-6 font-medium text-gray-900">
                              {student.name}
                            </td>
                            <td className="py-4 px-6 text-gray-500 text-sm">{student.email}</td>
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {student.total_xp} XP
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center text-gray-700 font-bold">
                              {student.lessons_completed || 0}
                            </td>
                            <td className="py-4 px-6 text-center">
                              <button 
                                onClick={() => handleViewStudentHistory(student)}
                                className="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center justify-center gap-1"
                              >
                                <History className="w-4 h-4" /> History
                              </button>
                            </td>
                          </tr>
                        ))}
                        {batchDetails?.students?.length === 0 && (
                          <tr>
                            <td colSpan="5" className="p-10 text-center text-gray-400 italic">
                              No students found in this batch.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              // C) STUDENT HISTORY DETAILS
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-h-[500px]">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleBackToBatch}
                      className="p-2 hover:bg-white rounded-full border border-transparent hover:border-gray-300 transition shadow-sm"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">
                        {selectedStudent?.name}
                      </h2>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500"/>
                        Total XP: {selectedStudent?.total_xp}
                      </p>
                    </div>
                  </div>
                  <div className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                    ACTIVITY LOG
                  </div>
                </div>

                {loadingHistory ? (
                  <div className="p-20 text-center text-gray-400">Loading history...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider border-b border-gray-200">
                        <tr>
                          <th className="py-4 px-6">Exercise</th>
                          <th className="py-4 px-6">Completed At</th>
                          <th className="py-4 px-6 text-center">Mistakes</th>
                          <th className="py-4 px-6 text-right">XP Gained</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {studentHistory.map((attempt, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-4 px-6 text-gray-800 font-medium">
                              {attempt.title || "Unknown Exercise"}
                              <div className="text-[10px] text-gray-400 uppercase tracking-wider">{attempt.type || 'quiz'}</div>
                            </td>
                            <td className="py-4 px-6 text-gray-500 text-sm">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                {new Date(attempt.completed_at).toLocaleString()}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              {attempt.mistakes > 0 ? (
                                <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded">
                                  <XCircle className="w-4 h-4" /> {attempt.mistakes}
                                </span>
                              ) : (
                                <span className="text-green-500 font-bold">Perfect</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right font-bold text-green-600">
                              +{attempt.xp_gained}
                            </td>
                          </tr>
                        ))}
                        {studentHistory.length === 0 && (
                          <tr>
                            <td colSpan="4" className="p-10 text-center text-gray-400 italic">
                              No activity recorded for this student yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* === 2. CREATE CONTENT TAB === */}
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

              {/* 3. ADD QUESTIONS */}
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
                                q.content.sentence ||
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

        {/* === 3. LOCKS TAB === */}
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
                    ).map((chap) => {
                      // Determine if unlocked
                      const isUnlocked = accessMap.has(`${batch.batch_id}-${chap.chapter_id}`);

                      return (
                        <div
                          key={chap.chapter_id}
                          className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded ${isUnlocked ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                              {isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
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
                              className={`p-2 border rounded transition ${isUnlocked ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-400 hover:text-green-600'}`}
                            >
                              <Lock className="w-4 h-4 rotate-180" />
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
                              className={`p-2 border rounded transition ${!isUnlocked ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-200 text-gray-400 hover:text-red-600'}`}
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
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