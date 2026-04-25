import { apiClient } from "../lib/api";

export const fetchCustomers = async (params) => {
  try {
    const data = await apiClient.getCustomers(params);
    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchCustomerById = async (id) => {
  try {
    const data = await apiClient.getCustomer(id);
    return data;
  } catch (error) {
    throw error;
  }
};

export const createCustomer = async (customerData) => {
  try {
    const data = await apiClient.createCustomer(customerData);
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateCustomer = async (id, customerData) => {
  try {
    const data = await apiClient.updateCustomer(id, customerData);
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteCustomer = async (id) => {
  try {
    await apiClient.deleteCustomer(id);
    return id;
  } catch (error) {
    throw error;
  }
};

export const getCustomerBalance = async (id) => {
  try {
    const data = await apiClient.getCustomerBalance(id);
    return data;
  } catch (error) {
    throw error;
  }
};
