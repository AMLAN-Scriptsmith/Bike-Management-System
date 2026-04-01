import request from "./apiClient";

export const registerBike = (data) =>
  request("/customers/bikes", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getServiceHistory = (params = "page=1&limit=20") => request(`/customers/service-history?${params}`);

export const trackJobStatus = (jobId) => request(`/customers/jobs/${jobId}/status`);

export const submitFeedback = (data) =>
  request("/customers/feedback", {
    method: "POST",
    body: JSON.stringify(data),
  });
