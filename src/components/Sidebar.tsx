'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation, Translations } from '@/utils/localization';

interface SidebarProps {
  activeReport: string;
  setActiveReport: (reportId: string) => void;
}

// Helper function to get translated report names
const getTranslatedReportName = (nameKey: string, t: Translations): string => {
  const keys = nameKey.split('.');
  let value: any = t;
  for (const key of keys) {
    value = value[key];
  }
  return value || nameKey;
};

export default function Sidebar({ activeReport, setActiveReport }: SidebarProps) {
  const { language, isRTL } = useLanguage();
  const t = getTranslation(language);

  // Define sidebar groups with translation keys
  const sidebarGroups = [
    {
      nameKey: 'sidebar.predefinedReports',
      items: [
        { nameKey: 'sidebar.reports.researchTitles', id: "export_research_titles" },
        { nameKey: 'sidebar.reports.researchAuthors', id: "export_research_authors" },
        // { nameKey: 'sidebar.reports.translationsTitlesAuthors', id: "export_translations_titles_authors" },
        { nameKey: 'sidebar.reports.abstractField', id: "export_abstract_field" },
        { nameKey: 'sidebar.reports.customReport', id: "custom_report" }
      ]
    },
    {
      nameKey: 'sidebar.citationReports',
      items: [
        { nameKey: 'sidebar.reports.exportCitationTitles', id: "export_citation_titles" },
        { nameKey: 'sidebar.reports.exportCitationAuthors', id: "export_citation_authors" },
        { nameKey: 'sidebar.reports.customCitationReport', id: "custom_citation_report" }
      ]
    },
    {
      nameKey: 'sidebar.utilities',
      items: [
        { nameKey: 'sidebar.reports.convertUrl', id: "convert_url_to_biblio" }
      ]
    }
  ];

  return (
    <div className={`w-80 bg-white shadow-xl border-r-2 flex flex-col ${isRTL ? 'border-l-2 border-r-0' : ''}`}>
      {/* Logo Section */}
      <div className="p-6 border-b-2 border-red-100 bg-gradient-to-r from-red-50 to-white">
        <div className="flex items-center justify-center mb-4">
          <img 
            src="/logo.jpg" 
            alt="Mandumah Logo" 
            className="h-16 w-auto object-contain"
          />
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 overflow-y-auto p-4" >
        <div className="space-y-5">
          {sidebarGroups.map((group, groupIndex) => (
            <div key={group.nameKey}>
              {/* Group Header */}
              <div className="mb-3">
                <h3 className={`text-xs font-bold text-gray-500 uppercase tracking-wider px-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {getTranslatedReportName(group.nameKey, t)}
                </h3>
                <div className={`mt-1 h-px bg-gradient-to-r ${isRTL ? 'from-transparent to-red-200' : 'from-red-200 to-transparent'}`}></div>
              </div>
              
              {/* Group Items */}
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveReport(item.id)}
                      className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2 rounded-xl transition-all duration-200 group ${
                        activeReport === item.id
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg transform scale-105'
                          : 'text-gray-700 hover:bg-red-50 hover:text-red-700 hover:shadow-md hover:transform hover:scale-105'
                      }`}
                    >
                      <div className={`flex items-center`}>
                        <div className="flex-1">
                          <div className="text-sm font-semibold mb-1">
                            {getTranslatedReportName(item.nameKey, t)}
                          </div>
                        </div>
                        <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                          {activeReport === item.id ? (
                            <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                          ) : (
                            <svg className={`w-3 h-3 text-gray-400 group-hover:text-red-500 transition-colors ${isRTL ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Sidebar Footer */}
      {/* <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className={`${isRTL ? 'text-center' : 'text-center'}`}>
          <p className="text-xs text-gray-500 mb-1">© 2025 Mandumah</p>
        </div>
      </div> */}
    </div>
  );
}
