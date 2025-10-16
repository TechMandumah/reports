'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslation } from '@/utils/localization';

interface EstenadUniversityReportFormProps {
  onGenerate: (formData: any) => void;
  isGenerating: boolean;
  recordCount?: number;
  showSuccessMessage?: boolean;
}

export default function EstenadUniversityReportForm({ 
  onGenerate, 
  isGenerating,
  recordCount = 0,
  showSuccessMessage = false 
}: EstenadUniversityReportFormProps) {
  const { language, isRTL } = useLanguage();
  const t = getTranslation(language);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [authorIds, setAuthorIds] = useState<string[]>([]);
  const [inputMethod, setInputMethod] = useState<'author' | 'biblio'>('author');
  const [biblioUploadedFile, setBiblioUploadedFile] = useState<File | null>(null);
  const [biblioNumbers, setBiblioNumbers] = useState<string[]>([]);

  // Fixed field 373 (Associated Group) with subfields a and q
  const selectedFields = ['373'];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('text') && !file.name.endsWith('.txt')) {
      setValidationErrors([String(t.estenad.pleaseUploadTxtFile)]);
      return;
    }

    setUploadedFile(file);
    
    try {
      const text = await file.text();
      const { numbers, errors } = parseAndValidateAuthorIds(text);
      setAuthorIds(numbers);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setValidationErrors([]);
      }
    } catch (error) {
      setValidationErrors(['Error reading file']);
    }
  };

  const parseAndValidateAuthorIds = (text: string): { numbers: string[]; errors: string[] } => {
    const lines = text.split(/\r?\n/);
    const numbers: string[] = [];
    const errors: string[] = [];
    
    lines.forEach((line, lineIndex) => {
      const lineNumber = lineIndex + 1;
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        return;
      }
      
      if (trimmedLine.includes(',')) {
        const values = trimmedLine.split(',');
        values.forEach((value, valueIndex) => {
          const trimmedValue = value.trim();
          if (trimmedValue === '') return;
          
          const validation = validateSingleAuthorId(trimmedValue, lineNumber, valueIndex + 1, true);
          if (validation.isValid) {
            numbers.push(trimmedValue);
          } else {
            errors.push(...validation.errors);
          }
        });
      } else {
        const validation = validateSingleAuthorId(trimmedLine, lineNumber, 1, false);
        if (validation.isValid) {
          numbers.push(trimmedLine);
        } else {
          errors.push(...validation.errors);
        }
      }
    });
    
    return { numbers, errors };
  };

  const validateSingleAuthorId = (value: string, lineNumber: number, position: number, isCommaSeparated: boolean): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const positionText = isCommaSeparated ? `, position ${position}` : '';
    
    if (!/^\d+$/.test(value)) {
      const invalidChars = value.match(/[^\d]/g)?.join('') || '';
      errors.push(`Line ${lineNumber}${positionText}: "${value}" contains invalid characters (${invalidChars}). Only digits 0-9 are allowed for author IDs.`);
      return { isValid: false, errors };
    }
    
    if (value.length === 0) {
      errors.push(`Line ${lineNumber}${positionText}: Empty author ID found.`);
      return { isValid: false, errors };
    }
    
    return { isValid: true, errors: [] };
  };

  const handleBiblioFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('text') && !file.name.endsWith('.txt')) {
      setValidationErrors([String(t.estenad.pleaseUploadTxtFile)]);
      return;
    }

    setBiblioUploadedFile(file);
    
    try {
      const text = await file.text();
      const { numbers, errors } = parseAndValidateBiblioNumbers(text);
      setBiblioNumbers(numbers);
      
      if (errors.length > 0) {
        setValidationErrors(errors);
      } else {
        setValidationErrors([]);
      }
    } catch (error) {
      setValidationErrors(['Error reading file']);
    }
  };

  const parseAndValidateBiblioNumbers = (text: string): { numbers: string[]; errors: string[] } => {
    const lines = text.split(/\r?\n/);
    const numbers: string[] = [];
    const errors: string[] = [];
    
    lines.forEach((line, lineIndex) => {
      const lineNumber = lineIndex + 1;
      const trimmedLine = line.trim();
      
      if (trimmedLine === '') {
        return;
      }
      
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
    
    if (!/^\d+$/.test(value)) {
      const invalidChars = value.match(/[^\d]/g)?.join('') || '';
      errors.push(`Line ${lineNumber}${positionText}: "${value}" contains invalid characters (${invalidChars}). Only digits 0-9 are allowed for biblio numbers.`);
      return { isValid: false, errors };
    }
    
    if (value.length === 0) {
      errors.push(`Line ${lineNumber}${positionText}: Empty biblio number found.`);
      return { isValid: false, errors };
    }
    
    return { isValid: true, errors: [] };
  };

  const clearFormInputs = () => {
    setValidationErrors([]);
    setUploadedFile(null);
    setAuthorIds([]);
    setInputMethod('author');
    setBiblioUploadedFile(null);
    setBiblioNumbers([]);
  };

  const handleGenerate = () => {
    if (inputMethod === 'author' && authorIds.length === 0) {
      setValidationErrors([String(t.estenad.pleaseUploadAuthorIdsFile)]);
      return;
    }

    if (inputMethod === 'biblio' && biblioNumbers.length === 0) {
      setValidationErrors([String(t.estenad.pleaseUploadBiblioNumbersFile)]);
      return;
    }

    setValidationErrors([]);
    
    const formData = {
      reportType: 'estenad_university_report',
      inputMethod,
      authorIds: inputMethod === 'author' ? authorIds : undefined,
      biblioNumbers: inputMethod === 'biblio' ? biblioNumbers : undefined,
      selectedFields: ['373'], // Fixed field 373
      exportType: 'full'
    };
    
    onGenerate(formData);
    clearFormInputs();
  };

  return (
    <div className="space-y-6">
      <h3 className={`text-lg font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
        {language === 'ar' ? 'تقرير ترجمات الجامعات للإسناد' : 'Estenad Universities Translations Report'}
      </h3>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <p className={`text-sm text-blue-800 ${isRTL ? 'text-right' : 'text-left'}`}>
          {language === 'ar' 
            ? 'هذا التقرير يستخرج بيانات الحقل 373 (المجموعة المرتبطة) من سجلات الاستناد. قم برفع معرفات المؤلفين أو أرقام الببليو للبدء.'
            : 'This report extracts field 373 (Associated Group) data from authority records. Upload author IDs or biblio numbers to begin.'}
        </p>
      </div>

      {/* Input Method Selection */}
      <div className={`flex gap-4 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <button
          type="button"
          onClick={() => {
            setInputMethod('author');
            setBiblioUploadedFile(null);
            setBiblioNumbers([]);
            setValidationErrors([]);
          }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            inputMethod === 'author'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {String(t.estenad.uploadAuthorIds)}
        </button>
        <button
          type="button"
          onClick={() => {
            setInputMethod('biblio');
            setUploadedFile(null);
            setAuthorIds([]);
            setValidationErrors([]);
          }}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            inputMethod === 'biblio'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {String(t.estenad.uploadBiblioNumbers)}
        </button>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        {/* Author IDs Upload */}
        {inputMethod === 'author' && (
          <div>
            <label htmlFor="authorIdsUpload" className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {String(t.estenad.authorIdsFileRequired)}
            </label>
          
            <input
              id="authorIdsUpload"
              type="file"
              accept=".txt,text/plain"
              onChange={handleFileUpload}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black ${isRTL ? 'text-right' : 'text-left'}`}
            />
            <p className={`mt-2 text-xs text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
              {String(t.estenad.uploadAuthorIdsHelper)}
            </p>
          
            {uploadedFile && (
              <div className={`mt-3 p-3 border rounded-md ${
                validationErrors.length > 0 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    {uploadedFile.name}
                  </span>
                </div>
                {authorIds.length > 0 && validationErrors.length === 0 && (
                  <div className="mt-2 text-sm text-green-700">
                    ✓ {String(t.estenad.foundValidAuthorIds).replace('{count}', authorIds.length.toString())}: {authorIds.slice(0, 10).join(', ')}
                    {authorIds.length > 10 && ` ... ${String(t.estenad.andMore).replace('{count}', (authorIds.length - 10).toString())}`}
                  </div>
                )}
                {validationErrors.length > 0 && authorIds.length > 0 && (
                  <div className="mt-2 text-sm text-green-700">
                    ✓ {String(t.estenad.foundValidAuthorIds).replace('{count}', authorIds.length.toString())}: {authorIds.slice(0, 5).join(', ')}
                    {authorIds.length > 5 && ` ... ${String(t.estenad.andMore).replace('{count}', (authorIds.length - 5).toString())}`}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Biblio Numbers Upload */}
        {inputMethod === 'biblio' && (
          <div>
            <label htmlFor="biblioUpload" className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
              {String(t.estenad.biblioNumbersFileRequired)}
            </label>
            
            <input
              id="biblioUpload"
              type="file"
              accept=".txt,text/plain"
              onChange={handleBiblioFileUpload}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-black ${isRTL ? 'text-right' : 'text-left'}`}
            />
            <p className={`mt-2 text-xs text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
              {String(t.estenad.uploadBiblioNumbersHelper)}
            </p>
            
            {biblioUploadedFile && (
              <div className={`mt-3 p-3 border rounded-md ${
                validationErrors.length > 0 
                  ? 'bg-yellow-50 border-yellow-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">
                    {biblioUploadedFile.name}
                  </span>
                </div>
                {biblioNumbers.length > 0 && validationErrors.length === 0 && (
                  <div className="mt-2 text-sm text-green-700">
                    ✓ {String(t.estenad.foundValidBiblioNumbers.replace('{count}', biblioNumbers.length.toString()))}: {biblioNumbers.slice(0, 10).join(', ')}
                    {biblioNumbers.length > 10 && ` ${String(t.estenad.andMore.replace('{count}', (biblioNumbers.length - 10).toString()))}`}
                  </div>
                )}
                {validationErrors.length > 0 && biblioNumbers.length > 0 && (
                  <div className="mt-2 text-sm text-green-700">
                    ✓ {String(t.estenad.foundValidBiblioNumbers.replace('{count}', biblioNumbers.length.toString()))}: {biblioNumbers.slice(0, 5).join(', ')}
                    {biblioNumbers.length > 5 && ` ${String(t.estenad.andMore.replace('{count}', (biblioNumbers.length - 5).toString()))}`}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {String(t.estenad.validationErrors)}:
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || ((inputMethod === 'author' && authorIds.length === 0) || (inputMethod === 'biblio' && biblioNumbers.length === 0))}
          className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? String(t.forms.generating) : String(t.forms.generateReport)}
        </button>
      </div>

      {/* Generating Status */}
      {isGenerating && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 ${isRTL ? 'ml-3' : 'mr-3'}`}></div>
            <span className="text-blue-800">{String(t.forms.generating)}</span>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccessMessage && recordCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`w-5 h-5 bg-green-600 rounded-full flex items-center justify-center ${isRTL ? 'ml-3' : 'mr-3'}`}>
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-green-800">
              {String(t.estenad.successfullyExported).replace('{count}', String(recordCount))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
