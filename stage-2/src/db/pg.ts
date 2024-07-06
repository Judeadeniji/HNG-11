import { Client } from 'pg';
import type { User } from '../../app.types';

async function createClient(env: Env) {
	try {
		const client = new Client({
			user: env.DB_USERNAME,
			password: env.DB_PASSWORD,
			host: env.DB_HOST,
			port: env.DB_PORT,
			database: env.DB_NAME,
		});

		await client.connect();

		return [null, client];
	} catch (error) {
		return [error as Error, null];
	}
}

function addUser(client: Client, user: User) {
	return client.query(`INSERT INTO users (userId, firstName, lastName, email, password, phone) VALUES ($1, $2, $3, $4, $5)`, [
		user.firstName,
		user.lastName,
		user.email,
		user.password,
		user.phone,
	]);
}

export { addUser, createClient };
