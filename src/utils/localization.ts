export type Language = 'en' | 'ar';

export interface Translations {
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    reset: string;
    back: string;
    next: string;
    previous: string;
    close: string;
    yes: string;
    no: string;
  };

  // Input options
  inputOptions: {
    abstractType: string;
    fullText: string;
    citationFormat: string;
    authorTip: string;
    uploadTextFileWithBiblioNumbers: string;
    uploadBiblioHelper: string;
    manual: string;
    file: string;
    biblio: string;
    uploadedFile: string;
    validNumbersFound: string;
    validNumbers: string;
    errors: string;
    validNumbersFoundLabel: string;
    andMore: string;
    more: string;
  };

  // Abstract Filter
  abstractFilter: {
    filterByAbstractType: string;
    abstractType: string;
    withoutAbstract: string;
    withoutAbstractDesc: string;
    missingEnglish: string;
    missingEnglishDesc: string;
    otherLanguage: string;
    otherLanguageDesc: string;
    mandumahAbstract: string;
    mandumahAbstractDesc: string;
  };

  // Authentication
  auth: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    signIn: string;
    signingIn: string;
    accessInfo: string;
    contactAdmin: string;
    authorizedOnly: string;
    invalidCredentials: string;
    accountBlocked: string;
    attemptsRemaining: string;
    sessionExpired: string;
  };

  // Dashboard
  dashboard: {
    title: string;
    welcome: string;
    authentication: string;
    verifyingCredentials: string;
    logout: string;
    changeLanguage: string;
  };

  // Sidebar
  sidebar: {
    predefinedReports: string;
    citationReports: string;
    estenadReports: string;
    utilities: string;
    reports: {
      researchTitles: string;
      researchAuthors: string;
      hierarchicalAuthors: string;
      authorData: string;
      translationsTitlesAuthors: string;
      abstractField: string;
      citationEntry: string;
      translationsCitationTitle: string;
      translationsCitationAuthor: string;
      convertUrlToBiblio: string;
      customReport: string;
      customCitationReport: string;
      customCitationForm: string;
      citationTitle: string;
      citationAuthor: string;
      convertUrl: string;
      exportCitationTitles: string;
      exportCitationAuthors: string;
      customEstenadReport: string;
      estenadUniversityReport: string;
    };
  };

  // Report Content
  reportContent: {
    titles: {
      researchTitles: string;
      researchAuthors: string;
      hierarchicalAuthors: string;
      authorData: string;
      translationsTitlesAuthors: string;
      abstractField: string;
      citationEntry: string;
      translationsCitationTitle: string;
      translationsCitationAuthor: string;
      convertUrlToBiblio: string;
      customReport: string;
    };
    descriptions: {
      researchTitles: string;
      researchAuthors: string;
      hierarchicalAuthors: string;
      authorData: string;
      translationsTitlesAuthors: string;
      abstractField: string;
      citationEntry: string;
      translationsCitationTitle: string;
      translationsCitationAuthor: string;
      convertUrlToBiblio: string;
      customReport: string;
      customCitationReport: string;
      customCitationForm: string;
    };
  };

  // Forms
  forms: {
    reportParameters: string;
    differentDatabase: string;
    magazineNumbers: string;
    magazineNumbersPlaceholder: string;
    magazineNumbersHelp: string;
    startYear: string;
    endYear: string;
    yearRange: string;
    authorName: string;
    authorNamePlaceholder: string;
    authorNameHelp: string;
    selectFields: string;
    selectFieldsHelp: string;
    generateReport: string;
    generating: string;
    exportToExcel: string;
    previewData: string;
    dataPreview: string;
    reviewData: string;
    noDataFound: string;
    adjustFilters: string;
    backToSelection: string;
    backToFilters: string;
    nextExport: string;
    nextPreview: string;
    recordsFound: string;
    recordsExported: string;
    recordExportedSingle: string;
    recordExportedPlural: string;
    checkDownloadsFolder: string;
    issueNotValidNumber: string;
    issueMustBe4Digits: string;
    magazineNumberValidationErrors: string;
    fileUploaded: string;
    validNumbersFound: string;
    validNumbersFoundWithErrors: string;
    validNumbersFoundLabel: string;
    errors: string;
    noFileChosen: string;
    chooseFile: string;
    uploadTextFileWithMagazineNumbers: string;
    authorNameOptional: string;
    authorPlaceholder: string;
    authorTip: string;
    uploadTextFileWithBiblioNumbers: string;
    uploadBiblioHelper: string;
  };

  // Steps
  steps: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    basicCriteria: string;
    fieldSelection: string;
    dataPreview: string;
    exportOptions: string;
    selectMarcFields: string;
    inputMethod: string;
    manualEntry: string;
    uploadFile: string;
    nextSelectFields: string;
    nextPreviewData: string;
    nextExport: string;
    backToSelection: string;
    backToFilters: string;
    backToPreview: string;
    loadingPreview: string;
    selectAll: string;
    selectNone: string;
    selectedFields: string;
    of: string;
    fields: string;
    reportSummary: string;
    sampleExport: string;
    fullExport: string;
    exportSample: string;
    exportFull: string;
    magazineNumbersInputMethod: string;
      magazineNumbersPlaceholder: string;
      startYearPlaceholder: string;
      endYearPlaceholder: string;
      magazineNumbersHelper: string;
      uploadFileHelper: string;
      magazineNumbers: string;
    };

  // Estenad (Authority) Reports
  estenad: {
    uploadAuthorIds: string;
    uploadBiblioNumbers: string;
    authorIdsFile: string;
    authorIdsFileRequired: string;
    biblioNumbersFile: string;
    biblioNumbersFileRequired: string;
    uploadAuthorIdsHelper: string;
    uploadBiblioNumbersHelper: string;
    foundValidAuthorIds: string;
    foundValidBiblioNumbers: string;
    andMore: string;
    validationErrors: string;
    pleaseUploadTxtFile: string;
    pleaseUploadAuthorIdsFile: string;
    pleaseUploadBiblioNumbersFile: string;
    pleaseSelectMarcField: string;
    subfields: string;
    showingFirstRecords: string;
    recordsOutOf: string;
    totalAuthorIds: string;
    biblioNumbersRecords: string;
    startYear: string;
    endYear: string;
    failedLoadPreview: string;
    authorIdsRecords: string;
    successfullyExported: string;
    authorRecords: string;
  };

  // Author Type Filter
  authorTypeFilter: {
    filterByAuthorType: string;
    mainAuthor100: string;
    additionalAuthors700: string;
    mainAuthorDesc: string;
    additionalAuthorsDesc: string;
    authorTypeFilterTip: string;
  };

  // Table Headers
  table: {
    url: string;
    biblio: string;
    title245: string;
    title246: string;
    title242: string;
    author: string;
    mainAuthor: string;
    mainAuthorId: string;
    additionalAuthorId: string;
    university373: string;
    abstract520: string;
    abstractSubfield: string;
  };

  // Error Messages
  errors: {
    invalidMagazineNumbers: string;
    invalidYearRange: string;
    noFieldsSelected: string;
    selectMarcField: string;
    errorLoadingPreview: string;
    uploadTextFile: string;
    errorReadingFile: string;
    noValidNumbers: string;
    failedLoadPreview: string;
    exportFailed: string;
    previewFailed: string;
    networkError: string;
    unexpectedError: string;
  };

  // MARC Fields
  marcFields: {
    leader: string;
    controlNumber: string;
    standardIdentifier: string;
    languageCode: string;
    countryCode: string;
    author: string;
    corporateAuthor: string;
    translatedTitle: string;
    title: string;
    alternativeTitle: string;
    publicationInfo: string;
    physicalDescription: string;
    contentType: string;
    generalNote: string;
    abstract: string;
    indexTerm: string;
    classificationNumber: string;
    additionalAuthor: string;
    hostItem: string;
    electronicLocation: string;
    localNote: string;
    localData: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    common: {
      loading: 'Loading',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      reset: 'Reset',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      yes: 'Yes',
      no: 'No',
    },
    auth: {
      title: 'Mandumah Magazine Reports',
      subtitle: 'Sign in to access the reporting dashboard',
      email: 'Email Address',
      password: 'Password',
      signIn: 'Sign In',
      signingIn: 'Signing in...',
      accessInfo: 'Access Information:',
      contactAdmin: 'Contact your administrator for login credentials',
      authorizedOnly: 'Authorized personnel only',
      invalidCredentials: 'Invalid email or password',
      accountBlocked: 'Too many failed attempts. Account blocked for 15 minutes.',
      attemptsRemaining: 'attempts remaining: ',
      sessionExpired: 'Your session has expired. Please log in again.',
    },
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome',
      authentication: 'Authentication',
      verifyingCredentials: 'Verifying your credentials...',
      logout: 'Logout',
      changeLanguage: 'العربية',
    },
    sidebar: {
      predefinedReports: 'Predefined Reports',
      citationReports: 'Citation Reports',
      estenadReports: 'Estenad Reports',
      utilities: 'Utilities',
      reports: {
        researchTitles: 'Export Research Titles for Review',
        researchAuthors: 'Export Research Authors for Review',
        hierarchicalAuthors: 'Hierarchical Authors Report',
        authorData: 'Export Author Data for Review',
        translationsTitlesAuthors: 'Export Translations of Titles, Authors & Universities',
        abstractField: 'Export Abstract Field',
        citationEntry: 'Export Citation Entry',
        translationsCitationTitle: 'Export Translations of Citation Title (Different Database)',
        translationsCitationAuthor: 'Export Translations of Citation Author (Different Database)',
        convertUrlToBiblio: 'Convert URL to Biblio',
        customReport: 'Custom Report',
        customCitationReport: 'Custom Citation Report',
        customCitationForm: 'Custom Citation Form',
        citationTitle: 'Citation Title Translations',
        citationAuthor: 'Citation Author Translations', 
        convertUrl: 'Convert URL to Biblio',
        exportCitationTitles: 'Export Citation Titles',
        exportCitationAuthors: 'Export Citation Authors',
        customEstenadReport: 'Custom Estenad Report',
        estenadUniversityReport: 'Estenad Universities Translations',
      },
    },
    reportContent: {
      titles: {
        researchTitles: 'Research Titles for Review',
        researchAuthors: 'Research Authors for Review',
        hierarchicalAuthors: 'Hierarchical Authors Report',
        authorData: 'Author Data for Review',
        translationsTitlesAuthors: 'Translations of Titles, Authors & Universities',
        abstractField: 'Abstract Field',
        citationEntry: 'Citation Entry (Different Database)',
        translationsCitationTitle: 'Translations of Citation Title (Different Database)',
        translationsCitationAuthor: 'Translations of Citation Author (Different Database)',
        convertUrlToBiblio: 'Convert URL to Biblio',
        customReport: 'Custom Report',
      },
      descriptions: {
        researchTitles: 'Export research titles with title fields for review and verification. Biblio numbers are clickable links.',
        researchAuthors: 'Export research authors with author field and clickable author IDs for review and verification.',
        hierarchicalAuthors: 'Export authors in hierarchical structure with main authors (100) and additional authors (700) separated. Includes subfields: name, date, fuller form, and authority ID.',
        authorData: 'Export author data with author field for review and verification. Biblio numbers are clickable links.',
        translationsTitlesAuthors: 'Export translations of titles, authors and universities for review. Biblio numbers are clickable links.',
        abstractField: 'Export abstract field data with all subfields extracted separately. Biblio numbers are clickable links.',
        citationEntry: 'Export citation entries from different database. Biblio numbers are clickable links.',
        translationsCitationTitle: 'Export translations of citation titles from different database. Biblio numbers are clickable links.',
        translationsCitationAuthor: 'Export translations of citation authors from different database. Biblio numbers are clickable links.',
        convertUrlToBiblio: 'Convert URL entries to biblio numbers for cataloging reference.',
        customReport: 'Create custom reports by selecting specific MARC fields and applying filters.',
        customCitationReport: 'Generate custom citation reports with advanced field selection and filtering options.',
        customCitationForm: 'Advanced citation report generator with multi-step form and custom field selection.',
      },
    },
    forms: {
      reportParameters: 'Report Parameters',
      differentDatabase: 'Different Database',
      magazineNumbers: 'Magazine Numbers',
      magazineNumbersPlaceholder: 'Enter magazine numbers (e.g., 1001, 1002, 1003)',
      magazineNumbersHelp: 'Enter magazine numbers separated by commas, spaces, or new lines',
      startYear: 'Start Year',
      endYear: 'End Year',
      yearRange: 'Year Range',
      authorName: 'Author Name',
      authorNamePlaceholder: 'Enter author name',
      authorNameHelp: 'Enter partial or full author name for filtering',
      selectFields: 'Select MARC Fields',
      selectFieldsHelp: 'Choose the MARC fields you want to include in your report',
      generateReport: 'Generate Report',
      generating: 'Generating...',
      exportToExcel: 'Export to Excel',
      previewData: 'Preview Data',
      dataPreview: 'Data Preview (First 5 rows):',
      reviewData: 'Review the data structure and content before generating the full report.',
      noDataFound: 'No data found for the specified criteria. Please go back and adjust your filters.',
      adjustFilters: 'Please go back and adjust your filters.',
      backToSelection: 'Back to Field Selection',
      backToFilters: 'Back to Filter Selection',
      nextExport: 'Next: Export',
      nextPreview: 'Next: Preview Data',
      recordsFound: 'Records Found',
      recordsExported: 'Records Exported',
      recordExportedSingle: 'record found and exported to Excel',
      recordExportedPlural: 'records found and exported to Excel',
      checkDownloadsFolder: 'Check your downloads folder for the Excel file',
      issueNotValidNumber: 'is not a valid number',
      issueMustBe4Digits: 'must be exactly 4 digits (e.g., 0001, 0123, 4567)',
      magazineNumberValidationErrors: 'Magazine Number Validation Errors:',
      fileUploaded: 'File uploaded:',
      validNumbersFound: 'valid numbers found',
      validNumbersFoundWithErrors: 'valid numbers found, {count} errors',
      validNumbersFoundLabel: 'Valid numbers found:',
      errors: 'errors',
      noFileChosen: 'No file chosen',
      chooseFile: 'Choose file',
      uploadTextFileWithMagazineNumbers: 'Upload Text File with Magazine Numbers',
      authorNameOptional: 'Author Name (Optional)',
      authorPlaceholder: 'e.g., أحمد محمد, Smith, John',
      authorTip: 'Tip: Enter partial author name to search. The system will find all authors containing the entered text.',
      uploadTextFileWithBiblioNumbers: 'Upload Text File with Biblio Numbers',
      uploadBiblioHelper: 'Upload a .txt file containing biblio numbers, one per line or comma-separated',
    },
    steps: {
      step1: 'Step 1',
      step2: 'Step 2',
      step3: 'Step 3',
      step4: 'Step 4',
      basicCriteria: 'Basic Criteria',
      fieldSelection: 'Field Selection',
      dataPreview: 'Data Preview',
      exportOptions: 'Export Options',
      selectMarcFields: 'Select MARC Fields',
      inputMethod: 'Magazine Numbers Input Method',
      manualEntry: 'Manual Entry',
      uploadFile: 'Upload File',
      nextSelectFields: 'Next: Select Fields',
      nextPreviewData: 'Next: Preview Data',
      nextExport: 'Next: Export',
      backToSelection: 'Back to Field Selection',
      backToFilters: 'Back to Filter Selection',
      backToPreview: 'Back to Preview',
      loadingPreview: 'Loading Preview...',
      selectAll: 'Select All',
      selectNone: 'Select None',
      selectedFields: 'Selected Fields',
      of: 'of',
      fields: 'fields',
      reportSummary: 'Report Summary',
      sampleExport: 'Sample Export (First 100 records)',
      fullExport: 'Full Export (All records)',
      exportSample: 'Export Sample',
      exportFull: 'Export Full Report',
      magazineNumbersInputMethod: 'Magazine Numbers Input Method',
      magazineNumbersPlaceholder: 'e.g., 0001, 0123, 4567 (exactly 4 digits each)',
      startYearPlaceholder: 'e.g., 2020',
      endYearPlaceholder: 'e.g., 2024',
      magazineNumbersHelper: 'Enter magazine numbers as exactly 4 digits (e.g., 0001, 0123, 4567). Separate multiple numbers with commas. Leave empty to include all magazines.',
      uploadFileHelper: 'Upload a text file (.txt) containing magazine numbers separated by commas or new lines. Each number must be exactly 4 digits.',
      magazineNumbers: 'Magazine Numbers',
    },

    inputOptions: {
      abstractType: 'Abstract Type',
      fullText: 'Full Text',
      citationFormat: 'Citation Format',
      authorTip: 'Tip: Enter part of the author\'s name to search. The system will find all authors containing the entered text.',
      uploadTextFileWithBiblioNumbers: 'Upload Text File with Biblio Numbers',
      uploadBiblioHelper: 'Upload a .txt file containing biblio numbers, one per line or comma-separated',
      manual: 'Manual Entry',
      file: 'Upload File',
      biblio: 'Upload Biblio Numbers',
      uploadedFile: 'Uploaded File',
      validNumbersFound: 'valid numbers found',
      validNumbers: 'valid numbers',
      errors: 'errors',
      validNumbersFoundLabel: 'Valid Numbers Found',
      andMore: '... and',
      more: 'more',
    },

    abstractFilter: {
      filterByAbstractType: 'Filter by Abstract Type',
      abstractType: 'Abstract Type',
      withoutAbstract: 'Without Abstract (520)',
      withoutAbstractDesc: 'Records with no field 520',
      missingEnglish: 'Missing English',
      missingEnglishDesc: 'Subfield \'a\' available, but \'b\' and \'f\' empty',
      otherLanguage: 'Other Language',
      otherLanguageDesc: 'Subfield \'d\' available, all others empty',
      mandumahAbstract: 'Mandumah Abstract',
      mandumahAbstractDesc: 'Subfields \'a\' and \'e\' empty in field 520',
    },

    authorTypeFilter: {
      filterByAuthorType: 'Filter by Author Type',
      mainAuthor100: 'Main Author (100)',
      additionalAuthors700: 'Additional Authors (700)',
      mainAuthorDesc: 'Export only main author field and related columns',
      additionalAuthorsDesc: 'Export only additional author fields and related columns',
      authorTypeFilterTip: 'Select author types to export only specific author fields, or leave unselected to export all author types as usual.',
    },

    table: {
      url: 'URL',
      biblio: 'Biblio',
      title245: 'Title 245',
      title246: 'Title 246',
      title242: 'Title 242',
      author: 'Author',
      mainAuthor: 'Main Author (100)',
      mainAuthorId: 'Main Author ID',
      additionalAuthorId: 'Additional Author ID',
      university373: 'University 373',
      abstract520: 'Abstract 520',
      abstractSubfield: 'Abstract Subfield',
    },
    errors: {
      invalidMagazineNumbers: 'Please enter valid magazine numbers',
      invalidYearRange: 'Please enter a valid year range',
      noFieldsSelected: 'Please select at least one MARC field',
      selectMarcField: 'Please select at least one MARC field',
      errorLoadingPreview: 'Error loading preview',
      uploadTextFile: 'Please upload a text file (.txt)',
      errorReadingFile: 'Error reading file. Please try again.',
      noValidNumbers: 'No valid magazine numbers found in the file. Please check the file format and content.',
      failedLoadPreview: 'Failed to load preview data',
      exportFailed: 'Failed to export report',
      previewFailed: 'Failed to load preview data',
      networkError: 'Network error occurred',
      unexpectedError: 'An unexpected error occurred',
    },
    marcFields: {
      leader: 'Leader',
      controlNumber: 'Control Number',
      standardIdentifier: 'Standard Identifier',
      languageCode: 'Language Code',
      countryCode: 'Country/Geographic Code',
      author: 'Author/Creator',
      corporateAuthor: 'Corporate Author',
      translatedTitle: 'Translated Title',
      title: 'Title',
      alternativeTitle: 'Alternative Title',
      publicationInfo: 'Publication Info',
      physicalDescription: 'Physical Description',
      contentType: 'Content Type',
      generalNote: 'General Note',
      abstract: 'Abstract',
      indexTerm: 'Index Term',
      classificationNumber: 'Classification Number',
      additionalAuthor: 'Additional Author',
      hostItem: 'Host Item',
      electronicLocation: 'Electronic Location',
      localNote: 'Local Note',
      localData: 'Local Data',
    },
    estenad: {
      uploadAuthorIds: 'Upload Author IDs',
      uploadBiblioNumbers: 'Upload Biblio Numbers',
      authorIdsFile: 'Author IDs File',
      authorIdsFileRequired: 'Author IDs File (Required)',
      biblioNumbersFile: 'Biblio Numbers File',
      biblioNumbersFileRequired: 'Biblio Numbers File (Required)',
      uploadAuthorIdsHelper: 'Upload a .txt file with author IDs (authid from auth_header table). One per line or comma-separated.',
      uploadBiblioNumbersHelper: 'Upload a .txt file with biblio numbers. One per line or comma-separated.',
      foundValidAuthorIds: 'Found {count} valid author IDs',
      foundValidBiblioNumbers: 'Found {count} valid biblio numbers',
      andMore: 'and {count} more',
      validationErrors: 'Validation Errors',
      pleaseUploadTxtFile: 'Please upload a .txt file',
      pleaseUploadAuthorIdsFile: 'Please upload an author IDs file',
      pleaseUploadBiblioNumbersFile: 'Please upload a biblio numbers file',
      pleaseSelectMarcField: 'Please select at least one MARC field',
      subfields: 'Subfields',
      showingFirstRecords: 'Showing first {count} records out of {total} total author IDs',
      recordsOutOf: 'records out of',
      totalAuthorIds: 'total author IDs',
      biblioNumbersRecords: 'Biblio Numbers: {count} records',
      startYear: 'Start Year',
      endYear: 'End Year',
      failedLoadPreview: 'Failed to load preview data. Please try again.',
      authorIdsRecords: 'Author IDs: {count} records',
      successfullyExported: 'Successfully exported {count} author records',
      authorRecords: 'author records',
    },
  },
  ar: {
    common: {
      loading: 'جارٍ التحميل',
      error: 'خطأ',
      success: 'نجح',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      save: 'حفظ',
      delete: 'حذف',
      edit: 'تعديل',
      add: 'إضافة',
      search: 'بحث',
      reset: 'إعادة تعيين',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      close: 'إغلاق',
      yes: 'نعم',
      no: 'لا',
    },
    auth: {
      title: 'تقارير مجلات دار المنظومة',
      subtitle: 'قم بتسجيل الدخول للوصول إلى لوحة التقارير',
      email: 'عنوان البريد الإلكتروني',
      password: 'كلمة المرور',
      signIn: 'تسجيل الدخول',
      signingIn: 'جارٍ تسجيل الدخول...',
      accessInfo: 'معلومات الوصول:',
      contactAdmin: 'اتصل بالمشرف للحصول على بيانات تسجيل الدخول',
      authorizedOnly: 'للموظفين المخولين فقط',
      invalidCredentials: 'بريد إلكتروني أو كلمة مرور غير صحيحة',
      accountBlocked: 'محاولات فاشلة كثيرة. تم حظر الحساب لمدة 15 دقيقة.',
      attemptsRemaining: 'محاولة متبقية.',
      sessionExpired: 'انتهت صلاحية جلستك. يرجى تسجيل الدخول مرة أخرى.',
    },
    dashboard: {
      title: 'لوحة التحكم',
      welcome: 'مرحباً',
      authentication: 'التحقق من الهوية',
      verifyingCredentials: 'جارٍ التحقق من بياناتك...',
      logout: 'تسجيل الخروج',
      changeLanguage: 'English',
    },
    sidebar: {
      predefinedReports: 'التقارير المحددة مسبقاً',
      citationReports: 'تقارير الاستشهاد',
      estenadReports: 'تقارير الإستناد',
      utilities: 'الأدوات المساعدة',
      reports: {
        researchTitles: 'تصدير عناوين البحوث للمراجعة',
        researchAuthors: 'تصدير مؤلفي البحوث للمراجعة',
        hierarchicalAuthors: 'تقرير المؤلفين الهرمي',
        authorData: 'تصدير بيانات المؤلفين للمراجعة',
        translationsTitlesAuthors: 'تصدير ترجمات العناوين والمؤلفين والجامعات',
        abstractField: 'تصدير حقل الملخص',
        citationEntry: 'تصدير إدخال الاستشهاد (قاعدة بيانات مختلفة)',
        translationsCitationTitle: 'تصدير ترجمات عنوان الاستشهاد (قاعدة بيانات مختلفة)',
        translationsCitationAuthor: 'تصدير ترجمات مؤلف الاستشهاد (قاعدة بيانات مختلفة)',
        convertUrlToBiblio: 'تحويل الرابط إلى ببليو',
        customReport: 'تقرير مخصص',
        customCitationReport: 'تقرير استشهاد مخصص',
        customCitationForm: 'نموذج استشهاد مخصص',
        citationTitle: 'ترجمات عناوين الاستشهاد',
        citationAuthor: 'ترجمات مؤلفي الاستشهاد',
        convertUrl: 'تحويل الرابط إلى ببليو',
        exportCitationTitles: 'تصدير عناوين الاستشهاد',
        exportCitationAuthors: 'تصدير مؤلفي الاستشهاد',
        customEstenadReport: 'تقرير إستناد مخصص',
        estenadUniversityReport: 'تقرير ترجمات الجامعات للإسناد',
      },
    },
    reportContent: {
      titles: {
        researchTitles: 'عناوين البحوث للمراجعة',
        researchAuthors: 'مؤلفو البحوث للمراجعة',
        hierarchicalAuthors: 'تقرير المؤلفين الهرمي',
        authorData: 'بيانات المؤلفين للمراجعة',
        translationsTitlesAuthors: 'ترجمات العناوين والمؤلفين والجامعات',
        abstractField: 'حقل الملخص',
        citationEntry: 'إدخال الاستشهاد (قاعدة بيانات مختلفة)',
        translationsCitationTitle: 'ترجمات عنوان الاستشهاد (قاعدة بيانات مختلفة)',
        translationsCitationAuthor: 'ترجمات مؤلف الاستشهاد (قاعدة بيانات مختلفة)',
        convertUrlToBiblio: 'تحويل الرابط إلى ببليو',
        customReport: 'تقرير مخصص',
      },
      descriptions: {
        researchTitles: 'تصدير عناوين البحوث مع حقول العناوين للمراجعة والتحقق. أرقام الببليو قابلة للنقر.',
        researchAuthors: 'تصدير مؤلفي البحوث مع حقل المؤلف ومعرفات المؤلفين القابلة للنقر للمراجعة والتحقق.',
        hierarchicalAuthors: 'تصدير المؤلفين في بنية هرمية مع فصل المؤلفين الرئيسيين (100) والمؤلفين الإضافيين (700). يتضمن الحقول الفرعية: الاسم، التاريخ، الاسم الكامل، ومعرف الاستناد.',
        authorData: 'تصدير بيانات المؤلفين مع حقل المؤلف للمراجعة والتحقق. أرقام الببليو قابلة للنقر.',
        translationsTitlesAuthors: 'تصدير ترجمات العناوين والمؤلفين والجامعات للمراجعة. أرقام الببليو قابلة للنقر.',
        abstractField: 'تصدير بيانات حقل الملخص مع استخراج جميع الحقول الفرعية بشكل منفصل. أرقام الببليو قابلة للنقر.',
        citationEntry: 'تصدير إدخالات الاستشهاد من قاعدة بيانات مختلفة. أرقام الببليو قابلة للنقر.',
        translationsCitationTitle: 'تصدير ترجمات عناوين الاستشهاد من قاعدة بيانات مختلفة. أرقام الببليو قابلة للنقر.',
        translationsCitationAuthor: 'تصدير ترجمات مؤلفي الاستشهاد من قاعدة بيانات مختلفة. أرقام الببليو قابلة للنقر.',
        convertUrlToBiblio: 'تحويل إدخالات الروابط إلى أرقام ببليو للمرجع الفهرسي.',
        customReport: 'إنشاء تقارير مخصصة عن طريق اختيار حقول مارك محددة وتطبيق المرشحات.',
        customCitationReport: 'إنشاء تقارير استشهاد مخصصة مع خيارات متقدمة لاختيار الحقول والتصفية.',
        customCitationForm: 'مولد تقارير الاستشهاد المتقدم مع نموذج متعدد الخطوات واختيار حقول مخصص.',
      },
    },
    forms: {
      reportParameters: 'معاملات التقرير',
      differentDatabase: 'قاعدة بيانات مختلفة',
      magazineNumbers: 'أرقام المجلات',
      magazineNumbersPlaceholder: 'أدخل أرقام المجلات (مثال: 1001، 1002، 1003)',
      magazineNumbersHelp: 'أدخل أرقام المجلات مفصولة بفواصل أو مسافات أو أسطر جديدة',
      startYear: 'السنة من',
      endYear: 'السنة إلى',
      yearRange: 'النطاق الزمني',
      authorName: 'اسم المؤلف',
      authorNamePlaceholder: 'أدخل اسم المؤلف',
      authorNameHelp: 'أدخل جزءاً من اسم المؤلف أو الاسم كاملاً للتصفية',
      selectFields: 'اختيار حقول مارك',
      selectFieldsHelp: 'اختر حقول مارك التي تريد تضمينها في تقريرك',
      generateReport: 'إنشاء التقرير',
      generating: 'جارِ الإنشاء...',
      exportToExcel: 'تصدير إلى إكسل',
      previewData: 'معاينة البيانات',
      dataPreview: 'معاينة البيانات (أول 5 صفوف):',
      reviewData: 'راجع هيكل البيانات والمحتوى قبل إنشاء التقرير الكامل.',
      noDataFound: 'لم يتم العثور على بيانات للمعايير المحددة. يرجى العودة وتعديل المرشحات.',
      adjustFilters: 'يرجى العودة وتعديل المرشحات.',
      backToSelection: 'العودة إلى اختيار الحقول',
      backToFilters: 'العودة إلى اختيار المرشحات',
      nextExport: 'التالي: التصدير',
      nextPreview: 'التالي: معاينة البيانات',
      recordsFound: 'سجلات موجودة',
      recordsExported: 'سجلات مصدرة',
      recordExportedSingle: 'سجل موجود وتم تصديره إلى إكسل',
      recordExportedPlural: 'سجل موجود وتم تصديره إلى إكسل',
      checkDownloadsFolder: 'تحقق من مجلد التنزيلات للحصول على ملف إكسل',
      issueNotValidNumber: 'ليس رقماً صحيحاً',
      issueMustBe4Digits: 'يجب أن يكون 4 أرقام بالضبط (مثال: 0001، 0123، 4567)',
      magazineNumberValidationErrors: 'أخطاء التحقق من أرقام المجلات:',
      fileUploaded: 'تم رفع الملف:',
      validNumbersFound: 'أرقام صحيحة موجودة',
      validNumbersFoundWithErrors: 'أرقام صحيحة موجودة، {count} أخطاء',
      validNumbersFoundLabel: 'الأرقام الصحيحة الموجودة:',
      errors: 'أخطاء',
      noFileChosen: 'لم يتم اختيار ملف',
      chooseFile: 'اختر ملف',
      uploadTextFileWithMagazineNumbers: 'رفع ملف نصي يحتوي على أرقام المجلات',
      authorNameOptional: 'اسم المؤلف (اختياري)',
      authorPlaceholder: 'مثال: أحمد محمد، Smith، John',
      authorTip: 'نصيحة: أدخل جزء من اسم المؤلف للبحث. سيجد النظام جميع المؤلفين الذين يحتوون على النص المدخل.',
      uploadTextFileWithBiblioNumbers: 'رفع ملف نصي يحتوي على أرقام الببليو',
      uploadBiblioHelper: 'رفع ملف .txt يحتوي على أرقام الببليوجرافيا، واحد في كل سطر أو مفصول بفواصل',
    },
    steps: {
      step1: 'الخطوة 1',
      step2: 'الخطوة 2',
      step3: 'الخطوة 3',
      step4: 'الخطوة 4',
      basicCriteria: 'المعايير الأساسية',
      fieldSelection: 'اختيار الحقول',
      dataPreview: 'معاينة البيانات',
      exportOptions: 'خيارات التصدير',
      selectMarcFields: 'اختيار حقول مارك',
      inputMethod: 'طريقة إدخال أرقام المجلات',
      manualEntry: 'الإدخال اليدوي',
      uploadFile: 'رفع ملف',
      nextSelectFields: 'التالي: اختيار الحقول',
      nextPreviewData: 'التالي: معاينة البيانات',
      nextExport: 'التالي: التصدير',
      backToSelection: 'العودة إلى اختيار الحقول',
      backToFilters: 'العودة إلى اختيار المرشحات',
      backToPreview: 'العودة إلى المعاينة',
      loadingPreview: 'جارٍ تحميل المعاينة...',
      selectAll: 'اختيار الكل',
      selectNone: 'إلغاء الاختيار',
      selectedFields: 'الحقول المختارة',
      of: 'من',
      fields: 'حقول',
      reportSummary: 'ملخص التقرير',
      sampleExport: 'تصدير عينة (أول 100 سجل)',
      fullExport: 'التصدير الكامل (جميع السجلات)',
      exportSample: 'تصدير عينة',
      exportFull: 'تصدير التقرير الكامل',
      magazineNumbersInputMethod: 'طريقة إدخال أرقام المجلات',
      magazineNumbersPlaceholder: 'مثال: 0001، 0123، 4567 (4 أرقام بالضبط لكل مجلة)',
      startYearPlaceholder: 'مثال: 2020',
      endYearPlaceholder: 'مثال: 2024',
      magazineNumbersHelper: 'أدخل أرقام المجلات كـ 4 أرقام بالضبط (مثال: 0001، 0123، 4567). افصل بين الأرقام المتعددة بفواصل. اتركها فارغة لتشمل جميع المجلات.',
      uploadFileHelper: 'ارفع ملف نصي (.txt) يحتوي على أرقام المجلات مفصولة بفواصل أو أسطر جديدة. يجب أن يكون كل رقم 4 أرقام بالضبط.',
      magazineNumbers: 'أرقام المجلات',
    },

    inputOptions: {
      abstractType: 'نوع الملخص',
      fullText: 'النص الكامل',
      citationFormat: 'تنسيق الاستشهاد',
      authorTip: 'نصيحة: أدخل جزءًا من اسم المؤلف للبحث. سيجد النظام جميع المؤلفين الذين يحتوون على النص المدخل.',
      uploadTextFileWithBiblioNumbers: 'رفع ملف نصي يحتوي على أرقام الببليو',
      uploadBiblioHelper: 'رفع ملف .txt يحتوي على أرقام الببليوجرافيا، واحد في كل سطر أو مفصول بفواصل',
      manual: 'الإدخال اليدوي',
      file: 'رفع ملف',
      biblio: 'رفع أرقام الببليو',
      uploadedFile: 'الملف المرفوع',
      validNumbersFound: 'أرقام صحيحة موجودة',
      validNumbers: 'أرقام صحيحة',
      errors: 'أخطاء',
      validNumbersFoundLabel: 'الأرقام الصحيحة الموجودة',
      andMore: '... و',
      more: 'رقم آخر',
    },

    abstractFilter: {
      filterByAbstractType: 'فلترة حسب نوع الملخص',
      abstractType: 'نوع الملخص',
      withoutAbstract: 'بدون ملخص (520)',
      withoutAbstractDesc: 'السجلات التي لا تحتوي على الحقل 520',
      missingEnglish: 'مفقود باللغة الإنجليزية',
      missingEnglishDesc: 'الحقل الفرعي \'a\' متوفر، ولكن \'b\' و \'f\' فارغان',
      otherLanguage: 'لغة أخرى',
      otherLanguageDesc: 'الحقل الفرعي \'d\' متوفر، وجميع الآخرين فارغان',
      mandumahAbstract: 'ملخص المنظومة',
      mandumahAbstractDesc: 'الحقلان الفرعيان \'a\' و \'e\' فارغان في الحقل 520',
    },

    authorTypeFilter: {
      filterByAuthorType: 'فلترة حسب نوع المؤلف',
      mainAuthor100: 'المؤلف الرئيسي (100)',
      additionalAuthors700: 'المؤلفون الإضافيون (700)',
      mainAuthorDesc: 'تصدير حقل المؤلف الرئيسي والأعمدة المرتبطة فقط',
      additionalAuthorsDesc: 'تصدير حقول المؤلفين الإضافيين والأعمدة المرتبطة فقط',
      authorTypeFilterTip: 'اختر أنواع المؤلفين لتصدير حقول مؤلفين محددة فقط، أو اتركها غير محددة لتصدير جميع أنواع المؤلفين كالمعتاد.',
    },

    table: {
      url: 'الرابط',
      biblio: 'الببليو',
      title245: 'العنوان 245',
      title246: 'العنوان 246',
      title242: 'العنوان 242',
      author: 'المؤلف',
      mainAuthor: 'المؤلف الرئيسي (100)',
      mainAuthorId: 'معرف المؤلف الرئيسي',
      additionalAuthorId: 'معرف المؤلف الإضافي',
      university373: 'الجامعة 373',
      abstract520: 'الملخص 520',
      abstractSubfield: 'حقل فرعي للملخص',
    },
    errors: {
      invalidMagazineNumbers: 'يرجى إدخال أرقام مجلات صحيحة',
      invalidYearRange: 'يرجى إدخال نطاق زمني صحيح',
      noFieldsSelected: 'يرجى اختيار حقل مارك واحد على الأقل',
      selectMarcField: 'يرجى اختيار حقل مارك واحد على الأقل',
      errorLoadingPreview: 'خطأ في تحميل المعاينة',
      uploadTextFile: 'يرجى رفع ملف نصي (.txt)',
      errorReadingFile: 'خطأ في قراءة الملف. يرجى المحاولة مرة أخرى.',
      noValidNumbers: 'لم يتم العثور على أرقام مجلات صحيحة في الملف. يرجى فحص تنسيق ومحتوى الملف.',
      failedLoadPreview: 'فشل في تحميل بيانات المعاينة',
      exportFailed: 'فشل في تصدير التقرير',
      previewFailed: 'فشل في تحميل بيانات المعاينة',
      networkError: 'حدث خطأ في الشبكة',
      unexpectedError: 'حدث خطأ غير متوقع',
    },
    marcFields: {
      leader: 'القائد',
      controlNumber: 'رقم التحكم',
      standardIdentifier: 'المعرف المعياري',
      languageCode: 'رمز اللغة',
      countryCode: 'رمز البلد/الجغرافي',
      author: 'المؤلف/المُنشئ',
      corporateAuthor: 'المؤلف المؤسسي',
      translatedTitle: 'العنوان المترجم',
      title: 'العنوان',
      alternativeTitle: 'العنوان البديل',
      publicationInfo: 'معلومات النشر',
      physicalDescription: 'الوصف المادي',
      contentType: 'نوع المحتوى',
      generalNote: 'ملاحظة عامة',
      abstract: 'الملخص',
      indexTerm: 'مصطلح الفهرسة',
      classificationNumber: 'رقم التصنيف',
      additionalAuthor: 'مؤلف إضافي',
      hostItem: 'المادة المضيفة',
      electronicLocation: 'الموقع الإلكتروني',
      localNote: 'ملاحظة محلية',
      localData: 'بيانات محلية',
    },
    estenad: {
      uploadAuthorIds: 'رفع معرفات المؤلفين',
      uploadBiblioNumbers: 'رفع أرقام الببليو',
      authorIdsFile: 'ملف معرفات المؤلفين',
      authorIdsFileRequired: 'ملف معرفات المؤلفين (مطلوب)',
      biblioNumbersFile: 'ملف أرقام الببليو',
      biblioNumbersFileRequired: 'ملف أرقام الببليو (مطلوب)',
      uploadAuthorIdsHelper: 'ارفع ملف .txt يحتوي على معرفات المؤلفين (authid من جدول auth_header). واحد في كل سطر أو مفصولة بفواصل.',
      uploadBiblioNumbersHelper: 'ارفع ملف .txt يحتوي على أرقام الببليو. واحد في كل سطر أو مفصولة بفواصل.',
      foundValidAuthorIds: 'تم العثور على {count} معرف مؤلف صحيح',
      foundValidBiblioNumbers: 'تم العثور على {count} رقم ببليو صحيح',
      andMore: 'و {count} آخرين',
      validationErrors: 'أخطاء التحقق',
      pleaseUploadTxtFile: 'يرجى رفع ملف .txt',
      pleaseUploadAuthorIdsFile: 'يرجى رفع ملف معرفات المؤلفين',
      pleaseUploadBiblioNumbersFile: 'يرجى رفع ملف أرقام الببليو',
      pleaseSelectMarcField: 'يرجى اختيار حقل مارك واحد على الأقل',
      subfields: 'الحقول الفرعية',
      showingFirstRecords: 'عرض أول {count} سجلات من أصل {total} معرف مؤلف إجمالي',
      recordsOutOf: 'سجلات من أصل',
      totalAuthorIds: 'معرف مؤلف إجمالي',
      biblioNumbersRecords: 'أرقام الببليو: {count} سجلات',
      startYear: 'سنة البداية',
      endYear: 'سنة النهاية',
      failedLoadPreview: 'فشل في تحميل بيانات المعاينة. يرجى المحاولة مرة أخرى.',
      authorIdsRecords: 'معرفات المؤلفين: {count} سجلات',
      successfullyExported: 'تم تصدير {count} سجل مؤلف بنجاح',
      authorRecords: 'سجلات المؤلفين',
    },
  },
};

export const getTranslation = (language: Language): Translations => {
  return translations[language];
};

export const isRTL = (language: Language): boolean => {
  return language === 'ar';
};
