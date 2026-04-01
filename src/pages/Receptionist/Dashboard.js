import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiCreditCard,
  FiHome,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { receptionistApi } from "../../api/receptionistApi";
import { isRazorpayEnabled, openRazorpayCheckout } from "../../utils/razorpayCheckout";
import "./ReceptionistDashboard.scss";

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: <FiHome /> },
  { key: "customers", label: "Customer Registration", icon: <FiUserPlus /> },
  { key: "jobcards", label: "Job Card Creation", icon: <FiClipboard /> },
  { key: "appointments", label: "Appointments", icon: <FiCalendar /> },
  { key: "billing", label: "Billing", icon: <FiCreditCard /> },
];

const paymentMethods = ["Cash", "UPI", "Card"];
const timeSlots = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
];

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isValidPhone = (value) => /^\d{10}$/.test(String(value || "").replace(/\D/g, ""));

const toCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const toBackendPaymentMethod = (method) => {
  const map = {
    Cash: "CASH",
    UPI: "UPI",
    Card: "CARD",
  };
  return map[method] || String(method || "").toUpperCase();
};

const buildMonthMatrix = (appointments, selectedDate) => {
  const date = selectedDate ? new Date(selectedDate) : new Date();
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, idx) => {
    const day = idx + 1;
    const dayKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const count = appointments.filter((item) => item.date === dayKey).length;
    return { day, dayKey, count };
  });
};

const createReceiptText = (entry) => {
  return [
    "Bike Service Center Receipt",
    "--------------------------",
    `Payment ID: ${entry.id}`,
    `Invoice ID: ${entry.invoiceId}`,
    `Job Card: ${entry.jobCardId}`,
    `Amount: ${toCurrency(entry.amount)}`,
    `Method: ${entry.method}`,
    `Date: ${new Date(entry.paidAt).toLocaleString()}`,
    `Notes: ${entry.notes || "-"}`,
  ].join("\n");
};

export default function ReceptionistDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "" });

  const activeTabLabel = useMemo(() => {
    return navItems.find((item) => item.key === activeTab)?.label || "Dashboard";
  }, [activeTab]);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  const [overview, setOverview] = useState({ todaysBookings: 0, pendingJobs: 0, completedJobs: 0 });
  const [services, setServices] = useState([]);

  const [customers, setCustomers] = useState([]);
  const [customersPagination, setCustomersPagination] = useState({ page: 1, pageSize: 5, total: 0, totalPages: 1 });
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    model: "",
    brand: "",
    numberPlate: "",
  });

  const [jobCards, setJobCards] = useState([]);
  const [jobCardsPagination, setJobCardsPagination] = useState({ page: 1, pageSize: 5, total: 0, totalPages: 1 });
  const [jobCardForm, setJobCardForm] = useState({
    customerId: "",
    bikeId: "",
    serviceIds: [],
    problemDescription: "",
  });

  const [appointments, setAppointments] = useState([]);
  const [appointmentsPagination, setAppointmentsPagination] = useState({ page: 1, pageSize: 5, total: 0, totalPages: 1 });
  const [appointmentDateFilter, setAppointmentDateFilter] = useState("");
  const [appointmentForm, setAppointmentForm] = useState({
    customerName: "",
    phone: "",
    bikeLabel: "",
    date: "",
    slot: "",
    notes: "",
  });

  const [payments, setPayments] = useState([]);
  const [paymentsPagination, setPaymentsPagination] = useState({ page: 1, pageSize: 5, total: 0, totalPages: 1 });
  const [billingForm, setBillingForm] = useState({
    jobCardId: "",
    serviceCharge: "",
    spareParts: "",
    paymentMethod: "Cash",
    notes: "",
  });

  const gatewayMode = useMemo(() => {
    return isRazorpayEnabled() ? "RAZORPAY" : "MOCK";
  }, []);

  const selectedCustomer = useMemo(() => {
    if (!jobCardForm.customerId) return null;
    return customers.find((c) => String(c.id) === String(jobCardForm.customerId)) || null;
  }, [customers, jobCardForm.customerId]);

  const selectedBike = useMemo(() => {
    if (!selectedCustomer || !jobCardForm.bikeId) return null;
    return String(selectedCustomer.bike.id) === String(jobCardForm.bikeId) ? selectedCustomer.bike : null;
  }, [selectedCustomer, jobCardForm.bikeId]);

  const selectedServicesTotal = useMemo(() => {
    return services
      .filter((service) => jobCardForm.serviceIds.includes(String(service.id)))
      .reduce((sum, item) => sum + Number(item.charge || 0), 0);
  }, [jobCardForm.serviceIds, services]);

  const appointmentCalendar = useMemo(() => buildMonthMatrix(appointments, appointmentDateFilter), [appointments, appointmentDateFilter]);

  const pushAlert = (type, message) => {
    setAlert({ type, message });
    window.clearTimeout(pushAlert._timer);
    pushAlert._timer = window.setTimeout(() => setAlert({ type: "", message: "" }), 2400);
  };

  const loadOverview = useCallback(async () => {
    const response = await receptionistApi.getOverview();
    if (response.success) setOverview(response.data);
  }, []);

  const loadServices = useCallback(async () => {
    const response = await receptionistApi.getServices();
    if (response.success) setServices(response.data);
  }, []);

  const loadCustomers = useCallback(async (page = customersPagination.page) => {
    const response = await receptionistApi.getCustomers({ search: customerSearch, page, pageSize: customersPagination.pageSize });
    if (response.success) {
      setCustomers(response.data);
      setCustomersPagination(response.pagination);
    }
  }, [customerSearch, customersPagination.page, customersPagination.pageSize]);

  const loadJobCards = useCallback(async (page = jobCardsPagination.page) => {
    const response = await receptionistApi.getJobCards({ page, pageSize: jobCardsPagination.pageSize });
    if (response.success) {
      setJobCards(response.data);
      setJobCardsPagination(response.pagination);
    }
  }, [jobCardsPagination.page, jobCardsPagination.pageSize]);

  const loadAppointments = useCallback(async (page = appointmentsPagination.page) => {
    const response = await receptionistApi.getAppointments({ date: appointmentDateFilter, page, pageSize: appointmentsPagination.pageSize });
    if (response.success) {
      setAppointments(response.data);
      setAppointmentsPagination(response.pagination);
    }
  }, [appointmentDateFilter, appointmentsPagination.page, appointmentsPagination.pageSize]);

  const loadPayments = useCallback(async (page = paymentsPagination.page) => {
    const response = await receptionistApi.getPayments({ page, pageSize: paymentsPagination.pageSize });
    if (response.success) {
      setPayments(response.data);
      setPaymentsPagination(response.pagination);
    }
  }, [paymentsPagination.page, paymentsPagination.pageSize]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      loadOverview(),
      loadServices(),
      loadCustomers(1),
      loadJobCards(1),
      loadAppointments(1),
      loadPayments(1),
    ]);
    setLoading(false);
  }, [loadAppointments, loadCustomers, loadJobCards, loadOverview, loadPayments, loadServices]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleCustomerAutoFill = async () => {
    if (!isValidPhone(customerForm.phone)) {
      pushAlert("error", "Enter a valid 10-digit phone number first");
      return;
    }

    const response = await receptionistApi.findCustomerByPhone(customerForm.phone);
    if (!response.success) {
      pushAlert("error", response.message || "No customer found");
      return;
    }

    const data = response.data;
    setCustomerForm({
      name: data.name || "",
      phone: data.phone || "",
      email: data.email || "",
      model: data.bike?.model || "",
      brand: data.bike?.brand || "",
      numberPlate: data.bike?.numberPlate || "",
    });
    pushAlert("success", "Customer details auto-filled");
  };

  const handleCustomerSubmit = async (event) => {
    event.preventDefault();

    if (!customerForm.name.trim()) return pushAlert("error", "Customer name is required");
    if (!isValidPhone(customerForm.phone)) return pushAlert("error", "Phone number must be 10 digits");
    if (!isValidEmail(customerForm.email)) return pushAlert("error", "Enter a valid email");
    if (!customerForm.model.trim() || !customerForm.brand.trim() || !customerForm.numberPlate.trim()) {
      return pushAlert("error", "Bike model, brand and number plate are required");
    }

    const response = await receptionistApi.registerCustomer(customerForm);
    if (!response.success) {
      pushAlert("error", response.message || "Failed to register customer");
      return;
    }

    pushAlert("success", response.message || "Customer registered");
    setCustomerForm({ name: "", phone: "", email: "", model: "", brand: "", numberPlate: "" });
    await loadCustomers(1);
  };

  const handleServiceToggle = (serviceId) => {
    setJobCardForm((prev) => {
      const key = String(serviceId);
      const has = prev.serviceIds.includes(key);
      return { ...prev, serviceIds: has ? prev.serviceIds.filter((id) => id !== key) : [...prev.serviceIds, key] };
    });
  };

  const handleJobCardSubmit = async (event) => {
    event.preventDefault();

    if (!jobCardForm.customerId) return pushAlert("error", "Select a customer");
    if (!jobCardForm.bikeId) return pushAlert("error", "Select customer bike");
    if (jobCardForm.serviceIds.length === 0) return pushAlert("error", "Select at least one service");
    if (!jobCardForm.problemDescription.trim()) return pushAlert("error", "Problem description is required");

    const response = await receptionistApi.createJobCard({
      customerId: Number(jobCardForm.customerId),
      customerName: selectedCustomer?.name || "",
      bikeId: jobCardForm.bikeId,
      bikeLabel: selectedBike ? `${selectedBike.brand} ${selectedBike.model} (${selectedBike.numberPlate})` : "",
      serviceIds: jobCardForm.serviceIds,
      problemDescription: jobCardForm.problemDescription,
    });

    if (!response.success) {
      pushAlert("error", response.message || "Failed to create job card");
      return;
    }

    pushAlert("success", `${response.message}. Job Card ID: ${response.data.jobCardId}`);
    setJobCardForm({ customerId: "", bikeId: "", serviceIds: [], problemDescription: "" });
    await Promise.all([loadJobCards(1), loadOverview()]);
  };

  const handleAppointmentSubmit = async (event) => {
    event.preventDefault();
    if (!appointmentForm.customerName.trim()) return pushAlert("error", "Customer name is required");
    if (!isValidPhone(appointmentForm.phone)) return pushAlert("error", "Valid phone number is required");
    if (!appointmentForm.date || !appointmentForm.slot) return pushAlert("error", "Select date and slot");

    const response = await receptionistApi.bookAppointment(appointmentForm);
    if (!response.success) {
      pushAlert("error", response.message || "Failed to book appointment");
      return;
    }

    pushAlert("success", response.message || "Appointment booked");
    setAppointmentForm({ customerName: "", phone: "", bikeLabel: "", date: "", slot: "", notes: "" });
    await Promise.all([loadAppointments(1), loadOverview()]);
  };

  const handleBillingSubmit = async (event) => {
    event.preventDefault();
    if (!billingForm.jobCardId.trim()) return pushAlert("error", "Job card ID is required");

    const serviceCharge = Number(billingForm.serviceCharge || 0);
    const spareParts = Number(billingForm.spareParts || 0);

    if (serviceCharge < 0 || spareParts < 0) return pushAlert("error", "Charges cannot be negative");

    const invoiceResponse = await receptionistApi.generateInvoice({
      jobId: billingForm.jobCardId,
      serviceCharge,
      spareParts,
    });

    if (!invoiceResponse.success) {
      pushAlert("error", invoiceResponse.message || "Could not generate invoice");
      return;
    }

    const backendMethod = toBackendPaymentMethod(billingForm.paymentMethod);
    let gatewayPaymentId = null;

    if (backendMethod !== "CASH" && isRazorpayEnabled()) {
      const keyId = process.env.REACT_APP_RAZORPAY_KEY_ID;
      if (!keyId) {
        pushAlert("error", "Razorpay key is not configured");
        return;
      }

      try {
        const checkout = await openRazorpayCheckout({
          keyId,
          amount: invoiceResponse.data.totalAmount,
          currency: "INR",
          name: "Bike Service Center",
          description: `Invoice ${invoiceResponse.data.invoiceId}`,
          notes: {
            invoiceId: String(invoiceResponse.data.invoiceId),
            jobCardId: String(billingForm.jobCardId),
          },
        });
        gatewayPaymentId = checkout.paymentId;
      } catch (error) {
        pushAlert("error", error.message || "Online payment was not completed");
        return;
      }
    }

    const paymentResponse = await receptionistApi.processPayment({
      invoiceId: invoiceResponse.data.invoiceId,
      amount: invoiceResponse.data.totalAmount,
      method: backendMethod,
      notes: billingForm.notes,
      jobCardId: billingForm.jobCardId,
      gatewayPaymentId,
    });

    if (!paymentResponse.success) {
      pushAlert("error", paymentResponse.message || "Payment failed");
      return;
    }

    pushAlert("success", "Invoice generated and payment recorded");
    setBillingForm({ jobCardId: "", serviceCharge: "", spareParts: "", paymentMethod: "Cash", notes: "" });
    await loadPayments(1);
  };

  const downloadReceipt = (entry) => {
    const text = createReceiptText(entry);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${entry.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printReceipt = (entry) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<pre style="font-family: monospace; font-size: 14px; padding: 20px;">${createReceiptText(entry)}</pre>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const renderDashboardTab = () => (
    <>
      <div className="rc-top">
        <div>
          <h2>Reception Desk Dashboard</h2>
          <p>Manage registrations, job cards, appointments, and billing.</p>
        </div>
        <div className="rc-top-actions">
          <button type="button" className="rc-btn" onClick={refreshAll} disabled={loading}><FiRefreshCw /> Refresh</button>
          <div className="rc-hero" aria-hidden="true">
            <div className="rc-hero-icon"><FiUsers /></div>
            <div>
              <p className="rc-hero-title">Front Desk Flow</p>
              <p className="rc-hero-subtitle">Fast check-ins and appointment clarity</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rc-grid-4">
        <article className="rc-card"><div className="rc-kpi-label">Today’s bookings</div><div className="rc-kpi-value">{overview.todaysBookings}</div></article>
        <article className="rc-card"><div className="rc-kpi-label">Pending jobs</div><div className="rc-kpi-value">{overview.pendingJobs}</div></article>
        <article className="rc-card"><div className="rc-kpi-label">Completed jobs</div><div className="rc-kpi-value">{overview.completedJobs}</div></article>
        <article className="rc-card">
          <div className="rc-kpi-label">Quick actions</div>
          <div className="rc-actions" style={{ marginTop: 8 }}>
            <button type="button" className="rc-btn primary" onClick={() => setActiveTab("jobcards")}><FiPlus /> Create Job Card</button>
          </div>
        </article>
      </div>

      <article className="rc-card">
        <div className="rc-section-head"><h4>Recent Job Cards</h4></div>
        <div className="rc-table-wrap">
          <table className="rc-table">
            <thead><tr><th>Job Card ID</th><th>Customer</th><th>Bike</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {jobCards.slice(0, 5).map((row) => (
                <tr key={row.jobCardId}>
                  <td>{row.jobCardId}</td>
                  <td>{row.customerName}</td>
                  <td>{row.bikeLabel}</td>
                  <td><span className={`rc-chip ${row.status.toLowerCase()}`}>{row.status}</span></td>
                  <td>{new Date(row.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </>
  );

  const renderCustomersTab = () => (
    <article className="rc-card">
      <div className="rc-section-head"><h4>Customer Registration</h4></div>

      <form className="rc-form-grid" onSubmit={handleCustomerSubmit}>
        <input className="rc-input" placeholder="Name" value={customerForm.name} onChange={(e) => setCustomerForm((p) => ({ ...p, name: e.target.value }))} />
        <div className="rc-actions" style={{ alignItems: "center" }}>
          <input className="rc-input" placeholder="Phone" value={customerForm.phone} onChange={(e) => setCustomerForm((p) => ({ ...p, phone: e.target.value }))} />
          <button type="button" className="rc-btn" onClick={handleCustomerAutoFill}>Auto Fill</button>
        </div>
        <input className="rc-input" placeholder="Email" value={customerForm.email} onChange={(e) => setCustomerForm((p) => ({ ...p, email: e.target.value }))} />
        <input className="rc-input" placeholder="Bike Model" value={customerForm.model} onChange={(e) => setCustomerForm((p) => ({ ...p, model: e.target.value }))} />
        <input className="rc-input" placeholder="Bike Brand" value={customerForm.brand} onChange={(e) => setCustomerForm((p) => ({ ...p, brand: e.target.value }))} />
        <input className="rc-input" placeholder="Number Plate" value={customerForm.numberPlate} onChange={(e) => setCustomerForm((p) => ({ ...p, numberPlate: e.target.value }))} />
        <button type="submit" className="rc-btn primary"><FiCheckCircle /> Save Customer</button>
      </form>

      <div className="rc-actions" style={{ marginTop: 10 }}>
        <div style={{ position: "relative" }}>
          <FiSearch style={{ position: "absolute", left: 10, top: 10, color: "#7a8da8" }} />
          <input className="rc-input" style={{ paddingLeft: 30 }} placeholder="Search customer / phone / plate" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
        </div>
        <button type="button" className="rc-btn" onClick={() => loadCustomers(1)}>Search</button>
      </div>

      <div className="rc-table-wrap">
        <table className="rc-table">
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Bike</th><th>Number Plate</th></tr></thead>
          <tbody>
            {customers.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.phone}</td>
                <td>{row.email}</td>
                <td>{row.bike?.brand} {row.bike?.model}</td>
                <td>{row.bike?.numberPlate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rc-pagination">
        <button type="button" className="rc-btn" onClick={() => loadCustomers(Math.max(1, customersPagination.page - 1))}>Prev</button>
        <span>Page {customersPagination.page} / {customersPagination.totalPages}</span>
        <button type="button" className="rc-btn" onClick={() => loadCustomers(Math.min(customersPagination.totalPages, customersPagination.page + 1))}>Next</button>
      </div>
    </article>
  );

  const renderJobCardsTab = () => (
    <article className="rc-card">
      <div className="rc-section-head"><h4>Job Card Creation</h4></div>

      <form onSubmit={handleJobCardSubmit}>
        <div className="rc-form-grid">
          <select className="rc-select" value={jobCardForm.customerId} onChange={(e) => {
            const customerId = e.target.value;
            const customer = customers.find((c) => String(c.id) === String(customerId));
            setJobCardForm((p) => ({ ...p, customerId, bikeId: customer?.bike?.id || "" }));
          }}>
            <option value="">Select Customer</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
          </select>

          <select className="rc-select" value={jobCardForm.bikeId} onChange={(e) => setJobCardForm((p) => ({ ...p, bikeId: e.target.value }))}>
            <option value="">Select Bike</option>
            {selectedCustomer && (
              <option value={selectedCustomer.bike.id}>
                {selectedCustomer.bike.brand} {selectedCustomer.bike.model} ({selectedCustomer.bike.numberPlate})
              </option>
            )}
          </select>

          <div className="rc-card" style={{ gridColumn: "span 2", padding: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Select Services</div>
            <div className="rc-actions">
              {services.map((service) => {
                const checked = jobCardForm.serviceIds.includes(String(service.id));
                return (
                  <label key={service.id} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <input type="checkbox" checked={checked} onChange={() => handleServiceToggle(service.id)} />
                    {service.name} ({toCurrency(service.charge)})
                  </label>
                );
              })}
            </div>
          </div>

          <textarea className="rc-textarea" style={{ gridColumn: "span 4" }} placeholder="Problem description" value={jobCardForm.problemDescription} onChange={(e) => setJobCardForm((p) => ({ ...p, problemDescription: e.target.value }))} />
        </div>

        <div className="rc-actions" style={{ marginTop: 10 }}>
          <button type="submit" className="rc-btn primary"><FiPlus /> Create Job Card (Pending)</button>
          <div className="rc-card" style={{ padding: "8px 10px" }}>Estimated Service Total: <strong>{toCurrency(selectedServicesTotal)}</strong></div>
        </div>
      </form>

      <div className="rc-table-wrap">
        <table className="rc-table">
          <thead><tr><th>Job Card ID</th><th>Customer</th><th>Bike</th><th>Services</th><th>Status</th></tr></thead>
          <tbody>
            {jobCards.map((row) => (
              <tr key={row.jobCardId}>
                <td>{row.jobCardId}</td>
                <td>{row.customerName}</td>
                <td>{row.bikeLabel}</td>
                <td>{(row.services || []).map((s) => s.name).join(", ")}</td>
                <td><span className={`rc-chip ${row.status.toLowerCase()}`}>{row.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rc-pagination">
        <button type="button" className="rc-btn" onClick={() => loadJobCards(Math.max(1, jobCardsPagination.page - 1))}>Prev</button>
        <span>Page {jobCardsPagination.page} / {jobCardsPagination.totalPages}</span>
        <button type="button" className="rc-btn" onClick={() => loadJobCards(Math.min(jobCardsPagination.totalPages, jobCardsPagination.page + 1))}>Next</button>
      </div>
    </article>
  );

  const renderAppointmentsTab = () => (
    <article className="rc-card">
      <div className="rc-section-head"><h4>Appointments</h4></div>

      <form className="rc-form-grid" onSubmit={handleAppointmentSubmit}>
        <input className="rc-input" placeholder="Customer Name" value={appointmentForm.customerName} onChange={(e) => setAppointmentForm((p) => ({ ...p, customerName: e.target.value }))} />
        <input className="rc-input" placeholder="Phone" value={appointmentForm.phone} onChange={(e) => setAppointmentForm((p) => ({ ...p, phone: e.target.value }))} />
        <input className="rc-input" placeholder="Bike Details" value={appointmentForm.bikeLabel} onChange={(e) => setAppointmentForm((p) => ({ ...p, bikeLabel: e.target.value }))} />
        <input className="rc-input" type="date" value={appointmentForm.date} onChange={(e) => setAppointmentForm((p) => ({ ...p, date: e.target.value }))} />
        <select className="rc-select" value={appointmentForm.slot} onChange={(e) => setAppointmentForm((p) => ({ ...p, slot: e.target.value }))}>
          <option value="">Select Slot</option>
          {timeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
        </select>
        <input className="rc-input" placeholder="Notes" value={appointmentForm.notes} onChange={(e) => setAppointmentForm((p) => ({ ...p, notes: e.target.value }))} />
        <button type="submit" className="rc-btn primary"><FiCalendar /> Book Appointment</button>
      </form>

      <div className="rc-actions" style={{ marginTop: 10 }}>
        <input className="rc-input" type="date" value={appointmentDateFilter} onChange={(e) => setAppointmentDateFilter(e.target.value)} />
        <button type="button" className="rc-btn" onClick={() => loadAppointments(1)}>Filter Date</button>
      </div>

      <div className="rc-calendar">
        {appointmentCalendar.map((day) => (
          <div key={day.dayKey} className="rc-day">
            <div className="d">{day.day}</div>
            <div className="count">{day.count > 0 ? `${day.count} booking(s)` : ""}</div>
          </div>
        ))}
      </div>

      <div className="rc-table-wrap">
        <table className="rc-table">
          <thead><tr><th>Appointment ID</th><th>Customer</th><th>Bike</th><th>Date</th><th>Slot</th></tr></thead>
          <tbody>
            {appointments.map((row) => (
              <tr key={row.appointmentId}>
                <td>{row.appointmentId}</td>
                <td>{row.customerName} ({row.phone})</td>
                <td>{row.bikeLabel}</td>
                <td>{row.date}</td>
                <td>{row.slot}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rc-pagination">
        <button type="button" className="rc-btn" onClick={() => loadAppointments(Math.max(1, appointmentsPagination.page - 1))}>Prev</button>
        <span>Page {appointmentsPagination.page} / {appointmentsPagination.totalPages}</span>
        <button type="button" className="rc-btn" onClick={() => loadAppointments(Math.min(appointmentsPagination.totalPages, appointmentsPagination.page + 1))}>Next</button>
      </div>
    </article>
  );

  const renderBillingTab = () => (
    <article className="rc-card">
      <div className="rc-section-head">
        <h4>Billing</h4>
        <span className={`rc-gateway-badge ${gatewayMode.toLowerCase()}`}>Gateway: {gatewayMode}</span>
      </div>

      {gatewayMode === "MOCK" && (
        <p className="rc-hint">Online payment UI is enabled, but transactions are simulated in MOCK mode.</p>
      )}
      {gatewayMode === "RAZORPAY" && (
        <p className="rc-hint">UPI/Card will open Razorpay checkout. Cash is recorded directly.</p>
      )}

      <form className="rc-form-grid" onSubmit={handleBillingSubmit}>
        <input className="rc-input" placeholder="Job Card ID" value={billingForm.jobCardId} onChange={(e) => setBillingForm((p) => ({ ...p, jobCardId: e.target.value }))} />
        <input className="rc-input" type="number" min="0" placeholder="Service Charges" value={billingForm.serviceCharge} onChange={(e) => setBillingForm((p) => ({ ...p, serviceCharge: e.target.value }))} />
        <input className="rc-input" type="number" min="0" placeholder="Spare Parts Charges" value={billingForm.spareParts} onChange={(e) => setBillingForm((p) => ({ ...p, spareParts: e.target.value }))} />
        <select className="rc-select" value={billingForm.paymentMethod} onChange={(e) => setBillingForm((p) => ({ ...p, paymentMethod: e.target.value }))}>
          {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
        </select>
        <input className="rc-input" placeholder="Payment Notes" value={billingForm.notes} onChange={(e) => setBillingForm((p) => ({ ...p, notes: e.target.value }))} />
        <button type="submit" className="rc-btn primary"><FiCreditCard /> Generate Invoice + Accept Payment</button>
      </form>

      <div className="rc-table-wrap">
        <table className="rc-table">
          <thead><tr><th>Payment ID</th><th>Invoice</th><th>Job Card</th><th>Method</th><th>Amount</th><th>Date</th><th>Receipt</th></tr></thead>
          <tbody>
            {payments.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.id}</td>
                <td>{entry.invoiceId}</td>
                <td>{entry.jobCardId}</td>
                <td>{entry.method}</td>
                <td>{toCurrency(entry.amount)}</td>
                <td>{new Date(entry.paidAt).toLocaleString()}</td>
                <td>
                  <div className="rc-actions">
                    <button type="button" className="rc-btn" onClick={() => printReceipt(entry)}>Print</button>
                    <button type="button" className="rc-btn" onClick={() => downloadReceipt(entry)}>Download</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rc-pagination">
        <button type="button" className="rc-btn" onClick={() => loadPayments(Math.max(1, paymentsPagination.page - 1))}>Prev</button>
        <span>Page {paymentsPagination.page} / {paymentsPagination.totalPages}</span>
        <button type="button" className="rc-btn" onClick={() => loadPayments(Math.min(paymentsPagination.totalPages, paymentsPagination.page + 1))}>Next</button>
      </div>
    </article>
  );

  return (
    <div className={`rc-shell rc-view-${activeTab}`}>
      <aside className="rc-sidebar">
        <div className="rc-brand">
          <span className="rc-brand-icon"><FiUsers /></span>
          <div>
            <p className="rc-brand-title">Receptionist Panel</p>
            <p className="rc-brand-subtitle">Bike Service Job Management</p>
          </div>
        </div>

        <nav className="rc-nav">
          {navItems.map((item) => (
            <button key={item.key} type="button" className={`rc-nav-btn ${activeTab === item.key ? "active" : ""}`} onClick={() => setActiveTab(item.key)}>
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="rc-content">
        <div className="rc-meta-bar" role="status" aria-live="polite">
          <span className="rc-meta-chip">Section: {activeTabLabel}</span>
          <span className="rc-meta-chip">Today: {todayLabel}</span>
          <span className="rc-meta-chip">Role: Receptionist</span>
        </div>
        {activeTab === "dashboard" && renderDashboardTab()}
        {activeTab === "customers" && renderCustomersTab()}
        {activeTab === "jobcards" && renderJobCardsTab()}
        {activeTab === "appointments" && renderAppointmentsTab()}
        {activeTab === "billing" && renderBillingTab()}

        {alert.message && <div className={`rc-alert ${alert.type}`}>{alert.message}</div>}
      </main>
    </div>
  );
}
