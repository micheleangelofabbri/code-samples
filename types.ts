/**
 * Options for configuring HTTP client requests
 */
export interface HttpClientOptions {
  // Optional headers to include in the HTTP request
  headers?: Headers;
}

/**
 * Represents a membership application that is pending approval
 */
export interface PendingMember {
  // Internal database ID
  id: number;
  // Corresponding record ID in Airtable
  airtableId: string;
  // Full name of the applicant
  name: string;
  // Contact email address
  email: string;
  // Type of membership being applied for
  membershipType: string;
  // URL to the generated QR code for this member
  qrCodeUrl: string;
  // When the application was submitted
  createdAt: Date;
  // Current status of the application
  status: 'pending' | 'approved' | 'rejected';
  // When the application was processed (if status is not pending)
  processedAt?: Date;
  // Who processed the application (if status is not pending)
  processedBy?: string;
  // Source/origin of the application (e.g., 'website', 'event', etc.)
  source: string;
}

/**
 * Represents the response structure from Airtable API
 */
export interface AirtableResponse {
  // Array of records returned from Airtable
  records: {
    // Airtable record ID
    id: string;
    // When the record was created in Airtable
    createdTime: string;
    // The actual data fields from Airtable
    fields: {
      // URL to the QR code image
      'QR Code': string;
      // Member's email address
      'Email': string;
      // Member's full name
      'Name': string;
      // Type of membership
      'Membership Type': string;
      // When the record was created (formatted as string)
      'Created': string;
    };
  }[];
}
