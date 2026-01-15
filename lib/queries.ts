import { gql } from "@apollo/client";

export const GET_PRODUCTS = gql`
  query GetProducts($search: String, $page: Int!, $limit: Int!) {
    findAllProducts(args: { search: $search, page: $page, limit: $limit }) {
      data {
        uuid
        name
        price
        stock
        min_stock
        barcodes {
          barcode
        }
      }
      total
      hasNextPage
    }
  }
`;

export const GET_PRODUCT_BY_BARCODE = gql`
  query GetProductByBarcode($barcode: String!) {
    productByBarcode(barcode: $barcode) {
      uuid
      name
      price
      stock
    }
  }
`;

export const CREATE_SALE = gql`
  mutation CreateSale($input: CreateSaleInput!) {
    createSale(createSaleInput: $input) {
      uuid
      totalAmount
    }
  }
`;

export const GET_DEBTS = gql`
  query GetDebts($search: String, $page: Int!, $limit: Int!) {
    findAllDebts(args: { search: $search, page: $page, limit: $limit }) {
      data {
        uuid
        amount
        status
        user {
          firstname
          lastname
          email
        }
        updated_at
      }
      total
    }
  }
`;

export const GET_REPORTS_DAILY = gql`
  query GetDailyReport($date: Date!) {
    dailySalesReportByDate(date: $date) {
      total_sales
      total_cash_sales
      total_credit_sales
      total_transactions
      total_products_sold
      average_sale_amount
      active_debts_count
      pending_debts_count
      paid_debts_count
      settled_debts_count
      total_active_amount
      total_paid_amount
    }
  }
`;

export const GET_REPORTS_MONTHLY = gql`
  query GetMonthlyReport($year: Int!, $month: Int!) {
    monthlySalesReportByYearMonth(year: $year, month: $month) {
      year
      month
      total_sales
      total_cash_sales
      total_credit_sales
      total_transactions
      total_products_sold
      average_sale_amount
      active_debts_count
      pending_debts_count
      paid_debts_count
      settled_debts_count
      total_active_amount
      total_paid_amount
      total_days
      average_daily_sales
    }
  }
`;

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(createProductInput: $input) {
      uuid
      name
      price
      stock
      min_stock
      type
    }
  }
`;
