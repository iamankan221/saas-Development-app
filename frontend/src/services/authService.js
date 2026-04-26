import { apiClient } from "../lib/api";

export const loginService = async (identifier, password) => {
  return await apiClient.login({ identifier, password });
};

export const registerService = async ({ firstName, lastName, email, phone, password }) => {
  return await apiClient.register({ firstName, lastName, email, phone, password });
};

export const logoutService = async (refreshToken) => {
  return await apiClient.logout({ refreshToken });
};

export const refreshService = async (refreshToken) => {
  return await apiClient.refresh({ refreshToken });
};

export const getMeService = async () => {
  return await apiClient.getMe();
};
