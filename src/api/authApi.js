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

export const sendPhoneOtp = (phone) => {
	return request("/auth/otp/send-phone", {
		method: "POST",
		body: JSON.stringify({ phone }),
	});
};

export const verifyPhoneOtp = (phone, code) => {
	return request("/auth/otp/verify-phone", {
		method: "POST",
		body: JSON.stringify({ phone, code }),
	});
};

export const getProfile = () => request("/auth/profile");
