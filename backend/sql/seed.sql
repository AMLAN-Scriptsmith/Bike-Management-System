USE bike_service_center;

-- Password hash for all users below is for: 1234
INSERT INTO users (name, email, password, role, phone) VALUES
('Super Admin', 'admin@test.com', '$2b$10$Q6pcVWxppIqhzyapMI2Q0eEmM7q8st6fujS1GH.J2j34fTpuAq4vi', 'Super Admin', '9000000001'),
('Center Manager', 'manager@test.com', '$2b$10$Q6pcVWxppIqhzyapMI2Q0eEmM7q8st6fujS1GH.J2j34fTpuAq4vi', 'Manager', '9000000002'),
('Front Desk', 'reception@test.com', '$2b$10$Q6pcVWxppIqhzyapMI2Q0eEmM7q8st6fujS1GH.J2j34fTpuAq4vi', 'Receptionist', '9000000003'),
('Lead Technician', 'tech@test.com', '$2b$10$Q6pcVWxppIqhzyapMI2Q0eEmM7q8st6fujS1GH.J2j34fTpuAq4vi', 'Technician', '9000000004'),
('Customer One', 'customer@test.com', '$2b$10$Q6pcVWxppIqhzyapMI2Q0eEmM7q8st6fujS1GH.J2j34fTpuAq4vi', 'Customer', '9000000005');

INSERT INTO service_centers (name, location, admin_id) VALUES
('Bike Care Central', 'Downtown', 2);

INSERT INTO bikes (user_id, model, number_plate, brand) VALUES
(5, 'CB Shine', 'KA01AB1234', 'Honda'),
(5, 'Apache RTR 160', 'KA02CD9876', 'TVS');

INSERT INTO services (name, price, description) VALUES
('General Service', 1500.00, 'Full periodic maintenance'),
('Oil Change', 500.00, 'Engine oil replacement'),
('Brake Service', 800.00, 'Front and rear brake tuning');

INSERT INTO spare_parts (name, stock, price) VALUES
('Brake Pad Set', 25, 450.00),
('Air Filter', 40, 220.00),
('Spark Plug', 60, 180.00);

INSERT INTO job_cards (bike_id, service_center_id, status, assigned_to) VALUES
(1, 1, 'Assigned', 4),
(2, 1, 'Pending', NULL);

INSERT INTO job_services (job_id, service_id, status) VALUES
(1, 1, 'In Progress'),
(1, 2, 'Pending'),
(2, 3, 'Pending');

INSERT INTO parts_usage (job_id, part_id, quantity) VALUES
(1, 1, 1);

INSERT INTO invoices (job_id, total_amount, payment_status, payment_method) VALUES
(1, 1950.00, 'Pending', NULL);
