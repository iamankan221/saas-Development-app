import { apiClient } from "../lib/api";

export const fetchSuppliers = async (params) => {
  try {
    const data = await apiClient.getSuppliers(params);
    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchSupplierById = async (id) => {
  try {
    const data = await apiClient.getSupplier(id);
    return data;
  } catch (error) {
    throw error;
  }
};

export const createSupplier = async (supplierData) => {
  try {
    const data = await apiClient.createSupplier(supplierData);
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateSupplier = async (id, supplierData) => {
  try {
    const data = await apiClient.updateSupplier(id, supplierData);
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteSupplier = async (id) => {
  try {
    await apiClient.deleteSupplier(id);
    return id;
  } catch (error) {
    throw error;
  }
};
