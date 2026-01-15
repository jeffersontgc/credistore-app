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
  totalSales: number;
  totalCashSales: number;
  totalCreditSales: number;
  totalTransactions: number;
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
  dailyReports: DailyReport;
}

export interface GetDailyReportQueryVariables {
  date: string;
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
