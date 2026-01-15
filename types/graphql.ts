export enum ProductType {
  GRANOS_BASICOS = "granos_basicos",
  SNACKS = "snacks",
  BEBIDAS = "bebidas",
  LACTEOS = "lacteos",
}

export interface Product {
  uuid: string;
  name: string;
  price: number;
  stock: number;
  min_stock: number;
  type: ProductType;
  barcodes?: { barcode: string }[];
}

export interface User {
  uuid: string;
  firstname: string;
  lastname: string;
  email: string;
  roles?: string[];
}

export interface Debt {
  uuid: string;
  amount: number;
  status: string;
  user: Partial<User>;
  updated_at: string;
}

export interface DailyReport {
  total_sales: number;
  total_cash_sales: number;
  total_credit_sales: number;
  total_transactions: number;
  total_products_sold: number;
  average_sale_amount: number;
  active_debts_count: number;
  pending_debts_count: number;
  paid_debts_count: number;
  settled_debts_count: number;
  total_active_amount: number;
  total_paid_amount: number;
}

export interface MonthlyReport extends DailyReport {
  year: number;
  month: number;
  total_days: number;
  average_daily_sales: number;
}

// Queries

export interface GetProductsQuery {
  findAllProducts: {
    data: Product[];
    total: number;
    hasNextPage: boolean;
  };
}

export interface GetProductsQueryVariables {
  search?: string | null;
  page: number;
  limit: number;
}

export interface GetProductByBarcodeQuery {
  productByBarcode: Product | null;
}

export interface GetProductByBarcodeQueryVariables {
  barcode: string;
}

export interface GetDebtsQuery {
  findAllDebts: {
    data: Debt[];
    total: number;
  };
}

export interface GetDebtsQueryVariables {
  search?: string | null;
  page: number;
  limit: number;
}

export interface GetDailyReportQuery {
  dailySalesReportByDate: DailyReport | null;
}

export interface GetDailyReportQueryVariables {
  date: string;
}

export interface GetMonthlyReportQuery {
  monthlySalesReportByYearMonth: MonthlyReport | null;
}

export interface GetMonthlyReportQueryVariables {
  year: number;
  month: number;
}

// Mutations

export interface CreateSaleInput {
  items: { product_uuid: string; quantity: number }[];
}

export interface CreateSaleMutation {
  createSale: {
    uuid: string;
    totalAmount: number;
  };
}

export interface CreateSaleMutationVariables {
  input: CreateSaleInput;
}

export interface LoginMutation {
  login: {
    access_token: string;
    user: User;
  };
}

export interface LoginMutationVariables {
  email?: string;
  password?: string;
}
export interface CreateProductInput {
  name: string;
  barcode?: string;
  price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  type: ProductType;
}

export interface CreateProductMutation {
  createProduct: Product;
}

export interface CreateProductMutationVariables {
  input: CreateProductInput;
}
