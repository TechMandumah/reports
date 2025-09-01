// Database entity interfaces
export interface BiblioRecord {
  biblionumber: number;
  frameworkcode?: string;
  author?: string;
  title?: string;
  medium?: string;
  subtitle?: string;
  part_number?: string;
  part_name?: string;
  unititle?: string;
  notes?: string;
  serial?: string;
  seriestitle?: string;
  copyrightdate?: number;
  timestamp?: Date;
  datecreated?: Date;
  abstract?: string;
  // Fields from biblioitems join
  url?: string;
  journalnum?: number;
  volumenumber?: string;
  issuenumber?: string;
}

export interface BiblioMetadata {
  id: number;
  biblionumber: number;
  format: 'marcxml';
  schema: 'MARC21';
  metadata: string;
  timestamp: Date;
}

export interface BiblioItems {
  biblioitemnumber: number;
  biblionumber: number;
  volume?: string;
  number?: string;
  itemtype?: string;
  isbn?: string;
  issn?: string;
  ean?: string;
  publicationyear?: number;
  publishercode?: string;
  volumedate?: Date;
  editionresponsibility?: string;
  timestamp?: Date;
  illus?: string;
  pages?: string;
  notes?: string;
  size?: string;
  place?: string;
  lccn?: string;
  url?: string;
  journalnum?: number;
  volumenumber?: number;
  issuenumber?: number;
}

// MARC field extraction interfaces
export interface MarcField {
  tag: string;
  value: string;
}

export interface ParsedMarcData {
  leader_000?: string;
  control_001?: string;
  identifier_024?: string;
  language_041?: string;
  country_044?: string;
  author_100?: string;
  corporate_author_110?: string;
  translated_title_242?: string;
  main_title_245?: string;
  alternative_title_246?: string;
  publication_info_260?: string;
  physical_description_300?: string;
  content_type_336?: string;
  general_note_500?: string;
  abstract_520?: string;
  keywords_653?: string;
  keywords_author_692?: string;
  additional_author_700?: string;
  host_item_773?: string;
  electronic_location_856?: string;
  uniform_title_930?: string;
  recommendation_995?: string;
}

// Report query result interface
export interface ReportQueryResult extends BiblioRecord {
  url: string;
  biblio: string;
  link: string;
  // MARC fields will be added dynamically based on selected fields
  [key: string]: any;
}

// Query filters interface
export interface QueryFilters {
  magazineNumbers?: string[];
  startYear?: number;
  endYear?: number;
  authorName?: string;
  selectedFields?: string[];
  isPreview?: boolean;
}
