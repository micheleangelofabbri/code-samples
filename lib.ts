/**
 * Utility functions and configuration for the rewards system.
 * Includes:
 * - Environment variable management
 * - API URL configuration (dev vs prod)
 * - Airtable sync utilities
 * - Password hashing helper
 */

// ======================
// Environment Configuration
// ======================
/** 
 * Site name loaded from VITE_SITE_NAME environment variable.
 * Used throughout the UI for branding.
 */
export const siteName: string = import.meta.env.VITE_SITE_NAME;

/**
 * Dynamic API URL configuration:
 * - In development: Uses VITE_SITE_URL from .env + '/api'
 * - In production: Uses current window origin + '/api' (relative URL)
 * Note: Wrangler (Cloudflare) requires relative URLs in production.
 */
export const apiUrl: string = process.env.NODE_ENV === 'development'
  ? import.meta.env.VITE_SITE_URL + '/api'
  : window.location.origin + '/api';

// ======================
// Password Utilities (Temporary)
// ======================
/**
 * @deprecated demo-only password hasher.
 * Generates a bcrypt hash for testing purposes.
 */
import bcrypt from 'bcryptjs';
export const pw_hasher = async () => {
  const password = "some_password";
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('hashedPassword: ', hashedPassword);
};

// ======================
// Airtable Sync Functions
// ======================
import { AirtableResponse } from './types';
import simpleRestProvider from 'ra-data-simple-rest';
const dataProvider = simpleRestProvider(apiUrl);

/**
 * Syncs Airtable records with the local database:
 * 1. Fetches records from Airtable
 * 2. Maps them to member objects
 * 3. Filters out existing members (by airtable_id or email)
 * 4. Creates new pending members in the database
 * @throws Error if Airtable API fails or sync encounters critical errors
 */
export async function airtableFetch(): Promise<void> {
  try {
    // Fetch data from Airtable
    const response = await fetch(
      `https://api.airtable.com/v0/${import.meta.env.VITE_AIRTABLE_BASE_ID}/${import.meta.env.VITE_AIRTABLE_TABLE_NAME}`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
        },
      }
    );

    if (response.status >= 400) {
      const errorMessage = await response.text();
      throw new Error(`Airtable request failed: ${errorMessage}`);
    }

    const airtableData: AirtableResponse = await response.json();

    // Transform Airtable records into member objects
    const members = airtableData.records.map(record => ({
      airtable_id: record.id,
      name: record.fields.Name,
      email: record.fields.Email,
      membership_type: record.fields['Membership Type'],
      qr_code_url: record.fields['QR Code'],
      created_at: record.fields.Created,
      status: 'pending',
      source: 'Airtable'
    }));

    // Fetch existing pending members to avoid duplicates
    const existingMembersResponse = await dataProvider.getList('pending_members', {
      filter: {},
      pagination: { page: 1, perPage: 1000 }, // High perPage to minimize pagination issues
      sort: { field: 'id', order: 'ASC' }
    });

    const existingMembers = existingMembersResponse.data;

    // Create lookup sets for quick duplicate checks
    const existingAirtableIds = new Set(existingMembers.map(member => member.airtable_id));
    const existingEmails = new Set(existingMembers.map(member => member.email.toLowerCase()));

    // Filter out duplicates
    const newMembers = members.filter(member =>
      !existingAirtableIds.has(member.airtable_id) &&
      !existingEmails.has(member.email.toLowerCase())
    );

    // Batch create new members
    for (const member of newMembers) {
      try {
        await dataProvider.create('pending_members', { data: member });
        console.log(`Created new 'Pending Member': ${member.name}`);
      } catch (error) {
        console.error(`Error creating member '${member.name}':`,
