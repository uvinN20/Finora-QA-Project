const fs = require('node:fs');
const path = require('node:path');

const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
const runId = Math.random().toString(16).slice(2, 12);
const password = 'FinoraQA123';
const results = [];

async function request(method, route, body, token) {
  const headers = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(baseUrl + route, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await response.text();
  let data = null;
  if (raw) {
    try { data = JSON.parse(raw); } catch { data = raw; }
  }
  return { status: response.status, data };
}

function record(id, expected, response, passed, detail) {
  results.push({
    id,
    expected,
    actualHttp: response?.status ?? null,
    result: passed ? 'Pass' : 'Fail',
    detail,
  });
}

function blocked(id, reason) {
  results.push({ id, expected: 'Preconditions met', actualHttp: null, result: 'Blocked', detail: reason });
}

async function run() {
  const health = await request('GET', '/api/health');
  if (health.status !== 200 || health.data?.status !== 'ok') {
    throw new Error(`Backend health check failed (HTTP ${health.status}).`);
  }

  const email = `qa.uvin.${runId}@example.test`;
  const registerBody = { name: 'QA Uvin', email, password, currency: 'LKR' };
  const reg = await request('POST', '/api/auth/register', registerBody);
  const token = reg.data?.token;
  const userId = String(reg.data?.user?.id || reg.data?.user?._id || '');
  const safeUser = !!reg.data?.user && !Object.hasOwn(reg.data.user, 'password');
  let ownAccounts = token ? await request('GET', '/api/accounts', undefined, token) : null;
  const defaultCash = ownAccounts?.status === 200 &&
    Array.isArray(ownAccounts.data?.accounts) &&
    ownAccounts.data.accounts.filter((a) => a.name === 'Cash').length === 1;
  record('TC-AUTH-01', '201; safe user and token; default Cash account',
    reg, reg.status === 201 && !!token && safeUser && defaultCash,
    `safeUser=${safeUser}; tokenReturned=${!!token}; defaultCash=${!!defaultCash}`);

  const missingPayloads = [
    { email: `no-name.${runId}@example.test`, password },
    { name: 'No email', password },
    { name: 'No password', email: `no-pass.${runId}@example.test` },
  ];
  const missingResponses = [];
  for (const payload of missingPayloads) {
    missingResponses.push(await request('POST', '/api/auth/register', payload));
  }
  const missingCodes = missingResponses.map((r) => r.status);
  record('TC-AUTH-02', 'three HTTP 400 responses',
    missingResponses.at(-1), missingCodes.every((code) => code === 400),
    `responses=${missingCodes.join(',')}`);

  const duplicate = await request('POST', '/api/auth/register', registerBody);
  record('TC-AUTH-03', '400', duplicate, duplicate.status === 400, 'duplicate email');

  const malformedEmail = `bad-at-${runId}`;
  const malformed = await request('POST', '/api/auth/register', {
    name: 'Malformed email', email: malformedEmail, password,
  });
  const malformedLogin = await request('POST', '/api/auth/login', {
    email: malformedEmail, password,
  });
  record('TC-AUTH-04', '4xx; rejected account cannot log in (401)', malformed,
    malformed.status >= 400 && malformed.status < 500 && malformedLogin.status === 401,
    `malformed email rejected; follow-up login HTTP ${malformedLogin.status}`);

  const shortEmail = `short.${runId}@example.test`;
  const shortPassword = await request('POST', '/api/auth/register', {
    name: 'Short password', email: shortEmail, password: 'abcde',
  });
  const shortPasswordLogin = await request('POST', '/api/auth/login', {
    email: shortEmail, password: 'abcde',
  });
  record('TC-AUTH-05', '4xx; rejected account cannot log in (401)', shortPassword,
    shortPassword.status >= 400 && shortPassword.status < 500 && shortPasswordLogin.status === 401,
    `short password rejected; follow-up login HTTP ${shortPasswordLogin.status}`);

  const minimumPassword = await request('POST', '/api/auth/register', {
    name: 'Minimum password', email: `minimum.${runId}@example.test`, password: 'abc123',
  });
  record('TC-AUTH-06', '201; token and safe user',
    minimumPassword, minimumPassword.status === 201 && !!minimumPassword.data?.token &&
      !!minimumPassword.data?.user && !Object.hasOwn(minimumPassword.data.user, 'password'),
    `tokenReturned=${!!minimumPassword.data?.token}`);

  if (token) {
    const login = await request('POST', '/api/auth/login', { email, password });
    record('TC-AUTH-07', '200; token and safe user', login,
      login.status === 200 && !!login.data?.token && !!login.data?.user &&
        !Object.hasOwn(login.data.user, 'password'),
      `tokenReturned=${!!login.data?.token}; passwordOmitted=${!!login.data?.user && !Object.hasOwn(login.data.user, 'password')}`);
    const wrongPassword = await request('POST', '/api/auth/login', { email, password: 'wrong-password' });
    record('TC-AUTH-08', '401', wrongPassword, wrongPassword.status === 401, 'wrong password');
    const noToken = await request('GET', '/api/accounts');
    record('TC-AUTH-09', '401', noToken, noToken.status === 401, 'no bearer token');
    const badToken = await request('GET', '/api/accounts', undefined, 'invalid-or-expired-token');
    record('TC-AUTH-10', '401', badToken, badToken.status === 401, 'invalid bearer token');

    ownAccounts = await request('GET', '/api/accounts', undefined, token);
    const sum = (ownAccounts.data?.accounts || []).reduce((n, account) => n + Number(account.balance || 0), 0);
    const onlyOwn = (ownAccounts.data?.accounts || []).every((a) => String(a.userId) === userId);
    const totalMatches = Number(ownAccounts.data?.total) === sum;
    record('TC-ACCT-01', '200; own accounts and correct total', ownAccounts,
      ownAccounts.status === 200 && onlyOwn && totalMatches,
      `onlyOwn=${onlyOwn}; totalMatchesSum=${totalMatches}`);

    const savings = await request('POST', '/api/accounts', {
      name: 'QA Savings', type: 'savings', balance: 0,
    }, token);
    const savingsId = String(savings.data?._id || '');
    record('TC-ACCT-02', '201; owner is authenticated user', savings,
      savings.status === 201 && String(savings.data?.userId) === userId,
      `ownerMatches=${String(savings.data?.userId) === userId}`);

    const accountsBeforeMissingName = await request('GET', '/api/accounts', undefined, token);
    const missingName = await request('POST', '/api/accounts', { type: 'cash', balance: 0 }, token);
    const accountsAfterMissingName = await request('GET', '/api/accounts', undefined, token);
    record('TC-ACCT-03', '400; no account created', missingName,
      missingName.status === 400 &&
        accountsBeforeMissingName.data?.accounts?.length === accountsAfterMissingName.data?.accounts?.length,
      'missing account name');

    if (savingsId) {
      const update = await request('PUT', `/api/accounts/${savingsId}`,
        { name: 'QA Savings Updated', type: 'savings' }, token);
      record('TC-ACCT-04', '200; editable fields changed; balance preserved', update,
        update.status === 200 && update.data?.name === 'QA Savings Updated' &&
          Number(update.data?.balance) === 0 && String(update.data?.userId) === userId,
        `nameUpdated=${update.data?.name === 'QA Savings Updated'}; balancePreserved=${Number(update.data?.balance) === 0}`);

      const userB = await request('POST', '/api/auth/register', {
        name: 'QA Other User', email: `other.${runId}@example.test`, password,
      });
      const userBAccounts = await request('GET', '/api/accounts', undefined, userB.data?.token);
      const foreignId = String(userBAccounts.data?.accounts?.[0]?._id || '');
      const foreignUpdate = foreignId
        ? await request('PUT', `/api/accounts/${foreignId}`, { name: 'Should Not Change' }, token)
        : { status: 0, data: null };
      const userBAfter = await request('GET', '/api/accounts', undefined, userB.data?.token);
      const foreignUnchanged = (userBAfter.data?.accounts || []).some(
        (a) => String(a._id) === foreignId && a.name === 'Cash',
      );
      record('TC-ACCT-05', '404; foreign account unchanged', foreignUpdate,
        foreignUpdate.status === 404 && foreignUnchanged,
        `foreignAccountUnchanged=${foreignUnchanged}`);

      const empty = await request('POST', '/api/accounts', {
        name: 'QA Empty', type: 'cash', balance: 0,
      }, token);
      const emptyId = String(empty.data?._id || '');
      const deletion = emptyId
        ? await request('DELETE', `/api/accounts/${emptyId}`, undefined, token)
        : { status: 0, data: null };
      const accountsAfterDelete = await request('GET', '/api/accounts', undefined, token);
      const emptyRemoved = !(accountsAfterDelete.data?.accounts || []).some(
        (a) => String(a._id) === emptyId,
      );
      record('TC-ACCT-06', '200; account removed', deletion,
        deletion.status === 200 && emptyRemoved, `removedFromList=${emptyRemoved}`);

      const transaction = await request('POST', '/api/transactions', {
        accountId: savingsId, type: 'expense', amount: 1,
        category: 'QA', description: 'seed account deletion guard',
      }, token);
      if (transaction.status >= 200 && transaction.status < 300) {
        const deleteWithTransaction = await request('DELETE', `/api/accounts/${savingsId}`, undefined, token);
        const afterGuard = await request('GET', '/api/accounts', undefined, token);
        const stillExists = (afterGuard.data?.accounts || []).some((a) => String(a._id) === savingsId);
        record('TC-ACCT-07', '400; account remains', deleteWithTransaction,
          deleteWithTransaction.status === 400 && stillExists,
          `seedTransactionHttp=${transaction.status}; accountRemains=${stillExists}`);
      } else {
        blocked('TC-ACCT-07', `Could not create the setup transaction; HTTP ${transaction.status}`);
      }
    } else {
      for (const id of ['TC-ACCT-04', 'TC-ACCT-05', 'TC-ACCT-06', 'TC-ACCT-07']) {
        blocked(id, 'Could not create the QA Savings precondition account');
      }
    }
  } else {
    for (const id of ['TC-AUTH-07', 'TC-AUTH-08', 'TC-AUTH-09', 'TC-AUTH-10',
      'TC-ACCT-01', 'TC-ACCT-02', 'TC-ACCT-03', 'TC-ACCT-04',
      'TC-ACCT-05', 'TC-ACCT-06', 'TC-ACCT-07']) {
      blocked(id, 'Registration did not return a token');
    }
  }

  fs.mkdirSync(path.join(process.cwd(), 'qa-results'), { recursive: true });
  fs.writeFileSync(
    path.join(process.cwd(), 'qa-results', 'auth-accounts-api-results.json'),
    JSON.stringify({ runId, generatedAt: new Date().toISOString(), results }, null, 2) + '\n',
  );
  console.table(results);
  const pass = results.filter((r) => r.result === 'Pass').length;
  const fail = results.filter((r) => r.result === 'Fail').length;
  const blockedCount = results.filter((r) => r.result === 'Blocked').length;
  console.log(`Summary: ${pass} Pass, ${fail} Fail, ${blockedCount} Blocked`);
  console.log('No passwords or bearer tokens are written to the result artifact.');
  if (fail || blockedCount || results.length !== 17) process.exitCode = 1;
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
