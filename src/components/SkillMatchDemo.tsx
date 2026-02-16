"use client";
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Briefcase, 
  Target, 
  TrendingUp, 
  Award,
  BookOpen,
  CheckCircle2,
  XCircle,
  BarChart3,
  Users,
  Star,
  Zap,
  Shield,
  Brain,
  Eye
} from 'lucide-react';
import { sampleResumes, sampleJobDescriptions } from '@/data';
import { 
  SkillMatchResult, 
  MatchAnalysis, 
  matchResumesToJob, 
  getAllJobMatches, 
  getBestOverallCandidate, 
  getSkillGapAnalysis 
} from '@/utils/skillMatcher';
import { useTheme } from '@/context/ThemeProvider';

// Enhanced Badge component with dashboard colors
const Badge: React.FC<{ children: React.ReactNode; variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'danger'; className?: string }> = ({ 
  children, 
  variant = 'default', 
  className = '' 
}) => {
  const baseClasses = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200';
  const variantClasses = {
    default: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30',
    secondary: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800',
    outline: 'border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600',
    success: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/30',
    warning: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md shadow-red-500/30'
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

// Enhanced Tabs component with dashboard styling
const Tabs: React.FC<{ children: React.ReactNode; defaultValue: string; className?: string }> = ({ 
  children, 
  defaultValue, 
  className = '' 
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className={className}>
      {React.Children.map(children, child => 
        React.isValidElement(child) ? 
          React.cloneElement(child as any, { activeTab, setActiveTab }) : 
          child
      )}
    </div>
  );
};

const TabsList: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`flex space-x-1 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-1 rounded-xl shadow-inner ${className}`}>
    {children}
  </div>
);

const TabsTrigger: React.FC<{ 
  value: string; 
  children: React.ReactNode; 
  activeTab?: string; 
  setActiveTab?: (tab: string) => void;
  className?: string;
}> = ({ value, children, activeTab, setActiveTab, className = '' }) => (
  <button
    onClick={() => setActiveTab?.(value)}
    className={`px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-300 ${className} ${
      activeTab === value
        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 transform scale-105'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`}
  >
    {children}
  </button>
);

const TabsContent: React.FC<{ 
  value: string; 
  children: React.ReactNode; 
  activeTab?: string;
}> = ({ value, children, activeTab }) => {
  if (activeTab !== value) return null;
  return <div className="animate-in fade-in duration-300">{children}</div>;
};

const SkillMatchDemo: React.FC = () => {
  const { darkTheme } = useTheme();
  const [selectedJob, setSelectedJob] = useState<number>(1);
  const [selectedResume, setSelectedResume] = useState<number>(1);
  const [jobMatches, setJobMatches] = useState<SkillMatchResult[]>([]);
  const [allMatches, setAllMatches] = useState<MatchAnalysis[]>([]);
  const [bestCandidate, setBestCandidate] = useState<any>(null);
  const [skillGaps, setSkillGaps] = useState<any>(null);

  const handleJobMatch = () => {
    const matches = matchResumesToJob(selectedJob);
    setJobMatches(matches);
  };

  const handleAllMatches = () => {
    const matches = getAllJobMatches();
    setAllMatches(matches);
  };

  const handleBestCandidate = () => {
    const best = getBestOverallCandidate();
    setBestCandidate(best);
  };

  const handleSkillGaps = () => {
    const gaps = getSkillGapAnalysis(selectedResume);
    setSkillGaps(gaps);
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 70) return 'success';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-gradient-to-r from-emerald-500 to-green-600';
    if (percentage >= 50) return 'bg-gradient-to-r from-amber-500 to-orange-600';
    return 'bg-gradient-to-r from-red-500 to-rose-600';
  };

  return (
    <div className={`min-h-screen ${darkTheme ? "bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" : "bg-gradient-to-br from-blue-50 via-slate-50 to-white"} p-6`}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              <h1 className="text-5xl font-black font-sora tracking-tight">
                AI Skill Matching System
              </h1>
            </div>
          </div>
          <p className={`text-xl ${darkTheme ? "text-slate-400" : "text-slate-600"} max-w-3xl mx-auto leading-relaxed`}>
            Advanced AI-powered resume-to-job matching using intelligent overlap analysis. 
            Find the perfect candidates with real-time skill compatibility scoring.
          </p>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full animate-pulse"></div>
              <span className={`text-sm font-semibold ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>Smart Matching Algorithm</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse"></div>
              <span className={`text-sm font-semibold ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>Real-time Analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-pulse"></div>
              <span className={`text-sm font-semibold ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>Detailed Insights</span>
            </div>
          </div>
        </div>

        {/* Enhanced Controls */}
        <Card className={`${darkTheme ? "bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 shadow-2xl shadow-blue-500/10" : "bg-gradient-to-br from-white to-blue-50/30 border-blue-200/50 shadow-xl shadow-blue-500/10"} backdrop-blur-sm`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-3 text-2xl font-bold font-sora ${darkTheme ? "text-white" : "text-slate-900"}`}>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                <Target className="w-6 h-6 text-white" />
              </div>
              Matching Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className={`block text-sm font-bold font-inter uppercase tracking-wider ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Select Job Description
                </label>
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(Number(e.target.value))}
                  className={`w-full p-4 rounded-xl border-2 font-medium transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 ${
                    darkTheme 
                      ? "bg-slate-800/50 border-slate-600 text-white hover:border-blue-500 focus:border-blue-500" 
                      : "bg-white border-gray-300 text-gray-900 hover:border-blue-500 focus:border-blue-500"
                  }`}
                >
                  {sampleJobDescriptions.map((job: any) => (
                    <option key={job.id} value={job.id} className={darkTheme ? "bg-slate-800" : "bg-white"}>
                      {job.title} - {job.company}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label className={`block text-sm font-bold font-inter uppercase tracking-wider ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Select Resume
                </label>
                <select
                  value={selectedResume}
                  onChange={(e) => setSelectedResume(Number(e.target.value))}
                  className={`w-full p-4 rounded-xl border-2 font-medium transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 ${
                    darkTheme 
                      ? "bg-slate-800/50 border-slate-600 text-white hover:border-blue-500 focus:border-blue-500" 
                      : "bg-white border-gray-300 text-gray-900 hover:border-blue-500 focus:border-blue-500"
                  }`}
                >
                  {sampleResumes.map((resume: any) => (
                    <option key={resume.id} value={resume.id} className={darkTheme ? "bg-slate-800" : "bg-white"}>
                      {resume.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleJobMatch} 
                className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <Briefcase className="w-5 h-5" />
                Match Selected Job
              </Button>
              <Button 
                onClick={handleAllMatches} 
                variant="outline" 
                className={`flex items-center gap-3 font-bold px-8 py-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  darkTheme 
                    ? "border-blue-500 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300" 
                    : "border-blue-500 text-blue-600 hover:bg-blue-50"
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Analyze All Jobs
              </Button>
              <Button 
                onClick={handleBestCandidate} 
                variant="outline" 
                className={`flex items-center gap-3 font-bold px-8 py-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  darkTheme 
                    ? "border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300" 
                    : "border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                }`}
              >
                <Award className="w-5 h-5" />
                Find Best Candidate
              </Button>
              <Button 
                onClick={handleSkillGaps} 
                variant="outline" 
                className={`flex items-center gap-3 font-bold px-8 py-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  darkTheme 
                    ? "border-purple-500 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300" 
                    : "border-purple-500 text-purple-600 hover:bg-purple-50"
                }`}
              >
                <BookOpen className="w-5 h-5" />
                Skill Gap Analysis
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Results */}
        <Tabs defaultValue="job-match" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="job-match" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Job Matches
            </TabsTrigger>
            <TabsTrigger value="all-matches" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              All Analysis
            </TabsTrigger>
            <TabsTrigger value="best-candidate" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Top Candidate
            </TabsTrigger>
            <TabsTrigger value="skill-gaps" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Skill Gaps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="job-match">
            {jobMatches.length > 0 && (
              <Card className={`${darkTheme ? "bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 shadow-2xl shadow-blue-500/10" : "bg-gradient-to-br from-white to-blue-50/30 border-blue-200/50 shadow-xl shadow-blue-500/10"} backdrop-blur-sm`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-3 text-2xl font-bold font-sora ${darkTheme ? "text-white" : "text-slate-900"}`}>
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
                      <Briefcase className="w-6 h-6 text-white" />
                    </div>
                    Candidates for {sampleJobDescriptions.find((j: any) => j.id === selectedJob)?.title}
                    <div className="ml-auto">
                      <Badge variant="default" className="text-sm">
                        {jobMatches.length} Candidates Found
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {jobMatches.map((match, index) => (
                      <div key={match.resumeId} className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                        darkTheme 
                          ? "bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-blue-500/50" 
                          : "bg-gradient-to-br from-white to-blue-50/30 border-blue-200/50 hover:border-blue-300/50"
                      }`}>
                        {/* Ranking Badge */}
                        <div className="absolute top-4 left-4 z-10">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg ${
                            index === 0 ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' :
                            index === 1 ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' :
                            index === 2 ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' :
                            'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                          }`}>
                            {index + 1}
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div>
                                <h3 className={`text-xl font-bold font-sora ${darkTheme ? "text-white" : "text-slate-900"}`}>
                                  {match.resumeName}
                                </h3>
                                <p className={`text-sm ${darkTheme ? "text-slate-400" : "text-slate-600"}`}>
                                  {match.totalMatchedSkills}/{match.totalJobSkills} skills matched
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-4xl font-black font-sora ${
                                match.matchPercentage >= 70 ? 'text-emerald-500' :
                                match.matchPercentage >= 50 ? 'text-amber-500' :
                                'text-red-500'
                              }`}>
                                {match.matchPercentage}%
                              </div>
                              <Badge variant={getMatchColor(match.matchPercentage)} className="text-sm mt-2">
                                {match.matchPercentage >= 70 ? 'Strong Match' : 
                                 match.matchPercentage >= 50 ? 'Moderate Match' : 'Weak Match'}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Enhanced Progress Bar */}
                          <div className="mb-6">
                            <div className={`h-4 rounded-full overflow-hidden ${darkTheme ? "bg-slate-700" : "bg-gray-200"}`}>
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${getProgressColor(match.matchPercentage)}`}
                                style={{ width: `${match.matchPercentage}%` }}
                              >
                                <div className="h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className={`font-bold font-sora mb-3 flex items-center gap-2 text-emerald-600`}>
                                <CheckCircle2 className="w-5 h-5" />
                                Matched Skills
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {match.matchedSkills.map((skill: string) => (
                                  <Badge key={skill} variant="success" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className={`font-bold font-sora mb-3 flex items-center gap-2 text-red-600`}>
                                <XCircle className="w-5 h-5" />
                                Missing Skills
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {match.missingSkills.map((skill: string) => (
                                  <Badge key={skill} variant="danger" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all-matches">
            {allMatches.length > 0 && (
              <div className="space-y-6">
                {allMatches.map((analysis) => (
                  <Card key={analysis.jobTitle}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Briefcase className="w-5 h-5" />
                          {analysis.jobTitle}
                        </span>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">
                            Avg Match: {analysis.averageMatchPercentage}%
                          </span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Top Candidates</h4>
                          <div className="space-y-2">
                            {analysis.candidates.slice(0, 3).map((candidate, index) => (
                              <div key={candidate.resumeId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-gray-500">#{index + 1}</span>
                                  <span className="font-medium">{candidate.resumeName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Progress value={candidate.matchPercentage} className="w-20" />
                                  <span className="text-sm font-medium">{candidate.matchPercentage}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Skill Distribution</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {Object.entries(analysis.skillDistribution).map(([skill, data]: [string, any]) => (
                              <div key={skill} className="text-center p-2 bg-gray-50 rounded">
                                <div className="text-xs font-medium">{skill}</div>
                                <div className="text-sm text-gray-600">{data.percentage}%</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="best-candidate">
            {bestCandidate && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Best Overall Candidate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                      <Award className="w-10 h-10 text-yellow-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{bestCandidate.candidate.resumeName}</h2>
                      <p className="text-gray-600">{bestCandidate.jobTitle}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600">
                        {bestCandidate.candidate.matchPercentage}%
                      </div>
                      <p className="text-gray-600">Match Percentage</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div>
                        <h4 className="font-semibold text-green-700 mb-2">Matched Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {bestCandidate.candidate.matchedSkills.map((skill: string) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-700 mb-2">Missing Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {bestCandidate.candidate.missingSkills.map((skill: string) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="skill-gaps">
            {skillGaps && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Skill Gap Analysis - {skillGaps.resumeName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {skillGaps.gaps.map((gap: any, index: number) => (
                      <div key={gap.jobTitle} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold">{gap.jobTitle}</h3>
                          <Badge className={getMatchColor(100 - gap.gapPercentage)}>
                            {100 - gap.gapPercentage}% Match
                          </Badge>
                        </div>
                        <Progress 
                          value={100 - gap.gapPercentage} 
                          className="mb-3"
                        />
                        <div>
                          <h4 className="font-semibold text-red-700 mb-2">Skills to Develop</h4>
                          <div className="flex flex-wrap gap-1">
                            {gap.missingSkills.map((skill: string) => (
                              <Badge key={skill} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SkillMatchDemo;
