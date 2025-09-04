import { DOMParser } from 'xmldom';
import { MarcField, ParsedMarcData } from '@/types/database';

// Enhanced MARC parsing interfaces
export interface MarcSubfield {
  code: string;
  value: string;
}

export interface EnhancedMarcField {
  tag: string;
  subfields: MarcSubfield[];
}

// Extract all instances of a specific MARC field with all subfields
export function extractAllMarcFields(marcxml: string, fieldTag: string): EnhancedMarcField[] {
  const fields: EnhancedMarcField[] = [];
  
  // Create regex pattern to match datafield tags
  const fieldPattern = new RegExp(`<datafield tag="${fieldTag}"[^>]*>(.*?)</datafield>`, 'gs');
  const fieldMatches = marcxml.matchAll(fieldPattern);
  
  for (const fieldMatch of fieldMatches) {
    const fieldContent = fieldMatch[1];
    const subfields: MarcSubfield[] = [];
    
    // Extract all subfields within this field
    const subfieldPattern = /<subfield code="([^"]+)">([^<]*)<\/subfield>/g;
    const subfieldMatches = fieldContent.matchAll(subfieldPattern);
    
    for (const subfieldMatch of subfieldMatches) {
      subfields.push({
        code: subfieldMatch[1],
        value: subfieldMatch[2].trim()
      });
    }
    
    if (subfields.length > 0) {
      fields.push({
        tag: fieldTag,
        subfields: subfields
      });
    }
  }
  
  return fields;
}

// Extract all subfields of specific codes from a field tag
export function extractSubfields(marcxml: string, fieldTag: string, subfieldCodes: string[]): string[] {
  const fields = extractAllMarcFields(marcxml, fieldTag);
  const values: string[] = [];
  
  fields.forEach(field => {
    field.subfields.forEach(subfield => {
      if (subfieldCodes.includes(subfield.code) && subfield.value.trim()) {
        values.push(subfield.value.trim());
      }
    });
  });
  
  return values;
}

// Extract titles from multiple MARC fields (245, 242, 246)
export function extractAllTitles(marcxml: string): {
  titles_245: string[];
  titles_242: string[];
  titles_246: string[];
  allTitles: string[];
} {
  const titles_245 = extractSubfields(marcxml, '245', ['a', 'b', 'c']);
  const titles_242 = extractSubfields(marcxml, '242', ['a', 'b', 'c']);
  const titles_246 = extractSubfields(marcxml, '246', ['a', 'b', 'c']);
  
  return {
    titles_245,
    titles_242,
    titles_246,
    allTitles: [...titles_245, ...titles_242, ...titles_246]
  };
}

// Extract authors and author IDs from multiple MARC fields (100, 700)
export function extractAllAuthors(marcxml: string): {
  mainAuthor: string;
  mainAuthorId: string;
  additionalAuthors: string[];
  additionalAuthorIds: string[];
  allAuthors: string[];
  allAuthorIds: string[];
} {
  // Extract main author (100)
  const mainAuthorFields = extractAllMarcFields(marcxml, '100');
  let mainAuthor = '';
  let mainAuthorId = '';
  
  if (mainAuthorFields.length > 0) {
    const field = mainAuthorFields[0]; // Usually only one 100 field
    const authorSubfield = field.subfields.find(sf => sf.code === 'a');
    const idSubfield = field.subfields.find(sf => sf.code === '9');
    
    mainAuthor = authorSubfield?.value || '';
    mainAuthorId = idSubfield?.value || '';
  }
  
  // Extract additional authors (700)
  const additionalAuthorFields = extractAllMarcFields(marcxml, '700');
  const additionalAuthors: string[] = [];
  const additionalAuthorIds: string[] = [];
  
  additionalAuthorFields.forEach(field => {
    const authorSubfield = field.subfields.find(sf => sf.code === 'a');
    const idSubfield = field.subfields.find(sf => sf.code === '9');
    
    if (authorSubfield?.value) {
      additionalAuthors.push(authorSubfield.value);
      additionalAuthorIds.push(idSubfield?.value || '');
    }
  });
  
  return {
    mainAuthor,
    mainAuthorId,
    additionalAuthors,
    additionalAuthorIds,
    allAuthors: [mainAuthor, ...additionalAuthors].filter(a => a.trim()),
    allAuthorIds: [mainAuthorId, ...additionalAuthorIds]
  };
}

// Format multiple values as a readable string
export function formatMultipleValues(values: string[], separator: string = '; '): string {
  return values.filter(v => v.trim()).join(separator);
}

// MARC field definitions with extraction paths
const MARC_FIELD_MAP: Record<string, { xpath: string; attribute?: string }> = {
  '000': { xpath: '//leader' },
  '001': { xpath: '//controlfield[@tag="001"]' },
  '024': { xpath: '//datafield[@tag="024"]/subfield[@code="a"]' },
  '041': { xpath: '//datafield[@tag="041"]/subfield[@code="a"]' },
  '044': { xpath: '//datafield[@tag="044"]/subfield[@code="b"]' },
  '100': { xpath: '//datafield[@tag="100"]/subfield[@code="a"]' },
  '110': { xpath: '//datafield[@tag="110"]/subfield[@code="a"]' },
  '242': { xpath: '//datafield[@tag="242"]/subfield[@code="a"]' },
  '245': { xpath: '//datafield[@tag="245"]/subfield[@code="a"]' },
  '246': { xpath: '//datafield[@tag="246"]/subfield[@code="a"]' },
  '260': { xpath: '//datafield[@tag="260"]/subfield[@code="b"]' },
  '300': { xpath: '//datafield[@tag="300"]/subfield[@code="a"]' },
  '336': { xpath: '//datafield[@tag="336"]/subfield[@code="a"]' },
  '500': { xpath: '//datafield[@tag="500"]/subfield[@code="a"]' },
  '520': { xpath: '//datafield[@tag="520"]/subfield[@code="a"]' },
  '653': { xpath: '//datafield[@tag="653"]/subfield[@code="a"]' },
  '692': { xpath: '//datafield[@tag="692"]/subfield[@code="a"]' },
  '700': { xpath: '//datafield[@tag="700"]/subfield[@code="a"]' },
  '773': { xpath: '//datafield[@tag="773"]/subfield[@code="s"]' },
  '856': { xpath: '//datafield[@tag="856"]/subfield[@code="u"]' },
  '930': { xpath: '//datafield[@tag="930"]/subfield[@code="a"]' },
  '995': { xpath: '//datafield[@tag="995"]/subfield[@code="a"]' }
};

// Simple XPath-like evaluation for XML nodes
function evaluateXPath(doc: Document, xpath: string): string | null {
  try {
    // Handle leader queries
    if (xpath.includes('leader')) {
      const leaders = doc.getElementsByTagName('leader');
      if (leaders.length > 0) {
        return leaders[0].textContent || '';
      }
    }
    
    // Handle controlfield queries
    if (xpath.includes('controlfield')) {
      const tag = xpath.match(/\[@tag="([^"]+)"\]/)?.[1];
      if (tag) {
        const controlFields = doc.getElementsByTagName('controlfield');
        for (let i = 0; i < controlFields.length; i++) {
          const field = controlFields[i];
          if (field.getAttribute('tag') === tag) {
            return field.textContent || '';
          }
        }
      }
    }
    
    // Handle datafield/subfield queries
    if (xpath.includes('datafield') && xpath.includes('subfield')) {
      const tagMatch = xpath.match(/datafield\[@tag="([^"]+)"\]/);
      const codeMatch = xpath.match(/subfield\[@code="([^"]+)"\]/);
      
      if (tagMatch && codeMatch) {
        const tag = tagMatch[1];
        const code = codeMatch[1];
        
        const dataFields = doc.getElementsByTagName('datafield');
        for (let i = 0; i < dataFields.length; i++) {
          const field = dataFields[i];
          if (field.getAttribute('tag') === tag) {
            const subFields = field.getElementsByTagName('subfield');
            for (let j = 0; j < subFields.length; j++) {
              const subField = subFields[j];
              if (subField.getAttribute('code') === code) {
                return subField.textContent || '';
              }
            }
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('XPath evaluation error:', error);
    return null;
  }
}

// Parse MARC XML metadata
export function parseMarcXML(marcXml: string): ParsedMarcData {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(marcXml, 'text/xml');
    
    const result: ParsedMarcData = {};
    
    // Extract each MARC field
    Object.entries(MARC_FIELD_MAP).forEach(([tag, config]) => {
      const value = evaluateXPath(doc, config.xpath);
      if (value) {
        // Map tag to meaningful property name
        switch (tag) {
          case '000':
            result.leader_000 = value;
            break;
          case '001':
            result.control_001 = value;
            break;
          case '024':
            result.identifier_024 = value;
            break;
          case '041':
            result.language_041 = value;
            break;
          case '044':
            result.country_044 = value;
            break;
          case '100':
            result.author_100 = value;
            break;
          case '110':
            result.corporate_author_110 = value;
            break;
          case '242':
            result.translated_title_242 = value;
            break;
          case '245':
            result.main_title_245 = value;
            break;
          case '246':
            result.alternative_title_246 = value;
            break;
          case '260':
            result.publication_info_260 = value;
            break;
          case '300':
            result.physical_description_300 = value;
            break;
          case '336':
            result.content_type_336 = value;
            break;
          case '500':
            result.general_note_500 = value;
            break;
          case '520':
            result.abstract_520 = value;
            break;
          case '653':
            result.keywords_653 = value;
            break;
          case '692':
            result.keywords_author_692 = value;
            break;
          case '700':
            result.additional_author_700 = value;
            break;
          case '773':
            result.host_item_773 = value;
            break;
          case '856':
            result.electronic_location_856 = value;
            break;
          case '930':
            result.uniform_title_930 = value;
            break;
          case '995':
            result.recommendation_995 = value;
            break;
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error('MARC XML parsing error:', error);
    return {};
  }
}

// Extract specific MARC field by tag
export function extractMarcField(marcXml: string, tag: string): string | null {
  try {
    const fieldConfig = MARC_FIELD_MAP[tag];
    if (!fieldConfig) {
      return null;
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(marcXml, 'text/xml');
    
    return evaluateXPath(doc, fieldConfig.xpath);
  } catch (error) {
    console.error(`Error extracting MARC field ${tag}:`, error);
    return null;
  }
}

// Extract all subfields for a specific MARC tag (e.g., 520)
export function extractMarcSubfields(marcXml: string, tag: string): Record<string, string> {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(marcXml, 'text/xml');
    const subfields: Record<string, string> = {};
    
    const dataFields = doc.getElementsByTagName('datafield');
    for (let i = 0; i < dataFields.length; i++) {
      const field = dataFields[i];
      if (field.getAttribute('tag') === tag) {
        const subFieldElements = field.getElementsByTagName('subfield');
        for (let j = 0; j < subFieldElements.length; j++) {
          const subField = subFieldElements[j];
          const code = subField.getAttribute('code');
          const value = subField.textContent;
          if (code && value) {
            // If subfield code already exists, combine with comma
            if (subfields[code]) {
              subfields[code] += ', ' + value;
            } else {
              subfields[code] = value;
            }
          }
        }
      }
    }
    
    return subfields;
  } catch (error) {
    console.error(`Error extracting MARC subfields for ${tag}:`, error);
    return {};
  }
}

// Extract multiple instances of the same MARC field
export function extractMultipleMarcFields(marcXml: string, tag: string, subFieldCode: string = 'a'): string[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(marcXml, 'text/xml');
    const values: string[] = [];
    
    // Handle controlfields (like 001)
    if (tag === '001' || tag === '000') {
      const controlFields = doc.getElementsByTagName(tag === '000' ? 'leader' : 'controlfield');
      for (let i = 0; i < controlFields.length; i++) {
        const field = controlFields[i];
        if (tag === '000' || field.getAttribute('tag') === tag) {
          const value = field.textContent;
          if (value) {
            values.push(value);
          }
        }
      }
    } else {
      // Handle datafields
      const dataFields = doc.getElementsByTagName('datafield');
      for (let i = 0; i < dataFields.length; i++) {
        const field = dataFields[i];
        if (field.getAttribute('tag') === tag) {
          const subFields = field.getElementsByTagName('subfield');
          
          // Collect all subfield values for this field instance and combine with commas
          const fieldSubfields: string[] = [];
          for (let j = 0; j < subFields.length; j++) {
            const subField = subFields[j];
            if (subField.getAttribute('code') === subFieldCode) {
              const value = subField.textContent;
              if (value) {
                fieldSubfields.push(value);
              }
            }
          }
          
          // Join subfields within the same field with commas
          if (fieldSubfields.length > 0) {
            values.push(fieldSubfields.join(', '));
          }
        }
      }
    }
    
    return values;
  } catch (error) {
    console.error(`Error extracting multiple MARC fields for ${tag}:`, error);
    return [];
  }
}

// Extract all instances of all MARC fields as a structured object
export function extractAllMarcFieldInstances(marcXml: string): Record<string, string[]> {
  const allFields: Record<string, string[]> = {};
  
  Object.keys(MARC_FIELD_MAP).forEach(tag => {
    const subFieldCode = MARC_FIELD_MAP[tag].xpath.match(/subfield\[@code="([^"]+)"\]/)?.[1] || 'a';
    const values = extractMultipleMarcFields(marcXml, tag, subFieldCode);
    if (values.length > 0) {
      allFields[tag] = values;
    }
  });
  
  return allFields;
}

// Extract main author (field 100) with author ID from subfield 9
export function extractMainAuthorWithId(marcXml: string): { author: string; authorId: string | null } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(marcXml, 'text/xml');
  
  const dataFields = doc.getElementsByTagName('datafield');
  for (let i = 0; i < dataFields.length; i++) {
    const field = dataFields[i];
    if (field.getAttribute('tag') === '100') {
      let author = '';
      let authorId: string | null = null;
      
      const subfields = field.getElementsByTagName('subfield');
      for (let j = 0; j < subfields.length; j++) {
        const subfield = subfields[j];
        const code = subfield.getAttribute('code');
        const value = subfield.textContent || '';
        
        if (code === 'a') {
          author = value;
        } else if (code === '9') {
          authorId = value;
        }
      }
      
      return { author, authorId };
    }
  }
  
  return { author: '', authorId: null };
}

// Extract all additional authors (field 700) with author IDs from subfield 9
export function extractAdditionalAuthorsWithIds(marcXml: string): Array<{ author: string; authorId: string | null }> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(marcXml, 'text/xml');
  const authors: Array<{ author: string; authorId: string | null }> = [];
  
  const dataFields = doc.getElementsByTagName('datafield');
  for (let i = 0; i < dataFields.length; i++) {
    const field = dataFields[i];
    if (field.getAttribute('tag') === '700') {
      let author = '';
      let authorId: string | null = null;
      
      const subfields = field.getElementsByTagName('subfield');
      for (let j = 0; j < subfields.length; j++) {
        const subfield = subfields[j];
        const code = subfield.getAttribute('code');
        const value = subfield.textContent || '';
        
        if (code === 'a') {
          author = value;
        } else if (code === '9') {
          authorId = value;
        }
      }
      
      if (author) {
        authors.push({ author, authorId });
      }
    }
  }
  
  return authors;
}

// Get all available MARC fields from XML
export function getAllMarcFields(marcXml: string): MarcField[] {
  const fields: MarcField[] = [];
  
  Object.keys(MARC_FIELD_MAP).forEach(tag => {
    const value = extractMarcField(marcXml, tag);
    if (value) {
      fields.push({ tag, value });
    }
  });
  
  return fields;
}
