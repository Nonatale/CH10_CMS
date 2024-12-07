import inquirer from 'inquirer';
import { pool, connectToDb } from './connection.js';

// PostgreSQL pool setup
async function testing() {
    const data = await pool.query('');
    console.log(data);
}

async function main() {
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                'View All Employees',
                'Add Employee',
                'Update Employee Role',
                'View All Roles',
                'Add Role',
                'View All Departments',
                'Add Department',
                'Update Manager',
                'View Employee by Manager',
                'Delete Employee',
                'Department Budget',
                'Quit',
            ],
        },
    ]);

    switch (answers.action) {
        case 'View All Employees':
            await viewAllEmployees();
            break;
        case 'Add Employee':
            await addEmployee();
            break;
        case 'Update Employee Role':
            await updateEmployeeRole();
            break;
        case 'View All Roles':
            await viewAllRoles();
            break;
        case 'Add Role':
            await addRole();
            break;
        case 'View All Departments':
            await viewAllDepartments();
            break;
        case 'Add Department':
            await addDepartment();
            break;
        case 'Update Manager' :
            await updateManager();
            break;
        case 'View Employee by Manager' :
            await viewEmployeeByManager();
            break;
        case 'Delete Employee' :
            await deleteEmployee();
            break;
        case 'Department Budget' :
            await viewDepartmentBudget();
            break;
        case 'Quit':
            console.log('Goodbye!');
            pool.end();
            return;
    }

    main(); // Restart the prompt loop
}

async function viewAllEmployees() {
    try {
        const res = await pool.query(`
            SELECT 
                e.id, 
                e.first_name, 
                e.last_name, 
                roles.title AS role, 
                roles.salary, 
                departments.department_name AS department, 
                COALESCE(m.first_name || ' ' || m.last_name, 'None') AS manager
            FROM 
                employees e
            LEFT JOIN 
                employees m
            ON 
                e.manager_id = m.id
            JOIN 
                roles
            ON 
                e.roles_id = roles.id
            JOIN 
                departments
            ON 
                roles.department_id = departments.id;

        `);

        console.table(res.rows);
    } catch (err) {
        console.error('Error fetching employees:', err.message);
    }
}

async function getRoles() {
    const res = await pool.query('SELECT id, title FROM roles');
    return res.rows.map(role => ({ name: `${role.id} - ${role.title}`, value: role.id }));
}

async function getEmployees() {
    const res = await pool.query('SELECT id, first_name, last_name FROM employees');
    return res.rows.map(employee => ({ name: `${employee.id} - ${employee.first_name} ${employee.last_name}`, value: employee.id }));
}

async function getDepartment() {
    const res = await pool.query('SELECT id, department_name FROM departments');
    return res.rows.map(department => ({ name: `${department.id} - ${department.department_name}`, value: department.id }));
}

async function addEmployee() {
    try {
        const roles = await getRoles();
        const employees = await getEmployees();

        const answers = await inquirer.prompt([
            { name: 'firstName', message: 'First Name:' },
            { name: 'lastName', message: 'Last Name:' },
            {   
                type: 'list',
                name: 'roleId',
                message: 'What is the role of this employee?',
                choices: roles, // Dynamically populated list of roles
            },
            {
                type: 'list',
                name: 'managerId',
                message: 'Who is the manager of this employee?',
                choices: employees,
            },
        ]);

        await pool.query(
            'INSERT INTO employees (first_name, last_name, roles_id, manager_id) VALUES ($1, $2, $3, $4)',
            [answers.firstName, answers.lastName, answers.roleId, answers.managerId || null]
        );

        console.log('Employee added successfully.');

    } catch (err) {
        console.error('Error adding employee:', err.message);
    }
}

async function updateEmployeeRole() {
    const employees = await getEmployees();
    const roles = await getRoles();

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'employeeId',
            message: 'Which employee should be updated?',
            choices: employees,
        },
        {
            type: 'list',
            name: 'newRoleId',
            message: 'What is the new role of this employee?',
            choices: roles,
        },
    ]);

    await pool.query(
        'UPDATE employees SET roles_id = $1 WHERE id = $2',
        [answers.newRoleId, answers.employeeId]
    );

    console.log('Employee role updated successfully.');
}

async function viewAllRoles() {
    try {
        const res = await pool.query(`
            SELECT 
                r.id, 
                r.title, 
                d.department_name AS department, 
                r.salary
            FROM 
                roles r
            JOIN 
                departments d
            ON 
                r.department_id = d.id;
        `);
        console.table(res.rows); // Display the roles with department names and salaries
    } catch (err) {
        console.error('Error fetching roles:', err.message);
    }
}

async function addRole() {
    const departments = await getDepartment();

    const answers = await inquirer.prompt([
        { name: 'title', message: 'Name of the New Role:' },
        { name: 'salary', message: 'Salary:' },
        {   type: 'list',
            name: 'departmentId',
            message: 'Which department does this role belong to:',
            choices: departments,
        },
    ]);
    console.log(`${answers.title, answers.salary, answers.departmentId}`);
    await pool.query(
        'INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)',
        [answers.title, answers.salary, answers.departmentId]
    );

    console.log('Role added successfully.');
}

async function viewAllDepartments() {
    const res = await pool.query(`
        SELECT
            d.id,
            d.department_name AS department
        FROM
            departments d
    `);
    console.table(res.rows);
}

async function addDepartment() {
    const answers = await inquirer.prompt([
        { name: 'name', message: 'Department Name:' },
    ]);

    await pool.query(
        'INSERT INTO departments (name) VALUES ($1)',
        [answers.name]
    );

    console.log('Department added successfully.');
}

async function updateManager() {
    const employee = await getEmployees();

    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'employeeId',
            message: 'For whom are we changing manager?',
            choices: employee,
        },
        {
            type: 'list',
            name: 'managerId',
            message: `Who should be the employee's new manager?`,
            choices: (answers) => {
                // Exclude the selected employee from the manager list
                return employee.filter(
                    (employee) => employee.value !== answers.employeeId
                );
            },
        },
    ]);

    await pool.query(
        `UPDATE employees SET manager_id = $1 WHERE id = $2`,
        [answers.managerId, answers.employeeId]
    );
    
    console.log('Employee manager updated succesfully.');
}

async function viewEmployeeByManager() {
    try {
        const managers = await getEmployees();

        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'manager',
                message: `Who's employees would you like to see:`,
                choices: managers,
            }
        ]);

        const res = await pool.query(`
            SELECT 
                e.id, 
                e.first_name, 
                e.last_name, 
                roles.title AS role, 
                roles.salary, 
                departments.department_name AS department
            FROM 
                employees e
            JOIN 
                roles
            ON 
                e.roles_id = roles.id
            JOIN 
                departments
            ON 
                roles.department_id = departments.id
            WHERE
                e.manager_id = $1
        `, [answers.manager]);
        
        if (res.rows.length > 0) {
            console.table(res.rows);
        } else {
            console.log('No employees found for the selected manager.');
        }
    } catch (err) {
        console.error('Error Viewing by Manager:', err.message);
    }
}

async function deleteEmployee() {
    try {
        const employees = await getEmployees();

        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'employee',
                message: `Who's employees would you like to see:`,
                choices: employees,
            }
        ]);

        const res = await pool.query(`
            DELETE FROM
                employees e
            WHERE
                e.id = $1
        `, [answers.employee]);

        console.log('Delete Successful.');
    } catch (err) {
        console.error('Error Deleting Employee', err.message);
    }
}

async function viewDepartmentBudget() {
    try {
        const department = await getDepartment();

        const answers = await inquirer.prompt([
            { 
                type: 'list',
                name: 'departmentId',
                message: 'Which department should we calculate the budget for?',
                choices: department,
            }
        ]);

        const res = await pool.query(`
            SELECT SUM(roles.salary) AS total_budget
            FROM
                employees e
            JOIN
                roles
            ON
                e.roles_id = roles.id
            WHERE
                roles.department_id = $1
        `, [answers.departmentId]);

        console.table(res.rows);
    } catch (err) {
        console.error('Error Getting Budget:', err.message);
    }
}

main();