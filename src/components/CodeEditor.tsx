"use client";
import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import {
    LuCode,
    LuPlay,
    LuMessageSquarePlus,
    LuCopy,
    LuTerminal,
    LuShieldCheck
} from "react-icons/lu";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface CodeEditorProps {
    code: string;
    onChange: (value: string | undefined) => void;
    language: string;
    onLanguageChange: (lang: string) => void;
    onAskAI: () => void;
    onRun: () => void;
    output?: string;
    problem?: {
        title: string;
        description: string;
        examples?: { input: string; output: string; explanation?: string }[];
    } | null;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
    code,
    onChange,
    language,
    onLanguageChange,
    onAskAI,
    onRun,
    output,
    problem,
}) => {
    const [isCopying, setIsCopying] = useState(false);
    const [showOutput, setShowOutput] = useState(false);
    const [isProblemVisible, setIsProblemVisible] = useState(true);

    // Auto-open problem sidebar when a problem is received
    useEffect(() => {
        if (problem) {
            setIsProblemVisible(true);
        }
    }, [problem]);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setIsCopying(true);
        toast.success("Code copied to clipboard");
        setTimeout(() => setIsCopying(false), 2000);
    };

    return (
        <div className="flex flex-col h-full w-full rounded-2xl border border-white/10 bg-[#1e1e1e] shadow-2xl overflow-hidden ring-1 ring-white/5 font-inter">
            {/* Editor Header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsProblemVisible(!isProblemVisible)}
                        className={`h-8 px-2 text-[10px] font-bold uppercase tracking-wider transition-all gap-2 ${isProblemVisible ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-white'}`}
                    >
                        <LuCode className="w-4 h-4" />
                        {isProblemVisible ? "Review Problem" : "Show Challenge"}
                    </Button>

                    <Select value={language} onValueChange={onLanguageChange}>
                        <SelectTrigger className="h-8 w-32 bg-[#2d2d2d] border-white/5 text-[11px] font-medium text-slate-300 focus:ring-0 focus:ring-offset-0">
                            <SelectValue placeholder="Select Language" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2d2d2d] border-white/10 text-slate-200">
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="typescript">TypeScript</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="cpp">C++</SelectItem>
                            <SelectItem value="java">Java</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled
                        className="h-8 px-2 text-slate-500 cursor-not-allowed gap-1.5 opacity-50"
                    >
                        <LuShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-medium">Copy Locked</span>
                    </Button>

                    <div className="w-[1px] h-4 bg-white/10 mx-1" />

                    <Button
                        size="sm"
                        onClick={onAskAI}
                        className="h-8 px-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white border-0 shadow-lg shadow-blue-900/20 gap-1.5 font-bold"
                    >
                        <LuMessageSquarePlus className="w-3.5 h-3.5" />
                        <span className="text-[10px]">Discuss AI</span>
                    </Button>

                    <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 gap-1.5 font-bold"
                        onClick={() => {
                            setShowOutput(true);
                            onRun();
                        }}
                    >
                        <LuPlay className="w-3.5 h-3.5 fill-current" />
                        <span className="text-[10px]">Run Code</span>
                    </Button>
                </div>
            </div>

            {/* Actual Editor and Output Area */}
            <div className="flex-1 flex min-h-0 bg-[#1e1e1e]">
                {/* Problem Sidebar */}
                {isProblemVisible && (
                    <div className="w-[360px] border-r border-white/10 bg-[#252526]/40 flex flex-col overflow-hidden animate-in slide-in-from-left duration-300">
                        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
                            {problem ? (
                                <div className="space-y-6">
                                    <h2 className="text-lg font-bold text-white tracking-tight leading-tight">{problem.title}</h2>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="h-[2px] w-4 bg-blue-500/50" />
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Problem Description</p>
                                        </div>
                                        <div className="text-sm text-slate-300 leading-relaxed font-inter whitespace-pre-wrap">
                                            {problem.description}
                                        </div>
                                    </div>

                                    {problem.examples && problem.examples.length > 0 && (
                                        <div className="space-y-4 pt-4 border-t border-white/5">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Sample Cases</p>
                                            {problem.examples.map((ex, i) => (
                                                <div key={i} className="bg-black/30 rounded-xl p-4 space-y-3 border border-white/5 hover:border-white/10 transition-colors group">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest opacity-70">Input</span>
                                                        <code className="text-xs text-slate-200 font-mono bg-white/5 p-2 rounded-lg block font-medium">{ex.input}</code>
                                                    </div>
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest opacity-70">Output</span>
                                                        <code className="text-xs text-slate-200 font-mono bg-white/5 p-2 rounded-lg block font-medium">{ex.output}</code>
                                                    </div>
                                                    {ex.explanation && (
                                                        <div className="mt-1 text-[11px] text-slate-500 leading-relaxed italic">
                                                            {ex.explanation}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4 opacity-40 text-center">
                                    <div className="p-4 rounded-full bg-slate-800 animate-pulse">
                                        <LuTerminal className="w-8 h-8" />
                                    </div>
                                    <p className="text-[11px] font-medium italic">Your interviewer is preparing the <br /> technical challenge...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex-1 flex flex-col min-h-0 min-w-0">
                    <div className="flex-1 min-h-0">
                        <Editor
                            height="100%"
                            language={language}
                            value={code}
                            theme="vs-dark"
                            onChange={onChange}
                            onMount={(editor) => {
                                // Prevent pasting into the editor
                                const domNode = editor.getDomNode();
                                if (domNode) {
                                    domNode.addEventListener('paste', (e: any) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toast.error("Integrity Mode: Paste is disabled for this session.");
                                    }, true);

                                    // Also block standard keyboard shortcuts just in case
                                    domNode.addEventListener('keydown', (e: any) => {
                                        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                                            e.preventDefault();
                                            toast.error("Security Alert: Use your own logic, pasting is restricted.");
                                        }
                                    });
                                }
                            }}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                                lineNumbers: "on",
                                roundedSelection: true,
                                scrollBeyondLastLine: false,
                                readOnly: false,
                                automaticLayout: true,
                                padding: { top: 16, bottom: 16 },
                                cursorSmoothCaretAnimation: "on",
                                smoothScrolling: true,
                                contextmenu: false, // Disabling right-click menu
                                bracketPairColorization: { enabled: true },
                            }}
                        />
                    </div>

                    {showOutput && (
                        <div className="h-1/3 border-t border-white/10 bg-[#0d0d0d] flex flex-col animate-in slide-in-from-bottom duration-300">
                            <div className="flex items-center justify-between px-4 py-1.5 bg-white/5 border-b border-white/5 shrink-0">
                                <div className="flex items-center gap-2">
                                    <LuTerminal className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execution Terminal</span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 text-[9px] text-slate-500 hover:text-white"
                                    onClick={() => setShowOutput(false)}
                                >
                                    Hide Output
                                </Button>
                            </div>
                            <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap selection:bg-emerald-500/30 custom-scrollbar">
                                {output || "Process exited successfully (No output captured)."}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Footer */}
            <div className="px-4 py-1.5 bg-[#252526] border-t border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4 text-[10px] text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/70 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse" />
                        <span>Live Session Active</span>
                    </div>
                    <div className="w-[1px] h-3 bg-white/5" />
                    <div className="flex items-center gap-1.5 opacity-80 uppercase tracking-tighter">
                        <span>Compiler: {language}</span>
                    </div>
                    <div className="w-[1px] h-3 bg-white/5" />
                    <div className="flex items-center gap-1.5 text-blue-400 font-bold opacity-90">
                        <LuShieldCheck className="w-3.5 h-3.5" />
                        <span>INTEGRITY MODE ACTIVE</span>
                    </div>
                </div>
                <div className="text-[9px] text-slate-600 font-mono tracking-widest opacity-60">
                    INTERVIEWX IDE 1.2.0-STABLE
                </div>
            </div>
        </div>
    );
};

export default CodeEditor;
