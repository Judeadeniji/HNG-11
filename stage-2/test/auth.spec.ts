// test/index.spec.ts
import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Create a new user', () => {
	it('It Should Register User Successfully with Default Organisation', async () => {
		const response = await SELF.fetch('http://localhost:8787/auth/register', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				firstName: 'John',
				lastName: 'Doe',
				email: 'johndoe@email.com',
				password: 'C0mpl3xP@ssw0rd',
				phone: '1234567890',
			}),
		});

		const responseBody = await response.json();
		
    console.log(responseBody);

		expect(response.status).toBe(201);
		expect(responseBody).toSatisfy<{
			status: string;
			message: string;
			data: {
				accessToken: string;
				user: {
					userId: string;
					firstName: string;
					lastName: string;
					email: string;
					phone: string;
				};
			};
		}>((responseBody) => {
			return !!(
				responseBody.status === 'success' &&
				responseBody.message === 'Registration successful' &&
				responseBody.data.accessToken &&
				responseBody.data.user.userId &&
				responseBody.data.user.firstName === 'John' &&
				responseBody.data.user.lastName === 'Doe' &&
				responseBody.data.user.email === 'johndoe@email.com'
			);
		});
	});
});
