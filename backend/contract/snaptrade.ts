import { z } from "zod";

// POST /snaptrade/connect
// If not yet registered with SnapTrade, calls registerUser; otherwise skips registration
// Returns the broker connection portal URL
export const ConnectSnapTradeInput = z.object({});

export const ConnectSnapTradeOutput = z.object({
  redirectURI: z.string(),
});

// POST /snaptrade/reconnect
export const ReconnectSnapTradeInput = z.object({ authorizationId: z.string() });
export const ReconnectSnapTradeOutput = z.object({ redirectURI: z.string() });

// DELETE /snaptrade/deleteConnection
export const DeleteConnectionInput = z.object({ authorizationId: z.string() });
export const DeleteConnectionOutput = z.object({});

// DELETE /snaptrade/deleteUser
export const DeleteUserInput = z.object({});
export const DeleteUserOutput = z.object({});

// GET /snaptrade/accounts
export const GetAccountsInput = z.object({});

export const AccountSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  number: z.string().nullable(),
});

export const ConnectionSchema = z.object({
  authorizationId: z.string(),
  institutionName: z.string().nullable(),
  isDisabled: z.boolean(),
  accounts: z.array(AccountSchema),
});

export const GetAccountsOutput = z.object({
  connections: z.array(ConnectionSchema),
});
