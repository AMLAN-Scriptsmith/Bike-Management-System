import request from "./apiClient";

export const registerUser = (data) => {
	return request("/auth/register", {
		method: "POST",
		body: JSON.stringify(data),
	});
};

export const loginUser = (data) => {
	return request("/auth/login", {
		method: "POST",
		body: JSON.stringify(data),
	});
};

export const getProfile = () => request("/auth/profile");
