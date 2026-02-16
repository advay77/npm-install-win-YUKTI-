import { toast } from 'sonner';

// Dynamically import jsPDF to avoid build-time issues
export const generatePDFReport = async (feedbackData: any, interviewInfo: any) => {
  if (!feedbackData) {
    toast.error("No feedback data available for PDF generation");
    return;
  }

  try {
    // Dynamic import to avoid SSR issues
    const { default: jsPDF } = await import('jspdf');
    
    const jsPDFOptions = {
      orientation: 'portrait' as const,
      unit: 'mm' as const,
      format: 'a4' as const,
      compress: true
    };
    
    const pdf = new jsPDF(jsPDFOptions);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Colors - matching the dark theme from the image
    const primaryColor = [59, 130, 246]; // blue-500
    const secondaryColor = [107, 114, 128]; // gray-500
    const accentColor = [16, 185, 129]; // emerald-500
    const headerBgColor = [17, 24, 39]; // gray-900
    const rejectColor = [239, 68, 68]; // red-500
    const passColor = [34, 197, 94]; // green-500
    
    // Helper function for colored text
    const addColoredText = (text: string, x: number, y: number, color: number[], fontSize: number = 12, isBold: boolean = false) => {
      pdf.setTextColor(color[0], color[1], color[2]);
      pdf.setFontSize(fontSize);
      if (isBold) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      pdf.text(text, x, y);
    };
    
    // Professional Header Section
    pdf.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
    pdf.rect(0, 0, pageWidth, 60, 'F');
    
    // Candidate info in header
    addColoredText(interviewInfo?.userName?.toUpperCase() || 'CANDIDATE NAME', 20, 25, [255, 255, 255], 20, true);
    addColoredText(interviewInfo?.userEmail || 'N/A', 20, 40, [156, 163, 175], 12);
    
    // Recommendation Badge
    const recommendation = feedbackData?.feedback?.recommendation || 'No';
    let badgeText = recommendation === 'Yes' ? 'RECOMMENDED' : recommendation === 'Maybe' ? 'REVIEW' : 'REJECTED';
    let badgeColor = recommendation === 'Yes' ? passColor : recommendation === 'Maybe' ? [255, 165, 0] : rejectColor;
    
    // Badge background
    pdf.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
    pdf.roundedRect(pageWidth - 85, 20, 65, 25, 3, 3, 'F');
    addColoredText(badgeText, pageWidth - 75, 37, [255, 255, 255], 12, true);
    
    // Interview title below header
    addColoredText(interviewInfo?.jobPosition || interviewInfo?.jobTitle || 'Interview Assessment', 20, 75, primaryColor, 18, true);
    
    // Candidate Information Section
    let yPosition = 95;
    addColoredText('CANDIDATE INFORMATION', 20, yPosition, primaryColor, 14, true);
    yPosition += 8;
    
    // Draw line under section header
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setLineWidth(0.5);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;
    
    addColoredText(`Position: ${interviewInfo?.jobPosition || interviewInfo?.jobTitle || 'N/A'}`, 20, yPosition, secondaryColor, 11);
    yPosition += 7;
    addColoredText(`Interview Type: ${interviewInfo?.interviewType || 'N/A'}`, 20, yPosition, secondaryColor, 11);
    yPosition += 7;
    addColoredText(`Duration: ${interviewInfo?.duration || 'N/A'} minutes`, 20, yPosition, secondaryColor, 11);
    yPosition += 7;
    addColoredText(`Assessment Date: ${new Date().toLocaleDateString()}`, 20, yPosition, secondaryColor, 11);
    yPosition += 15;
    
    // Technical Score Section
    addColoredText('TECHNICAL SCORE', 20, yPosition, primaryColor, 14, true);
    yPosition += 8;
    
    // Draw line under section header
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;
    
    // Get ratings data
    const ratings = feedbackData?.feedback?.rating;
    
    // Comprehensive Assessment Section - All Points Together
    addColoredText('COMPREHENSIVE ASSESSMENT', 20, yPosition, primaryColor, 14, true);
    yPosition += 8;
    
    // Draw line under section header
    pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;
    
    if (ratings) {
      // Overall Score
      const values = Object.values(ratings);
      const sum = values.reduce((acc: number, v: any) => acc + (v ?? 0), 0);
      const avgScore = values.length > 0 ? sum / values.length : 0;
      const scoreColor = avgScore >= 7 ? passColor : avgScore >= 5 ? [255, 165, 0] : rejectColor;
      
      addColoredText(`● Overall Score: ${avgScore.toFixed(1)}/10`, 20, yPosition, scoreColor, 12, true);
      yPosition += 8;
      
      // Individual Category Scores
      addColoredText('● Category Breakdown:', 20, yPosition, secondaryColor, 12, true);
      yPosition += 6;
      
      const categories = [
        { name: 'Technical Skills', score: ratings.technicalSkills },
        { name: 'Communication', score: ratings.communication },
        { name: 'Problem Solving', score: ratings.problemSolving },
        { name: 'Experience', score: ratings.experience }
      ];
      
      categories.forEach((category) => {
        if (category.score !== undefined && category.score !== null) {
          const categoryColor = category.score >= 7 ? passColor : category.score >= 5 ? [255, 165, 0] : rejectColor;
          addColoredText(`  - ${category.name}: ${category.score.toFixed(1)}/10`, 25, yPosition, categoryColor, 11);
          yPosition += 6;
        }
      });
      
      yPosition += 5;
    }
    
    // Recommendation Points
    addColoredText('● Recommendation:', 20, yPosition, secondaryColor, 12, true);
    yPosition += 6;
    addColoredText(`  Decision: ${recommendation.toUpperCase()}`, 25, yPosition, badgeColor, 11, true);
    yPosition += 6;
    
    const recommendationMessage = feedbackData?.feedback?.recommendationMessage || 'No recommendation message available.';
    const messageLines = pdf.splitTextToSize(recommendationMessage, pageWidth - 65);
    messageLines.forEach((line: string) => {
      addColoredText(`  ${line}`, 25, yPosition, secondaryColor, 10);
      yPosition += 5;
    });
    
    yPosition += 8;
    
    // Key Strengths Points
    const strengths = feedbackData?.feedback?.strengths || [];
    if (strengths.length > 0) {
      addColoredText('● Key Strengths:', 20, yPosition, secondaryColor, 12, true);
      yPosition += 6;
      
      strengths.forEach((strength: string) => {
        const strengthLines = pdf.splitTextToSize(strength, pageWidth - 65);
        strengthLines.forEach((line: string, index: number) => {
          const prefix = index === 0 ? '  -' : '   ';
          addColoredText(`${prefix} ${line}`, 25, yPosition, passColor, 10);
          yPosition += 5;
        });
      });
      yPosition += 5;
    }
    
    // Areas for Improvement Points
    const improvements = feedbackData?.feedback?.improvements || [];
    if (improvements.length > 0) {
      addColoredText('● Areas for Improvement:', 20, yPosition, secondaryColor, 12, true);
      yPosition += 6;
      
      improvements.forEach((improvement: string) => {
        const improvementLines = pdf.splitTextToSize(improvement, pageWidth - 65);
        improvementLines.forEach((line: string, index: number) => {
          const prefix = index === 0 ? '  -' : '   ';
          addColoredText(`${prefix} ${line}`, 25, yPosition, [255, 165, 0], 10);
          yPosition += 5;
        });
      });
      yPosition += 5;
    }
    
    // Actionable Recommendations Points
    const recommendationsList: string[] = [];
    
    if (ratings?.technicalSkills && ratings.technicalSkills < 7) {
      recommendationsList.push(
        `Technical: ${ratings.technicalSkills < 4 ? 'Enroll in comprehensive technical training programs' : 'Focus on advanced technical concepts and open-source contributions'}`
      );
    }
    
    if (ratings?.communication && ratings.communication < 7) {
      recommendationsList.push(
        `Communication: ${ratings.communication < 4 ? 'Join public speaking workshops' : 'Participate in team meetings and technical discussions'}`
      );
    }
    
    if (ratings?.problemSolving && ratings.problemSolving < 7) {
      recommendationsList.push(
        `Problem Solving: ${ratings.problemSolving < 4 ? 'Practice algorithmic problems daily' : 'Work on complex real-world projects'}`
      );
    }
    
    if (ratings?.experience && ratings.experience < 7) {
      recommendationsList.push(
        `Experience: ${ratings.experience < 4 ? 'Seek internships or freelance projects' : 'Take on leadership roles in projects'}`
      );
    }
    
    if (recommendationsList.length > 0) {
      addColoredText('● Actionable Recommendations:', 20, yPosition, secondaryColor, 12, true);
      yPosition += 6;
      
      recommendationsList.forEach((rec: string) => {
        const recLines = pdf.splitTextToSize(rec, pageWidth - 65);
        recLines.forEach((line: string, index: number) => {
          const prefix = index === 0 ? '  →' : '   ';
          addColoredText(`${prefix} ${line}`, 25, yPosition, primaryColor, 10);
          yPosition += 5;
        });
      });
      yPosition += 5;
    }
    
    // Next Steps Points
    const avgScore = ratings ? Object.values(ratings).reduce((acc: number, v: any) => acc + (v ?? 0), 0) / Object.values(ratings).length : 0;
    
    addColoredText('● Recommended Next Steps:', 20, yPosition, secondaryColor, 12, true);
    yPosition += 6;
    
    const nextSteps = [
      'Review detailed feedback and identify top 3 priority areas',
      'Create a 30-60-90 day development plan',
      avgScore >= 7 
        ? 'Prepare for senior/advanced role interviews'
        : avgScore >= 5
        ? 'Build intermediate skills and gain practical experience'
        : 'Focus on foundational skills before reapplying'
    ];
    
    nextSteps.forEach((step, index) => {
      addColoredText(`  ${index + 1}. ${step}`, 25, yPosition, accentColor, 10);
      yPosition += 5;
    });
    
    yPosition += 10;
    
    // Footer
    const footerY = pageHeight - 20;
    addColoredText(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, footerY, secondaryColor, 9);
    addColoredText('InterviewX - AI Interview Platform', pageWidth - 80, footerY, secondaryColor, 9);
    
    // Save the PDF
    const fileName = `interview-feedback-${interviewInfo?.userName?.replace(/\s+/g, '-').toLowerCase() || 'candidate'}-${Date.now()}.pdf`;
    pdf.save(fileName);
    
    toast.success("PDF report downloaded successfully!");
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error("Failed to generate PDF report. Please try again.");
  }
};
