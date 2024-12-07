INSERT INTO departments (department_name) VALUES
('Engineering'),
('Human Resources'),
('Marketing'),
('Sales'),
('Finance');

INSERT INTO roles (title, department_id, salary) VALUES
('Software Engineer', 1, 80000),
('HR Manager', 2, 75000),
('Marketing Specialist', 3, 60000),
('Sales Representative', 4, 55000),
('Financial Analyst', 5, 70000);

INSERT INTO employees (first_name, last_name, roles_id, manager_id) VALUES
('John', 'Doe', 1, NULL),
('Jane', 'Smith', 2, 1),
('Emily', 'Jones', 3, 1),
('Michael', 'Brown', 4, 2),
('Sarah', 'Davis', 5, 3);