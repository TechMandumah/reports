import { DOMParser } from 'xmldom';
import { MarcField, ParsedMarcData } from '@/types/database';

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
