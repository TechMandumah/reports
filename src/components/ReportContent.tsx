'use client';

import { useState } from 'react';
import { exportToExcel, reportConfigurations } from '@/utils/excelExport';
import CustomReportForm from './CustomReportForm';
import PredefinedReportForm from './PredefinedReportForm';
import ExportCitationEntry from './CitationReports/ExportCitationEntry';
import CitationTitleTranslations from './CitationReports/CitationTitleTranslations';
import CitationAuthorTranslations from './CitationReports/CitationAuthorTranslations';
import CustomCitationReport from './CitationReports/CustomCitationReport';
import CustomCitationReportForm from './CitationReports/CustomCitationReportForm';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation, Translations } from '@/utils/localization';

interface ReportContentProps {
  activeReport: string;
}

// Helper function to get translated report names
const getTranslatedReportName = (reportId: string, t: Translations, isRTL: boolean): string => {
  const reportMap: { [key: string]: string } = {
    'export_research_titles': t.sidebar.reports.researchTitles,
    'export_research_authors': t.sidebar.reports.researchAuthors,
    'export_author_data': t.sidebar.reports.authorData,
    'export_translations_titles_authors': t.sidebar.reports.translationsTitlesAuthors,
    'export_abstract_field': t.sidebar.reports.abstractField,
    'export_citation_entry': t.sidebar.reports.citationEntry,
    'export_translations_citation_title': t.sidebar.reports.translationsCitationTitle,
    'export_translations_citation_author': t.sidebar.reports.translationsCitationAuthor,
    'custom_citation_report': isRTL ? 'تقرير الاستشهاد المخصص' : 'Custom Citation Report',
    'custom_citation_form': isRTL ? 'نموذج الاستشهاد المخصص' : 'Custom Citation Form',
    'custom_report': t.sidebar.reports.customReport,
    'convert_url_to_biblio': t.sidebar.reports.convertUrlToBiblio
  };
  return reportMap[reportId] || reportId;
};

// Helper function to get translated report descriptions
const getTranslatedReportDescription = (reportId: string, t: Translations, isRTL: boolean): string => {
  const descriptionMap: { [key: string]: string } = {
    'export_research_titles': t.reportContent.descriptions.researchTitles,
    'export_research_authors': t.reportContent.descriptions.researchAuthors,
    'export_author_data': t.reportContent.descriptions.authorData,
    'export_translations_titles_authors': t.reportContent.descriptions.translationsTitlesAuthors,
    'export_abstract_field': t.reportContent.descriptions.abstractField,
    'export_citation_entry': t.reportContent.descriptions.citationEntry,
    'export_translations_citation_title': t.reportContent.descriptions.translationsCitationTitle,
    'export_translations_citation_author': t.reportContent.descriptions.translationsCitationAuthor,
    'custom_citation_report': isRTL ? 'إنشاء تقرير مخصص بالحقول التي تختارها من قاعدة بيانات الاستشهاد' : 'Generate a custom report with selected fields from the citation database',
    'custom_citation_form': isRTL ? 'إنشاء تقرير مخصص متقدم من قاعدة بيانات الاستشهاد مع خيارات متعددة الخطوات' : 'Generate advanced custom reports from citation database with multi-step options',
    'custom_report': t.reportContent.descriptions.customReport,
    'convert_url_to_biblio': t.reportContent.descriptions.convertUrlToBiblio
  };
  return descriptionMap[reportId] || '';
};

export default function ReportContent({ activeReport }: ReportContentProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [recordCount, setRecordCount] = useState<number>(0);
  const { language, isRTL } = useLanguage();
  const t = getTranslation(language);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const handleGenerateReport = async (formData: any) => {
    setIsGenerating(true);
    setShowSuccessMessage(false);
    
    try {
      // Fetch report data and count records
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: activeReport,
          filters: {
            magazineNumbers: formData.magazineNumbers,
            startYear: formData.startYear ? parseInt(formData.startYear) : undefined,
            endYear: formData.endYear ? parseInt(formData.endYear) : undefined,
            authorName: formData.authorName,
            selectedFields: formData.selectedFields
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const result = await response.json();
      setRecordCount(result.count || 0);
      
      // Export to Excel using the database data
      await exportToExcel(activeReport, formData);
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
    } catch (error) {
      console.error('Error generating report:', error);
      alert(`Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateCustomCitationReport = async (formData: any) => {
    setIsGenerating(true);
    setShowSuccessMessage(false);
    
    try {
      // Call the custom citation form API
      const response = await fetch('/api/citation-reports/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          magazineNumbers: formData.magazineNumbers,
          startYear: formData.startYear,
          endYear: formData.endYear,
          selectedFields: formData.selectedFields,
          isPreview: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate custom citation report');
      }

      // Get the Excel file blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `custom-citation-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Get record count from response headers
      const count = response.headers.get('X-Record-Count');
      setRecordCount(count ? parseInt(count) : 0);
      
      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);

    } catch (error) {
      console.error('Error generating custom citation report:', error);
      alert(`Error generating report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const isCustomReport = activeReport === 'custom_report';
  const isCitationReport = ['export_citation_titles', 'export_citation_authors', 'custom_citation_report'].includes(activeReport);

  // Render citation reports directly without the wrapper
  if (isCitationReport) {
    switch (activeReport) {
      case 'export_citation_titles':
        return <CitationTitleTranslations />;
      case 'export_citation_authors':
        return <CitationAuthorTranslations />;
      case 'custom_citation_report':
        return <CustomCitationReportForm 
          onGenerate={handleGenerateCustomCitationReport}
          isGenerating={isGenerating}
          recordCount={recordCount}
          showSuccessMessage={showSuccessMessage}
        />;
      default:
        return null;
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 bg-green-600 rounded-full flex items-center justify-center ${isRTL ? 'ml-3' : 'mr-3'}`}>
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h4 className={`text-sm font-semibold text-green-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                {language === 'ar' ? 'تم تصدير إكسل بنجاح!' : 'Excel Export Successful!'}
              </h4>
              <p className={`text-sm text-green-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                {language === 'ar' ? 'تم تصدير تقريرك وتحميله تلقائياً.' : 'Your report has been exported and downloaded automatically.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Report Header
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8 mb-6">
        <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
            <div>
              <h1 className={`text-2xl font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                {getTranslatedReportName(activeReport, t, isRTL)}
              </h1>
              <p className={`text-gray-600 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {getTranslatedReportDescription(activeReport, t, isRTL)}
              </p>
            </div>
          </div>
          <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <svg className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t.forms.exportToExcel}
            </div>
            {reportConfigurations[activeReport]?.isDifferentDatabase && (
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <svg className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3" />
                </svg>
                {t.forms.differentDatabase}
              </div>
            )}
          </div>
        </div>
      </div> */}
      

      {/* Report Form */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-8">
        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'} mb-6`}>
          <h3 className={`text-xl font-bold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.forms.reportParameters}
          </h3>
        </div>
        
        {isCustomReport ? (
          <CustomReportForm 
            onGenerate={handleGenerateReport}
            isGenerating={isGenerating}
            recordCount={recordCount}
            showSuccessMessage={showSuccessMessage}
          />
        ) : (
          <PredefinedReportForm 
            reportType={activeReport}
            onGenerate={handleGenerateReport}
            isGenerating={isGenerating}
            recordCount={recordCount}
            showSuccessMessage={showSuccessMessage}
          />
        )}
      </div>
    </div>
  );
}
