import { apiClient } from "../lib/api";

export const fetchInventory = async (params) => {
  try {
    const data = await apiClient.getInventory(params);
    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchInventoryById = async (id) => {
  try {
    const data = await apiClient.getInventoryItem(id);
    return data;
  } catch (error) {
    throw error;
  }
};

export const createInventoryItem = async (itemData) => {
  try {
    const data = await apiClient.createInventoryItem(itemData);
    return data;
  } catch (error) {
    throw error;
  }
};

export const updateInventoryItem = async (id, itemData) => {
  try {
    const data = await apiClient.updateInventoryItem(id, itemData);
    return data;
  } catch (error) {
    throw error;
  }
};

export const deleteInventoryItem = async (id) => {
  try {
    await apiClient.deleteInventoryItem(id);
    return id;
  } catch (error) {
    throw error;
  }
};

export const getInventorySummary = async () => {
  try {
    const data = await apiClient.getInventorySummary();
    return data;
  } catch (error) {
    throw error;
  }
};
