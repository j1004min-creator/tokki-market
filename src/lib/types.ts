/** 매물 상태 */
export type ProductStatus = "selling" | "reserved" | "sold";

export type Category = {
  slug: string;
  label: string;
  emoji: string;
  sort_order: number;
};

/**
 * market_products_view 한 줄.
 * 뷰가 판매자 닉네임·카테고리·최저가 여부까지 붙여 준다.
 */
export type ProductListItem = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  region: string | null;
  image_path: string | null;
  status: ProductStatus;
  category_slug: string;
  category_label: string;
  category_emoji: string;
  model_key: string | null;
  seller_id: string;
  seller_nickname: string;
  seller_emoji: string;
  buyer_id: string | null;
  sold_at: string | null;
  created_at: string;
  /** 같은 물건(model_key) 중 제일 싼 매물인가 */
  is_lowest: boolean;
  lowest_price: number | null;
  same_model_count: number;
};

/** 내 장부 한 줄 (판매 = 수입, 구매 = 지출) */
export type LedgerEntry = {
  id: string;
  title: string;
  price: number;
  sold_at: string;
  kind: "income" | "expense";
  counterpart: string;
};
