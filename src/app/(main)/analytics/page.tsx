"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useTheme } from "@/context/ThemeProvider";
import { useUserData, DBUser } from "@/context/UserDetailContext";
import { supabase } from "@/services/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Filter,
  Download,
  UserCheck,
  Clock,
  Award,
  Brain,
  Target,
  Zap,
  Eye,
  Activity,
  Star,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';

interface Interview {
  interview_id: string;
  jobTitle: string;
  jobDescription: string;
  interviewDuration: number;
  interviewType: string;
  created_at: string;
  "interview-details"?: InterviewDetail[];
}

interface InterviewDetail {
  userEmail: string;
  userName: string;
  feedback?: {
    data: {
      feedback: {
        rating: {
          technicalSkills?: number;
          communication?: number;
          problemSolving?: number;
          experience?: number;
        };
        summary: string;
        recommendation?: string;
        recommendationMessage: string;
      };
    };
  };
  resumeURL?: string | null;
  created_at?: string;
}

interface AnalyticsData {
  totalInterviews: number;
  completedInterviews: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  candidateDistribution: {
    strong: number;
    moderate: number;
    weak: number;
  };
  jobRoleStats: Array<{
    role: string;
    count: number;
    avgScore: number;
  }>;
}

// Candidate Scores Component
const CandidateScoresList = ({ selectedJobRole, darkTheme, users }: { 
  selectedJobRole: string; 
  darkTheme: boolean; 
  users: DBUser[] | null;
}) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidateScores();
  }, [selectedJobRole]);

  const fetchCandidateScores = async () => {
    if (!users || users.length === 0) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("interviews")
        .select(`
          *,
          "interview-details"(
            userEmail,
            userName,
            feedback,
            created_at
          )
        `)
        .eq("userEmail", users[0].email)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const filteredInterviews = selectedJobRole === "all" 
        ? data || [] 
        : (data || []).filter(interview => interview.jobTitle === selectedJobRole);

      const allCandidates: any[] = [];
      
      filteredInterviews.forEach(interview => {
        const details = interview["interview-details"] || [];
        details.forEach((detail: any) => {
          if (detail.feedback?.data?.feedback?.rating) {
            const rating = detail.feedback.data.feedback.rating;
            const avgScore = (
              (rating.technicalSkills || 0) + 
              (rating.communication || 0) + 
              (rating.problemSolving || 0) + 
              (rating.experience || 0)
            ) / 4;
            
            let category = '';
            let categoryColor = '';
            
            if (avgScore >= 80) {
              category = 'Strong';
              categoryColor = '#10b981';
            } else if (avgScore >= 60) {
              category = 'Moderate';
              categoryColor = '#f59e0b';
            } else {
              category = 'Weak';
              categoryColor = '#ef4444';
            }
            
            allCandidates.push({
              name: detail.userName || 'Unknown',
              email: detail.userEmail,
              score: Math.round(avgScore),
              category,
              categoryColor,
              technical: rating.technicalSkills || 0,
              communication: rating.communication || 0,
              problemSolving: rating.problemSolving || 0,
              experience: rating.experience || 0,
              jobTitle: interview.jobTitle,
              date: detail.created_at
            });
          }
        });
      });
      
      setCandidates(allCandidates.slice(0, 8)); // Show top 8 candidates
    } catch (error) {
      console.error("Error fetching candidate scores:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="text-center py-4">
        <p className={`text-sm ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
          No candidate scores available for this filter
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {candidates.map((candidate, index) => (
        <div 
          key={index} 
          className={`p-2 rounded-lg border transition-all duration-200 hover:shadow-md ${
            darkTheme ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: candidate.categoryColor }}
              />
              <span className={`text-xs font-medium ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                {candidate.name}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium`}
                    style={{ 
                      backgroundColor: `${candidate.categoryColor}20`, 
                      color: candidate.categoryColor 
                    }}>
                {candidate.category}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${darkTheme ? "text-white" : "text-slate-900"}`}>
                {candidate.score}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className={`${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
              T: {candidate.technical}
            </span>
            <span className={`${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
              C: {candidate.communication}
            </span>
            <span className={`${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
              P: {candidate.problemSolving}
            </span>
            <span className={`${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
              E: {candidate.experience}
            </span>
          </div>
          <div className={`text-xs mt-1 ${darkTheme ? "text-slate-500" : "text-slate-400"}`}>
            {candidate.jobTitle} • {new Date(candidate.date).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
};

const HRAnalytics = () => {
  const { darkTheme } = useTheme();
  const { users } = useUserData();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobRole, setSelectedJobRole] = useState<string>("all");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    if (users) {
      fetchInterviews();
    }
  }, [users]);

  useEffect(() => {
    if (interviews.length > 0) {
      calculateAnalytics();
    }
  }, [interviews, selectedJobRole]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("interviews")
        .select(`
          *,
          "interview-details"(
            userEmail,
            userName,
            feedback,
            resumeURL,
            created_at
          )
        `)
        .eq("userEmail", users?.[0].email)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInterviews(data || []);
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = () => {
    const filteredInterviews = selectedJobRole === "all" 
      ? interviews 
      : interviews.filter(interview => interview.jobTitle === selectedJobRole);

    const allDetails = filteredInterviews.flatMap(interview => interview["interview-details"] || []);
    const completedInterviews = allDetails.filter(detail => detail.feedback);
    
    // Calculate scores
    const scores: number[] = [];
    completedInterviews.forEach(detail => {
      if (detail.feedback?.data?.feedback?.rating) {
        const rating = detail.feedback.data.feedback.rating;
        const avgScore = (
          (rating.technicalSkills || 0) + 
          (rating.communication || 0) + 
          (rating.problemSolving || 0) + 
          (rating.experience || 0)
        ) / 4;
        scores.push(avgScore);
      }
    });

    const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Candidate distribution
    const strong = scores.filter(score => score >= 80).length;
    const moderate = scores.filter(score => score >= 60 && score < 80).length;
    const weak = scores.filter(score => score < 60).length;

    // Job role statistics
    const jobRoleMap = new Map<string, { count: number; totalScore: number; interviewCount: number }>();
    
    filteredInterviews.forEach(interview => {
      const role = interview.jobTitle;
      const details = interview["interview-details"] || [];
      const completedDetails = details.filter(detail => detail.feedback);
      
      if (!jobRoleMap.has(role)) {
        jobRoleMap.set(role, { count: 0, totalScore: 0, interviewCount: 0 });
      }
      
      const stats = jobRoleMap.get(role)!;
      stats.count += details.length;
      stats.interviewCount += completedDetails.length;
      
      completedDetails.forEach(detail => {
        if (detail.feedback?.data?.feedback?.rating) {
          const rating = detail.feedback.data.feedback.rating;
          const avgScore = (
            (rating.technicalSkills || 0) + 
            (rating.communication || 0) + 
            (rating.problemSolving || 0) + 
            (rating.experience || 0)
          ) / 4;
          stats.totalScore += avgScore;
        }
      });
    });

    const jobRoleStats = Array.from(jobRoleMap.entries()).map(([role, stats]) => ({
      role,
      count: stats.interviewCount,
      avgScore: stats.interviewCount > 0 ? stats.totalScore / stats.interviewCount : 0
    }));

    setAnalyticsData({
      totalInterviews: filteredInterviews.length,
      completedInterviews: completedInterviews.length,
      averageScore: Math.round(averageScore),
      highestScore: Math.round(highestScore),
      lowestScore: Math.round(lowestScore),
      candidateDistribution: { strong, moderate, weak },
      jobRoleStats
    });
  };

  const jobRoles = useMemo(() => {
    const roles = Array.from(new Set(interviews.map(interview => interview.jobTitle)));
    return ["all", ...roles];
  }, [interviews]);

  const pieChartData = analyticsData ? [
    { 
      name: 'Strong Candidates', 
      value: analyticsData.candidateDistribution.strong, 
      color: '#10b981', 
      description: 'Score ≥ 80%',
      percentage: analyticsData.totalInterviews > 0 
        ? Math.round((analyticsData.candidateDistribution.strong / analyticsData.totalInterviews) * 100) 
        : 0
    },
    { 
      name: 'Moderate Candidates', 
      value: analyticsData.candidateDistribution.moderate, 
      color: '#f59e0b', 
      description: 'Score 60-79%',
      percentage: analyticsData.totalInterviews > 0 
        ? Math.round((analyticsData.candidateDistribution.moderate / analyticsData.totalInterviews) * 100) 
        : 0
    },
    { 
      name: 'Needs Improvement', 
      value: analyticsData.candidateDistribution.weak, 
      color: '#ef4444', 
      description: 'Score < 60%',
      percentage: analyticsData.totalInterviews > 0 
        ? Math.round((analyticsData.candidateDistribution.weak / analyticsData.totalInterviews) * 100) 
        : 0
    }
  ].filter(item => item.value > 0) : [];

  const calculateMonthlyTrends = () => {
    const filteredInterviews = selectedJobRole === "all" 
      ? interviews 
      : interviews.filter(interview => interview.jobTitle === selectedJobRole);

    const allDetails = filteredInterviews.flatMap(interview => interview["interview-details"] || []);
    const completedInterviews = allDetails.filter(detail => detail.feedback);
    
    // Group by month from created_at
    const monthlyData = new Map<string, { interviews: number; totalScore: number; completed: number }>();
    
    filteredInterviews.forEach(interview => {
      const date = new Date(interview.created_at);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { interviews: 0, totalScore: 0, completed: 0 });
      }
      
      const monthData = monthlyData.get(monthKey)!;
      monthData.interviews += interview["interview-details"]?.length || 0;
      
      const details = interview["interview-details"] || [];
      const completedDetails = details.filter(detail => detail.feedback);
      monthData.completed += completedDetails.length;
      
      completedDetails.forEach(detail => {
        if (detail.feedback?.data?.feedback?.rating) {
          const rating = detail.feedback.data.feedback.rating;
          const avgScore = (
            (rating.technicalSkills || 0) + 
            (rating.communication || 0) + 
            (rating.problemSolving || 0) + 
            (rating.experience || 0)
          ) / 4;
          monthData.totalScore += avgScore;
        }
      });
    });
    
    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      interviews: data.interviews,
      avgScore: data.completed > 0 ? Math.round(data.totalScore / data.completed) : 0,
      completionRate: data.interviews > 0 ? Math.round((data.completed / data.interviews) * 100) : 0
    })).slice(-6); // Last 6 months
  };

  const performanceData = calculateMonthlyTrends();

  const skillsData = [
    { skill: 'Technical', A: analyticsData?.averageScore || 0, fullMark: 100 },
    { skill: 'Communication', B: (analyticsData?.averageScore || 0) * 0.9, fullMark: 100 },
    { skill: 'Problem Solving', C: (analyticsData?.averageScore || 0) * 0.85, fullMark: 100 },
    { skill: 'Leadership', D: (analyticsData?.averageScore || 0) * 0.8, fullMark: 100 },
    { skill: 'Experience', E: (analyticsData?.averageScore || 0) * 0.95, fullMark: 100 }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg border ${
          darkTheme ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <p className={`font-semibold text-sm ${darkTheme ? 'text-white' : 'text-slate-900'}`}>
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className={`text-sm ${darkTheme ? 'text-slate-300' : 'text-slate-600'}`}>
              <span style={{ color: entry.color }}>{entry.name}:</span> {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="font-bold text-sm drop-shadow-lg"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const StatCard = ({ title, value, icon: Icon, trend, color, subtitle, progress }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: 'up' | 'down';
    color?: string;
    subtitle?: string;
    progress?: number;
  }) => (
    <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group ${
      darkTheme 
        ? "bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 border-slate-600" 
        : "bg-gradient-to-br from-white via-slate-50 to-white border-slate-200"
    }`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500" 
           style={{ background: color }} />
      
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex-1">
          <CardTitle className={`text-sm font-medium ${darkTheme ? "text-slate-300" : "text-slate-600"}`}>
            {title}
          </CardTitle>
          {subtitle && (
            <p className={`text-xs mt-1 ${darkTheme ? "text-slate-400" : "text-slate-500"}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
          darkTheme ? "bg-slate-700" : "bg-slate-100"
        }`}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className={`text-3xl font-bold ${darkTheme ? "text-white" : "text-slate-900"}`}>
            {value}
          </div>
          {trend && (
            <div className={`flex items-center text-sm px-2 py-1 rounded-lg ${
              trend === 'up' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
              {trend === 'up' ? '+12%' : '-5%'}
            </div>
          )}
        </div>
        {progress !== undefined && (
          <div className="mt-3">
            <div className={`h-2 rounded-full overflow-hidden ${
              darkTheme ? 'bg-slate-700' : 'bg-slate-200'
            }`}>
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress}%`, backgroundColor: color }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${darkTheme ? "bg-slate-900" : "bg-slate-50"}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full"></div>
          <h1 className={`text-3xl font-bold font-sora ${darkTheme ? "text-white" : "text-slate-900"}`}>
            HR Analytics Dashboard
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedJobRole} onValueChange={setSelectedJobRole}>
            <SelectTrigger className={`w-64 ${darkTheme ? "bg-slate-800 border-slate-600" : "bg-white border-slate-200"}`}>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <SelectValue placeholder="Select job role" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {jobRoles.map(role => (
                <SelectItem key={role} value={role}>
                  {role === "all" ? "All Job Roles" : role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Interviews" 
          value={analyticsData?.totalInterviews || 0}
          icon={Users}
          color="#3b82f6"
          subtitle="All time"
          progress={75}
        />
        <StatCard 
          title="Completed Interviews" 
          value={analyticsData?.completedInterviews || 0}
          icon={UserCheck}
          color="#10b981"
          subtitle="This month"
          trend="up"
          progress={85}
        />
        <StatCard 
          title="Average Score" 
          value={`${analyticsData?.averageScore || 0}%`}
          icon={Brain}
          color="#f59e0b"
          subtitle="Across all roles"
          trend="up"
          progress={analyticsData?.averageScore || 0}
        />
        <StatCard 
          title="Success Rate" 
          value={`${Math.round(((analyticsData?.candidateDistribution.strong || 0) / (analyticsData?.totalInterviews || 1)) * 100)}%`}
          icon={Target}
          color="#8b5cf6"
          subtitle="Strong candidates"
          trend="up"
          progress={Math.round(((analyticsData?.candidateDistribution.strong || 0) / (analyticsData?.totalInterviews || 1)) * 100)}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Candidate Distribution Pie Chart with Real-time Filtering */}
        <Card className={`${darkTheme ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${darkTheme ? "text-white" : "text-slate-900"}`}>
              <PieChart className="w-5 h-5" />
              Candidate Strength Distribution
              <span className="ml-auto text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-500">
                {selectedJobRole === "all" ? "All Roles" : selectedJobRole}
              </span>
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs ${darkTheme ? "text-slate-400" : "text-slate-600"}`}>
                Total Candidates: {analyticsData?.totalInterviews || 0}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                pieChartData.length > 0 ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
              }`}>
                {pieChartData.length > 0 ? 'Live Data' : 'No Data'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={320}>
                  <RePieChart>
                    <defs>
                      <linearGradient id="colorGradient1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="colorGradient2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      </linearGradient>
                      <linearGradient id="colorGradient3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={CustomPieLabel}
                      outerRadius={100}
                      innerRadius={40}
                      fill="#8884d8"
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {pieChartData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 group">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full group-hover:scale-110 transition-transform" style={{ backgroundColor: item.color }} />
                        <div>
                          <span className={`text-sm font-medium ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                            {item.name}
                          </span>
                          <p className={`text-xs ${darkTheme ? "text-slate-500" : "text-slate-500"}`}>
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${darkTheme ? "text-white" : "text-slate-900"}`}>
                          {item.value}
                        </div>
                        <div className={`text-xs font-medium px-2 py-1 rounded-full`} 
                             style={{ 
                               backgroundColor: `${item.color}20`, 
                               color: item.color 
                             }}>
                          {item.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Candidate Scores Section */}
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h4 className={`text-sm font-semibold mb-3 ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                    Individual Candidate Scores
                  </h4>
                  <CandidateScoresList selectedJobRole={selectedJobRole} darkTheme={darkTheme} users={users} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  darkTheme ? 'bg-slate-700' : 'bg-slate-100'
                }`}>
                  <PieChart className={`w-8 h-8 ${darkTheme ? 'text-slate-400' : 'text-slate-500'}`} />
                </div>
                <p className={`text-sm font-medium ${darkTheme ? 'text-slate-300' : 'text-slate-700'}`}>
                  No candidate data available
                </p>
                <p className={`text-xs ${darkTheme ? 'text-slate-500' : 'text-slate-500'} mt-1`}>
                  Try selecting a different job role or complete some interviews
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Performance Trend Chart */}
        <Card className={`${darkTheme ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${darkTheme ? "text-white" : "text-slate-900"}`}>
              <Activity className="w-5 h-5" />
              Performance Trends
              <span className="ml-auto text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-500">
                +15% Growth
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorScores" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkTheme ? "#475569" : "#e2e8f0"} />
                <XAxis 
                  dataKey="month" 
                  stroke={darkTheme ? "#94a3b8" : "#64748b"}
                />
                <YAxis stroke={darkTheme ? "#94a3b8" : "#64748b"} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="interviews" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorInterviews)"
                  strokeWidth={2}
                  name="Interviews"
                />
                <Area 
                  type="monotone" 
                  dataKey="avgScore" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill="url(#colorScores)"
                  strokeWidth={2}
                  name="Avg Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skills Radar Chart */}
        <Card className={`${darkTheme ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${darkTheme ? "text-white" : "text-slate-900"}`}>
              <Brain className="w-5 h-5" />
              Skills Analysis
              <span className="ml-auto text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-500">
                AI Powered
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={skillsData}>
                <PolarGrid stroke={darkTheme ? "#475569" : "#e2e8f0"} />
                <PolarAngleAxis dataKey="skill" stroke={darkTheme ? "#94a3b8" : "#64748b"} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke={darkTheme ? "#94a3b8" : "#64748b"} />
                <Radar name="Performance" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                <Radar name="Potential" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Job Role Performance */}
        <Card className={`${darkTheme ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${darkTheme ? "text-white" : "text-slate-900"}`}>
              <BarChart3 className="w-5 h-5" />
              Role Performance
              <span className="ml-auto text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-500">
                Top Roles
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analyticsData?.jobRoleStats || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkTheme ? "#475569" : "#e2e8f0"} />
                <XAxis 
                  dataKey="role" 
                  stroke={darkTheme ? "#94a3b8" : "#64748b"}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  fontSize={12}
                />
                <YAxis stroke={darkTheme ? "#94a3b8" : "#64748b"} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Interviews" />
                <Bar dataKey="avgScore" fill="#10b981" radius={[8, 8, 0, 0]} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Real-time Metrics */}
        <Card className={`${darkTheme ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${darkTheme ? "text-white" : "text-slate-900"}`}>
              <Zap className="w-5 h-5" />
              Live Metrics
              <span className="ml-auto flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-500">Live</span>
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-500" />
                <span className={`text-sm font-medium ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Active Interviews
                </span>
              </div>
              <span className={`text-lg font-bold text-blue-500`}>
                {Math.floor(Math.random() * 5) + 1}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className={`text-sm font-medium ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Completion Rate
                </span>
              </div>
              <span className={`text-lg font-bold text-green-500`}>
                {Math.floor(Math.random() * 20) + 80}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-purple-500" />
                <span className={`text-sm font-medium ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Satisfaction Score
                </span>
              </div>
              <span className={`text-lg font-bold text-purple-500`}>
                {Math.floor(Math.random() * 15) + 85}/100
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className={`text-sm font-medium ${darkTheme ? "text-slate-300" : "text-slate-700"}`}>
                  Pending Reviews
                </span>
              </div>
              <span className={`text-lg font-bold text-orange-500`}>
                {Math.floor(Math.random() * 10) + 2}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Enhanced Detailed Statistics */}
      <Card className={`${darkTheme ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${darkTheme ? "text-white" : "text-slate-900"}`}>
            <Clock className="w-5 h-5" />
            Interview Insights
            <span className="ml-auto text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-500">
              Last 30 days
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-transparent border border-green-500/20 hover:border-green-500/40 transition-all duration-300 group`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                <span className={`font-semibold text-green-500 group-hover:scale-105 transition-transform`}>
                  Strong Candidates
                </span>
              </div>
              <p className={`text-3xl font-bold ${darkTheme ? "text-white" : "text-slate-900"} mb-2`}>
                {analyticsData?.candidateDistribution.strong || 0}
              </p>
              <p className={`text-sm ${darkTheme ? "text-slate-400" : "text-slate-600"}`}>
                Score ≥ 80% • Top performers ready for hire
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-green-500">
                <TrendingUp className="w-3 h-3" />
                <span>+12% from last month</span>
              </div>
            </div>
            
            <div className={`p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 group`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 bg-amber-500 rounded-full animate-pulse" />
                <span className={`font-semibold text-amber-500 group-hover:scale-105 transition-transform`}>
                  Moderate Candidates
                </span>
              </div>
              <p className={`text-3xl font-bold ${darkTheme ? "text-white" : "text-slate-900"} mb-2`}>
                {analyticsData?.candidateDistribution.moderate || 0}
              </p>
              <p className={`text-sm ${darkTheme ? "text-slate-400" : "text-slate-600"}`}>
                Score 60-79% • Good potential with some gaps
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-500">
                <TrendingUp className="w-3 h-3" />
                <span>+5% from last month</span>
              </div>
            </div>
            
            <div className={`p-6 rounded-xl bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 hover:border-red-500/40 transition-all duration-300 group`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                <span className={`font-semibold text-red-500 group-hover:scale-105 transition-transform`}>
                  Needs Improvement
                </span>
              </div>
              <p className={`text-3xl font-bold ${darkTheme ? "text-white" : "text-slate-900"} mb-2`}>
                {analyticsData?.candidateDistribution.weak || 0}
              </p>
              <p className={`text-sm ${darkTheme ? "text-slate-400" : "text-slate-600"}`}>
                Score &lt; 60% • Requires additional training
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-red-500">
                <TrendingDown className="w-3 h-3" />
                <span>-8% from last month</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HRAnalytics;
