/**
 * Custom authentication provider for React-Admin.
 * Handles login, logout, role-based permissions, and session management.
 * Uses bcrypt for password hashing and localStorage for session persistence.
 */
import { AuthProvider, UserIdentity } from "react-admin";
import { apiUrl } from './lib'; // Base API endpoint
import bcrypt from 'bcryptjs'; // For secure password comparison

export const authProvider: AuthProvider = {
  /**
   * Authenticates a user by comparing provided credentials with stored hashes.
   * @param username - User's email (used as username)
   * @param password - Plaintext password (hashed and compared server-side)
   * @throws Error if user not found, password invalid, or network issues occur
   */
  login: async ({ username, password }) => {
    try {
      // Fetch user by email from the API
      const response = await fetch(`${apiUrl}/site_users?email=${username}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error Response Body:', errorText);
        throw new Error('Network response was not ok');
      }

      const users = await response.json();
      if (users.length === 0) {
        throw new Error('User not found');
      }
      const user = users[0];

      // Securely compare hashed password with input
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid password');
      }

      // Store session data in localStorage (consider using HttpOnly cookies in production)
      localStorage.setItem("username", username);
      localStorage.setItem("role", user.role || 'base'); // Default role if not specified

      return Promise.resolve();
    } catch (error) {
      console.error('Login Error:', error);
      throw new Error('Invalid username, password, or network error');
    }
  },

  /**
   * Clears user session data from localStorage on logout.
   */
  logout: () => {
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    return Promise.resolve();
  },

  /**
   * Handles API errors (e.g., 401 Unauthorized or 403 Forbidden).
   * Automatically logs out the user if their session is invalid.
   * @param status - HTTP status code from the failed request
   */
  checkError: ({ status }: { status: number }) => {
    if (status === 401 || status === 403) {
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      return Promise.reject();
    }
    return Promise.resolve();
  },

  /**
   * Checks if a user is authenticated by verifying localStorage data.
   * @rejects if no session exists
   */
  checkAuth: () => {
    return localStorage.getItem("username")
      ? Promise.resolve()
      : Promise.reject();
  },

  /**
   * Retrieves the user's role from localStorage for permission checks.
   * @rejects if no role is found
   */
  getPermissions: () => {
    const role = localStorage.getItem("role");
    return role ? Promise.resolve(role) : Promise.reject();
  },

  /**
   * Returns the user's identity (id + role) for React-Admin's UI.
   * @throws Error if username or role is missing
   */
  getIdentity: () => {
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    if (!username) {
      return Promise.reject("No user found");
    }
    if (!role) {
      return Promise.reject("No role found");
    }

    const identity: UserIdentity & { role?: string } = {
      id: username,
      role: role, // Attach role for role-based rendering
    };

    return Promise.resolve(identity);
  },
};
