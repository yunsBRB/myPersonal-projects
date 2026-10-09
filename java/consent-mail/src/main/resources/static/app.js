let session;
async function start() {
    const response = await fetch('/api/session');
    if (!response.ok || response.redirected) { location.href = '/login'; return; }
    session = await response.json();
    document.querySelector('#session').textContent = `Signed in as ${session.username}`;
}
document.querySelector('#demo').addEventListener('submit', async event => {
    event.preventDefault();
    const result = document.querySelector('#result');
    const button = event.target.querySelector('button');
    button.disabled = true;
    try {
        if (!session) throw new Error('Sign in before submitting.');
        const body = JSON.stringify(JSON.parse(document.querySelector('#request').value));
        const response = await fetch('/api/subscriptions', {method: 'POST', headers: {'Content-Type': 'application/json', [session.csrfHeader]: session.csrfToken}, body});
        result.textContent = `HTTP ${response.status}\n${JSON.stringify(await response.json(), null, 2)}`;
    } catch (error) { result.textContent = error.message; }
    finally { button.disabled = false; }
});
start().catch(() => { document.querySelector('#session').textContent = 'Unable to connect. Refresh to sign in.'; });
