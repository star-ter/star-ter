export type QueryParams = {
  stdrYyquCd?: string;
  areaCd?: string;
  areaCdList?: string[];
  categoryCode?: string;
  limit?: number;
  maxDeposit?: number;
  maxMonthlyRent?: number;
  minSize?: number;
  keywords?: string;
  deposit?: number;
  monthlyRent?: number;
  size?: number;
  floor?: number;
  latitude?: number;
  longitude?: number;
  // Task 4.6 & 4.7 additions
  listingId?: string;
  title?: string;
  // Task 6: Personalized Recommendation
  userId?: string;
};

// TODO: 정훈 ㅈㅅ
