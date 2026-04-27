# Landing Page Feature

This directory contains tests and Page Object Models (POMs) related to the public facing landing page of the Questra Portal.

## Contents
- **`LandingPage.ts`**: The Page Object class. Contains action methods on top (like `.navigate()`, `.clickLogin()`) and locators at the bottom.
- **`landingPage.spec.ts`**: The "smoke" test suite verifying the behavior of the landing page.

## Acceptance Criteria

The following acceptance criteria are actively verified in our automated tests:
1. **Welcome Message**: Wait for the portal to load and confirm that the main welcome title header ("Willkommen") is visible.
2. **Login CTA Availability**: Ensure the standard "Anmelden" button is globally visible and functionally enabled for public users.
3. **Login Redirection flow**: Verifies that triggering the "Anmelden" login action gracefully handles the SSO redirect mechanics towards Azure AD / Microsoft login sequentially.
