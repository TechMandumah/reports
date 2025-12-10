// Raw download action from stats database
export interface DownloadAction {
  id: number;
  visitor_id: number;
  session_id: number;
  site_id: string;
  timestamp: number;
  yyyymmdd: number;
  year: number;
  month: number;
  day: number;
  dayofweek: string;
  ip_address: string;
  language: string;
  medium: string;
  action_name: string;
  action_label: string;
  action_group: string;
  cv1_value?: string; // login username
}

// Parsed download information
export interface ParsedDownload {
  biblionumber: number;
  url: string;
  magazineNumber: string;
  fileName: string;
  database?: string; // edusearch, dissertations, islamicinfo, etc.
}

// Download record with biblio details
export interface DownloadRecord extends DownloadAction {
  parsed: ParsedDownload;
  biblio?: BiblioDetails;
}

// Biblio details from koha database
export interface BiblioDetails {
  biblionumber: number;
  author?: string;
  title?: string;
  copyrightdate?: number;
  abstract?: string;
  magazineNumber?: string;
  magazineTitle?: string;
  issn?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  publishDate?: string;
  subjects?: string[];
  categories?: string[];
}

// Download statistics filters
export interface DownloadsFilters {
  startDate?: string; // YYYYMMDD format
  endDate?: string; // YYYYMMDD format
  magazineNumber?: string;
  magazineNumbers?: string[];
  biblionumber?: number;
  biblionumbers?: number[];
  database?: string; // edusearch, dissertations, islamicinfo
  username?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

// Download statistics aggregation
export interface DownloadStats {
  totalDownloads: number;
  uniqueVisitors: number;
  uniqueSessions: number;
  downloadsByDate: DateDownloadCount[];
  downloadsByMagazine: MagazineDownloadCount[]; // Magazines (0000-5999)
  downloadsByDissertation: MagazineDownloadCount[]; // Dissertations (6000-9999)
  downloadsByDatabase: DatabaseDownloadCount[];
  downloadsByCategory: CategoryDownloadCount[];
  topArticles: ArticleDownloadCount[];
}

// Date-based download count
export interface DateDownloadCount {
  date: string; // YYYYMMDD
  year: number;
  month: number;
  day: number;
  count: number;
  uniqueVisitors: number;
}

// Magazine-based download count
export interface MagazineDownloadCount {
  magazineNumber: string;
  magazineTitle?: string;
  issn?: string;
  count: number;
  uniqueVisitors: number;
  vtigerName?: string; // Magazine name from vtiger
  categoryC?: string; // Category C from vtiger (cf_939)
  type?: 'magazine' | 'dissertation'; // Type based on number range
}

// Database-based download count
export interface DatabaseDownloadCount {
  database: string;
  count: number;
  uniqueVisitors: number;
}

// Category-based download count
export interface CategoryDownloadCount {
  category: string;
  count: number;
  uniqueVisitors: number;
}

// Article-based download count
export interface ArticleDownloadCount {
  biblionumber: number;
  title?: string;
  author?: string;
  magazineNumber?: string;
  magazineTitle?: string;
  count: number;
  uniqueVisitors: number;
}

// University-based download statistics
export interface UniversityDownloadStats {
  universityName: string;
  totalDownloads: number;
  uniqueVisitors: number;
  downloadsByDate: DateDownloadCount[];
  topArticles: ArticleDownloadCount[];
}

// Query result wrapper
export interface DownloadsQueryResult<T> {
  data: T;
  filters: DownloadsFilters;
  total: number;
  page?: number;
  pageSize?: number;
}
