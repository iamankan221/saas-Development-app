import { apiClient } from "../lib/api";

export const fetchBills = async (params) => {
  try {
    const data = await apiClient.getBills(params);
    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchBillById = async (id) => {
  try {
    const data = await apiClient.getBill(id);
    return data;
  } catch (error) {
    throw error;
  }
};

export const createBill = async (billData) => {
  try {
    const data = await apiClient.createBill(billData);
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateBill = async (id, billData) => {
  try {
    const data = await apiClient.updateBill(id, billData);
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteBill = async (id) => {
  try {
    await apiClient.deleteBill(id);
    return id;
  } catch (error) {
    throw error;
  }
};

export const getNextBillNumber = async () => {
  try {
    const data = await apiClient.getNextBillNumber();
    return data;
  } catch (error) {
    throw error;
  }
};
