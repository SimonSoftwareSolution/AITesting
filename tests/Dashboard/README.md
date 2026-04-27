# Dashboard Feature

This directory focuses on the authenticated user's landing view: the Dashboard.

## Contents
- **`DashboardPage.ts`**: The POM handles the dashboard-specific widgets, welcome messages, and dynamic cards. It inherently possesses a `NavigationBar` instance via composition to account for the overall layout.

## Acceptance Criteria

Currently tested within the Dashboard lifecycle `portal.spec.ts`:
1. **Personalised Welcome Heading**: Verify "Willkommen zurück" text renders appropriately.
2. **Dashboard Cards**: Check multiple feature cards (Inventories, Access, Automation) exist simultaneously.
3. **Documentation Integration**: Make sure the help documentation link exists and is visibly interactive.
4. **Widget Addition Action**: Confirm the "Erstes Widget hinzufügen" / "Add first widget" call to action functions globally on an empty dashboard state.
5. **Privacy State Mechanism**: The public landing "Anmelden" module must emphatically NOT be visible here.
