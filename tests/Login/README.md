# Login Feature

This directory contains the initial global setup for authenticating against the identity provider and saving the session state.

## Contents
- **`auth.setup.ts`**: The main Playwright project setup script. It uses the POMs below to simulate a user logging in and dumps the token to `.auth/session.json`.
- **`MicrosoftUsernamePage.ts`**: POM representing the first step of Microsoft SSO (entering the email).
- **`MicrosoftPasswordPage.ts`**: POM representing the second step (entering the password and declining the "stay signed in" prompt).

## Acceptance Criteria

The following acceptance criteria outline the core setup suite auth mechanics:
1. **Landing Page SSO Redirect**: Ensures Authentik correctly routes login intents to Microsoft Azure AD SSO.
2. **Microsoft Account Validation**: Given valid MS credentials (Email & Password), the identity provider accepts the login request.
3. **Handle MFA/Prompts Appropriately**: Discards "stay signed in?" interruption prompts elegantly without failing timeouts.
4. **Successful Portal Access**: Ensure that successful external authentication definitively drops the user back onto `dev.questra.s2o.dev` behind closed doors (no "Anmelden" public button remains).
