import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import {
	FiAlertCircle,
	FiCheckCircle,
	FiEye,
	FiEyeOff,
	FiLock,
	FiMail,
	FiMapPin,
	FiMoon,
	FiPhone,
	FiSun,
	FiTool,
	FiUser,
} from "react-icons/fi";
import { registerUser } from "../../api/authApi";
import {
	PasswordStrengthMeter,
	RegisterInputField,
	RegisterShowcasePanel,
} from "../../components/AuthRegister";
import "./Register.scss";

const schema = yup.object({
	name: yup.string().trim().min(2, "Full name must be at least 2 characters").required("Full name is required"),
	email: yup.string().trim().email("Enter a valid email address").required("Email is required"),
	phone: yup.string().matches(/^\d{10}$/, "Phone must be exactly 10 digits").required("Phone is required"),
	city: yup.string().trim().required("City is required"),
	preferredServiceType: yup.string().required("Preferred service type is required"),
	password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
	confirmPassword: yup
		.string()
		.oneOf([yup.ref("password")], "Passwords do not match")
		.required("Confirm password is required"),
	agreeTerms: yup.boolean().oneOf([true], "You must accept terms and privacy policy"),
});

const defaultValues = {
	name: "",
	email: "",
	phone: "",
	city: "",
	preferredServiceType: "",
	password: "",
	confirmPassword: "",
	agreeTerms: false,
};

const Register = () => {
	const navigate = useNavigate();
	const location = useLocation();

	const {
		register,
		handleSubmit,
		watch,
		reset,
		setValue,
		formState: { errors, isValid, isSubmitting },
	} = useForm({
		resolver: yupResolver(schema),
		mode: "onChange",
		defaultValues,
	});

	useEffect(() => {
		const preferredService = location?.state?.preferredServiceType;
		if (preferredService) {
			setValue("preferredServiceType", preferredService, { shouldValidate: true });
			setFeedback({
				type: "info",
				message: `Selected service: ${preferredService}. Complete registration to continue booking.`,
			});
		}
	}, [location?.state?.preferredServiceType, setValue]);

	const [feedback, setFeedback] = useState({ type: "", message: "" });
	const [theme, setTheme] = useState("dark");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const password = watch("password");
	const canSubmit = isValid && !isSubmitting;

	const onSubmit = async (form) => {
		setFeedback({ type: "", message: "" });

		try {
			const payload = {
				name: form.name,
				email: form.email,
				phone: form.phone,
				password: form.password,
				role: "Customer",
			};

			const response = await registerUser(payload);
			if (!response.success) {
				setFeedback({ type: "error", message: response.message || "Registration failed." });
				return;
			}

			setFeedback({ type: "success", message: "Registration successful. Redirecting to login..." });
			reset(defaultValues);

			setTimeout(() => navigate("/login"), 1200);
		} catch (err) {
			setFeedback({ type: "error", message: err.message || "Registration failed." });
		}
	};

	const containerClass = useMemo(
		() => `register-page ${theme === "dark" ? "theme-dark" : "theme-light"}`,
		[theme]
	);

	return (
		<section className={containerClass}>
			<div className="register-overlay" />

			<button
				type="button"
				className="theme-toggle"
				onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
				aria-label="Toggle dark mode"
			>
				{theme === "dark" ? <FiSun aria-hidden="true" /> : <FiMoon aria-hidden="true" />}
			</button>

			<RegisterShowcasePanel />

			<motion.div
				className="register-panel"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.45 }}
			>
				<h2>Create Your Account</h2>
				<p className="register-subtitle">Start booking and tracking your bike services in minutes.</p>

				{feedback.message ? (
					<motion.div
						className={`register-alert register-alert-${feedback.type || "info"}`}
						role={feedback.type === "error" ? "alert" : "status"}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
					>
						{feedback.type === "success" ? <FiCheckCircle aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}
						{feedback.message}
					</motion.div>
				) : null}

				<form onSubmit={handleSubmit(onSubmit)} className="register-form" noValidate>
					<RegisterInputField
						id="name"
						label="Full Name"
						icon={FiUser}
						placeholder="Enter your full name"
						autoComplete="name"
						register={register}
						error={errors.name}
					/>

					<RegisterInputField
						id="email"
						label="Email"
						icon={FiMail}
						placeholder="you@example.com"
						autoComplete="email"
						register={register}
						error={errors.email}
					/>

					<div className="register-inline-group">
						<RegisterInputField
							id="phone"
							label="Phone"
							icon={FiPhone}
							placeholder="10-digit mobile number"
							autoComplete="tel"
							register={register}
							error={errors.phone}
						/>
						<p className="register-helper-text">Phone verification is not required. Your number is used for service updates only.</p>
					</div>

					<div className="register-grid-two">
						<RegisterInputField
							id="city"
							label="City / Location"
							icon={FiMapPin}
							placeholder="Your city"
							autoComplete="address-level2"
							register={register}
							error={errors.city}
						/>

						<div className="register-field">
							<label htmlFor="preferredServiceType">Preferred Service Type</label>
							<div className={`register-input-shell ${errors.preferredServiceType ? "register-input-shell-error" : ""}`}>
								<FiTool className="register-input-icon" aria-hidden="true" />
								<select id="preferredServiceType" {...register("preferredServiceType")}>
									<option value="">Select service type</option>
									<option value="General Service">General Service</option>
									<option value="Repair">Repair</option>
									<option value="Inspection">Inspection</option>
								</select>
							</div>
							{errors.preferredServiceType ? (
								<p className="register-field-error" role="alert">{errors.preferredServiceType.message}</p>
							) : null}
						</div>
					</div>

					<RegisterInputField
						id="password"
						label="Password"
						icon={FiLock}
						type={showPassword ? "text" : "password"}
						autoComplete="new-password"
						register={register}
						error={errors.password}
						rightAction={(
							<button
								type="button"
								className="register-toggle"
								onClick={() => setShowPassword((prev) => !prev)}
								aria-label={showPassword ? "Hide password" : "Show password"}
							>
								{showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
							</button>
						)}
					/>

					<PasswordStrengthMeter password={password || ""} />

					<RegisterInputField
						id="confirmPassword"
						label="Confirm Password"
						icon={FiLock}
						type={showConfirmPassword ? "text" : "password"}
						autoComplete="new-password"
						register={register}
						error={errors.confirmPassword}
						rightAction={(
							<button
								type="button"
								className="register-toggle"
								onClick={() => setShowConfirmPassword((prev) => !prev)}
								aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
							>
								{showConfirmPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
							</button>
						)}
					/>

					<label className="register-terms">
						<input type="checkbox" {...register("agreeTerms")} />
						I agree to Terms & Conditions and Privacy Policy
					</label>
					{errors.agreeTerms ? <p className="register-field-error" role="alert">{errors.agreeTerms.message}</p> : null}

					<button type="submit" className="register-submit-btn" disabled={!canSubmit}>
						{isSubmitting ? <span className="register-spinner" aria-hidden="true" /> : null}
						{isSubmitting ? "Creating Account..." : "Register"}
					</button>
				</form>

				<p className="register-footer">
					Already have an account? <Link to="/login">Sign In</Link>
				</p>
				<p className="register-footer home-link">
					<Link to="/">Back to Home</Link>
				</p>
			</motion.div>
		</section>
	);
};

export default Register;
