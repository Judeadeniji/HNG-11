import bcrypt from 'bcryptjs';
import type { Context } from 'hono';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '../app.types';
import type { AppEnv } from './server';
import { loginPayloadSchema, userPayloadSchema } from './zod.schema';

export async function handleRegistration(ctx: Context<AppEnv>) {
	console.log(ctx.env);
	try {
		const pgClient = ctx.get('pg-client')!;
		const userPayload = (await ctx.req.json()) as User;
		const { error, data, success } = userPayloadSchema.safeParse(userPayload);

		if (!success) {
			return ctx.json({ errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) }, 422);
		}

		const { firstName, lastName, email, password, phone } = data;

		// Check for existing user
		const dbUserCheckRes = await pgClient.query('SELECT * FROM users WHERE email = $1', [email]);
		if (dbUserCheckRes.rows.length > 0) {
			return ctx.json(
				{
					errors: [{ field: 'email', message: 'Email already in use' }],
				},
				422
			);
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Create user and default organisation
		const userId = uuidv4();
		const orgId = uuidv4();
		await pgClient.query('INSERT INTO users (userId, firstName, lastName, email, password, phone) VALUES ($1, $2, $3, $4, $5, $6)', [
			userId,
			firstName,
			lastName,
			email,
			hashedPassword,
			phone,
		]);
		await pgClient.query('INSERT INTO organisations (orgId, name, description) VALUES ($1, $2, $3)', [
			orgId,
			`${firstName}'s Organisation`,
			'',
		]);
		await pgClient.query('INSERT INTO user_organisations (userId, orgId) VALUES ($1, $2)', [userId, orgId]);

		// Create JWT token
		const token = jwt.sign({ userId, email }, null, {
			expiresIn: ctx.env.JWT_EXPIRES_IN as string,
			algorithm: 'none',
		});

		return ctx.json(
			{
				status: 'success',
				message: 'Registration successful',
				data: {
					accessToken: token,
					user: {
						userId,
						firstName,
						lastName,
						email,
						phone,
					},
				},
			},
			201
		);
	} catch (error) {
		console.error(error);
		return ctx.json(
			{
				status: 'error',
				message: 'An error occurred',
				error: (error as Error).message,
			},
			422
		);
	}
}

export async function handleLogin(ctx: Context<AppEnv>) {
	try {
		const pgClient = ctx.get('pg-client')!;
		const loginPayload = (await ctx.req.json()) as { email: string; password: string };
		const { error, data, success } = loginPayloadSchema.safeParse(loginPayload);

		if (!success) {
			return ctx.json({ errors: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })) }, 422);
		}

		const { email, password } = data;

		// Check for existing user
		const dbUserCheckRes = await pgClient.query('SELECT * FROM users WHERE email = $1', [email]);
		if (dbUserCheckRes.rows.length === 0) {
			return ctx.json(
				{
					status: 'Bad request',
					message: 'Authentication failed',
					statusCode: 401,
				},
				401
			);
		}

		const user = dbUserCheckRes.rows[0];
		// Check password
		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return ctx.json(
				{
					status: 'Bad request',
					message: 'Authentication failed',
					statusCode: 401,
				},
				401
			);
		}

		// Create JWT token
		const token = jwt.sign({ userId: user.userId, email }, null, {
			expiresIn: ctx.env.JWT_EXPIRES_IN as string,
			algorithm: 'none',
		});

		return ctx.json({
			status: 'success',
			message: 'Login successful',
			data: {
				accessToken: token,
				user: {
					userId: user.userid,
					firstName: user.firstname,
					lastName: user.lastname,
					email: user.email,
					phone: user.phone,
				},
			},
		});
	} catch (error) {
		console.error(error);
		return ctx.json(
			{
				status: 'error',
				message: 'An error occurred',
				error: (error as Error).message,
			},
			422
		);
	}
}
