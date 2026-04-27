# Navigation Bar Feature

This directory focuses on the primary site navigation experience for an authenticated user.

## Contents
- **`NavigationBar.ts`**: The POM handles the sidebar, user avatar, logout functionality, and global routing shortcuts.
- **`navigationBar.spec.ts`**: The test suite that verifies these links are visible and that clicking them works without causing server errors.

## Acceptance Criteria

The following features concerning the layout state are actively tested:
1. **Sidebar Visibility**: Expect the sidebar shell UI element to be functionally visible on every authenticated page layout.
2. **Version Stamping**: Ensure the current deployment/dev version indicator is present and visible.
3. **User Profile Rendering**: Ensures the user avatar/initials exist within the sidebar container (bottom left normally).
4. **Logout Mechanism**: Assert that interacting with the user avatar opens a sub-menu clearly displaying an "Abmelden" utility link.
5. **Navigational Sub-Pages**: Testing that navigation via internal routing (ex: Eigene Seiten) successfully delivers a page layout without resolving to a native 500 Internal Server error or missing resource screen.
