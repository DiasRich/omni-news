export interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  thumbnail: string;
  source: string;
}

export interface CryptoPrices {
  btc: number;
  eth: number;
  sol: number;
  xrp: number;
}

export interface AuthUser {
  email: string;
}
