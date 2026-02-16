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
    
    // Colors
    const primaryColor = [59, 130, 246]; // blue-500
    const secondaryColor = [107, 114, 128]; // gray-500
    const accentColor = [16, 185, 129]; // emerald-500
    
    // Helper function to check if we need a new page
    const checkAndAddPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20; // Reset y position for new page
        
        // Add header to new page
        pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        pdf.rect(0, 0, pageWidth, 30, 'F');
        addColoredText('Interview Feedback Report (Continued)', 20, 20, [255, 255, 255], 16, true);
        yPosition = 50;
      }
    };

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
    
    // Header Section
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    addColoredText('Interview Feedback Report', 20, 25, [255, 255, 255], 20, true);
    
    // Candidate Information
    let yPosition = 60;
    addColoredText('Candidate Information', 20, yPosition, primaryColor, 16, true);
    yPosition += 10;
    
    addColoredText(`Name: ${interviewInfo?.userName || 'N/A'}`, 20, yPosition, secondaryColor, 12);
    yPosition += 8;
    addColoredText(`Email: ${interviewInfo?.userEmail || 'N/A'}`, 20, yPosition, secondaryColor, 12);
    yPosition += 8;
    addColoredText(`Position: ${interviewInfo?.jobPosition || interviewInfo?.jobTitle || 'N/A'}`, 20, yPosition, secondaryColor, 12);
    yPosition += 8;
    addColoredText(`Interview Type: ${interviewInfo?.interviewType || 'N/A'}`, 20, yPosition, secondaryColor, 12);
    yPosition += 8;
    addColoredText(`Duration: ${interviewInfo?.duration || 'N/A'} minutes`, 20, yPosition, secondaryColor, 12);
    yPosition += 15;
    
    // Overall Score
    const ratings = feedbackData?.data?.feedback?.rating;
    if (ratings) {
      const values = Object.values(ratings);
      const sum = values.reduce((acc: number, v: any) => acc + (v ?? 0), 0);
      const overallScore = (sum / 20) * 100;
      
      addColoredText('Overall Performance Score', 20, yPosition, primaryColor, 16, true);
      yPosition += 10;
      
      // Score circle visualization
      const scoreText = `${overallScore.toFixed(1)}%`;
      addColoredText(scoreText, 20, yPosition, 
        overallScore >= 70 ? accentColor : overallScore >= 50 ? [255, 165, 0] : [239, 68, 68], 24, true);
      yPosition += 15;
    }
    
    // Category-wise Scores
    if (ratings) {
      addColoredText('Category-wise Performance', 20, yPosition, primaryColor, 16, true);
      yPosition += 10;
      
      const categories = [
        { name: 'Relevance', score: ratings.relevance },
        { name: 'Technical Depth', score: ratings.technicalDepth },
        { name: 'Clarity', score: ratings.clarity },
        { name: 'Communication Quality', score: ratings.communicationQuality }
      ];
      
      categories.forEach((category) => {
        if (category.score !== undefined && category.score !== null) {
          addColoredText(`${category.name}:`, 20, yPosition, secondaryColor, 12);
          
          // Progress bar
          const barWidth = 60;
          const barHeight = 6;
          const barX = 120;
          const barY = yPosition - 3;
          
          // Background bar
          pdf.setFillColor(230, 230, 230);
          pdf.rect(barX, barY, barWidth, barHeight, 'F');
          
          // Score bar
          const scoreWidth = (category.score / 5) * barWidth;
          const fillColor = category.score >= 4 ? [0, 150, 0] : category.score >= 3 ? [255, 165, 0] : [255, 0, 0];
          pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
          pdf.rect(barX, barY, scoreWidth, barHeight, 'F');
          
          // Score text
          addColoredText(`${category.score.toFixed(1)}/5`, barX + barWidth + 5, yPosition, secondaryColor, 10);
          
          yPosition += 12;
        }
      });
    }
    
    // Recommendation Section
    checkAndAddPage(80);
    yPosition += 10;
    addColoredText('Recommendation', 20, yPosition, primaryColor, 18, true);
    yPosition += 15;
    
    const recommendation = feedbackData?.data?.feedback?.recommendation || 'No';
    const recommendationColor = recommendation === 'Yes' ? accentColor : recommendation === 'Maybe' ? [255, 165, 0] : [239, 68, 68];
    
    addColoredText(`Decision: ${recommendation.toUpperCase()}`, 20, yPosition, recommendationColor, 14, true);
    yPosition += 10;
    
    const recommendationMessage = feedbackData?.data?.feedback?.recommendationMessage || 'No recommendation message available.';
    const messageLines = pdf.splitTextToSize(recommendationMessage, pageWidth - 40);
    messageLines.forEach((line: string) => {
      addColoredText(line, 20, yPosition, secondaryColor, 11);
      yPosition += 6;
    });
    
    // Strengths Section
    checkAndAddPage(60);
    yPosition += 10;
    addColoredText('Key Strengths', 20, yPosition, primaryColor, 16, true);
    yPosition += 10;
    
    const strengths = feedbackData?.data?.feedback?.strengths || [];
    if (strengths.length > 0) {
      strengths.forEach((strength: string) => {
        const strengthLines = pdf.splitTextToSize(`• ${strength}`, pageWidth - 40);
        strengthLines.forEach((line: string) => {
          addColoredText(line, 20, yPosition, secondaryColor, 11);
          yPosition += 6;
        });
      });
    } else {
      addColoredText('• No specific strengths identified', 20, yPosition, secondaryColor, 11);
      yPosition += 6;
    }
    
    // Areas for Improvement Section
    checkAndAddPage(60);
    yPosition += 10;
    addColoredText('Areas for Improvement', 20, yPosition, primaryColor, 16, true);
    yPosition += 10;
    
    const improvements = feedbackData?.data?.feedback?.improvements || [];
    if (improvements.length > 0) {
      improvements.forEach((improvement: string) => {
        const improvementLines = pdf.splitTextToSize(`• ${improvement}`, pageWidth - 40);
        improvementLines.forEach((line: string) => {
          addColoredText(line, 20, yPosition, secondaryColor, 11);
          yPosition += 6;
        });
      });
    } else {
      addColoredText('• No specific improvement areas identified', 20, yPosition, secondaryColor, 11);
      yPosition += 6;
    }
    
    // Technical Assessment Section
    checkAndAddPage(80);
    yPosition += 10;
    addColoredText('Technical Assessment', 20, yPosition, primaryColor, 16, true);
    yPosition += 10;
    
    const technicalAssessment = feedbackData?.data?.feedback?.technicalAssessment || 'No technical assessment available.';
    const technicalLines = pdf.splitTextToSize(technicalAssessment, pageWidth - 40);
    technicalLines.forEach((line: string) => {
      addColoredText(line, 20, yPosition, secondaryColor, 11);
      yPosition += 6;
    });
    
    // Communication Assessment Section
    checkAndAddPage(80);
    yPosition += 10;
    addColoredText('Communication Assessment', 20, yPosition, primaryColor, 16, true);
    yPosition += 10;
    
    const communicationAssessment = feedbackData?.data?.feedback?.communicationAssessment || 'No communication assessment available.';
    const communicationLines = pdf.splitTextToSize(communicationAssessment, pageWidth - 40);
    communicationLines.forEach((line: string) => {
      addColoredText(line, 20, yPosition, secondaryColor, 11);
      yPosition += 6;
    });
    
    // Confidence Level Section
    checkAndAddPage(40);
    yPosition += 10;
    addColoredText('Assessment Confidence', 20, yPosition, primaryColor, 16, true);
    yPosition += 10;
    
    const confidence = feedbackData?.data?.feedback?.overallConfidence || 0;
    const confidenceText = confidence >= 90 ? 'Very High' : confidence >= 70 ? 'High' : confidence >= 50 ? 'Moderate' : 'Low';
    const confidenceColor = confidence >= 70 ? accentColor : confidence >= 50 ? [255, 165, 0] : [239, 68, 68];
    
    addColoredText(`Confidence Level: ${confidence}% (${confidenceText})`, 20, yPosition, confidenceColor, 12);
    yPosition += 8;
    
    // Confidence bar
    const confidenceBarWidth = 100;
    const confidenceBarHeight = 8;
    const confidenceBarX = 20;
    const confidenceBarY = yPosition - 3;
    
    pdf.setFillColor(230, 230, 230);
    pdf.rect(confidenceBarX, confidenceBarY, confidenceBarWidth, confidenceBarHeight, 'F');
    
    const confidenceWidth = (confidence / 100) * confidenceBarWidth;
    pdf.setFillColor(confidenceColor[0], confidenceColor[1], confidenceColor[2]);
    pdf.rect(confidenceBarX, confidenceBarY, confidenceWidth, confidenceBarHeight, 'F');
    
    yPosition += 15;
    
    // Footer
    const footerY = pageHeight - 20;
    addColoredText(`Generated on ${new Date().toLocaleDateString()}`, 20, footerY, secondaryColor, 10);
    addColoredText('InterviewX - AI Interview Platform', pageWidth - 80, footerY, secondaryColor, 10);
    
    // Save the PDF
    const fileName = `interview-feedback-${interviewInfo?.userName?.replace(/\s+/g, '-').toLowerCase() || 'candidate'}-${Date.now()}.pdf`;
    pdf.save(fileName);
    
    toast.success("PDF report downloaded successfully!");
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error("Failed to generate PDF report. Please try again.");
  }
};
