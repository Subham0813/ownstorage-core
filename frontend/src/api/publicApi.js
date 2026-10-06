import axiosInstance from "./axiosInstance";

export const getSharedItemInfo = async (token) => {
  const { data } = await axiosInstance.get(`/api/public/shared/${token}/info`);
  return data;
};

export const getSharedPreviewUrl = async (token) => {
  const { data } = await axiosInstance.get(`/api/public/shared/${token}`);
  return data;
};

export const getSharedDownloadUrl = async (token) => {
  const { data } = await axiosInstance.get(`/api/public/shared/${token}/download`);
  return data;
};

export const getSharedDirList = async (dirId, token) => {
  const { data } = await axiosInstance.get(`/api/directories/all-dirs/${dirId}`, {
    params: { token },
  });
  return data;
};

export const getSharedFileList = async (dirId, token) => {
  const { data } = await axiosInstance.get(`/api/directories/all-files/${dirId}`, {
    params: { token },
  });
  return data;
};

export const getSharedFilePreviewUrl = async (fileId, token) => {
  const { data } = await axiosInstance.get(`/api/files/preview/${fileId}`, {
    params: { token },
  });
  return data;
};

export const getSharedFileDownloadUrl = async (fileId, token) => {
  const { data } = await axiosInstance.get(`/api/files/download/${fileId}`, {
    params: { token },
  });
  return data;
};
