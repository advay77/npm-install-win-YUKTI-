"use client";
import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { LuPlay, LuPause, LuHistory, LuCode } from "react-icons/lu";
import { Button } from "@/components/ui/button";

interface Snapshot {
    timestamp: number;
    code: string;
}

interface CodeHistoryViewerProps {
    history: Snapshot[];
    darkTheme: boolean;
}

const CodeHistoryViewer: React.FC<CodeHistoryViewerProps> = ({ history, darkTheme }) => {
    const [index, setIndex] = useState(history.length - 1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(500);

    const startPlayback = () => {
        if (index >= history.length - 1) setIndex(0);
        setIsPlaying(true);
        const interval = setInterval(() => {
            setIndex(prev => {
                if (prev >= history.length - 1) {
                    clearInterval(interval);
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, playbackSpeed);
    };

    if (!history || history.length === 0) {
        return (
            <div className={`p-10 rounded-3xl border border-dashed flex flex-col items-center justify-center gap-4 ${darkTheme ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                <LuHistory size={40} className="opacity-20" />
                <p className="text-sm italic">No keystroke history recorded for this session.</p>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-4 h-[500px] border rounded-[2rem] overflow-hidden ${darkTheme ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            {/* Controls */}
            <div className={`px-6 py-4 border-b flex items-center justify-between ${darkTheme ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl h-9"
                        onClick={() => isPlaying ? setIsPlaying(false) : startPlayback()}
                    >
                        {isPlaying ? <LuPause className="mr-2" /> : <LuPlay className="mr-2" />}
                        {isPlaying ? "Pause" : "Replay Journey"}
                    </Button>

                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Progress</span>
                        <input
                            type="range"
                            min="0"
                            max={history.length - 1}
                            value={index}
                            onChange={(e) => setIndex(parseInt(e.target.value))}
                            className="w-48 h-1.5 bg-blue-500/20 rounded-full appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className={`text-[11px] font-bold ${darkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                            Snapshot {index + 1} of {history.length}
                        </p>
                        <p className="text-[9px] text-slate-500 font-mono">
                            {new Date(history[index].timestamp).toLocaleTimeString()}
                        </p>
                    </div>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkTheme ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                        <LuCode size={16} />
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-0 bg-[#1e1e1e]">
                <Editor
                    height="100%"
                    defaultValue={history[index].code}
                    value={history[index].code}
                    theme="vs-dark"
                    language="javascript" // or detect from content
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        fontSize: 12,
                        lineNumbers: "on",
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        padding: { top: 12, bottom: 12 }
                    }}
                />
            </div>

            <div className={`px-6 py-3 border-t text-[10px] font-medium text-slate-500 flex justify-between ${darkTheme ? 'border-slate-800' : 'border-slate-200'}`}>
                <span>AI Forensic Log Active</span>
                <span className="italic">Keystrokes captured every 15s</span>
            </div>
        </div>
    );
};

export default CodeHistoryViewer;
