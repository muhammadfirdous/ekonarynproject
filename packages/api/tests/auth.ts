import request, { type SuperAgentTest } from 'supertest';
import app from '../src/app';
import { factories, type CreatedUser, type UserOverrides } from './factories';

// Lightweight wrapper: signs in via the real /auth/login endpoint and returns
// a Supertest agent that auto-attaches the bearer token to every request.
//
// Usage:
//   const { user, agent } = await loginAs('admin');
//   const res = await agent.get('/api/v1/users');
//
// Notes:
//  - `agent` is a real supertest agent, so any chain method (.get, .post,
//    .send, .attach, .field, .query) works as normal.
//  - `accessToken` and `refreshToken` are also returned for tests that need
//    to mint a fresh request without the agent.
//  - Pass `overrides` to control the underlying user (e.g. give a worker
//    specific service areas or capacity).

export type Role = 'admin' | 'worker' | 'resident';

export interface LoggedInUser {
  user: CreatedUser;
  accessToken: string;
  refreshToken: string;
  agent: SuperAgentTest;
}

function makeAgent(token: string): SuperAgentTest {
  const agent = request.agent(app);
  // supertest doesn't have set-default-header at agent level in v6+;
  // wrap each verb so we always send Authorization.
  const verbs = ['get', 'post', 'put', 'patch', 'delete'] as const;
  for (const v of verbs) {
    const original = agent[v].bind(agent);
    (agent as unknown as Record<string, unknown>)[v] = (url: string) =>
      original(url).set('Authorization', `Bearer ${token}`);
  }
  return agent;
}

export async function loginAs(role: Role, overrides: UserOverrides = {}): Promise<LoggedInUser> {
  const password = 'pass1234';
  const factory =
    role === 'admin' ? factories.admin : role === 'worker' ? factories.worker : factories.resident;
  const user = await factory({ ...overrides, password });

  const res = await request(app).post('/api/v1/auth/login').send({ phone: user.phone, password });

  if (res.status !== 200) {
    throw new Error(`loginAs(${role}) failed (${res.status}): ${res.body?.error ?? 'no body'}`);
  }

  const accessToken: string = res.body.data.accessToken;
  const refreshToken: string = res.body.data.refreshToken;

  return { user, accessToken, refreshToken, agent: makeAgent(accessToken) };
}

/** Convenience: build an authed agent from an existing token (no factory). */
export function agentWithToken(token: string): SuperAgentTest {
  return makeAgent(token);
}

/** Convenience: build an unauthed agent (no Authorization header). */
export function anonAgent(): SuperAgentTest {
  return request.agent(app);
}
