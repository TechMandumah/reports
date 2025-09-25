'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/localization';

interface PredefinedReportFormProps {
  reportType: string;
  onGenerate: (formData: any) => void;
  isGenerating: boolean;
  recordCount?: number;
  showSuccessMessage?: boolean;
}

export default function PredefinedReportForm({ 
  reportType, 
  onGenerate, 
  isGenerating,
  recordCount = 0,
  showSuccessMessage = false
}: PredefinedReportFormProps) {
  const { language, isRTL } = useLanguage();
  const t = getTranslation(language);
  const [magazineNumbers, setMagazineNumbers] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [inputMethod, setInputMethod] = useState<'manual' | 'file' | 'biblio'>('manual');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileNumbers, setFileNumbers] = useState<string[]>([]);
  const [abstractFilter, setAbstractFilter] = useState<string>('');
  const [biblioUploadedFile, setBiblioUploadedFile] = useState<File | null>(null);
  const [biblioNumbers, setBiblioNumbers] = useState<string[]>([]);
  const [authorTypeFilter, setAuthorTypeFilter] = useState<string[]>([]);

  const validateMagazineNumbers = (input: string): { isValid: boolean; errors: string[] } => {
    if (!input.trim()) {
      return { isValid: true, errors: [] }; // Empty is allowed
    }

    const numbers = input.split(',').map(n => n.trim()).filter(n => n !== '');
    const errors: string[] = [];

    numbers.forEach((num, index) => {
      // Check if it's a valid number
      if (!/^\d+$/.test(num)) {
        errors.push(`Issue #${index + 1}: "${num}" ${t.forms.issueNotValidNumber}`);
        return;
      }

      // Check if it's exactly 4 digits
      if (num.length !== 4) {
        errors.push(`Issue #${index + 1}: "${num}" ${t.forms.issueMustBe4Digits}`);
      }
    });

    return { isValid: errors.length === 0, errors };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('text') && !file.name.endsWith('.txt')) {
      setValidationErrors([t.errors.uploadTextFile]);
      return;
    }

    setUploadedFile(file);
    
    try {
      const text = await file.text();
      const { numbers, errors } = parseAndValidateFileContent(text);
      setFileNumbers(numbers);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setValidationErrors([]);
      }
    } catch (error) {
      setValidationErrors([t.errors.errorReadingFile]);
    }
  };

  const handleBiblioFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('text') && !file.name.endsWith('.txt')) {
      setValidationErrors([t.errors.uploadTextFile]);
      return;
    }

    setBiblioUploadedFile(file);
    
    try {
      const text = await file.text();
      const { numbers, errors } = parseAndValidateBiblioFileContent(text);
      setBiblioNumbers(numbers);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setValidationErrors([]);
      }
    } catch (error) {
      setValidationErrors([t.errors.errorReadingFile]);
    }
  };

  const parseAndValidateBiblioFileContent = (text: string): { numbers: string[]; errors: string[] } => {
    const lines = text.split(/\r?\n/);
    const numbers: string[] = [];
    const errors: string[] = [];
    
    lines.forEach((line, lineIndex) => {
      const lineNumber = lineIndex + 1;
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (trimmedLine === '') {
        return;
      }
      
      // Check if line contains comma-separated values
      if (trimmedLine.includes(',')) {
        const values = trimmedLine.split(',');
        values.forEach((value, valueIndex) => {
          const trimmedValue = value.trim();
          if (trimmedValue === '') return;
          
          const validation = validateSingleBiblioNumber(trimmedValue, lineNumber, valueIndex + 1, true);
          if (validation.isValid) {
            numbers.push(trimmedValue);
          } else {
            errors.push(...validation.errors);
          }
        });
      } else {
        // Single value per line
        const validation = validateSingleBiblioNumber(trimmedLine, lineNumber, 1, false);
        if (validation.isValid) {
          numbers.push(trimmedLine);
        } else {
          errors.push(...validation.errors);
        }
      }
    });
    
    return { numbers, errors };
  };

  const validateSingleBiblioNumber = (value: string, lineNumber: number, position: number, isCommaSeparated: boolean): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const positionText = isCommaSeparated ? `, position ${position}` : '';
    
    // Check for non-numeric characters
    if (!/^\d+$/.test(value)) {
      const invalidChars = value.match(/[^\d]/g)?.join('') || '';
      errors.push(`Line ${lineNumber}${positionText}: "${value}" contains invalid characters (${invalidChars}). Only digits 0-9 are allowed for biblio numbers.`);
      return { isValid: false, errors };
    }
    
    // Biblio numbers can be any length (unlike magazine numbers which must be 4 digits)
    if (value.length === 0) {
      errors.push(`Line ${lineNumber}${positionText}: Empty biblio number found.`);
      return { isValid: false, errors };
    }
    
    return { isValid: true, errors: [] };
  };

  const parseAndValidateFileContent = (text: string): { numbers: string[]; errors: string[] } => {
    const lines = text.split(/\r?\n/);
    const numbers: string[] = [];
    const errors: string[] = [];
    
    lines.forEach((line, lineIndex) => {
      const lineNumber = lineIndex + 1;
      const trimmedLine = line.trim();
      
      // Skip empty lines
      if (trimmedLine === '') {
        return;
      }
      
      // Check if line contains comma-separated values
      if (trimmedLine.includes(',')) {
        const values = trimmedLine.split(',');
        values.forEach((value, valueIndex) => {
          const trimmedValue = value.trim();
          if (trimmedValue === '') return;
          
          const validation = validateSingleNumber(trimmedValue, lineNumber, valueIndex + 1, true);
          if (validation.isValid) {
            numbers.push(trimmedValue);
          } else {
            errors.push(...validation.errors);
          }
        });
      } else {
        // Single value per line
        const validation = validateSingleNumber(trimmedLine, lineNumber, 1, false);
        if (validation.isValid) {
          numbers.push(trimmedLine);
        } else {
          errors.push(...validation.errors);
        }
      }
    });
    
    return { numbers, errors };
  };

  const validateSingleNumber = (value: string, lineNumber: number, position: number, isCommaSeparated: boolean): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const positionText = isCommaSeparated ? `, position ${position}` : '';
    
    // Check for non-numeric characters
    if (!/^\d+$/.test(value)) {
      const invalidChars = value.match(/[^\d]/g)?.join('') || '';
      errors.push(`Line ${lineNumber}${positionText}: "${value}" contains invalid characters (${invalidChars}). Only digits 0-9 are allowed.`);
      return { isValid: false, errors };
    }
    
    // Check if it's exactly 4 digits
    if (value.length !== 4) {
      if (value.length < 4) {
        errors.push(`Line ${lineNumber}${positionText}: "${value}" has only ${value.length} digit(s). Must be exactly 4 digits (pad with leading zeros: ${value.padStart(4, '0')}).`);
      } else {
        errors.push(`Line ${lineNumber}${positionText}: "${value}" has ${value.length} digits. Must be exactly 4 digits. Consider breaking it into separate 4-digit numbers.`);
      }
      return { isValid: false, errors };
    }
    
    return { isValid: true, errors: [] };
  };

  const parseNumbersFromText = (text: string): string[] => {
    // This is now handled by parseAndValidateFileContent
    const { numbers } = parseAndValidateFileContent(text);
    return numbers;
  };

  const validateFileNumbers = (numbers: string[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (numbers.length === 0) {
      errors.push(t.errors.noValidNumbers);
      return { isValid: false, errors };
    }
    
    // Additional validation can be added here if needed
    // The main validation is now handled in parseAndValidateFileContent
    
    return { isValid: errors.length === 0, errors };
  };

  const handleAuthorTypeChange = (value: string, checked: boolean) => {
    if (checked) {
      setAuthorTypeFilter(prev => [...prev, value]);
    } else {
      setAuthorTypeFilter(prev => prev.filter(item => item !== value));
    }
  };

  const clearFormInputs = () => {
    setMagazineNumbers('');
    setStartYear('');
    setEndYear('');
    setAuthorName('');
    setValidationErrors([]);
    setInputMethod('manual');
    setUploadedFile(null);
    setFileNumbers([]);
    setAbstractFilter('');
    setBiblioUploadedFile(null);
    setBiblioNumbers([]);
    setAuthorTypeFilter([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate and prepare data based on input method
    let validation: { isValid: boolean; errors: string[] };
    let numbersToUse: string[] = [];
    let biblioToUse: string[] = [];
    
    if (inputMethod === 'manual') {
      validation = validateMagazineNumbers(magazineNumbers);
      numbersToUse = magazineNumbers.split(',').map((m: string) => m.trim()).filter((m: string) => m !== '');
    } else if (inputMethod === 'file') {
      validation = validateFileNumbers(fileNumbers);
      numbersToUse = fileNumbers;
    } else if (inputMethod === 'biblio') {
      // For biblio method, we don't validate magazine numbers but biblio numbers
      if (biblioNumbers.length === 0) {
        setValidationErrors(['Please upload a biblio numbers file.']);
        return;
      }
      validation = { isValid: true, errors: [] };
      biblioToUse = biblioNumbers;
      numbersToUse = []; // No magazine numbers when using biblio filtering
    } else {
      validation = { isValid: false, errors: ['Invalid input method'] };
    }
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Clear validation errors if valid
    setValidationErrors([]);
    
    const formData = {
      reportType,
      magazineNumbers: numbersToUse,
      startYear: startYear ? parseInt(startYear) : undefined,
      endYear: endYear ? parseInt(endYear) : undefined,
      authorName: authorName || undefined,
      abstractFilter: abstractFilter || undefined,
      biblioNumbers: biblioToUse.length > 0 ? biblioToUse : undefined,
      authorTypeFilter: authorTypeFilter.length > 0 ? authorTypeFilter : undefined
    };
    
    onGenerate(formData);
    
    // Clear form inputs after successful generation
    clearFormInputs();
  };

  // Determine which fields to show based on report type
  const showAuthorFilter = ['export_research_authors', 'export_author_data', 'export_translations_titles_authors'].includes(reportType);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Magazine Numbers Input */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-800 mb-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              <span>{t.steps.magazineNumbersInputMethod}</span>
            </div>
          </label>
          
          {/* Input Method Selection */}
          <div className="flex space-x-4 mb-4">
            <button
              type="button"
              onClick={() => {
                setInputMethod('manual');
                setValidationErrors([]);
                setUploadedFile(null);
                setFileNumbers([]);
                setBiblioUploadedFile(null);
                setBiblioNumbers([]);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                inputMethod === 'manual'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.steps.manualEntry}
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMethod('file');
                setValidationErrors([]);
                setMagazineNumbers('');
                setBiblioUploadedFile(null);
                setBiblioNumbers([]);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                inputMethod === 'file'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.steps.uploadFile}
            </button>
            <button
              type="button"
              onClick={() => {
                setInputMethod('biblio');
                setValidationErrors([]);
                setMagazineNumbers('');
                setUploadedFile(null);
                setFileNumbers([]);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                inputMethod === 'biblio'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t.inputOptions.biblio}
            </button>
          </div>

          {/* Manual Entry */}
          {inputMethod === 'manual' && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <input
                id="magazineNumbers"
                type="text"
                value={magazineNumbers}
                onChange={(e) => {
                  setMagazineNumbers(e.target.value);
                  if (validationErrors.length > 0) {
                    setValidationErrors([]);
                  }
                }}
                className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500 ${
                  validationErrors.length > 0 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-200 focus:ring-red-500 focus:border-red-500'
                }`}
                placeholder={t.steps.magazineNumbersPlaceholder}
              />
            </div>
          )}

          {/* File Upload */}
          {inputMethod === 'file' && (
            <div>
              <input
                id="fileUpload"
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900"
              />
              <p className="mt-2 text-sm text-gray-600">
                {t.steps.uploadFileHelper}
              </p>
              
              {uploadedFile && (
                <div className={`mt-3 p-3 border rounded-md ${
                  validationErrors.length > 0 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center">
                    <svg className={`w-4 h-4 mr-2 ${
                      validationErrors.length > 0 ? 'text-yellow-500' : 'text-green-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={validationErrors.length > 0 
                          ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                          : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        } />
                    </svg>
                    <span className={`text-sm ${
                      validationErrors.length > 0 ? 'text-yellow-800' : 'text-green-800'
                    }`}>
                      {t.forms.fileUploaded} {uploadedFile.name} 
                      {validationErrors.length === 0 && (
                        <span> ({fileNumbers.length} {t.forms.validNumbersFound})</span>
                      )}
                      {validationErrors.length > 0 && (
                        <span> ({fileNumbers.length} {t.forms.validNumbersFound}, {validationErrors.length} {t.forms.errors})</span>
                      )}
                    </span>
                  </div>
                  {fileNumbers.length > 0 && validationErrors.length === 0 && (
                    <div className="mt-2 text-sm text-green-700">
                      <strong>{t.forms.validNumbersFoundLabel}</strong> {fileNumbers.slice(0, 10).join(', ')}
                      {fileNumbers.length > 10 && ` ... and ${fileNumbers.length - 10} more`}
                    </div>
                  )}
                  {validationErrors.length > 0 && fileNumbers.length > 0 && (
                    <div className="mt-2 text-sm text-green-700">
                      <strong>{t.forms.validNumbersFoundLabel}</strong> {fileNumbers.slice(0, 5).join(', ')}
                      {fileNumbers.length > 5 && ` ... and ${fileNumbers.length - 5} more`}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Biblio Numbers Upload */}
          {inputMethod === 'biblio' && (
            <div>
              <input
                id="biblioFileUpload"
                type="file"
                accept=".txt,text/plain"
                onChange={handleBiblioFileUpload}
                className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900"
              />
              <p className="mt-2 text-sm text-gray-600">
                Upload a .txt file with biblio numbers (one per line or comma-separated). This will filter results to only include these specific records.
              </p>
              
              {biblioUploadedFile && (
                <div className={`mt-3 p-3 border rounded-md ${
                  validationErrors.length > 0 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <div className="flex items-center">
                    <svg className={`w-4 h-4 mr-2 ${
                      validationErrors.length > 0 ? 'text-yellow-500' : 'text-green-500'
                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d={validationErrors.length > 0 
                          ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                          : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        } />
                    </svg>
                    <span className={`text-sm ${
                      validationErrors.length > 0 ? 'text-yellow-800' : 'text-green-800'
                    }`}>
                      File uploaded: {biblioUploadedFile.name} 
                      {validationErrors.length === 0 && (
                        <span> ({biblioNumbers.length} biblio numbers found)</span>
                      )}
                      {validationErrors.length > 0 && (
                        <span> ({biblioNumbers.length} valid, {validationErrors.length} errors)</span>
                      )}
                    </span>
                  </div>
                  {biblioNumbers.length > 0 && validationErrors.length === 0 && (
                    <div className="mt-2 text-sm text-green-700">
                      <strong>Biblio Numbers:</strong> {biblioNumbers.slice(0, 10).join(', ')}
                      {biblioNumbers.length > 10 && ` ... and ${biblioNumbers.length - 10} more`}
                    </div>
                  )}
                  {validationErrors.length > 0 && biblioNumbers.length > 0 && (
                    <div className="mt-2 text-sm text-green-700">
                      <strong>Valid Biblio Numbers:</strong> {biblioNumbers.slice(0, 5).join(', ')}
                      {biblioNumbers.length > 5 && ` ... and ${biblioNumbers.length - 5} more`}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">{t.forms.magazineNumberValidationErrors}</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <p className="mt-2 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-200">
            {t.steps.magazineNumbersHelper}
          </p>
        </div>

        {/* Start Year */}
        <div>
          <label htmlFor="startYear" className="block text-sm font-bold text-gray-800 mb-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{t.forms.startYear}</span>
            </div>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <input
              id="startYear"
              type="number"
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              min="1900"
              max="2030"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
              placeholder={t.steps.startYearPlaceholder}
            />
          </div>
        </div>

        {/* End Year */}
        <div>
          <label htmlFor="endYear" className="block text-sm font-bold text-gray-800 mb-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{t.forms.endYear}</span>
            </div>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <input
              id="endYear"
              type="number"
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
              min="1900"
              max="2030"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
              placeholder={t.steps.endYearPlaceholder}
            />
          </div>
        </div>

        {/* Author Name */}
        {/* {showAuthorFilter && (
          <div className="md:col-span-2">
            <label htmlFor="authorName" className="block text-sm font-bold text-gray-800 mb-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{t.forms.authorNameOptional}</span>
              </div>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                id="authorName"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-gray-50 focus:bg-white text-gray-900 placeholder-gray-500"
                placeholder={t.forms.authorPlaceholder}
              />
            </div>
            <p className="mt-2 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-200">
              💡 <strong>{t.forms.authorTip}</strong>
            </p>
          </div>
        )} */}

        {/* Abstract Filter Options - only for abstract field report */}
        {reportType === 'export_abstract_field' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-800 mb-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                <span>{t.abstractFilter.filterByAbstractType}</span>
              </div>
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="radio"
                  id="without_abstract"
                  name="abstractFilter"
                  value="without_abstract"
                  checked={abstractFilter === 'without_abstract'}
                  onChange={(e) => setAbstractFilter(e.target.value)}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500"
                />
                <label htmlFor="without_abstract" className="ml-2 text-sm font-medium text-gray-700">
                  {t.abstractFilter.withoutAbstract}
                </label>
                <p className="ml-6 text-xs text-gray-500">{t.abstractFilter.withoutAbstractDesc}</p>
              </div>
              
              <div>
                <input
                  type="radio"
                  id="missing_english"
                  name="abstractFilter"
                  value="missing_english"
                  checked={abstractFilter === 'missing_english'}
                  onChange={(e) => setAbstractFilter(e.target.value)}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500"
                />
                <label htmlFor="missing_english" className="ml-2 text-sm font-medium text-gray-700">
                  {t.abstractFilter.missingEnglish}
                </label>
                <p className="ml-6 text-xs text-gray-500">{t.abstractFilter.missingEnglishDesc}</p>
              </div>
              
              <div>
                <input
                  type="radio"
                  id="other_language"
                  name="abstractFilter"
                  value="other_language"
                  checked={abstractFilter === 'other_language'}
                  onChange={(e) => setAbstractFilter(e.target.value)}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500"
                />
                <label htmlFor="other_language" className="ml-2 text-sm font-medium text-gray-700">
                  {t.abstractFilter.otherLanguage}
                </label>
                <p className="ml-6 text-xs text-gray-500">{t.abstractFilter.otherLanguageDesc}</p>
              </div>
              
              <div>
                <input
                  type="radio"
                  id="mandumah_abstract"
                  name="abstractFilter"
                  value="mandumah_abstract"
                  checked={abstractFilter === 'mandumah_abstract'}
                  onChange={(e) => setAbstractFilter(e.target.value)}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500"
                />
                <label htmlFor="mandumah_abstract" className="ml-2 text-sm font-medium text-gray-700">
                  {t.abstractFilter.mandumahAbstract}
                </label>
                <p className="ml-6 text-xs text-gray-500">{t.abstractFilter.mandumahAbstractDesc}</p>
              </div>
            </div>
            
         
          </div>
        )}

        {/* Author Type Filter - only for research authors report */}
        {reportType === 'export_research_authors' && (
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-800 mb-3">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{t.authorTypeFilter.filterByAuthorType}</span>
              </div>
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="checkbox"
                  id="main_author_100"
                  name="authorType"
                  value="100"
                  checked={authorTypeFilter.includes('100')}
                  onChange={(e) => handleAuthorTypeChange('100', e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500 rounded"
                />
                <label htmlFor="main_author_100" className="ml-2 text-sm font-medium text-gray-700">
                  {t.authorTypeFilter.mainAuthor100}
                </label>
                <p className="ml-6 text-xs text-gray-500">{t.authorTypeFilter.mainAuthorDesc}</p>
              </div>
              
              <div>
                <input
                  type="checkbox"
                  id="additional_authors_700"
                  name="authorType"
                  value="700"
                  checked={authorTypeFilter.includes('700')}
                  onChange={(e) => handleAuthorTypeChange('700', e.target.checked)}
                  className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500 rounded"
                />
                <label htmlFor="additional_authors_700" className="ml-2 text-sm font-medium text-gray-700">
                  {t.authorTypeFilter.additionalAuthors700}
                </label>
                <p className="ml-6 text-xs text-gray-500">{t.authorTypeFilter.additionalAuthorsDesc}</p>
              </div>
            </div>
            
         
          </div>
        )}

       
      </div>

      {/* Generate Button */}
      <div className="flex flex-col items-center pt-4 space-y-4">
        <button
          type="submit"
          disabled={isGenerating}
          style={{ backgroundColor: '#C02025' }}
          className="px-8 py-4 text-white rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-bold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 min-w-[200px]"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              <span>{t.forms.generating}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{t.forms.generateReport}</span>
            </div>
          )}
        </button>

        {/* Record Count Display */}
        {recordCount > 0 && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 max-w-md">
            <div className="flex items-center justify-center">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mr-3">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-green-900">
                  {recordCount} {recordCount === 1 ? t.forms.recordExportedSingle : t.forms.recordExportedPlural}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  {t.forms.checkDownloadsFolder}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}