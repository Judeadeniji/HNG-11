// tests/index.spec.ts
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import type { Client } from 'pg';
import { createClient } from '../src/db/pg';

const userEmail = 'johndoe@email.com';
let client: Client;

beforeAll(async () => {
	const [error, dbClient] = (await createClient(process.env)) as [Error, Client];
	if (error) {
		throw error;
	}
	client = dbClient;
	await client.query('DELETE FROM users WHERE email = $1', [userEmail]);
	// delete all organisations
	await client.query('DELETE FROM organisations WHERE name = $1', ["John's Organisation"]);
	await client.query('DELETE FROM organisations WHERE name = $1', ["Test Organisation"]);
});

afterAll(async () => {
	await client.end();
});

describe('Auth Endpoints', () => {
	let accessToken: string;

	describe('[POST] /auth/register', () => {
		it('should register user successfully', async () => {
			const response = await fetch('http://localhost:8787/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					firstName: 'John',
					lastName: 'Doe',
					email: userEmail,
					password: 'C0mpl3xP@ssw0rd',
					phone: '1234567890',
				}),
			});

			const responseBody = (await response.json()) as {
				status: string;
				message: string;
				data: {
					user: {
						firstName: string;
						lastName: string;
						email: string;
					};
					accessToken: string;
				};
			};

			expect(response.status).toBe(201);
			expect(responseBody.status).not.toHaveProperty('errors');
			expect(responseBody).toMatchObject({
				status: 'success',
				message: 'Registration successful',
				data: {
					user: {
						firstName: 'John',
						lastName: 'Doe',
						email: userEmail,
					},
				},
			});

			accessToken = responseBody.data.accessToken;
		});

    it('Should Fail if there’s Duplicate Email or UserID', async () => {
      const response = await fetch('http://localhost:8787/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: userEmail,
          password: 'C0mpl3xP@ssw0rd',
          phone: '1234567890',
        }),
      });

      const responseBody = (await response.json()) as {
        errors: {
          field: string;
          message: string;
        }[];
      };

      expect(response.status).toBe(422);
      expect(responseBody).toHaveProperty("errors");
      expect(responseBody.errors).toHaveLength(1);
      expect(responseBody.errors[0]).toMatchObject({
        field: 'email',
        message: 'Email already in use'
      });
    })

		it('should register user successfully with default organisation', async () => {
			const response = await fetch('http://localhost:8787/api/organisations', {
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`,
				},
			});

			const responseBody = (await response.json()) as {
				status: string;
				message: string;
				data: {
					organisations: {
            name: string;
            description: string;
          }[];
        };
			};
			expect(response.status).toBe(200);
      expect(responseBody).toHaveProperty("data");
      expect(responseBody.data).toHaveProperty("organisations");
      expect(responseBody.data.organisations).toBeArray();
      expect(responseBody.data.organisations.find((org) => org.name === "John's Organisation")).not.toBeUndefined();
		});
	});

	describe('[POST] /auth/login', () => {
		it('Should Log the user in successfully', async () => {
			const response = await fetch('http://localhost:8787/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: userEmail,
					password: 'C0mpl3xP@ssw0rd',
				}),
			});

			const responseBody = (await response.json()) as {
				status: string;
				message: string;
				data: {
					user: {
						firstName: string;
						lastName: string;
						email: string;
					};
					accessToken: string;
				};
			};
			expect(response.status).toBe(200);
			expect(responseBody).toMatchObject({
				status: 'success',
				message: 'Login successful',
				data: {
					user: {
						firstName: 'John',
						lastName: 'Doe',
						email: userEmail,
					},
				},
			});

			accessToken = responseBody.data.accessToken;
		});

		it('Should Fail If Required Fields Are Missing', async () => {
			const response = await fetch('http://localhost:8787/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: userEmail,
				}),
			});

			const responseBody = (await response.json()) as {
				errors: {
					field: string;
					message: string;
				}[];
			};
			expect(response.status).toBe(422);
			expect(responseBody).toHaveProperty("errors");
      expect(responseBody.errors).toHaveLength(1);
      expect(responseBody.errors[0]).toMatchObject({
        field: 'password',
        message: 'Required'
      });
		});
	});

	describe('[POST] /api/organisations', () => {
		it('should create organisation successfully', async () => {
			const response = await fetch('http://localhost:8787/api/organisations', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify({
					name: 'Test Organisation',
					description: 'Test Organisation Description',
				}),
			});

			const responseBody = await response.json();
			expect(response.status).toBe(201);
			expect(responseBody).toMatchObject({
				status: 'success',
				message: 'Organisation created successfully',
				data: {
					organisation: {
						name: 'Test Organisation',
						description: 'Test Organisation Description',
					},
				},
			});
		});
	});
});
