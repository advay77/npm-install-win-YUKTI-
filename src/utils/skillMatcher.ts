import { sampleResumes } from '@/data/sampleResumes';
import { sampleJobDescriptions } from '@/data/sampleJobDescriptions';

// Interface for skill matching results
export interface SkillMatchResult {
  resumeId: number;
  resumeName: string;
  jobId: number;
  jobTitle: string;
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  totalJobSkills: number;
  totalMatchedSkills: number;
}

// Interface for detailed match analysis
export interface MatchAnalysis {
  jobTitle: string;
  candidates: SkillMatchResult[];
  averageMatchPercentage: number;
  topCandidate: SkillMatchResult;
  skillDistribution: {
    [skillName: string]: {
      count: number;
      percentage: number;
    };
  };
}

/**
 * Extract skills from text using a predefined skill set
 * This is a simplified version - in production, you'd use NLP techniques
 */
export const extractSkillsFromText = (text: string, predefinedSkills: string[]): string[] => {
  const extractedSkills: string[] = [];
  const lowerText = text.toLowerCase();
  
  predefinedSkills.forEach(skill => {
    // Check for exact skill match or variations
    const skillVariations = [
      skill.toLowerCase(),
      skill.replace(/\s+/g, '').toLowerCase(),
      skill.replace(/[.-]/g, '').toLowerCase()
    ];
    
    if (skillVariations.some(variation => 
      lowerText.includes(variation) || 
      lowerText.includes(skill.toLowerCase())
    )) {
      extractedSkills.push(skill);
    }
  });
  
  return [...new Set(extractedSkills)]; // Remove duplicates
};

/**
 * Calculate skill match percentage using overlap logic
 */
export const calculateSkillMatch = (
  resumeSkills: string[], 
  jobSkills: string[]
): {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
} => {
  // Normalize skills (lowercase, trim)
  const normalizedResumeSkills = resumeSkills.map(skill => 
    skill.toLowerCase().trim()
  );
  const normalizedJobSkills = jobSkills.map(skill => 
    skill.toLowerCase().trim()
  );
  
  // Find matching skills (overlap)
  const matchedSkills = normalizedResumeSkills.filter(skill => 
    normalizedJobSkills.includes(skill)
  );
  
  // Find missing skills (in job but not in resume)
  const missingSkills = normalizedJobSkills.filter(skill => 
    !normalizedResumeSkills.includes(skill)
  );
  
  // Calculate match percentage
  const matchPercentage = normalizedJobSkills.length > 0 
    ? Math.round((matchedSkills.length / normalizedJobSkills.length) * 100)
    : 0;
  
  return {
    matchPercentage,
    matchedSkills: matchedSkills.map(skill => 
      jobSkills[normalizedJobSkills.indexOf(skill)]
    ),
    missingSkills: missingSkills.map(skill => 
      jobSkills[normalizedJobSkills.indexOf(skill)]
    )
  };
};

/**
 * Match all resumes against a specific job description
 */
export const matchResumesToJob = (jobId: number): SkillMatchResult[] => {
  const job = sampleJobDescriptions.find(j => j.id === jobId);
  if (!job) {
    throw new Error(`Job with ID ${jobId} not found`);
  }
  
  const results: SkillMatchResult[] = [];
  
  sampleResumes.forEach(resume => {
    const matchResult = calculateSkillMatch(resume.skills, job.skills);
    
    results.push({
      resumeId: resume.id,
      resumeName: resume.name,
      jobId: job.id,
      jobTitle: job.title,
      matchPercentage: matchResult.matchPercentage,
      matchedSkills: matchResult.matchedSkills,
      missingSkills: matchResult.missingSkills,
      totalJobSkills: job.skills.length,
      totalMatchedSkills: matchResult.matchedSkills.length
    });
  });
  
  // Sort by match percentage (highest first)
  return results.sort((a, b) => b.matchPercentage - a.matchPercentage);
};

/**
 * Get comprehensive match analysis for all jobs
 */
export const getAllJobMatches = (): MatchAnalysis[] => {
  const analyses: MatchAnalysis[] = [];
  
  sampleJobDescriptions.forEach(job => {
    const matches = matchResumesToJob(job.id);
    
    // Calculate average match percentage
    const averageMatchPercentage = Math.round(
      matches.reduce((sum, match) => sum + match.matchPercentage, 0) / matches.length
    );
    
    // Get top candidate
    const topCandidate = matches[0];
    
    // Calculate skill distribution across all candidates
    const skillDistribution: { [skillName: string]: { count: number; percentage: number } } = {};
    
    job.skills.forEach(skill => {
      const candidatesWithSkill = matches.filter(match => 
        match.matchedSkills.includes(skill)
      ).length;
      
      skillDistribution[skill] = {
        count: candidatesWithSkill,
        percentage: Math.round((candidatesWithSkill / matches.length) * 100)
      };
    });
    
    analyses.push({
      jobTitle: job.title,
      candidates: matches,
      averageMatchPercentage,
      topCandidate,
      skillDistribution
    });
  });
  
  return analyses;
};

/**
 * Get best overall candidate across all jobs
 */
export const getBestOverallCandidate = (): {
  candidate: SkillMatchResult;
  jobTitle: string;
} => {
  const allMatches: SkillMatchResult[] = [];
  
  sampleJobDescriptions.forEach(job => {
    const matches = matchResumesToJob(job.id);
    allMatches.push(...matches);
  });
  
  // Sort by match percentage and get the best one
  allMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);
  const bestMatch = allMatches[0];
  
  const job = sampleJobDescriptions.find(j => j.id === bestMatch.jobId);
  
  return {
    candidate: bestMatch,
    jobTitle: job?.title || 'Unknown'
  };
};

/**
 * Get skill gap analysis for a specific resume
 */
export const getSkillGapAnalysis = (resumeId: number): {
  resumeName: string;
  gaps: {
    jobTitle: string;
    missingSkills: string[];
    gapPercentage: number;
  }[];
} => {
  const resume = sampleResumes.find(r => r.id === resumeId);
  if (!resume) {
    throw new Error(`Resume with ID ${resumeId} not found`);
  }
  
  const gaps: {
    jobTitle: string;
    missingSkills: string[];
    gapPercentage: number;
  }[] = [];
  
  sampleJobDescriptions.forEach(job => {
    const matchResult = calculateSkillMatch(resume.skills, job.skills);
    
    gaps.push({
      jobTitle: job.title,
      missingSkills: matchResult.missingSkills,
      gapPercentage: 100 - matchResult.matchPercentage
    });
  });
  
  return {
    resumeName: resume.name,
    gaps: gaps.sort((a, b) => b.gapPercentage - a.gapPercentage)
  };
};
