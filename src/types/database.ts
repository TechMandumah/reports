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
  abstractFilter?: string;
  biblioNumbers?: string[];
  authorTypeFilter?: string[];
  authorIds?: string[]; // For auth_header table queries (estenad reports)
  urlList?: string[]; // For convert_url_to_biblio report
}

// Journal/Conference database interfaces (vtiger tables)
export interface VtigerAccount {
  accountid: number;
  account_no: string;
  accountname: string;
  parentid: number;
  account_type?: string;
  industry?: string;
  annualrevenue?: number;
  rating?: string;
  ownership?: string;
  siccode?: string;
  tickersymbol?: string;
  phone?: string;
  otherphone?: string;
  email1?: string;
  email2?: string;
  website?: string;
  fax?: string;
  employees: string; // Magazine numbers (0000-5999) or Conference numbers (6000-9999)
  emailoptout?: string;
  notify_owner?: string;
  isconvertedfromlead?: string;
}

export interface VtigerAccountsCF {
  accountid: number;
  cf_703?: string; // Publisher/Organization
  cf_707?: string; // Rights status
  cf_709?: string; // ISSN
  cf_711?: string; // ISBN
  cf_715?: string; // Status (متوقفة/مستمرة)
  cf_717?: string; // 
  cf_719?: string; // Frequency (فصلية/نصف سنوية)
  cf_721?: number;
  cf_723?: string;
  cf_725?: string;
  cf_727?: string; // Database/Category
  cf_729?: string; // Full database name
  cf_873?: number;
  cf_875?: string;
  cf_877?: string; // Country
  cf_883?: string; // English title
  cf_885?: string; // Transliteration
  cf_887?: string;
  cf_901?: string; // Subject area
  cf_903?: string; // English subject
  cf_905?: string;
  cf_907?: string;
  cf_919?: string;
  cf_921?: string;
  cf_923?: string;
  cf_925?: string;
  cf_931?: string; // Website URL
  cf_933?: Date;
}

// Combined journal/conference data for export
export interface JournalData extends VtigerAccount, VtigerAccountsCF {}
