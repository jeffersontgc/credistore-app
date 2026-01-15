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
  query GetDailyReport($date: DateTime!) {
    dailyReports(args: { date: $date }) {
      totalSales
      totalCashSales
      totalCreditSales
      totalTransactions
    }
  }
`;
